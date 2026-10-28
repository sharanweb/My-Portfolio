-- Run once in the Supabase SQL editor.

create table if not exists public.portfolio_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null default '',
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_created_at_idx on public.messages (created_at desc);

-- Only the server (service role key) reads and writes these tables.
alter table public.portfolio_content enable row level security;
alter table public.messages enable row level security;

-- Public bucket for avatars, project covers and testimonial photos.
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;
