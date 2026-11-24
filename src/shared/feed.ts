import { fetchJson } from './http';
import type { HistoryItem, Kind, Lang, LinkedPage, Thumbnail } from './types';
import { pad2 } from './types';

interface FeedPage {
  type?: string;
  title: string;
  titles?: { normalized?: string; display?: string };
  description?: string;
  extract?: string;
  thumbnail?: Thumbnail;
  originalimage?: Thumbnail;
  content_urls?: { desktop?: { page?: string } };
}

interface FeedEntry {
  text: string;
  year?: number;
  pages?: FeedPage[];
}

type Feed = Partial<Record<'selected' | Kind | 'holidays', FeedEntry[]>>;

/** Accept-Language variants so zh content comes back in Simplified Chinese. */
const VARIANT: Partial<Record<Lang, string>> = { zh: 'zh-hans' };

export function feedUrl(lang: Lang, month: number, day: number): string {
  const base = `https://${lang}.wikipedia.org/api/rest_v1/feed/onthisday/all/${pad2(month)}/${pad2(day)}`;
  // The Wikimedia edge cache does not vary on Accept-Language, so without a
  // variant-specific URL a cached Traditional Chinese response can be served.
  const variant = VARIANT[lang];
  return variant ? `${base}?variant=${variant}` : base;
}

const YEAR_TITLE = /^(公元前|紀元前|前)?\d{1,4}(年|年代| BC| BCE| AD)?$/;

export function isYearTitle(title: string): boolean {
  return YEAR_TITLE.test(title.trim());
}

/** Standard Wikimedia thumbnail widths; the photo is shown full-bleed, so prefer the largest. */
const THUMB_WIDTHS = [1280, 960, 640];

/** Wikimedia thumbnails can be re-requested at a larger width by rewriting the URL. */
export function upscaleThumbnail(thumb: Thumbnail, original: Thumbnail | undefined): Thumbnail {
  const match = /\/(\d+)px-[^/]+$/.exec(thumb.source);
  const width = THUMB_WIDTHS.find((w) => (original?.width ?? 0) >= w);
  if (!original || !match || !width || Number(match[1]) >= width) return thumb;
  const ratio = original.height && original.width ? original.height / original.width : undefined;
  return {
    source: thumb.source.replace(/\/\d+px-([^/]+)$/, `/${width}px-$1`),
    width,
    height: ratio ? Math.round(width * ratio) : undefined,
  };
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function toLinkedPage(p: FeedPage, lang: Lang): LinkedPage {
  // The display title is variant-converted (e.g. Simplified Chinese); the normalized title is not.
  const display = p.titles?.display ? stripTags(p.titles.display) : '';
  const title = display || p.titles?.normalized || p.title.replace(/_/g, ' ');
  return {
    title,
    description: p.description,
    extract: p.extract?.trim(),
    url: p.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
    thumbnail: p.thumbnail ? upscaleThumbnail(p.thumbnail, p.originalimage) : undefined,
  };
}

const MAX_PAGES = 3;
const MAX_EXTRACT = 320;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';
}

/** Drops year pages, picks the card image and trims the payload to what the UI shows. */
export function finishItem(item: Omit<HistoryItem, 'image' | 'url' | 'local'>): HistoryItem {
  const content = item.pages.filter((p) => !isYearTitle(p.title));
  const withImage = content.find((p) => p.thumbnail);
  const pages = content.slice(0, MAX_PAGES).map(({ thumbnail: _thumb, extract, ...rest }, i) =>
    i === 0 && extract ? { ...rest, extract: truncate(extract, MAX_EXTRACT) } : rest,
  );
  return {
    ...item,
    pages,
    image: withImage?.thumbnail,
    url: content[0]?.url,
    local: false,
  };
}

function normalizeEntries(entries: FeedEntry[] | undefined, kind: Kind, lang: Lang): HistoryItem[] {
  return (entries ?? []).map((e, i) =>
    finishItem({
      id: `${kind}-${e.year ?? 'x'}-${i}`,
      kind,
      year: typeof e.year === 'number' ? e.year : null,
      text: e.text.trim(),
      pages: (e.pages ?? []).filter((p) => p.type !== 'disambiguation').map((p) => toLinkedPage(p, lang)),
    }),
  );
}

export function normalizeFeed(feed: Feed, lang: Lang): Record<Kind, HistoryItem[]> {
  const seen = new Set<string>();
  const events: HistoryItem[] = [];
  // "selected" holds editor-curated highlights that often duplicate "events".
  for (const item of [
    ...normalizeEntries(feed.selected, 'events', lang),
    ...normalizeEntries(feed.events, 'events', lang),
  ]) {
    const key = `${item.year}|${item.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({ ...item, id: `events-${events.length}` });
  }
  return {
    events,
    births: normalizeEntries(feed.births, 'births', lang),
    deaths: normalizeEntries(feed.deaths, 'deaths', lang),
  };
}

export async function fetchFeed(lang: Lang, month: number, day: number): Promise<Record<Kind, HistoryItem[]>> {
  const variant = VARIANT[lang];
  const feed = await fetchJson<Feed>(feedUrl(lang, month, day), variant ? { 'Accept-Language': variant } : {});
  return normalizeFeed(feed, lang);
}
