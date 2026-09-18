create table if not exists public.site_chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope_kind text not null check (scope_kind in ('global','area')),
  scope_key text not null default 'global',
  title text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.site_chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  model text,
  context_snapshot jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.site_chat_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null default 'global',
  topic text not null default 'כללי',
  content text not null,
  importance smallint not null default 3 check (importance between 1 and 5),
  pinned boolean not null default false,
  source_thread_id uuid references public.site_chat_threads(id) on delete set null,
  source_message_id uuid references public.site_chat_messages(id) on delete set null,
  signature text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, signature)
);

create table if not exists public.site_chat_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.site_chat_threads(id) on delete cascade,
  kind text not null,
  label text not null,
  target jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','cancelled','executed','failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  executed_at timestamptz
);

create table if not exists public.site_chat_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_id uuid references public.site_chat_actions(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.site_chat_threads enable row level security;
alter table public.site_chat_messages enable row level security;
alter table public.site_chat_memories enable row level security;
alter table public.site_chat_actions enable row level security;
alter table public.site_chat_revisions enable row level security;

drop policy if exists "site_chat_threads_own" on public.site_chat_threads;
create policy "site_chat_threads_own" on public.site_chat_threads for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "site_chat_messages_own" on public.site_chat_messages;
create policy "site_chat_messages_own" on public.site_chat_messages for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "site_chat_memories_own" on public.site_chat_memories;
create policy "site_chat_memories_own" on public.site_chat_memories for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "site_chat_actions_own" on public.site_chat_actions;
create policy "site_chat_actions_own" on public.site_chat_actions for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "site_chat_revisions_own" on public.site_chat_revisions;
create policy "site_chat_revisions_own" on public.site_chat_revisions for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists site_chat_threads_user_scope_idx on public.site_chat_threads(user_id,scope_kind,scope_key,updated_at desc);
create index if not exists site_chat_messages_thread_idx on public.site_chat_messages(thread_id,created_at);
create index if not exists site_chat_memories_user_area_idx on public.site_chat_memories(user_id,area,pinned desc,importance desc,updated_at desc);
create index if not exists site_chat_actions_user_status_idx on public.site_chat_actions(user_id,status,created_at desc);
