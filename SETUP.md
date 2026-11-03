# Connecting the Studio dashboard

The website works right now without any of this. The sixteen styles are built
into the page. You only need these steps if you want the owner to be able to
add and edit pieces herself at `/admin/`.

It is free, and it takes about five minutes. Do it once.

---

## 1. Make a Supabase project

Go to [supabase.com](https://supabase.com) and sign up. Create a new project.

- **Name:** ByJooy
- **Region:** pick the one nearest Lagos (usually `eu-west` or `eu-central`)
- **Database password:** generate one and save it somewhere safe

Wait a minute or two while it builds.

## 2. Create the tables

In the left sidebar open **SQL Editor** and click **New query**.

Open `supabase/schema.sql` from this project, copy the whole file, paste it in,
and press **Run**.

You should see "Success. No rows returned." That is correct.

## 3. Copy the two keys into the site

In the sidebar open **Project Settings** then **API**. You need two values:

| On the Supabase page | Goes into `assets/js/config.js` |
|---|---|
| Project URL | `SUPABASE_URL` |
| `anon` `public` key | `SUPABASE_ANON_KEY` |

Open `assets/js/config.js` and paste them in:

```js
window.BYJOOY_CONFIG = {
  SUPABASE_URL: 'https://xxxxxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',
  WHATSAPP: '2349038800195'
};
```

The anon key is safe to publish. The database rules only let it read pieces
that are set to show. Nothing can be changed without signing in.

## 4. Create her login

In the sidebar open **Authentication** then **Users**, and click
**Add user** then **Create new user**.

- Enter her email and a password
- Tick **Auto Confirm User** so she does not have to click a link in an email

Give her those details. She can change the password later from the same screen.

## 5. Commit and push

```bash
git add assets/js/config.js && git commit -m "connect studio backend" && git push
```

Give it two minutes to go live.

---

## Using it

She goes to **`/admin/`** on the site, signs in, and gets the dashboard.

- **+ New piece** adds a style. Name, price, sizes, category, description,
  photos, and an optional video.
- Photos are one per colourway. The first is the cover. Drag to reorder.
- **Hide** takes a piece off the website without deleting it.
- **Import starter catalogue** is a one-time button that pulls the sixteen
  styles already on the site into the dashboard so everything lives in one
  place. Press it once, on the first visit.

Once the dashboard has pieces in it, the website reads from there instead of
the built-in catalogue. If the backend is ever unreachable the site quietly
falls back to the built-in sixteen, so it can never show an empty page.

## Limits on the free plan

500 MB of database and 1 GB of file storage, which is a few thousand photos.
Supabase pauses a project after a week with no traffic; opening the site wakes
it. If that becomes annoying their paid tier is about 25 dollars a month.
