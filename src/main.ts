import '@fontsource/sofia-sans-extra-condensed/700.css';
import '@fontsource/sofia-sans/500.css';
import '@fontsource/sofia-sans/600.css';
import '@fontsource/sofia-sans/800.css';
import './styles.css';
import { loadOnThisDay } from './api';
import { detectLang, STRINGS, type Strings } from './i18n';
import type { HistoryItem, Kind, Lang, OnThisDay } from './shared/types';
import { isLang, KINDS, LANGS } from './shared/types';
import { Flaps, Stage } from './stage';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const params = new URLSearchParams(location.search);
const stored = localStorage.getItem('histoday.lang');
const today = new Date();

const state = {
  lang: (isLang(params.get('lang')) ? params.get('lang') : isLang(stored) ? stored : detectLang()) as Lang,
  kind: ((KINDS as readonly string[]).includes(params.get('kind') ?? '') ? params.get('kind') : 'events') as Kind,
  month: today.getMonth() + 1,
  day: today.getDate(),
};
let data: OnThisDay | null = null;
let token = 0;
const t = (): Strings => STRINGS[state.lang];

type Card = Omit<HistoryItem, 'image'> & { image?: string };
const items = (): Card[] =>
  (data?.items[state.kind] ?? []).map((it) => ({ ...it, image: it.image?.source }));

const flaps = new Flaps($('flaps'), 4);
const headline = $('headline');
const article = $<HTMLAnchorElement>('article');
const counter = $('counter');
const local = $('local');
const progressFill = $('progress-fill');
const status = $('status');
const storyText = $('story-text');

/** Visual length: CJK glyphs are roughly twice as wide as condensed Latin. */
function visualLength(text: string): number {
  let n = 0;
  for (const ch of text) n += /[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(ch) ? 1.9 : 1;
  return n;
}

function yearDigits(year: number | null): string {
  if (year === null) return '';
  return String(Math.abs(year)).slice(-4);
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function renderCounter(i: number): void {
  const list = items();
  const n = list.length;
  const w = Math.max(2, String(n).length);
  counter.textContent = n ? `${pad(i + 1, w)} / ${pad(n, w)}` : '';
  progressFill.style.transform = `scaleX(${n ? (i + 1) / n : 0})`;
  const item = list[i];
  local.hidden = !item?.local;
  local.textContent = t().localTag;
  $<HTMLButtonElement>('prev').disabled = i <= 0;
  $<HTMLButtonElement>('next').disabled = i >= n - 1;
  flaps.set(yearDigits(item?.year ?? null));
  const label = item?.year != null ? t().yearLabel(item.year) : '';
  $('flaps').setAttribute('aria-label', label);
  $('flaps').dataset.era = item?.year != null && item.year < 0 ? (state.lang === 'en' ? 'BC' : state.lang === 'zh' ? '公元前' : '紀元前') : '';
  for (const it of list.slice(i + 1, i + 3)) if (it.image) new Image().src = it.image;
}

function renderText(item: Card): void {
  headline.textContent = item.text;
  const len = visualLength(item.text);
  headline.dataset.size = len <= 56 ? 'xl' : len <= 96 ? 'l' : len <= 150 ? 'm' : 's';
  const main = item.pages[0];
  if (main) {
    article.hidden = false;
    article.href = main.url;
    article.textContent = main.description ? `${main.title}, ${main.description}` : main.title;
  } else {
    article.hidden = true;
  }
}

const stage = new Stage<Card>({
  surface: $('stage'),
  text: storyText,
  backdrop: [...document.querySelectorAll<HTMLImageElement>('.backdrop-img')] as [HTMLImageElement, HTMLImageElement],
  render: (item) => renderText(item),
  onCommit: (i) => renderCounter(i),
});

function setStatus(kind: 'loading' | 'error' | 'empty' | null): void {
  status.replaceChildren();
  status.hidden = kind === null;
  storyText.hidden = kind !== null;
  document.body.dataset.state = kind ?? 'ready';
  if (kind === null) return;
  const p = document.createElement('p');
  p.textContent = kind === 'loading' ? t().loading : kind === 'error' ? t().error : t().empty;
  status.append(p);
  if (kind === 'error') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = t().retry;
    b.addEventListener('click', () => void load());
    status.append(b);
  }
}

function show(): void {
  const list = items();
  stage.setItems(list, 0);
  setStatus(list.length ? null : 'empty');
  renderCounter(0);
}

async function load(): Promise<void> {
  const mine = ++token;
  data = null;
  stage.setItems([]);
  renderCounter(0);
  flaps.set('    ', false);
  setStatus('loading');
  try {
    const result = await loadOnThisDay(state.lang, state.month, state.day);
    if (mine !== token) return;
    data = result;
    show();
  } catch (err) {
    if (mine !== token) return;
    console.error(err);
    setStatus('error');
  }
}

function syncUrl(): void {
  const q = new URLSearchParams(location.search);
  q.set('lang', state.lang);
  if (state.kind === 'events') q.delete('kind');
  else q.set('kind', state.kind);
  history.replaceState(null, '', `${location.pathname}?${q}`);
}

function renderChrome(): void {
  const s = t();
  document.documentElement.lang = s.htmlLang;
  document.title = `histoday · ${s.title}`;
  const date = $('date');
  date.textContent = s.date(state.month, state.day);
  date.setAttribute('datetime', `${today.getFullYear()}-${pad(state.month, 2)}-${pad(state.day, 2)}`);
  $('open-settings').setAttribute('aria-label', s.settings);
  $('prev').setAttribute('aria-label', s.prev);
  $('next').setAttribute('aria-label', s.next);
  $('settings-title').textContent = s.settings;
  $('close-settings').setAttribute('aria-label', s.close);
  $('language-title').textContent = s.language;
  $('about-title').textContent = s.about;
  $('about-body').textContent = s.aboutBody;
  $('local-hint').textContent = s.localHint;
  $('source-note').textContent = s.source;
  $<HTMLAnchorElement>('source-link').href = data?.source.startsWith('https://') ? data.source : `https://${state.lang}.wikipedia.org/`;

  const tabs = $('tabs');
  tabs.querySelectorAll('.tab').forEach((n) => n.remove());
  KINDS.forEach((k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab';
    b.role = 'tab';
    b.setAttribute('aria-selected', String(k === state.kind));
    const label = document.createElement('span');
    label.textContent = s.kinds[k];
    b.appendChild(label);
    b.addEventListener('click', () => setKind(k));
    tabs.appendChild(b);
  });
  requestAnimationFrame(placeTabInk);

  const langs = $('langs');
  langs.replaceChildren(
    ...LANGS.map((l) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lang';
      b.role = 'radio';
      b.lang = STRINGS[l].htmlLang;
      b.setAttribute('aria-checked', String(l === state.lang));
      b.textContent = STRINGS[l].label;
      b.addEventListener('click', () => setLang(l));
      return b;
    }),
  );
}

function placeTabInk(): void {
  const active = document.querySelector<HTMLElement>('.tab[aria-selected="true"] span');
  const ink = document.querySelector<HTMLElement>('.tab-ink');
  if (!active || !ink) return;
  const box = active.getBoundingClientRect();
  const origin = ink.parentElement!.getBoundingClientRect().left;
  ink.style.transform = `translateX(${box.left - origin - 6}px)`;
  ink.style.width = `${box.width + 12}px`;
}

function setLang(lang: Lang): void {
  if (lang === state.lang) return;
  state.lang = lang;
  localStorage.setItem('histoday.lang', lang);
  syncUrl();
  renderChrome();
  void load();
}

function setKind(kind: Kind): void {
  if (kind === state.kind) return;
  state.kind = kind;
  syncUrl();
  renderChrome();
  if (data) show();
}

const sheet = $<HTMLDialogElement>('settings');
$('open-settings').addEventListener('click', () => sheet.showModal());
$('close-settings').addEventListener('click', () => sheet.close());
sheet.addEventListener('click', (e) => {
  if (e.target === sheet) sheet.close();
});
$('prev').addEventListener('click', () => stage.go(-1));
$('next').addEventListener('click', () => stage.go(1));
window.addEventListener('resize', placeTabInk);
document.addEventListener('keydown', (e) => {
  if (sheet.open || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    stage.go(1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    stage.go(-1);
  }
});

syncUrl();
renderChrome();
void load();
