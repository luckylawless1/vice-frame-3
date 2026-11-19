# VICE FRAME 3 — GTA-Style Cover Art Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/luckylawless1/vice-frame-3/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/luckylawless1/vice-frame-3/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

VICE FRAME 3 is an offline web app that turns any photo into GTA 6-style
multi-panel cover art. Open it, drop in your photos, arrange them across a
cover layout, grade each panel, add the masthead, stickers and caption, and
export a finished cover as a PNG in 1080×1080, 1080×1350 or 1920×1080.

Everything runs locally in the browser — no build step, no network, no
accounts. The fonts (Anton and Archivo Black, both SIL Open Font License)
ship inside the app, and every sticker and editorial mark is drawn on
canvas by the app itself.

## Features

- **Photos**: 9 built-in sample photos, multi-photo upload, and drag & drop.
  Click a panel to select it, click a photo thumbnail to assign it, drag to
  pan the photo inside its panel, mouse wheel or slider to zoom, arrow keys
  to nudge (Shift for bigger steps).
- **6 layouts**: Cover Star, Collage Four, Panel Grid, Crew Wide,
  Cover Close-Up (one huge hero panel with two bordered insets) and
  Angled Grid (diagonal panel cuts).
- **7 colour grades**, per panel or applied to all at once: Clean,
  Vice Sunset, Neon Night, Ink Poster (posterize + edge darkening +
  halftone), Duotone Heat (pink/teal gradient map), Split Tone (warm
  highlights, cool shadows) and Golden Hour.
- **Masthead**: editable Title / Tagline / Caption. The title is set in
  Anton with a pink-to-teal gradient; the wanted-stars row is placed from
  the measured bottom edge of the wrapped title, so it can never overlap
  it; the tagline glows neon.
- **Stickers & finish**: canvas-drawn palm silhouette, star badge,
  "NEW!" starburst (always inset from the edges, never clipped), wanted
  stars, film grain, plus a magazine barcode block and the issue line
  "ISSUE 06 · LAS LUMEN · $6.99".
- **Export**: one button per size (1080×1080, 1080×1350, 1920×1080) plus
  an "Export all 3 sizes" button.

## Run it

Serve the `app/` folder with any static file server and open it in a
desktop browser. With Node 22 the kit's tiny server works out of the box:

```
node serve.ts            # then open the local address it prints
```

`node main.ts` packages the entry: it copies `app/` and `screenshots/`
into the output directory (`MAKEFUN_OUTPUT_DIR`, default `/output`) and
writes the `dossier.json` the bounty scores.

## Layout of this repo

- `app/` — the web app itself (static files only): `index.html`,
  `style.css`, `src/` (editor, renderer, grades, layouts, stickers),
  `fonts/`, `samples/`.
- `screenshots/` — renders of the app for the bounty page.
- `main.ts` — the packaging entry point described above.
- `vendor/makefun-app.ts` — the kit's dossier builder, kept byte-identical.
- `serve.ts`, `shots.json` — the kit's local server and screenshot plan.
