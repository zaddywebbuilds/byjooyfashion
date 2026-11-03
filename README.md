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

## Brand

White and black. The clothes supply the colour, so the site stays out of their
way. Green is the only accent and is used sparingly.

Both greens live in `:root` at the top of `style.css`:

```css
--green:    #0F6B45;   /* on white */
--green-lt: #3DA47A;   /* on black */
```

Change those two values and the accent updates everywhere.

Layout rule: **no text or UI sits on top of a photo.** Names, prices, colourway
counts and captions all go on the white or black surface beside or under the
image.

## Contact in the markup

WhatsApp `0903 880 0195` is linked as `wa.me/2349038800195` in four places
(order section, order button in the lightbox, and twice in the footer area) and
in the JSON-LD block. Search for `2349038800195` to change all of them at once.

## Before going live

- The Instagram handle (`instagram.com/byjooy`) is a guess. Search for
  `instagram.com` in `index.html` and correct it if it is wrong.
- Photos are 810x1080 straight off the phone. Fine as-is, but converting to
  WebP would cut the page weight meaningfully.

## Tech

Plain HTML, CSS and JS. GSAP + ScrollTrigger for the scroll-driven work, Lenis
for smooth scrolling, both from CDN. Deploys anywhere static.
