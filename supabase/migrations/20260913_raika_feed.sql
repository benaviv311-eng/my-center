create table if not exists public.raika_feed_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_type text not null,
  title text not null,
  body text not null,
  structured_payload jsonb not null default '{}'::jsonb,
  context_refs jsonb not null default '[]'::jsonb,
  creativity_distance text not null check (creativity_distance in ('close','natural','wild')),
  signature text not null,
  batch_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  hidden_at timestamptz,
  promoted_item_id text
);

create table if not exists public.raika_feed_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.raika_feed_cards(id) on delete cascade,
  action text not null check (action in (
    'shown','liked','saved','more_like','less_like','discussed',
    'developed','converted_scene','hidden'
  )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists raika_feed_cards_user_created_idx
  on public.raika_feed_cards(user_id, created_at desc);
create index if not exists raika_feed_cards_user_signature_idx
  on public.raika_feed_cards(user_id, signature);
create index if not exists raika_feed_feedback_user_created_idx
  on public.raika_feed_feedback(user_id, created_at desc);
create index if not exists raika_feed_feedback_card_idx
  on public.raika_feed_feedback(card_id, created_at desc);

alter table public.raika_feed_cards enable row level security;
alter table public.raika_feed_feedback enable row level security;

drop policy if exists "raika feed cards own rows" on public.raika_feed_cards;
create policy "raika feed cards own rows"
  on public.raika_feed_cards
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "raika feed feedback own rows" on public.raika_feed_feedback;
create policy "raika feed feedback own rows"
  on public.raika_feed_feedback
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
