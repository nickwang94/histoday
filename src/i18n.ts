import type { Kind, Lang } from './shared/types';

export interface Strings {
  htmlLang: string;
  locale: string;
  label: string;
  title: string;
  tagline: string;
  kinds: Record<Kind, string>;
  localTag: string;
  localHint: string;
  prev: string;
  next: string;
  prevDay: string;
  nextDay: string;
  today: string;
  pickDate: string;
  hint: string;
  readMore: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  end: string;
  noImage: string;
  counter: (i: number, n: number) => string;
  year: (y: number) => string;
  yearsAgo: (n: number) => string;
  footer: string;
}

export const STRINGS: Record<Lang, Strings> = {
  en: {
    htmlLang: 'en',
    locale: 'en-US',
    label: 'English',
    title: 'On this day',
    tagline: 'A small stack of stories from the past',
    kinds: { events: 'Events', births: 'Births', deaths: 'Deaths' },
    localTag: 'US · UK',
    localHint: 'Stories about the US and UK come first',
    prev: 'Previous story',
    next: 'Next story',
    prevDay: 'Previous day',
    nextDay: 'Next day',
    today: 'Today',
    pickDate: 'Pick a date',
    hint: 'Swipe, drag or use ← → to turn the page',
    readMore: 'Read on Wikipedia',
    loading: 'Gathering stories…',
    error: 'Could not reach Wikipedia.',
    retry: 'Try again',
    empty: 'No stories found for this day.',
    end: 'You reached the bottom of the pile.',
    noImage: 'No picture survives',
    counter: (i, n) => `${i} / ${n}`,
    year: (y) => (y < 0 ? `${-y} BC` : String(y)),
    yearsAgo: (n) => (n === 0 ? 'This year' : n === 1 ? '1 year ago' : `${n.toLocaleString('en-US')} years ago`),
    footer: 'Stories from Wikipedia, available under CC BY-SA 4.0.',
  },
  zh: {
    htmlLang: 'zh-Hans',
    locale: 'zh-CN',
    label: '中文',
    title: '历史上的今天',
    tagline: '一叠来自过去的小故事',
    kinds: { events: '大事', births: '出生', deaths: '逝世' },
    localTag: '中国',
    localHint: '与中国相关的故事优先显示',
    prev: '上一则',
    next: '下一则',
    prevDay: '前一天',
    nextDay: '后一天',
    today: '今天',
    pickDate: '选择日期',
    hint: '左右滑动、拖拽或按 ← → 翻页',
    readMore: '在维基百科阅读',
    loading: '正在翻找故事…',
    error: '无法连接维基百科。',
    retry: '重试',
    empty: '这一天暂无故事。',
    end: '已经翻到最后一张了。',
    noImage: '暂无图片',
    counter: (i, n) => `${i} / ${n}`,
    year: (y) => (y < 0 ? `公元前${-y}年` : `${y}年`),
    yearsAgo: (n) => (n === 0 ? '今年' : `${n}年前`),
    footer: '内容来自维基百科，依 CC BY-SA 4.0 授权。',
  },
  ja: {
    htmlLang: 'ja',
    locale: 'ja-JP',
    label: '日本語',
    title: '今日は何の日',
    tagline: '過去からの小さな物語を一枚ずつ',
    kinds: { events: 'できごと', births: '誕生日', deaths: '忌日' },
    localTag: '日本',
    localHint: '日本に関する話題を優先して表示',
    prev: '前の話',
    next: '次の話',
    prevDay: '前の日',
    nextDay: '次の日',
    today: '今日',
    pickDate: '日付を選ぶ',
    hint: 'スワイプ・ドラッグ・← → キーでめくる',
    readMore: 'ウィキペディアで読む',
    loading: '物語を集めています…',
    error: 'ウィキペディアに接続できませんでした。',
    retry: '再試行',
    empty: 'この日の話題は見つかりませんでした。',
    end: '最後の一枚です。',
    noImage: '画像なし',
    counter: (i, n) => `${i} / ${n}`,
    year: (y) => (y < 0 ? `紀元前${-y}年` : `${y}年`),
    yearsAgo: (n) => (n === 0 ? '今年' : `${n}年前`),
    footer: '出典：ウィキペディア（CC BY-SA 4.0）',
  },
};

export function detectLang(): Lang {
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l.toLowerCase();
    if (code.startsWith('zh')) return 'zh';
    if (code.startsWith('ja')) return 'ja';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}
