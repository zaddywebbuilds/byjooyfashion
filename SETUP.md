# Setting up the Studio dashboard

Studio lets her add and edit pieces at `/admin/` without touching code.

There is no server, no database and nothing to pay for. When she saves,
Studio writes the photos and the catalogue straight into this GitHub
repository as one commit, and the live site updates a minute or two later.

Setup is one job: make her an access key. About three minutes.

---

## Make the access key

Do this from the GitHub account that owns the repository.

1. Go to **[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)**

2. Fill it in:

   | Field | Set it to |
   |---|---|
   | Token name | `ByJooy Studio` |
   | Expiration | **No expiration** |
   | Resource owner | `zaddywebbuilds` |
   | Repository access | **Only select repositories**, then pick `byjooyfashion` |

3. Open **Repository permissions** and set exactly one:

   - **Contents** -> **Read and write**

   Leave everything else on No access. This key can only edit files in this
   one repository. It cannot touch other repos, settings, or the account.

4. Click **Generate token** and copy the key. It starts `github_pat_`.
   GitHub shows it once, so paste it somewhere safe now.

> **Pick No expiration.** If you set a date, Studio simply stops accepting
> her key on that day and she will have no idea why. If your org forbids
> non-expiring tokens, set a reminder to issue a new one before it lapses.

## Give it to her

Easiest way: open `/admin/` on **her** phone yourself, paste the key in with
*Remember me* ticked, and hand the phone back. She never sees the key and
never types it again. Repeat once on any other device she uses.

Otherwise send her the key and the address, and talk her through the one
paste. Treat it like a password in transit.

## Check it first

Before handing it over, sign in yourself and add a test piece, then delete
it. Sign-in performs a real write against the repository, so if the
permission is wrong you find out immediately rather than she does.

She pastes the key once, ticks *Stay signed in on this device*, and will not
be asked again on that phone or laptop.

---

## How she uses it

- **+ New piece** adds a style: name, price, sizes, category, description,
  photos.
- Photos are one per colourway. The first is the cover. Drag to reorder.
  She can upload straight from her phone camera roll; the pictures are
  shrunk and converted automatically before saving, so size does not matter.
- **Hide** takes a piece off the website without deleting it.
- **Move up** and **Move down** change the order on the site.
- **Delete** removes a piece from the website. The photos stay in the
  repository, so it can be undone.

After each save the site takes a minute or two to update, because GitHub
rebuilds it. That delay is normal.

## If she loses the key

Make a new one with the steps above and delete the old one at
[github.com/settings/tokens](https://github.com/settings/tokens).

## What the key can and cannot do

It can add, change and delete files in `byjooyfashion`, which is exactly what
Studio needs. It cannot read private repositories, change account settings,
or spend money. If it ever leaks, delete it on that page and the key stops
working immediately.

## Where things live

- `data/products.json` is the catalogue Studio writes.
- `assets/img/<slug>/` holds the photos, with 440px copies in `thumb/`.
- `assets/js/products.js` is a copy baked into the page. If the catalogue
  file ever fails to load the site falls back to it, so the collection can
  never come up empty. Refresh it with `pwsh ./build-data.ps1`.
