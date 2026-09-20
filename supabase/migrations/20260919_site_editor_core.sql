create table if not exists public.site_edit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.site_chat_threads(id) on delete set null,
  prompt text not null,
  area text not null default 'global',
  page_context jsonb not null default '{}'::jsonb,
  selected_element jsonb,
  summary text not null default '',
  risk_level text not null check (risk_level in ('low','medium','high')),
  status text not null check (status in (
    'planning','awaiting_plan_approval','approved','applying','testing','repairing',
    'preview_ready','awaiting_publish_approval','merging','deploying','deployed',
    'needs_replan','failed','cancelled','rolled_back'
  )),
  base_sha text,
  branch_name text,
  head_sha text,
  pr_number bigint,
  merge_commit_sha text,
  deploy_status text,
  undo_of_request_id uuid references public.site_edit_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.site_edit_operations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.site_edit_requests(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  operation_type text not null check (operation_type in ('replace_text','replace_file','create_file','delete_file','publish_asset')),
  path text not null,
  expected_sha text,
  payload jsonb not null default '{}'::jsonb,
  diff_summary text not null default '',
  status text not null default 'pending' check (status in ('pending','applied','failed','cancelled')),
  created_at timestamptz not null default now(),
  unique(request_id, sequence)
);

create table if not exists public.site_edit_approvals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.site_edit_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stage text not null check (stage in ('plan','publish','rollback')),
  decision text not null check (decision in ('approved','rejected')),
  approved_head_sha text,
  created_at timestamptz not null default now()
);

create table if not exists public.site_edit_runs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.site_edit_requests(id) on delete cascade,
  kind text not null,
  provider_run_id text,
  status text not null,
  url text,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.site_edit_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.site_edit_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.site_edit_requests enable row level security;
alter table public.site_edit_operations enable row level security;
alter table public.site_edit_approvals enable row level security;
alter table public.site_edit_runs enable row level security;
alter table public.site_edit_events enable row level security;

drop policy if exists "site_edit_requests_read_own" on public.site_edit_requests;
create policy "site_edit_requests_read_own"
on public.site_edit_requests
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "site_edit_operations_read_own" on public.site_edit_operations;
create policy "site_edit_operations_read_own"
on public.site_edit_operations
for select to authenticated
using (
  exists (
    select 1
    from public.site_edit_requests r
    where r.id = request_id
      and r.user_id = (select auth.uid())
  )
);

drop policy if exists "site_edit_approvals_read_own" on public.site_edit_approvals;
create policy "site_edit_approvals_read_own"
on public.site_edit_approvals
for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.site_edit_requests r
    where r.id = request_id
      and r.user_id = (select auth.uid())
  )
);

drop policy if exists "site_edit_runs_read_own" on public.site_edit_runs;
create policy "site_edit_runs_read_own"
on public.site_edit_runs
for select to authenticated
using (
  exists (
    select 1
    from public.site_edit_requests r
    where r.id = request_id
      and r.user_id = (select auth.uid())
  )
);

drop policy if exists "site_edit_events_read_own" on public.site_edit_events;
create policy "site_edit_events_read_own"
on public.site_edit_events
for select to authenticated
using (
  exists (
    select 1
    from public.site_edit_requests r
    where r.id = request_id
      and r.user_id = (select auth.uid())
  )
);

create index if not exists site_edit_requests_user_updated_idx
  on public.site_edit_requests(user_id, updated_at desc);
create index if not exists site_edit_requests_status_idx
  on public.site_edit_requests(status, updated_at desc);
create index if not exists site_edit_operations_request_idx
  on public.site_edit_operations(request_id, sequence);
create index if not exists site_edit_approvals_request_idx
  on public.site_edit_approvals(request_id, created_at desc);
create index if not exists site_edit_runs_request_idx
  on public.site_edit_runs(request_id, started_at desc);
create index if not exists site_edit_events_request_idx
  on public.site_edit_events(request_id, created_at desc);
