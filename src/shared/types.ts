export const LANGS = ['en', 'zh', 'ja'] as const;
export type Lang = (typeof LANGS)[number];

export const KINDS = ['events', 'births', 'deaths'] as const;
export type Kind = (typeof KINDS)[number];

export interface Thumbnail {
  source: string;
  width?: number;
  height?: number;
}

export interface LinkedPage {
  title: string;
  description?: string;
  extract?: string;
  url: string;
  thumbnail?: Thumbnail;
}

export interface HistoryItem {
  id: string;
  kind: Kind;
  /** Negative for BCE. Null when the source line has no parseable year. */
  year: number | null;
  text: string;
  pages: LinkedPage[];
  image?: Thumbnail;
  /** Primary page to read more about the item. */
  url?: string;
  /** True when the item relates to the selected language's home country. */
  local: boolean;
}

export interface OnThisDay {
  lang: Lang;
  month: number;
  day: number;
  source: string;
  items: Record<Kind, HistoryItem[]>;
}

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function isValidMonthDay(month: number, day: number): boolean {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}
