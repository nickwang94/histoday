import { describe, expect, it } from 'vitest';
import { isLocal, rankItems } from './ranking';
import type { HistoryItem } from './types';

const item = (over: Partial<HistoryItem>): HistoryItem => ({
  id: over.id ?? 'x',
  kind: 'events',
  year: 2000,
  text: '',
  pages: [],
  local: false,
  ...over,
});

describe('isLocal', () => {
  it('matches US/UK for English but not South America', () => {
    expect(isLocal('en', item({ text: 'The United States grants Lend-Lease.' }))).toBe(true);
    expect(isLocal('en', item({ text: 'British forces land.' }))).toBe(true);
    expect(isLocal('en', item({ text: 'A coup in South America.' }))).toBe(false);
  });

  it('uses page descriptions only for people', () => {
    const pages = [{ title: 'Jane Doe', description: 'American actress', url: '' }];
    expect(isLocal('en', item({ kind: 'births', text: 'Jane Doe', pages }))).toBe(true);
    expect(isLocal('en', item({ kind: 'events', text: 'Jane Doe', pages }))).toBe(false);
  });

  it('matches China for zh and Japan for ja', () => {
    expect(isLocal('zh', item({ text: '中华人民共和国成立。' }))).toBe(true);
    expect(isLocal('ja', item({ text: '鳩山一郎らが日本民主党を結成。' }))).toBe(true);
    expect(isLocal('ja', item({ text: 'フィリピンで火災。' }))).toBe(false);
  });
});

describe('rankItems', () => {
  it('puts local items first, newest first within each group', () => {
    const ranked = rankItems('ja', [
      item({ id: 'a', year: 2020, text: 'フランスで選挙。' }),
      item({ id: 'b', year: 1900, text: '東京で開業。' }),
      item({ id: 'c', year: 1950, text: '日本で施行。' }),
      item({ id: 'd', year: 2001, text: 'ドイツで事故。' }),
    ]);
    expect(ranked.map((i) => i.id)).toEqual(['c', 'b', 'a', 'd']);
    expect(ranked.map((i) => i.local)).toEqual([true, true, false, false]);
  });
});
