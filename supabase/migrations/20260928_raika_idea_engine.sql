create table if not exists public.raika_idea_pool (
  idea_id text primary key,
  title text not null,
  body text not null,
  category text not null default '',
  card_type text not null,
  characters jsonb not null default '[]'::jsonb,
  locations jsonb not null default '[]'::jsonb,
  timeline text not null default '',
  tone jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  plot_family text not null,
  signature text not null unique,
  semantic_fingerprint text not null,
  canon_dependencies jsonb not null default '[]'::jsonb,
  novelty_score double precision not null check (novelty_score between 0 and 1),
  source_type text not null check (source_type in ('base','dynamic')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.raika_idea_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id text,
  signature text not null,
  semantic_fingerprint text not null,
  plot_family text not null default '',
  scope text not null default 'fingerprint' check (scope in ('fingerprint','family')),
  reason text not null default 'never_show_again',
  created_at timestamptz not null default now(),
  unique (user_id, semantic_fingerprint)
);

create index if not exists raika_idea_pool_active_type_idx
  on public.raika_idea_pool(active, card_type);
create index if not exists raika_idea_pool_plot_family_idx
  on public.raika_idea_pool(plot_family);
create index if not exists raika_idea_pool_fingerprint_idx
  on public.raika_idea_pool(semantic_fingerprint);
create index if not exists raika_idea_blocks_user_created_idx
  on public.raika_idea_blocks(user_id, created_at desc);
create index if not exists raika_idea_blocks_user_family_idx
  on public.raika_idea_blocks(user_id, plot_family);

alter table public.raika_idea_pool enable row level security;
alter table public.raika_idea_blocks enable row level security;

drop policy if exists "raika idea blocks own rows select" on public.raika_idea_blocks;
create policy "raika idea blocks own rows select"
  on public.raika_idea_blocks for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "raika idea blocks own rows insert" on public.raika_idea_blocks;
create policy "raika idea blocks own rows insert"
  on public.raika_idea_blocks for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "raika idea blocks own rows delete" on public.raika_idea_blocks;
create policy "raika idea blocks own rows delete"
  on public.raika_idea_blocks for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.raika_idea_pool from anon, authenticated;
grant select, insert, delete on table public.raika_idea_blocks to authenticated;
