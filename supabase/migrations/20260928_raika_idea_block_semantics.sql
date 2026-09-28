alter table public.raika_idea_blocks
  add column if not exists title text not null default '',
  add column if not exists body text not null default '';

create index if not exists raika_idea_blocks_user_fingerprint_idx
  on public.raika_idea_blocks(user_id, semantic_fingerprint);
