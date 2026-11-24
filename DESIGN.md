---
name: histoday
description: Today's history as a departures board, one story at a time.
colors:
  board: "#0b0b0b"
  flap: "#191919"
  sheet: "#111111"
  flap-edge: "#747474"
  rule: "#363636"
  ink: "#f2f1ee"
  ink-2: "#a9a9a6"
  ink-3: "#8c8c88"
  signal: "#f2b824"
typography:
  display:
    fontFamily: "'Sofia Sans Extra Condensed', 'Arial Narrow', sans-serif"
    fontSize: "calc(262 * var(--u))"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  headline:
    fontFamily: "'Sofia Sans Extra Condensed', 'Arial Narrow', sans-serif"
    fontSize: "calc(80 * var(--u))"
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "0"
  headline-cjk:
    fontFamily: "'Noto Sans SC', 'Noto Sans JP', system-ui, sans-serif"
    fontSize: "calc(56 * var(--u))"
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: "0.01em"
  title:
    fontFamily: "'Sofia Sans Extra Condensed', 'Arial Narrow', sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1
  wordmark:
    fontFamily: "'Sofia Sans', system-ui, sans-serif"
    fontSize: "calc(51 * var(--u))"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Sofia Sans', system-ui, sans-serif"
    fontSize: "calc(25 * var(--u))"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.012em"
  label:
    fontFamily: "'Sofia Sans', system-ui, sans-serif"
    fontSize: "calc(31 * var(--u))"
    fontWeight: 600
    letterSpacing: "0"
  numeric:
    fontFamily: "'Sofia Sans', system-ui, sans-serif"
    fontSize: "calc(40 * var(--u))"
    fontWeight: 600
    letterSpacing: "0.02em"
    fontFeature: "tnum"
rounded:
  hairline: "2px"
  option: "6px"
  flap: "calc(8 * var(--u))"
  sheet: "14px"
  round: "50%"
spacing:
  flap-gap: "calc(14 * var(--u))"
  text-gap: "calc(20 * var(--u))"
  board-to-text: "calc(26 * var(--u))"
  stage-inline: "calc(35 * var(--u))"
  board-to-progress: "calc(50 * var(--u))"
  sheet-stack: "8px"
  sheet-inline: "24px"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.board}"
    rounded: "{rounded.hairline}"
    padding: "calc(14 * var(--u)) calc(28 * var(--u))"
    typography: "{typography.label}"
  icon-button:
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "calc(50 * var(--u))"
  icon-button-hover:
    textColor: "{colors.signal}"
  tab:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  tab-active:
    textColor: "{colors.signal}"
  flap-cell:
    backgroundColor: "{colors.flap}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flap}"
    typography: "{typography.display}"
    height: "calc(228 * var(--u))"
  lang-option:
    backgroundColor: "{colors.flap}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.option}"
    padding: "0 18px"
    height: "56px"
  lang-option-selected:
    backgroundColor: "{colors.flap}"
    textColor: "{colors.ink}"
  settings-sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "22px 24px 28px"
    width: "560px"
---

# Design System: histoday

## Overview

**Creative North Star: "Departures from Today"**

The screen is a station departures board for today's date. One story owns the board at a time: its year sits on four split-flap cells, the headline beneath it in heavy extra-condensed grotesk, and a grayscale photograph hangs above, fading into matte black. Changing stories is physical. The text travels with the finger, the next photograph crossfades in proportion to the drag, and on release a spring settles the move while each year digit clatters forward through intermediate values.

The world runs on three inks: board black, flap white, and one signal yellow. Everything else is a step of neutral grey between them. Photographs are desaturated so they never introduce a fourth colour. Density is low and deliberate: a bar, a tab row, the board, a headline, one grey article line, a yellow progress rule, a counter. Nothing a daily glance does not need.

All geometry on phones is drawn in comp pixels (`--u`, one pixel of a 720 × 1280 comp, scaled to whichever of width or height is tighter), so the board keeps its proportions on any phone. On wide screens the board becomes a left column and the photograph claims the right.

**Key Characteristics:**
- Three inks: matte board black, warm flap white, one signal yellow; greys between.
- Split-flap year cells with a hairline split, hinge pins and ghost-grey edges.
- Heavy extra-condensed display type; tabular numerals everywhere a number appears.
- Grayscale full-bleed photograph masked into the board; an empty flap grid shows through when a story has no image.
- Motion is mechanical and spring-driven, never decorative.

## Colors

A near-monochrome board with a single chromatic signal.

### Primary
- **Signal Yellow** (`signal`): the only colour in the world. It marks state and place: the active tab and its underline, the progress fill, the era tag (BC) under the board, link underlines, the selected language box, the loading blink, focus rings, text selection, and the one filled button. It never fills large areas.

### Neutral
- **Matte Board** (`board`): page background, the bar and tabs on phones, the split line through each flap cell, and the text colour on Signal Yellow.
- **Flap Black** (`flap`): the face of split-flap cells and language options. Cell halves carry a faint vertical gradient (lighter top half, darker bottom half) to read as two physical leaves.
- **Sheet Black** (`sheet`): the Settings sheet surface and the empty-board fallback behind the photo.
- **Ghost Edge** (`flap-edge`): flap cell borders and hinge pins.
- **Rule Grey** (`rule`): 1px hairlines under the bar and tabs, between sheet sections, and around language options.
- **Flap White** (`ink`): primary text, the year digits, headlines, icons.
- **Article Grey** (`ink-2`): secondary text: the article line, inactive tabs, the local-first tag, sheet body copy, idle language names.
- **Dim Grey** (`ink-3`): sheet section headings, sheet notes and the idle language check box.

### Named Rules
**The One Signal Rule.** Signal Yellow is the only hue on screen. If a new element needs emphasis, it gets Signal Yellow or Flap White; it never gets a new colour.

**The Grayscale Photo Rule.** Every photograph renders through `grayscale(1) contrast(1.08) brightness(0.88)` with a dark radial vignette, so imagery stays inside the three inks.

## Typography

**Display Font:** Sofia Sans Extra Condensed 700 (with Arial Narrow)
**UI Font:** Sofia Sans 500 / 600 / 800 (with system-ui)
**CJK Headline Font:** Noto Sans SC 800 (zh) and Noto Sans JP 800 (ja), loaded on demand per language; system CJK stacks behind them.

All faces are self-hosted via @fontsource.

**Character:** A tall, tight, heavy display grotesk carries the year and the headline the way a departures board carries destinations; its wider sibling handles the quiet UI. The CJK headline face matches the weight rather than the width.

### Hierarchy
- **Display** (700, `calc(262 * var(--u))`, line-height 1, tabular): the four year digits on the flap cells. Nothing else uses this size.
- **Headline** (700, `calc(80 * var(--u))`, line-height 0.96): the story headline, clamped to six lines. It steps down by length to 64u, 52u (line-height 1) and 42u (line-height 1.04, eight lines). zh/ja headlines switch to the CJK face at 800, starting at 56u with line-height 1.18 and stepping to 46u, 38u and 32u, with strict line breaking.
- **Title** (700, 44px, line-height 1): the Settings sheet title and status messages (56u, Article Grey) share the display face.
- **Wordmark** (800, `calc(51 * var(--u))`, -0.01em): "histoday" in the top bar, lowercase.
- **Body** (500, `calc(25 * var(--u))`, line-height 1.3): the article line under the headline, clamped to two lines. Sheet copy is 18px at line-height 1.45.
- **Label** (600, `calc(31 * var(--u))`): tabs. The date (32u, 0.05em) and sheet section headings (15px, 0.08em) use the same weight with wider tracking.
- **Numeric** (600, `calc(40 * var(--u))`, tabular): the "03 / 49" counter.

### Named Rules
**The Tabular Rule.** Every number (year, date, counter) sets with tabular numerals so digits never jitter between stories.

**The Fit-by-Length Rule.** Headlines never shrink fluidly; they step down through fixed sizes chosen from text length, so the board always looks set rather than squeezed.

## Layout

The phone layout is a single column drawn on a 720 × 1280 comp. `--u` is `min(100vw / 720, 100svh / 1280)`, and `--side` centres the comp when the screen is wider than its ratio. The body is a fixed 100svh column with no page scroll: bar (86u), tabs (74u), then a stage that pins content to the bottom. The photograph is fixed behind the stage from under the tabs, masked to fade in at the top and out into the board by its lower edge.

Inside the stage, from the bottom up: the counter and footer, a 5u progress rule 50u under the story, the article line 20u under the headline, the headline 26u under the board, and the four flap cells (228u tall, 14u gaps) spanning the column. Stage inline padding is 35u; bottom padding is 50u plus the safe area.

At 900px and wider in landscape, `--u` becomes `clamp(0.62px, 100svh / 1000, 1.3px)`. The bar and tabs go transparent over the image, tabs left-align with 64u gaps, and the board, progress and footer form a left column of `min(720u, 48vw)`. The photograph takes the right 72vw at full height, masked on its left and bottom edges.

Prev and next buttons appear only for fine pointers with hover; touch users swipe.

## Elevation & Depth

The board is flat. Depth comes from masking and tone rather than shadows: the photograph fades into black through linear masks and a radial vignette, flap halves carry slight vertical gradients, and the Settings sheet is lifted only by a 62% black backdrop. The single shadow in the system belongs to the flip mechanism.

### Shadow Vocabulary
- **Leaf shade** (`box-shadow: inset 0 -10px 18px -12px rgba(0, 0, 0, 0.8)`): on the top leaf of a cell while it flips, to darken the hinge as it turns.

### Named Rules
**The Flat Board Rule.** Surfaces sit flat at rest. Depth is a fade into black, never a drop shadow.

## Shapes

Edges are mostly square and hard. Flap cells have softly rounded outer corners (8u) and none at the split; the split is a 2px board-black line with 5u hinge pins at both ends. Language options round to 6px, the primary button and focus rings to a near-square 2px, the Settings sheet to 14px on its top corners only. Icon buttons are circular hit areas with no visible fill. The language check is a 12px square, never a circle. Strokes are 1px hairlines; SVG icons use a 1.7 stroke with round caps.

## Components

### Split-flap Year Board (signature)
- **Character:** four mechanical cells, the year of the story.
- **Shape:** each cell is two halves with 8u outer corners, a ghost-edge border (1.5u, never under 1px), a 2px board-black split and hinge pins.
- **Behaviour:** on a story change each digit steps forward through the 0–9 cycle (at most five intermediate values), staggered across cells. Each step folds the top leaf down (accelerating ease) and drops the bottom leaf in; intermediate steps take 120ms, the landing step 210ms with a small overshoot.
- **Era:** a BC tag in Signal Yellow (600, 22u, 0.1em) hangs under the right edge when needed.

### Swipe Stage (signature)
- **Behaviour:** the story text follows the finger, blurring up to 6px and fading as it leaves; the next photograph crossfades in proportion to drag with a 3% slide and slight scale. Release commits past 22% of the width, or on a flick above 1.4 widths per second. A near-critically damped spring (stiffness 210, damping ratio 0.92) settles the move. At the ends of the deck the text rubber-bands and springs back.

### Buttons
- **Shape:** near-square (2px).
- **Primary:** Signal Yellow fill, Matte Board text, 600 at 28u, padding 14u × 28u, at least 40px tall. Used only for status actions such as retry.
- **Icon buttons:** 50u circular hit area (at least 36px), Flap White SVG, Signal Yellow on hover, 25% opacity when disabled.

### Tabs
- **Style:** Events / Births / Deaths spread across the row in Label type, Article Grey; hover lifts to Flap White.
- **Active:** Signal Yellow text over a 6u Signal Yellow underline (at least 3px) that slides between tabs over 0.5s on the standard ease-out.

### Progress and Counter
- **Progress:** a 5u rule with a 50% Signal Yellow track and a solid Signal Yellow fill that scales from the left over 0.6s.
- **Counter:** tabular "03 / 49" in Numeric type, followed by the local-first tag (600, 24u, 0.06em, Article Grey).

### Settings Sheet
- **Surface:** Sheet Black, 14px top corners, a 1px Rule Grey top edge, at most 560px wide and 88svh tall, sliding up from the bottom over 0.45s.
- **Sections:** separated by a 1px Rule Grey line with 26px above and 22px below.
- **Language options:** full-width Flap Black rows (56px, 6px radius, 1px Rule Grey border) with the language name in the display face at 30px. Selected: Flap White text, Signal Yellow border, filled Signal Yellow square.
- **Links:** Flap White, 600, Signal Yellow underline offset 0.25em.

### Status
- Loading, empty and error messages sit in the board's place in the display face (56u, Article Grey). Loading ends with a square Signal Yellow block blinking in one-second steps.

## Do's and Don'ts

### Do:
- **Do** keep Signal Yellow (`#f2b824`) as the only hue, used for state and place: active tab, progress, focus, selection, era, links.
- **Do** render every photograph grayscale and fade it into Matte Board through masks; keep the empty flap grid behind it for stories without an image.
- **Do** set every number with tabular numerals.
- **Do** size phone geometry in comp pixels (`calc(N * var(--u))`) so the board keeps its proportions.
- **Do** step headline sizes by text length rather than scaling them fluidly.
- **Do** give every flip and story change mechanical, spring-driven motion, with transitions collapsed under `prefers-reduced-motion`.
- **Do** keep 1px Rule Grey hairlines as the only dividers.

### Don't:
- **Don't** introduce a second accent colour or tint photographs with colour.
- **Don't** use drop shadows to lift surfaces; the only shadow is the leaf shade during a flip.
- **Don't** set years or headlines in the UI face; the display face owns them.
- **Do** keep Dim Grey (`ink-3`, #8c8c88) at or above its 5.6:1 contrast on Sheet Black; never dim small text below 4.5:1.
