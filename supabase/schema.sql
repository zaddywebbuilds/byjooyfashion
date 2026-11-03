-- ============================================================
-- ByJooy - database setup
-- Paste this whole file into the Supabase SQL editor and run it once.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tag         text not null default 'Core',
  price_low   integer not null default 0,
  price_high  integer,
  sizes       text not null default '6 - 18',
  note        text default '',
  images      jsonb not null default '[]'::jsonb,
  video_url   text,
  position    integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_position_idx on public.products (position, created_at);

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- row level security
--   the public site reads published rows with the anon key
--   only a signed-in account may write
-- ------------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "anyone reads published products" on public.products;
create policy "anyone reads published products"
  on public.products for select
  using (published = true);

drop policy if exists "signed in reads everything" on public.products;
create policy "signed in reads everything"
  on public.products for select
  to authenticated
  using (true);

drop policy if exists "signed in inserts" on public.products;
create policy "signed in inserts"
  on public.products for insert
  to authenticated
  with check (true);

drop policy if exists "signed in updates" on public.products;
create policy "signed in updates"
  on public.products for update
  to authenticated
  using (true) with check (true);

drop policy if exists "signed in deletes" on public.products;
create policy "signed in deletes"
  on public.products for delete
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- storage bucket for photos and video
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "anyone reads media" on storage.objects;
create policy "anyone reads media"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "signed in uploads media" on storage.objects;
create policy "signed in uploads media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "signed in updates media" on storage.objects;
create policy "signed in updates media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media');

drop policy if exists "signed in deletes media" on storage.objects;
create policy "signed in deletes media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');
