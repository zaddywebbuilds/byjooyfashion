# ByJooy - Adire Atelier

Single-page site for ByJooy, a Lagos adire label. 16 styles, 145 colourways.

## Running locally

No build step. Serve the folder over HTTP (not `file://`, or the image paths and
GSAP pins misbehave):

```bash
npx serve -l 4321 .
```

Then open http://localhost:4321

## Structure

```
index.html
assets/
  css/style.css
  js/main.js          interactions
  js/products.js      GENERATED - do not edit by hand
  img/<style-slug>/   product photos, one folder per style
build-data.ps1        regenerates products.js from the image folders
```

## Adding or changing products

1. Drop the photos into `assets/img/<style-slug>/`, named
   `<style-slug>-1.jpg`, `-2.jpg`, and so on.
2. If the style is new, add an entry to the `$meta` table at the top of
   `build-data.ps1` (name, tag, price, sizes, note). The key must match the
   folder name exactly.
3. Regenerate the data file:

   ```bash
   pwsh ./build-data.ps1
   ```

`products.js` is rewritten from what is actually on disk, so the image lists
never drift from the folders.

The `tag` field drives the filter chips on the collection grid. Current tags are
`Signature`, `Core` and `Occasion`.

## Before going live

- `index.html` and `assets/js/main.js` contain a placeholder WhatsApp number
  (`2348000000000`) and Instagram handle (`instagram.com/byjooy`). Replace both
  with the real ones - search for `wa.me` and `instagram.com`.
- Photos are 810x1080 straight off the phone. Fine as-is, but converting to
  WebP would cut the page weight meaningfully.

## Tech

Plain HTML, CSS and JS. GSAP + ScrollTrigger for the scroll-driven work, Lenis
for smooth scrolling, both from CDN. Deploys anywhere static.
