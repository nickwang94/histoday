/**
 * The Wikimedia "On this day" feed does not support Japanese, so for `ja` we
 * build the same data from the ja.wikipedia "M月D日" date article: its
 * できごと / 誕生日 / 忌日 sections are bullet lists of "[[YEAR年]] - text".
 */
import { finishItem } from './feed';
import { fetchJson } from './http';
import type { HistoryItem, Kind, LinkedPage, Thumbnail } from './types';

const API = 'https://ja.wikipedia.org/w/api.php';

const SECTION_KINDS: Record<string, Kind> = {
  できごと: 'events',
  出来事: 'events',
  誕生日: 'births',
  忌日: 'deaths',
};

/** Link targets that are dates, years or eras rather than topics. */
const NON_TOPIC = /^(紀元前)?\d{1,4}年(代)?$|^\d{1,2}月\d{1,2}日|^\d{1,2}月$|^(世紀|千年紀)$/;

const MAX_LINKS_PER_ITEM = 4;

export interface ParsedLine {
  year: number | null;
  text: string;
  links: string[];
}

function expandTemplate(inner: string): string {
  const parts = inner.split('|').map((s) => s.trim());
  const name = parts[0].toLowerCase();
  if (name === '仮リンク' || name === 'ill2' || name === 'interlanguage link') return parts[1] ?? '';
  if (name === 'lang' || name === 'lang-en' || name === 'langwithname') return parts[parts.length - 1] ?? '';
  if (name === '要出典範囲') return parts.find((p, i) => i > 0 && !p.includes('=')) ?? '';
  if (name === 'nowrap' || name === 'nobr' || name === 'smaller' || name === 'small') return parts[1] ?? '';
  if (name === 'ruby') return parts[1] ?? '';
  return '';
}

/** Converts a line of wikitext to plain text, collecting [[link]] targets in order. */
export function cleanWikitext(source: string, links: string[] = []): string {
  let s = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');

  // Innermost templates first so nested ones collapse correctly.
  for (let guard = 0; guard < 10 && /\{\{[^{}]*\}\}/.test(s); guard++) {
    s = s.replace(/\{\{([^{}]*)\}\}/g, (_, inner: string) => expandTemplate(inner));
  }

  s = s.replace(/\[\[([^\[\]]*)\]\]/g, (_, inner: string) => {
    const [target, ...rest] = inner.split('|');
    if (/^(ファイル|画像|file|image|category|カテゴリ):/i.test(target.trim())) return '';
    const label = rest.length ? rest[rest.length - 1] : target;
    const clean = target.split('#')[0].trim();
    if (clean && !links.includes(clean)) links.push(clean);
    return label;
  });

  return s
    .replace(/\[https?:\/\/\S+\s([^\]]*)\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseYear(raw: string): number | null {
  const m = /^(紀元前)?(\d{1,4})$/.exec(raw);
  if (!m) return null;
  return m[1] ? -Number(m[2]) : Number(m[2]);
}

const LINE = /^(?:\[\[)?((?:紀元前)?\d{1,4})年(?:\]\])?\s*(?:（[^）]*）|\([^)]*\))?\s*[-－–—]\s*(.+)$/;
const YEAR_ONLY = /^(?:\[\[)?((?:紀元前)?\d{1,4})年(?:\]\])?\s*$/;

/** Parses the bullet lines of one section. "** text" lines inherit the year of a bare "* [[YEAR年]]" line. */
export function parseSectionLines(wikitext: string): ParsedLine[] {
  const out: ParsedLine[] = [];
  let parentYear: number | null = null;
  for (const rawLine of wikitext.split('\n')) {
    const bullet = /^(\*+)\s*(.*)$/.exec(rawLine.trim());
    if (!bullet) continue;
    const depth = bullet[1].length;
    const body = bullet[2];

    const yearOnly = YEAR_ONLY.exec(body);
    if (yearOnly && depth === 1) {
      parentYear = parseYear(yearOnly[1]);
      continue;
    }

    const m = LINE.exec(body);
    let year: number | null;
    let rest: string;
    if (m) {
      year = parseYear(m[1]);
      rest = m[2];
    } else if (depth > 1 && parentYear !== null) {
      year = parentYear;
      rest = body;
    } else {
      continue;
    }

    const links: string[] = [];
    const text = cleanWikitext(rest, links);
    if (!text) continue;
    out.push({ year, text, links: links.filter((l) => !NON_TOPIC.test(l)) });
  }
  return out;
}

export function splitSections(wikitext: string): Partial<Record<Kind, string>> {
  const result: Partial<Record<Kind, string>> = {};
  const parts = wikitext.split(/^(={2,}\s*[^=\n]+?\s*={2,})\s*$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i];
    const level = /^=+/.exec(heading)![0].length;
    const title = heading.replace(/=/g, '').trim();
    const kind = SECTION_KINDS[title];
    if (level !== 2 || !kind) continue;
    // Include deeper subsections until the next level-2 heading.
    let body = parts[i + 1] ?? '';
    for (let j = i + 2; j < parts.length; j += 2) {
      if (/^=+/.exec(parts[j])![0].length <= 2) break;
      body += '\n' + (parts[j + 1] ?? '');
    }
    result[kind] = (result[kind] ?? '') + body;
  }
  return result;
}

interface QueryResponse {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: { title: string; missing?: boolean; description?: string; thumbnail?: Thumbnail }[];
  };
}

interface PageInfo {
  title: string;
  description?: string;
  thumbnail?: Thumbnail;
}

async function lookupPages(titles: string[]): Promise<Map<string, PageInfo>> {
  const result = new Map<string, PageInfo>();
  const batches: string[][] = [];
  for (let i = 0; i < titles.length; i += 50) batches.push(titles.slice(i, i + 50));

  const run = async (batch: string[]) => {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      origin: '*',
      redirects: '1',
      prop: 'pageimages|description',
      piprop: 'thumbnail',
      pithumbsize: '1280',
      pilimit: '50',
      titles: batch.join('|'),
    });
    const data = await fetchJson<QueryResponse>(`${API}?${params}`);
    const q = data.query ?? {};
    const byTitle = new Map((q.pages ?? []).filter((p) => !p.missing).map((p) => [p.title, p]));
    const follow = (map?: { from: string; to: string }[]) => new Map((map ?? []).map((x) => [x.from, x.to]));
    const normalized = follow(q.normalized);
    const redirects = follow(q.redirects);
    for (const original of batch) {
      let t = normalized.get(original) ?? original;
      t = redirects.get(t) ?? t;
      const page = byTitle.get(t);
      if (page) result.set(original, { title: page.title, description: page.description, thumbnail: page.thumbnail });
    }
  };

  // Small concurrency keeps us polite to the API and within Worker subrequest limits.
  const queue = [...batches];
  await Promise.all(
    Array.from({ length: Math.min(4, queue.length) }, async () => {
      for (let b = queue.shift(); b; b = queue.shift()) {
        try {
          await run(b);
        } catch {
          // Missing images/descriptions are acceptable; the card falls back gracefully.
        }
      }
    }),
  );
  return result;
}

function pageUrl(title: string): string {
  return `https://ja.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

export async function fetchJaOnThisDay(month: number, day: number): Promise<Record<Kind, HistoryItem[]>> {
  const params = new URLSearchParams({
    action: 'parse',
    format: 'json',
    formatversion: '2',
    origin: '*',
    prop: 'wikitext',
    redirects: '1',
    page: `${month}月${day}日`,
  });
  const data = await fetchJson<{ parse?: { wikitext?: string } }>(`${API}?${params}`);
  const sections = splitSections(data.parse?.wikitext ?? '');

  const parsed: Record<Kind, ParsedLine[]> = {
    events: parseSectionLines(sections.events ?? ''),
    births: parseSectionLines(sections.births ?? ''),
    deaths: parseSectionLines(sections.deaths ?? ''),
  };

  const titles = new Set<string>();
  for (const lines of Object.values(parsed)) {
    for (const line of lines) line.links.slice(0, MAX_LINKS_PER_ITEM).forEach((l) => titles.add(l));
  }
  const info = await lookupPages([...titles]);

  const build = (kind: Kind): HistoryItem[] =>
    parsed[kind].map((line, i) => {
      const links = line.links.slice(0, MAX_LINKS_PER_ITEM);
      // When the lookup worked, unknown titles are red links; drop them.
      const known = info.size > 0 ? links.filter((l) => info.has(l)) : links;
      const pages: LinkedPage[] = known.map((link) => {
        const p = info.get(link);
        const title = p?.title ?? link;
        return { title, description: p?.description, url: pageUrl(title), thumbnail: p?.thumbnail };
      });
      return finishItem({ id: `${kind}-${i}`, kind, year: line.year, text: line.text, pages });
    });

  return { events: build('events'), births: build('births'), deaths: build('deaths') };
}
