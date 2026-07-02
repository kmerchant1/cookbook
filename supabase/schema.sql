-- cookbook — Supabase / Postgres schema (README "Suggested data model").
-- Run this in the Supabase SQL editor (or `supabase db push`) to provision the
-- backend for auth + cross-device sync.
--
-- Every table carries user_id and is protected by Row-Level Security so a user
-- only ever sees their own rows (policy: user_id = auth.uid()).

-- ---------------------------------------------------------------- enums
do $$ begin
  create type hue as enum ('terra', 'green', 'amber', 'neutral');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------- helper: updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------- recipes
create table if not exists recipes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null,
  servings       int  not null default 2,
  time_minutes   int,
  hero_image_url text,
  favorite       boolean not null default false,
  source_url     text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists recipe_ingredients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  recipe_id  uuid not null references recipes (id) on delete cascade,
  quantity   text,
  name       text not null,
  sort_order int  not null default 0
);

create table if not exists recipe_steps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  recipe_id  uuid not null references recipes (id) on delete cascade,
  position   int  not null default 0,
  text       text not null
);

-- ------------------------------------------------------------------ tags
create table if not exists tags (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users (id) on delete cascade,
  label    text not null,
  hue      hue  not null default 'neutral'
);

create table if not exists recipe_tags (
  user_id   uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  tag_id    uuid not null references tags (id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- ---------------------------------------------------------------- stores
create table if not exists stores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  hue        hue  not null default 'neutral',
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grocery_items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  store_id         uuid not null references stores (id) on delete cascade,
  name             text not null,
  quantity         text,
  done             boolean not null default false,
  sort_order       int  not null default 0,
  source_recipe_id uuid references recipes (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------- indexes
create index if not exists recipe_ingredients_recipe_idx on recipe_ingredients (recipe_id);
create index if not exists recipe_steps_recipe_idx        on recipe_steps (recipe_id);
create index if not exists grocery_items_store_idx        on grocery_items (store_id);
create index if not exists recipes_user_idx               on recipes (user_id);
create index if not exists stores_user_idx                on stores (user_id);

-- ---------------------------------------------------------- updated_at triggers
drop trigger if exists recipes_updated on recipes;
create trigger recipes_updated before update on recipes
  for each row execute function set_updated_at();

drop trigger if exists stores_updated on stores;
create trigger stores_updated before update on stores
  for each row execute function set_updated_at();

drop trigger if exists grocery_items_updated on grocery_items;
create trigger grocery_items_updated before update on grocery_items
  for each row execute function set_updated_at();

-- ============================================================ Row-Level Security
-- Enable RLS and add "owner can do anything to their own rows" policies to every
-- table. auth.uid() is the id of the currently authenticated Supabase user.

do $$
declare
  t text;
begin
  foreach t in array array[
    'recipes', 'recipe_ingredients', 'recipe_steps',
    'tags', 'recipe_tags', 'stores', 'grocery_items'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %I on %I;', t || '_owner', t);
    execute format(
      'create policy %I on %I for all
         using (user_id = auth.uid())
         with check (user_id = auth.uid());',
      t || '_owner', t
    );
  end loop;
end $$;
