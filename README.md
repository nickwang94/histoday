# histoday

What happened today in history, one story at a time, on a split-flap departures board.

- **Data:** Wikipedia "On this day". English and Chinese use the Wikimedia REST feed
  (`https://{lang}.wikipedia.org/api/rest_v1/feed/onthisday/all/MM/DD`). The feed does not
  support Japanese, so for `ja` the app parses the ja.wikipedia date article (`11月24日`), with its
  できごと / 誕生日 / 忌日 sections, and looks up images and descriptions for the linked articles.
- **Always today:** the app shows today's date in the reader's time zone. There is no date picker.
- **Stories:** the year flips into place on split-flap cells, the headline and the main linked
  article sit below it, and the story's photo fills the top of the screen in black and white, fading
  into the board. Stories without a photo (or whose photo fails to load) show a wall of blank flaps.
- **Navigation:** swipe on touch screens, drag with the mouse, use the ← → arrow keys, or use the
  prev/next buttons (shown on devices with a mouse). The text follows the finger with a spring, and
  the photo crossfades in step with it. Switch between Events / Births / Deaths with the tabs.
- **Settings:** the gear icon opens a sheet with the language switch, an about note and credits.
- **Languages:** English, 中文 (Simplified), 日本語 for both UI and content. Each language loads its own
  Wikipedia and lists stories about its "home" country first: US/UK for English, China for Chinese,
  Japan for Japanese. Keywords are matched against the event text and the linked article titles
  (see `src/shared/ranking.ts`). Matching stories carry a small tag. The language choice is
  remembered in `localStorage`.
- **Deep links:** `?lang=ja&kind=births`.
- **Layout:** mobile-first. Phones and portrait screens scale one layout to the viewport; landscape
  screens 900px and wider put the board on the left and the photo on the right.

## Design

The look is a station departures board: matte black, flap white and one signal yellow.

- Headlines use Sofia Sans Extra Condensed and the UI uses Sofia Sans. Both are self-hosted
  through Fontsource, with no external font requests.
- Photos are rendered in grayscale so every story sits in the same world.
- Motion is limited to the flap flip, the spring-driven story switch and the settings sheet.
  `prefers-reduced-motion` turns all three into instant changes.

Design notes live in `PRODUCT.md` and `DESIGN.md`.

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
  main.ts            UI wiring, state, settings sheet, URL sync
  stage.ts           split-flap year + spring-driven story switch with photo crossfade
  styles.css         all styles (mobile first)
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
npm run dev        # Vite dev server at http://localhost:5173 (browser talks to Wikipedia directly;
                   # add ?fixture=comp for an offline sample day)
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
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Each story links to its source
article.
