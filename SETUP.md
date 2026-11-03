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

## Make a second key for her

Do not hand over the one you tested with. Repeat the steps above and make a
separate key named `ByJooy Studio - Jooy`, with identical settings.

One key each means you can delete hers on its own, the day her phone is lost
or she stops working on the site, without locking yourself out. Deleting a
shared key would cut off both of you.

Both keys sit under your GitHub account, so every save is recorded as you no
matter who made it. That only affects authorship in the commit log and
changes nothing about how the site works.

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

## If she loses the key, or you need to cut off access

Go to
[github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens),
delete `ByJooy Studio - Jooy`, and make a replacement with the same steps.
It stops working the moment you delete it. Your own key is untouched.

## What the key can and cannot do

It can add, change and delete files in `byjooyfashion`, which is exactly what
Studio needs. It cannot read private repositories, change account settings,
or spend money. If it ever leaks, delete it on that page and the key stops
working immediately.

## Moving to your own domain

Do this **before** setting her up, so she only ever signs in once.

1. In the repository, go to **Settings** then **Pages**, and enter the domain
   under *Custom domain*. GitHub writes a `CNAME` file for you.

2. At your registrar, point the domain at GitHub Pages:

   | Record | Name | Value |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `zaddywebbuilds.github.io` |

3. Wait for it to propagate, which is usually under an hour, then come back
   to **Settings / Pages** and tick **Enforce HTTPS**.

   Do not skip this. Without it the access key would travel over plain
   HTTP, where it can be read in transit.

### What the move does to signing in

The key itself does not care about the domain; it is tied to the
repository. But browsers store it per address, so anyone already signed in
on the `github.io` address is signed out once when the domain changes, and
has to paste the key one more time. After that it sticks as before.

Nothing else needs changing. The 404 page works out its own address at
runtime, and everything else uses relative paths.

## Where things live

- `data/products.json` is the catalogue Studio writes.
- `assets/img/<slug>/` holds the photos, with 440px copies in `thumb/`.
- `assets/js/products.js` is a copy baked into the page. If the catalogue
  file ever fails to load the site falls back to it, so the collection can
  never come up empty. Refresh it with `pwsh ./build-data.ps1`.
