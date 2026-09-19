create table if not exists public.site_chat_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.site_chat_messages(id) on delete cascade,
  thread_id uuid not null references public.site_chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text,
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','image/gif')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 6291456),
  created_at timestamptz not null default now()
);

alter table public.site_chat_attachments enable row level security;

drop policy if exists "site_chat_attachments_own" on public.site_chat_attachments;
create policy "site_chat_attachments_own"
on public.site_chat_attachments
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists site_chat_attachments_message_idx on public.site_chat_attachments(message_id, created_at);
create index if not exists site_chat_attachments_thread_idx on public.site_chat_attachments(thread_id, created_at);
create index if not exists site_chat_attachments_user_idx on public.site_chat_attachments(user_id, created_at);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-chat-images',
  'site-chat-images',
  false,
  6291456,
  array['image/png','image/jpeg','image/webp','image/gif']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
