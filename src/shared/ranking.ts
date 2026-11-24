import type { HistoryItem, Lang } from './types';

/**
 * Keywords that mark an item as related to the "home" country of each
 * language edition: US/UK for English, China for Chinese, Japan for Japanese.
 * They are matched against the item text and linked page titles. For people
 * (births/deaths) the short page description is matched too, since it states
 * nationality ("American actor", "日本の政治家"); for events, descriptions of
 * incidental links (an aircraft maker, a sports league) are too noisy.
 */
const LOCAL_PATTERNS: Record<Lang, RegExp> = {
  en: new RegExp(
    '\\b(' +
      [
        'United States',
        'U\\.S\\.',
        'US',
        'USA',
        '(?<!(?:South|Latin|Central|North) )Americans?',
        '(?<!(?:South|Latin|Central|North) )America',
        'Washington, D\\.C\\.',
        'New York',
        'California',
        'Texas',
        'Chicago',
        'Boston',
        'Congress',
        'Confederate',
        'NASA',
        'United Kingdom',
        'UK',
        'U\\.K\\.',
        'Britain',
        'British',
        'Great Britain',
        'England',
        'English',
        'Scotland',
        'Scottish',
        'Wales',
        'Welsh',
        'Northern Ireland',
        'London',
        'Parliament of England',
        'House of Commons',
      ].join('|') +
      ')\\b',
  ),
  zh: new RegExp(
    [
      '中国',
      '中國',
      '中华',
      '中華',
      '华人',
      '華人',
      '北京',
      '上海',
      '南京',
      '广州',
      '廣州',
      '香港',
      '澳门',
      '澳門',
      '台湾',
      '臺灣',
      '台灣',
      '清朝',
      '明朝',
      '元朝',
      '宋朝',
      '唐朝',
      '汉朝',
      '漢朝',
      '秦朝',
      '隋朝',
      '晋朝',
      '晉朝',
      '北洋政府',
      '国民政府',
      '國民政府',
      '国民党',
      '國民黨',
      '共产党',
      '共產黨',
      '解放军',
      '解放軍',
      '国务院',
      '國務院',
      '全国人民代表大会',
      '全國人民代表大會',
    ].join('|'),
  ),
  ja: new RegExp(
    [
      '日本',
      '東京',
      '京都',
      '大阪',
      '江戸',
      '幕府',
      '天皇',
      '皇太子',
      '内閣',
      '国会',
      '明治',
      '大正',
      '昭和',
      '平成',
      '令和',
      '寛永',
      '慶長',
      '元禄',
      '天保',
      '[都道府]県',
      '広島',
      '長崎',
      '名古屋',
      '横浜',
      '神戸',
      '福岡',
      '札幌',
      '仙台',
      '北海道',
      '沖縄',
      '樺太',
      '自衛隊',
      'JR',
    ].join('|'),
  ),
};

export function isLocal(lang: Lang, item: Pick<HistoryItem, 'kind' | 'text' | 'pages'>): boolean {
  const pattern = LOCAL_PATTERNS[lang];
  if (pattern.test(item.text)) return true;
  const person = item.kind !== 'events';
  return item.pages.some(
    (p) => pattern.test(p.title) || (person && p.description !== undefined && pattern.test(p.description)),
  );
}

/** Local items first, then the rest; each group newest first. */
export function rankItems(lang: Lang, items: HistoryItem[]): HistoryItem[] {
  const marked = items.map((item) => ({ ...item, local: isLocal(lang, item) }));
  return marked.sort((a, b) => {
    if (a.local !== b.local) return a.local ? -1 : 1;
    return (b.year ?? -Infinity) - (a.year ?? -Infinity);
  });
}
