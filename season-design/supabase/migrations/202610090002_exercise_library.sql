create type public.exercise_source as enum ('sheets', 'user', 'generated');
create type public.progression_stage as enum ('isolated', 'fixed', 'complex', 'game-situation');
create type public.exercise_kind as enum (
  'technical',
  'warm-up-game',
  'group-game',
  'competitive-game',
  'game-flow-sequence',
  'transition-idea',
  'warmup-idea',
  'coaching-tag'
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  source public.exercise_source not null,
  kind public.exercise_kind not null,
  skill_id uuid references public.skills(id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  progression_stage public.progression_stage,
  min_level public.skill_level,
  max_level public.skill_level,
  min_players integer check (min_players is null or min_players > 0),
  max_players integer check (max_players is null or max_players > 0),
  source_spreadsheet_id text,
  source_tab text,
  source_row integer check (source_row is null or source_row > 0),
  source_key text,
  source_hash text,
  normalized_signature text,
  current_version_number integer not null default 1 check (current_version_number > 0),
  synchronized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_player_range_check check (
    min_players is null or max_players is null or min_players <= max_players
  ),
  constraint exercises_source_owner_check check (
    (source = 'sheets' and owner_id is null)
    or (source in ('user', 'generated') and owner_id is not null)
  ),
  constraint exercises_sheet_metadata_check check (
    source <> 'sheets'
    or (source_spreadsheet_id is not null and source_tab is not null and normalized_signature is not null)
  )
);

create index exercises_owner_id_idx on public.exercises(owner_id);
create index exercises_kind_stage_idx on public.exercises(kind, progression_stage);
create index exercises_skill_id_idx on public.exercises(skill_id);
create index exercises_normalized_signature_idx
  on public.exercises(source_tab, progression_stage, normalized_signature)
  where source = 'sheets';
create unique index exercises_sheet_source_key_unique
  on public.exercises(source_spreadsheet_id, source_tab, source_key)
  where source = 'sheets' and source_key is not null;

create table public.exercise_versions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  setup text not null default '',
  flow text not null default '',
  rules text not null default '',
  coaching_cues text not null default '',
  variations text not null default '',
  content_hash text not null check (length(trim(content_hash)) > 0),
  source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (exercise_id, version_number)
);

create index exercise_versions_exercise_idx
  on public.exercise_versions(exercise_id, version_number desc);

create table public.exercise_tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  slug text not null check (length(trim(slug)) > 0),
  label_he text not null check (length(trim(label_he)) > 0),
  created_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create unique index exercise_tags_shared_slug_unique
  on public.exercise_tags(slug)
  where owner_id is null;

create table public.exercise_tag_links (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  tag_id uuid not null references public.exercise_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (exercise_id, tag_id)
);

create table public.sheet_sync_runs (
  id uuid primary key default gen_random_uuid(),
  spreadsheet_id text not null,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  created_count integer not null default 0 check (created_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  unchanged_count integer not null default 0 check (unchanged_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  error_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create or replace function public.can_read_exercise(target_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_coach()
    and exists (
      select 1
      from public.exercises e
      where e.id = target_exercise_id
        and (e.source = 'sheets' or e.owner_id = auth.uid())
    );
$$;

create or replace function public.owns_exercise(target_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_coach()
    and exists (
      select 1
      from public.exercises e
      where e.id = target_exercise_id
        and e.owner_id = auth.uid()
        and e.source in ('user', 'generated')
    );
$$;

grant execute on function public.can_read_exercise(uuid) to authenticated;
grant execute on function public.owns_exercise(uuid) to authenticated;

grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert on public.exercise_versions to authenticated;
grant select, insert, update, delete on public.exercise_tags to authenticated;
grant select, insert, delete on public.exercise_tag_links to authenticated;

alter table public.exercises enable row level security;
alter table public.exercise_versions enable row level security;
alter table public.exercise_tags enable row level security;
alter table public.exercise_tag_links enable row level security;
alter table public.sheet_sync_runs enable row level security;

create policy "active_coaches_read_visible_exercises"
on public.exercises for select
to authenticated
using (
  public.is_active_coach()
  and (source = 'sheets' or owner_id = auth.uid())
);

create policy "active_coaches_create_personal_exercises"
on public.exercises for insert
to authenticated
with check (
  public.is_active_coach()
  and owner_id = auth.uid()
  and source in ('user', 'generated')
);

create policy "active_coaches_update_personal_exercises"
on public.exercises for update
to authenticated
using (
  public.is_active_coach()
  and owner_id = auth.uid()
  and source in ('user', 'generated')
)
with check (
  public.is_active_coach()
  and owner_id = auth.uid()
  and source in ('user', 'generated')
);

create policy "active_coaches_delete_personal_exercises"
on public.exercises for delete
to authenticated
using (
  public.is_active_coach()
  and owner_id = auth.uid()
  and source in ('user', 'generated')
);

create policy "active_coaches_read_visible_exercise_versions"
on public.exercise_versions for select
to authenticated
using (public.can_read_exercise(exercise_id));

create policy "active_coaches_append_personal_exercise_versions"
on public.exercise_versions for insert
to authenticated
with check (public.owns_exercise(exercise_id));

create policy "active_coaches_read_visible_tags"
on public.exercise_tags for select
to authenticated
using (public.is_active_coach() and (owner_id is null or owner_id = auth.uid()));

create policy "active_coaches_create_personal_tags"
on public.exercise_tags for insert
to authenticated
with check (public.is_active_coach() and owner_id = auth.uid());

create policy "active_coaches_update_personal_tags"
on public.exercise_tags for update
to authenticated
using (public.is_active_coach() and owner_id = auth.uid())
with check (public.is_active_coach() and owner_id = auth.uid());

create policy "active_coaches_delete_personal_tags"
on public.exercise_tags for delete
to authenticated
using (public.is_active_coach() and owner_id = auth.uid());

create policy "active_coaches_read_visible_tag_links"
on public.exercise_tag_links for select
to authenticated
using (public.can_read_exercise(exercise_id));

create policy "active_coaches_create_personal_tag_links"
on public.exercise_tag_links for insert
to authenticated
with check (public.owns_exercise(exercise_id));

create policy "active_coaches_delete_personal_tag_links"
on public.exercise_tag_links for delete
to authenticated
using (public.owns_exercise(exercise_id));

create or replace function public.reject_exercise_version_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'exercise versions are immutable' using errcode = '55000';
end;
$$;

create trigger exercise_versions_immutable_update
before update on public.exercise_versions
for each row execute function public.reject_exercise_version_mutation();

create trigger exercise_versions_immutable_delete
before delete on public.exercise_versions
for each row execute function public.reject_exercise_version_mutation();
