# ByJooy - Adire Atelier

Site for ByJooy, a Lagos adire label. Sixteen cuts, 145 colourways, ordering
through WhatsApp, and a Studio dashboard the owner can run herself.

Live: https://zaddywebbuilds.github.io/byjooyfashion/
Studio: `/admin/`

## Running locally

No build step. Serve over HTTP, not `file://`:

```bash
npx serve -l 4321 .
```

## Structure

```
index.html              the site
admin/                  Studio dashboard (login, add and edit pieces)
assets/
  css/style.css
  js/config.js          backend keys - the only file you edit to connect it
  js/main.js            interactions
  js/products.js        GENERATED - do not edit by hand
  img/<slug>/*.webp     full size, used in the lightbox
  img/<slug>/thumb/     440px versions, used on cards
  video/hero.mp4        hero film, muted and looping
supabase/schema.sql     paste into Supabase once
build-data.ps1          regenerates products.js from the image folders
SETUP.md                connecting the dashboard, five steps
```

## Where the catalogue comes from

Two sources, in this order:

1. **The Studio dashboard**, if `assets/js/config.js` has been filled in.
2. **`products.js`**, the sixteen styles bundled into the repo.

If the backend is unreachable or empty the site silently falls back to the
bundled catalogue, so it can never render an empty page. See `SETUP.md`.

## Adding products without the dashboard

1. Put photos in `assets/img/<slug>/` named `<slug>-1.webp`, `-2.webp`, ...
2. Put 440px wide copies in `assets/img/<slug>/thumb/` with the same names.
3. Add a `$meta` entry in `build-data.ps1` keyed by the exact folder name.
4. Run `pwsh ./build-data.ps1`.

To make the two sizes from a source photo:

```bash
ffmpeg -i in.jpg -c:v libwebp -quality 82 assets/img/<slug>/<slug>-1.webp
ffmpeg -i in.jpg -vf scale=440:-1 -c:v libwebp -quality 80 assets/img/<slug>/thumb/<slug>-1.webp
```

## Brand

Surfaces carry a dusty rose sampled from the hero film rather than flat white
and black. Text is near-black. Green is the action colour and is what every
WhatsApp control uses.

```css
--bone:    #FDF6F7;   /* page surface   */
--bone-2:  #F6E7EA;   /* alt surface    */
--rose:    #BC8588;   /* accent         */
--rose-dp: #8F5456;   /* accent on text */
--green:   #0F6B45;   /* actions        */
```

Two layout rules the client set:

- **No text or UI on top of a photo.** Names, prices, colourway counts and
  captions sit on the surface beside or under the image.
- **No empty stretches.** If a section has room for an image it gets one.

## Ordering

Every piece has a WhatsApp button, and every colourway inside the lightbox has
its own. Each one opens a chat with the style, the colourway number and the
quoted price already written, leaving the buyer to fill in size and location.

The number is set once in `assets/js/config.js` under `WHATSAPP`, and the
scripted buttons read it from there. The plain links in `index.html` (hero,
order section, footer) carry it inline, so search `2349038800195` if it ever
changes.

Currently `2349038800195` (0903 880 0195).

## Still outstanding

- Instagram and TikTok handles. Facebook is linked already.
- The Studio dashboard is built but not connected. Follow `SETUP.md`.
