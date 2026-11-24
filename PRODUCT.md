# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Casual readers on a phone taking a quick daily glance (commute, coffee break) at what happened on today's date in history. Desktop visitors exist but are secondary.

## Product Purpose

histoday shows what happened on this day in history, one story at a time. It always shows today's date: there is no date picker. Success means a visitor flips through a few stories in under a minute and wants to come back tomorrow.

## Positioning

Today's history from Wikipedia in the visitor's own language. Each language edition (English, Chinese, Japanese) puts stories about its home country first (US/UK, China, Japan). Stories are shown one at a time, as a deck you flip through, rather than as a list.

## Operating Context

- One-handed phone use. Swipe on touch, drag with a mouse, arrow keys and on-screen buttons on desktop.
- Categories: Events, Births, Deaths.
- Settings (language and credits) live behind a gear icon in a sheet, not on the main surface.

## Capabilities and Constraints

- Content comes from the Wikipedia "On this day" feed (en, zh) and from parsing the ja.wikipedia date article (ja), served through a Cloudflare Pages Function with a direct browser fallback.
- Each story has: year, text, an optional image (thumbnail up to 640px wide), and the main linked article (title, short description, extract, URL). Many stories have no image, so the design must stay strong without one.
- UI and content languages: English, Simplified Chinese, Japanese.
- Static site on Cloudflare Pages, Vite + TypeScript, no UI framework, small file count.
- Committed text (code, comments, docs) is English; zh/ja UI strings are allowed.

## Evidence on Hand

Real content only: live Wikipedia text and images. Do not invent stories, statistics or quotes. Wikipedia attribution (CC BY-SA 4.0) must stay reachable, in Settings.

## Product Principles

1. Today, one story at a time: the active story owns the screen.
2. Image-led when an image exists, typography-led when it does not.
3. Moving to the next story should feel physical and immediate.
4. Nothing on the main surface that a daily glance does not need.

## Accessibility & Inclusion

Keyboard navigation (arrow keys, buttons), respects reduced motion, correct `lang` per language so CJK glyphs render properly, readable contrast over photos.
