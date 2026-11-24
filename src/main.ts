import './styles.css';
import { loadOnThisDay } from './api';
import { Deck } from './deck';
import { detectLang, STRINGS, type Strings } from './i18n';
import type { HistoryItem, Kind, Lang, OnThisDay } from './shared/types';
import { isLang, isValidMonthDay, KINDS, LANGS, pad2 } from './shared/types';

type Attrs = Record<string, string | boolean | undefined>;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

interface State {
  lang: Lang;
  month: number;
  day: number;
  kind: Kind;
}

function initialState(): State {
  const params = new URLSearchParams(location.search);
  const stored = localStorage.getItem('histoday.lang');
  const lang = isLang(params.get('lang')) ? (params.get('lang') as Lang) : isLang(stored) ? stored : detectLang();
  const now = new Date();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(params.get('date') ?? '');
  if (m && isValidMonthDay(Number(m[1]), Number(m[2]))) {
    month = Number(m[1]);
    day = Number(m[2]);
  }
  const kind = (KINDS as readonly string[]).includes(params.get('kind') ?? '') ? (params.get('kind') as Kind) : 'events';
  return { lang, month, day, kind };
}

const state = initialState();
let data: OnThisDay | null = null;
let loadToken = 0;
const t = (): Strings => STRINGS[state.lang];

function syncUrl(): void {
  const params = new URLSearchParams();
  params.set('lang', state.lang);
  params.set('date', `${pad2(state.month)}-${pad2(state.day)}`);
  if (state.kind !== 'events') params.set('kind', state.kind);
  history.replaceState(null, '', `${location.pathname}?${params}`);
}

function formatDate(): string {
  // A leap year keeps Feb 29 valid.
  const d = new Date(2024, state.month - 1, state.day);
  return new Intl.DateTimeFormat(t().locale, { month: 'long', day: 'numeric' }).format(d);
}

function yearsAgo(year: number): number {
  const now = new Date().getFullYear();
  // There is no year 0 between 1 BC and AD 1.
  return year < 0 ? now - year - 1 : now - year;
}

function mediaFallback(item: HistoryItem): HTMLElement {
  return h(
    'div',
    { class: 'media-fallback' },
    h('span', { class: 'media-fallback-year' }, item.year === null ? '?' : t().year(item.year)),
    h('small', {}, t().noImage),
  );
}

function renderCard(item: HistoryItem): HTMLElement {
  const s = t();
  const main = item.pages[0];

  let media: HTMLElement;
  if (item.image) {
    const img = h('img', {
      src: item.image.source,
      alt: main?.title ?? '',
      loading: 'lazy',
      decoding: 'async',
      draggable: 'false',
      referrerpolicy: 'no-referrer',
    });
    img.addEventListener('error', () => img.replaceWith(mediaFallback(item)), { once: true });
    media = h('div', { class: 'card-media' }, img);
  } else {
    media = h('div', { class: 'card-media is-empty' }, mediaFallback(item));
  }

  const head = h(
    'div',
    { class: 'card-head' },
    item.year !== null && h('span', { class: 'year' }, s.year(item.year)),
    item.year !== null && h('span', { class: 'ago' }, s.yearsAgo(yearsAgo(item.year))),
    item.local && h('span', { class: 'tag', title: s.localHint }, s.localTag),
  );

  const page =
    main &&
    h(
      'div',
      { class: 'card-page' },
      h('strong', {}, main.title),
      main.description && h('span', { class: 'desc' }, main.description),
      main.extract && h('p', { class: 'extract' }, main.extract),
    );

  const read =
    item.url && h('a', { class: 'read', href: item.url, target: '_blank', rel: 'noopener' }, `${s.readMore} →`);

  return h(
    'article',
    { lang: s.htmlLang },
    media,
    h('div', { class: 'card-body' }, head, h('p', { class: 'card-text' }, item.text), page, read),
  );
}

const deckEl = $('#deck');
const statusEl = $('#status');
const counterEl = $('#counter');
const prevBtn = $<HTMLButtonElement>('#prev');
const nextBtn = $<HTMLButtonElement>('#next');

const deck = new Deck<HistoryItem>(deckEl, {
  render: renderCard,
  key: (item) => item.id,
  onChange: (i) => {
    const items = currentItems();
    counterEl.textContent = items.length ? t().counter(i + 1, items.length) : '';
    prevBtn.disabled = i <= 0;
    nextBtn.disabled = i >= items.length - 1;
    for (const it of items.slice(i + 1, i + 4)) if (it.image) new Image().src = it.image.source;
  },
});

function currentItems(): HistoryItem[] {
  return data?.items[state.kind] ?? [];
}

function setStatus(kind: 'loading' | 'error' | 'empty' | null): void {
  statusEl.replaceChildren();
  statusEl.hidden = kind === null;
  deckEl.classList.toggle('is-busy', kind !== null);
  if (kind === 'loading') {
    statusEl.append(h('div', { class: 'spinner', 'aria-hidden': 'true' }), h('p', {}, t().loading));
  } else if (kind === 'error') {
    const retry = h('button', { class: 'btn', type: 'button' }, t().retry);
    retry.addEventListener('click', () => void load());
    statusEl.append(h('p', {}, t().error), retry);
  } else if (kind === 'empty') {
    statusEl.append(h('p', {}, t().empty));
  }
}

function showDeck(): void {
  const items = currentItems();
  deck.setItems(items, 0);
  setStatus(items.length ? null : 'empty');
}

async function load(): Promise<void> {
  const token = ++loadToken;
  data = null;
  deck.setItems([]);
  counterEl.textContent = '';
  setStatus('loading');
  try {
    const result = await loadOnThisDay(state.lang, state.month, state.day);
    if (token !== loadToken) return;
    data = result;
    showDeck();
  } catch (err) {
    if (token !== loadToken) return;
    console.error(err);
    setStatus('error');
  }
}

function renderChrome(): void {
  const s = t();
  document.documentElement.lang = s.htmlLang;
  document.title = `${s.title} · ${formatDate()}`;
  $('#title').textContent = s.title;
  $('#tagline').textContent = s.tagline;
  $('#date-label').textContent = formatDate();
  $('#date-input').setAttribute('aria-label', s.pickDate);
  $('#prev-day').setAttribute('aria-label', s.prevDay);
  $('#prev-day').title = s.prevDay;
  $('#next-day').setAttribute('aria-label', s.nextDay);
  $('#next-day').title = s.nextDay;
  $('#today').textContent = s.today;
  prevBtn.setAttribute('aria-label', s.prev);
  prevBtn.title = s.prev;
  nextBtn.setAttribute('aria-label', s.next);
  nextBtn.title = s.next;
  $('#hint').textContent = s.hint;
  $('#footer-text').textContent = s.footer;
  $('#local-hint').textContent = s.localHint;

  const input = $<HTMLInputElement>('#date-input');
  input.value = `${new Date().getFullYear()}-${pad2(state.month)}-${pad2(state.day)}`;

  const langs = $('#langs');
  langs.replaceChildren(
    ...LANGS.map((l) => {
      const b = h(
        'button',
        { type: 'button', class: 'chip', lang: STRINGS[l].htmlLang, 'aria-pressed': String(l === state.lang) },
        STRINGS[l].label,
      );
      b.addEventListener('click', () => setLang(l));
      return b;
    }),
  );

  const kinds = $('#kinds');
  kinds.replaceChildren(
    ...KINDS.map((k) => {
      const b = h(
        'button',
        { type: 'button', role: 'tab', class: 'tab', 'aria-selected': String(k === state.kind) },
        s.kinds[k],
      );
      b.addEventListener('click', () => setKind(k));
      return b;
    }),
  );
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
  if (data) showDeck();
}

function setDate(month: number, day: number): void {
  if (month === state.month && day === state.day) return;
  state.month = month;
  state.day = day;
  syncUrl();
  renderChrome();
  void load();
}

function shiftDay(delta: number): void {
  const d = new Date(2024, state.month - 1, state.day + delta);
  setDate(d.getMonth() + 1, d.getDate());
}

$('#prev-day').addEventListener('click', () => shiftDay(-1));
$('#next-day').addEventListener('click', () => shiftDay(1));
$('#today').addEventListener('click', () => {
  const now = new Date();
  setDate(now.getMonth() + 1, now.getDate());
});
$<HTMLInputElement>('#date-input').addEventListener('change', (e) => {
  const v = (e.target as HTMLInputElement).value;
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(v);
  if (m) setDate(Number(m[1]), Number(m[2]));
});
$('#date-button').addEventListener('click', () => {
  const input = $<HTMLInputElement>('#date-input');
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
      return;
    } catch {
      // Fall through to focusing the input.
    }
  }
  input.focus();
});
prevBtn.addEventListener('click', () => deck.prev());
nextBtn.addEventListener('click', () => deck.next());

document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const target = e.target as HTMLElement;
  if (target.closest('input, textarea, select, [contenteditable]')) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    deck.next();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    deck.prev();
  }
});

syncUrl();
renderChrome();
void load();
