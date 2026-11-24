import { describe, expect, it } from 'vitest';
import { cleanWikitext, parseSectionLines, splitSections } from './jawiki';

describe('cleanWikitext', () => {
  it('turns links, templates and refs into plain text', () => {
    const links: string[] = [];
    const text = cleanWikitext(
      "[[チャールズ・ダーウィン]]がイギリスで『[[種の起源]]』を出版<ref>{{Cite web|title=x}}</ref>。{{仮リンク|シンバの反乱|en|Simba Rebellion}}軍",
      links,
    );
    expect(text).toBe('チャールズ・ダーウィンがイギリスで『種の起源』を出版。シンバの反乱軍');
    expect(links).toEqual(['チャールズ・ダーウィン', '種の起源']);
  });

  it('uses the label of piped links', () => {
    const links: string[] = [];
    expect(cleanWikitext('[[B-29 (航空機)|B-29]]が東京を爆撃', links)).toBe('B-29が東京を爆撃');
    expect(links).toEqual(['B-29 (航空機)']);
  });
});

describe('parseSectionLines', () => {
  it('parses year lines, calendar notes, BCE years and inherited years', () => {
    const lines = parseSectionLines(
      [
        '* [[1629年]]（[[寛永]]6年[[10月10日 (旧暦)|10月10日]]） - [[徳川家光]]の乳母が拝謁。',
        '* [[2024年]] - [[WBSCプレミア12]]の決勝。',
        '* 2024年 - [[フィリピン]]で火災。',
        '* [[紀元前44年]] - [[ガイウス・ユリウス・カエサル]]が暗殺される。',
        '* [[1990年]]',
        '** [[東京]]で何かが起こる。',
        '{{要出典}}',
      ].join('\n'),
    );
    expect(lines.map((l) => l.year)).toEqual([1629, 2024, 2024, -44, 1990]);
    expect(lines[0].text).toBe('徳川家光の乳母が拝謁。');
    expect(lines[0].links).toEqual(['徳川家光']);
    expect(lines[4].links).toEqual(['東京']);
  });
});

describe('splitSections', () => {
  it('maps headings to kinds and keeps subsections', () => {
    const s = splitSections(
      ['== できごと ==', '* a', '== 誕生日 ==', '* b', '== 忌日 ==', '* c', '=== 人物以外 ===', '* d', '== 脚注 ==', '* e'].join(
        '\n',
      ),
    );
    expect(s.events?.trim()).toBe('* a');
    expect(s.births?.trim()).toBe('* b');
    expect(s.deaths).toContain('* c');
    expect(s.deaths).toContain('* d');
    expect(s.deaths).not.toContain('* e');
  });
});
