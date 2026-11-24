# histoday

What happened on this day in history, shown as a small stack of paper story cards.

- **Data:** Wikipedia "On this day". English and Chinese use the Wikimedia REST feed
  (`https://{lang}.wikipedia.org/api/rest_v1/feed/onthisday/all/MM/DD`). The feed does not
  support Japanese, so for `ja` the app parses the ja.wikipedia date article (`11月24日`), with its
  できごと / 誕生日 / 忌日 sections, and looks up images and descriptions for the linked articles.
- **Cards:** each event has a year, its description, the main linked article (title, short
  description, extract) and a thumbnail. If there is no image, or it fails to load, a paper placeholder
  showing the year appears instead.
- **Navigation:** swipe on touch screens, drag with the mouse, use the ← → arrow keys, or use the
  on-screen buttons. You can also switch between Events / Births / Deaths and change the date.
- **Languages:** English, 中文 (Simplified), 日本語 for both UI and content. Each language loads its own
  Wikipedia and lists stories about its "home" country first: US/UK for English, China for Chinese,
  Japan for Japanese. Keywords are matched against the event text and the linked article titles
  (see `src/shared/ranking.ts`). Matching cards carry a small tag.
- **Deep links:** `?lang=ja&date=11-24&kind=births`.

## Tech

- Vite + TypeScript, no UI framework. The static site builds to `dist/`.
- `functions/api/onthisday/[lang]/[month]/[day].ts` is a Cloudflare Pages Function. It fetches and
  normalizes the Wikipedia data, shrinks the payload (the raw feed is about 1.7 MB) and caches it at
  the edge for 6 hours.
- The browser calls `/api/onthisday/...` first. If no Function is available (for example under
  `vite dev` or on a plain static host), it calls Wikipedia directly, since both APIs allow CORS.
  The same code in `src/shared/` runs in both places.

```
src/
  main.ts            UI wiring, state, URL sync
  deck.ts            paper card stack + pointer/touch drag
  i18n.ts            UI strings (en / zh / ja)
  api.ts             Function-first loader with direct-Wikipedia fallback
  shared/            data layer shared with the Pages Function
    feed.ts          REST feed (en, zh)
    jawiki.ts        ja.wikipedia date-article parser
    ranking.ts       home-country prioritization
functions/api/...    Cloudflare Pages Function
```

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173 (browser talks to Wikipedia directly)
npm run pages:dev  # production build + Pages Function via wrangler at http://localhost:8788
npm test           # unit tests (parser, ranking, feed normalization)
npm run build      # type-check + build into dist/
```

## Deploy to Cloudflare Pages

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize GitHub and pick the `nickwang94/histoday` repository.
3. Use these build settings:

   | Setting                | Value           |
   | ---------------------- | --------------- |
   | Framework preset       | `None` (or Vite) |
   | Production branch      | `master`        |
   | Build command          | `npm run build` |
   | Build output directory | `dist`          |
   | Root directory         | `/` (leave empty) |

4. Under **Environment variables**, optionally set `NODE_VERSION` = `22`. The build image default
   also works, as long as it is Node 20 or newer.
5. Click **Save and Deploy**. Cloudflare picks up the `functions/` directory automatically and
   deploys it as Pages Functions. No bindings or secrets are needed.

After that, every push to `master` deploys to production and every other branch or PR gets a
preview URL.

`wrangler.toml` sets `pages_build_output_dir = "dist"`, so you can also deploy from the CLI with
`npx wrangler pages deploy` after `npm run build`.

## Attribution

Content comes from [Wikipedia](https://www.wikipedia.org/) under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Each card links to its source
article.
