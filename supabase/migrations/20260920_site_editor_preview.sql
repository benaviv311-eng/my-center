create table if not exists public.site_edit_previews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.site_edit_requests(id) on delete cascade,
  token_hash text not null unique,
  head_sha text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.site_edit_previews enable row level security;

drop policy if exists "site_edit_previews_read_own" on public.site_edit_previews;
create policy "site_edit_previews_read_own"
on public.site_edit_previews
for select to authenticated
using (
  exists (
    select 1
    from public.site_edit_requests r
    where r.id = request_id
      and r.user_id = (select auth.uid())
  )
);

create index if not exists site_edit_previews_request_idx
  on public.site_edit_previews(request_id, created_at desc);

create index if not exists site_edit_previews_expiry_idx
  on public.site_edit_previews(expires_at);
