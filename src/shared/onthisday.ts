import { feedUrl, fetchFeed } from './feed';
import { fetchJaOnThisDay } from './jawiki';
import { rankItems } from './ranking';
import type { Kind, Lang, OnThisDay } from './types';
import { KINDS } from './types';

export async function getOnThisDay(lang: Lang, month: number, day: number): Promise<OnThisDay> {
  const raw = lang === 'ja' ? await fetchJaOnThisDay(month, day) : await fetchFeed(lang, month, day);
  const items = {} as Record<Kind, OnThisDay['items'][Kind]>;
  for (const kind of KINDS) items[kind] = rankItems(lang, raw[kind]);
  return {
    lang,
    month,
    day,
    source: lang === 'ja' ? `https://ja.wikipedia.org/wiki/${month}月${day}日` : feedUrl(lang, month, day),
    items,
  };
}
