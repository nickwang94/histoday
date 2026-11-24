import type { Kind, Lang } from './shared/types';

export interface Strings {
  htmlLang: string;
  locale: string;
  label: string;
  title: string;
  kinds: Record<Kind, string>;
  localTag: string;
  settings: string;
  close: string;
  language: string;
  about: string;
  aboutBody: string;
  localHint: string;
  source: string;
  prev: string;
  next: string;
  hint: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  date: (month: number, day: number) => string;
  yearLabel: (y: number) => string;
}

const EN_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const STRINGS: Record<Lang, Strings> = {
  en: {
    htmlLang: 'en',
    locale: 'en-US',
    label: 'English',
    title: 'On this day',
    kinds: { events: 'Events', births: 'Births', deaths: 'Deaths' },
    localTag: 'US · UK',
    settings: 'Settings',
    close: 'Close',
    language: 'Language',
    about: 'About',
    aboutBody: 'What happened on this day in history, one story at a time.',
    localHint: 'Stories about the US and UK come first.',
    source: 'Stories and images from Wikipedia, CC BY-SA 4.0.',
    prev: 'Previous story',
    next: 'Next story',
    hint: 'Swipe or use ← → to flip',
    loading: 'Fetching today’s stories',
    error: 'Wikipedia could not be reached.',
    retry: 'Try again',
    empty: 'No stories for today.',
    date: (m, d) => `${EN_MONTHS[m - 1]} ${d}`,
    yearLabel: (y) => (y < 0 ? `${-y} BC` : String(y)),
  },
  zh: {
    htmlLang: 'zh-Hans',
    locale: 'zh-CN',
    label: '中文',
    title: '历史上的今天',
    kinds: { events: '大事', births: '出生', deaths: '逝世' },
    localTag: '中国',
    settings: '设置',
    close: '关闭',
    language: '语言',
    about: '关于',
    aboutBody: '历史上的今天发生了什么，一次只讲一个故事。',
    localHint: '与中国相关的故事优先显示。',
    source: '故事与图片来自维基百科，依 CC BY-SA 4.0 授权。',
    prev: '上一则',
    next: '下一则',
    hint: '左右滑动或按 ← → 翻页',
    loading: '正在获取今天的故事',
    error: '无法连接维基百科。',
    retry: '重试',
    empty: '今天暂无故事。',
    date: (m, d) => `${m}月${d}日`,
    yearLabel: (y) => (y < 0 ? `公元前${-y}年` : `${y}年`),
  },
  ja: {
    htmlLang: 'ja',
    locale: 'ja-JP',
    label: '日本語',
    title: '今日は何の日',
    kinds: { events: 'できごと', births: '誕生日', deaths: '忌日' },
    localTag: '日本',
    settings: '設定',
    close: '閉じる',
    language: '言語',
    about: 'このアプリについて',
    aboutBody: '今日という日に起きたことを、一話ずつ。',
    localHint: '日本に関する話題を優先して表示します。',
    source: '記事と画像の出典：ウィキペディア（CC BY-SA 4.0）',
    prev: '前の話',
    next: '次の話',
    hint: 'スワイプまたは ← → でめくる',
    loading: '今日の話題を取得中',
    error: 'ウィキペディアに接続できませんでした。',
    retry: '再試行',
    empty: '今日の話題はありません。',
    date: (m, d) => `${m}月${d}日`,
    yearLabel: (y) => (y < 0 ? `紀元前${-y}年` : `${y}年`),
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
