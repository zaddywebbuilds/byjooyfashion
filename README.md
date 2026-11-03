# ByJooy - African Prints, Lagos

Site for ByJooy, a Lagos label selling African prints: adire, Ankara, silk and
crepe. Sixteen styles, 145 colourways, ordering through WhatsApp, and a Studio
dashboard the owner runs herself.

Everything is **ready to wear**. Delivery is 1 to 3 days in Nigeria and 5 to 14
days outside it. The site must not claim made-to-order or bespoke fitting; that
was wrong in an earlier draft and the owner corrected it.

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
data/products.json      the live catalogue, written by the dashboard
assets/
  css/style.css
  js/config.js          repo name, paths, WhatsApp number
  js/main.js            interactions
  js/products.js        GENERATED - do not edit by hand
  img/<slug>/*.webp     full size, used in the lightbox
  img/<slug>/thumb/     440px versions, used on cards
  video/hero.mp4        hero film, muted and looping
  vendor/               GSAP, ScrollTrigger, Lenis
  fonts/                Bodoni Moda and Inter, with fonts.css
build-data.ps1          regenerates both catalogue files from the folders
SETUP.md                making her an access key
```

## No outside services

Everything the site needs is in this repository. Fonts and the animation
libraries are served from `assets/`, not from Google or a CDN, so the page
makes **zero external requests**. That is one less thing to break, a little
faster (no extra DNS and TLS handshakes), and it keeps working on networks
that block those hosts.

The only outside call anywhere is `api.github.com`, and only from the Studio
dashboard when she saves.

To update a vendored library, replace the file in `assets/vendor/`. Current
versions: GSAP 3.12.5, ScrollTrigger 3.12.5, Lenis 1.1.13.

## Where the catalogue comes from

`data/products.json` is the live catalogue. The Studio dashboard rewrites it
and commits it to this repo; the site fetches it on load.

`assets/js/products.js` is the same data baked into the page. If that fetch
ever fails the site falls back to it, so the collection can never render
empty. Both files are written by `build-data.ps1`.

There is no server and no database. See `SETUP.md`.

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

- Instagram handle. Facebook and TikTok are linked already.
- Studio needs an access key making before she can use it. See `SETUP.md`.
