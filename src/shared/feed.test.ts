import { describe, expect, it } from 'vitest';
import { feedUrl, isYearTitle, normalizeFeed, upscaleThumbnail } from './feed';

describe('feedUrl', () => {
  it('pads the date and pins the zh variant', () => {
    expect(feedUrl('en', 3, 7)).toBe('https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/03/07');
    expect(feedUrl('zh', 11, 24)).toContain('?variant=zh-hans');
  });
});

describe('isYearTitle', () => {
  it('detects year pages in each language', () => {
    expect(isYearTitle('1859')).toBe(true);
    expect(isYearTitle('44 BC')).toBe(true);
    expect(isYearTitle('2024年')).toBe(true);
    expect(isYearTitle('紀元前44年')).toBe(true);
    expect(isYearTitle('Apollo 12')).toBe(false);
  });
});

describe('upscaleThumbnail', () => {
  const thumb = { source: 'https://upload.wikimedia.org/a/b/320px-X.jpg', width: 320, height: 240 };
  it('requests a larger rendition when the original is big enough', () => {
    expect(upscaleThumbnail(thumb, { source: '', width: 2000, height: 1500 }).source).toContain('/1280px-X.jpg');
    expect(upscaleThumbnail(thumb, { source: '', width: 1000, height: 750 }).source).toContain('/960px-X.jpg');
  });
  it('keeps the thumbnail when the original is small', () => {
    expect(upscaleThumbnail(thumb, { source: '', width: 400, height: 300 })).toBe(thumb);
  });
});

describe('normalizeFeed', () => {
  it('merges selected into events, drops year and disambiguation pages, picks an image', () => {
    const page = (title: string, extra = {}) => ({ title, ...extra });
    const result = normalizeFeed(
      {
        selected: [{ text: 'A', year: 1900, pages: [page('1900'), page('Topic', { thumbnail: { source: 'img' } })] }],
        events: [
          { text: 'A', year: 1900, pages: [] },
          { text: 'B', year: 1800, pages: [page('Ambiguous', { type: 'disambiguation' }), page('Other')] },
        ],
        births: [],
        deaths: [],
      },
      'en',
    );
    expect(result.events.map((e) => e.text)).toEqual(['A', 'B']);
    expect(result.events[0].pages.map((p) => p.title)).toEqual(['Topic']);
    expect(result.events[0].image?.source).toBe('img');
    expect(result.events[1].pages.map((p) => p.title)).toEqual(['Other']);
    expect(result.events[1].image).toBeUndefined();
  });
});
