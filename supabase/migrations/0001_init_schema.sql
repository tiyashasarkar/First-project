-- Phase 0: core schema for the photo journal app.
-- Full data model per spec; Phase 0 only exercises journals + pages,
-- but the rest is created now so later phases don't need destructive migrations.

create extension if not exists "pgcrypto";

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type text not null default 'custom'
    check (type in ('daily', 'travel', 'school', 'letter', 'music', 'mood', 'custom')),
  theme jsonb not null default '{}'::jsonb,
  cover_page_id uuid,
  is_private boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals (id) on delete cascade,
  title text,
  date date not null default current_date,
  location jsonb,
  mood text,
  people text[] not null default '{}',
  weather jsonb,
  song jsonb,
  unlock_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journals
  add constraint journals_cover_page_id_fkey
  foreign key (cover_page_id) references public.pages (id) on delete set null;

create table if not exists public.page_elements (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  type text not null
    check (type in ('photo', 'video', 'sticker', 'text', 'doodle', 'tape', 'stamp')),
  transform jsonb not null default '{"x":0,"y":0,"width":100,"height":100,"rotation":0,"zIndex":0}'::jsonb,
  content_ref text,
  style jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  type text not null check (type in ('photo', 'video', 'audio')),
  duration numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.sticker_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  source text not null default 'custom' check (source in ('custom', 'built-in')),
  created_at timestamptz not null default now()
);

create index if not exists journals_user_id_idx on public.journals (user_id);
create index if not exists pages_journal_id_idx on public.pages (journal_id);
create index if not exists page_elements_page_id_idx on public.page_elements (page_id);
create index if not exists media_assets_user_id_idx on public.media_assets (user_id);
create index if not exists sticker_packs_user_id_idx on public.sticker_packs (user_id);

-- keep updated_at current on write
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger journals_set_updated_at
  before update on public.journals
  for each row execute function public.set_updated_at();

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

create trigger page_elements_set_updated_at
  before update on public.page_elements
  for each row execute function public.set_updated_at();
