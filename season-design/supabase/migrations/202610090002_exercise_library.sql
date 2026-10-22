create type public.exercise_source as enum ('sheets', 'user', 'generated');
create type public.exercise_kind as enum (
  'technical',
  'warmup-game',
  'group-game',
  'competitive-game',
  'game-flow-sequence',
  'transition-idea',
  'warmup-idea',
  'coaching-tag'
);
create type public.progression_stage as enum ('isolated', 'fixed', 'complex', 'game-situation');

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  source public.exercise_source not null,
  kind public.exercise_kind not null,
  progression_stage public.progression_stage,
  skill_slug text references public.skills(slug) on update cascade on delete set null,
  title text not null check (length(trim(title)) > 0),
  current_version_number integer not null default 0 check (current_version_number >= 0),
  is_shared boolean not null default false,
  source_spreadsheet_id text,
  source_tab text,
  source_row integer check (source_row is null or source_row > 0),
  source_key text,
  source_hash text,
  normalized_signature text,
  synchronized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source = 'sheets' and owner_id is null and is_shared)
    or
    (source in ('user', 'generated') and owner_id is not null and not is_shared)
  ),
  check (
    (kind = 'technical' and progression_stage is not null)
    or kind <> 'technical'
  )
);

create unique index exercises_sheet_source_key_uidx
  on public.exercises(source_spreadsheet_id, source_tab, source_key)
  where source = 'sheets' and source_key is not null;

create unique index exercises_sheet_source_row_uidx
  on public.exercises(source_spreadsheet_id, source_tab, source_row)
  where source = 'sheets' and source_row is not null;

create index exercises_signature_idx
  on public.exercises(source_tab, progression_stage, normalized_signature)
  where source = 'sheets';

create index exercises_owner_idx on public.exercises(owner_id);
create index exercises_kind_stage_idx on public.exercises(kind, progression_stage);

create table public.exercise_versions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  content_hash text not null,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (exercise_id, version_number),
  unique (exercise_id, content_hash)
);

create index exercise_versions_current_idx
  on public.exercise_versions(exercise_id, version_number desc);

create table public.exercise_tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  normalized_name text not null check (length(trim(normalized_name)) > 0),
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  check (
    (owner_id is null and is_shared)
    or
    (owner_id is not null and not is_shared)
  )
);

create unique index exercise_tags_shared_name_uidx
  on public.exercise_tags(normalized_name)
  where is_shared;

create unique index exercise_tags_owner_name_uidx
  on public.exercise_tags(owner_id, normalized_name)
  where owner_id is not null;

create table public.exercise_tag_links (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  tag_id uuid not null references public.exercise_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (exercise_id, tag_id)
);

create table public.sheet_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('running', 'succeeded', 'failed')),
  spreadsheet_id text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_count integer not null default 0 check (created_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  unchanged_count integer not null default 0 check (unchanged_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  error_message text
);

create or replace function public.reject_exercise_version_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'exercise_versions are immutable';
end;
$$;

create trigger exercise_versions_immutable_update
before update on public.exercise_versions
for each row execute function public.reject_exercise_version_mutation();

create trigger exercise_versions_immutable_delete
before delete on public.exercise_versions
for each row execute function public.reject_exercise_version_mutation();

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
  and (is_shared or owner_id = auth.uid())
);

create policy "active_coaches_create_personal_exercises"
on public.exercises for insert
to authenticated
with check (
  public.is_active_coach()
  and owner_id = auth.uid()
  and source in ('user', 'generated')
  and not is_shared
);

create policy "active_coaches_update_personal_exercises"
on public.exercises for update
to authenticated
using (
  public.is_active_coach()
  and owner_id = auth.uid()
  and source in ('user', 'generated')
  and not is_shared
)
with check (
  public.is_active_coach()
  and owner_id = auth.uid()
  and source in ('user', 'generated')
  and not is_shared
);

create policy "active_coaches_delete_personal_exercises"
on public.exercises for delete
to authenticated
using (
  public.is_active_coach()
  and owner_id = auth.uid()
  and source in ('user', 'generated')
  and not is_shared
);

create policy "active_coaches_read_visible_versions"
on public.exercise_versions for select
to authenticated
using (
  public.is_active_coach()
  and exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and (e.is_shared or e.owner_id = auth.uid())
  )
);

create policy "active_coaches_create_personal_versions"
on public.exercise_versions for insert
to authenticated
with check (
  public.is_active_coach()
  and exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and e.owner_id = auth.uid()
      and e.source in ('user', 'generated')
      and not e.is_shared
  )
);

create policy "active_coaches_read_visible_tags"
on public.exercise_tags for select
to authenticated
using (
  public.is_active_coach()
  and (is_shared or owner_id = auth.uid())
);

create policy "active_coaches_create_personal_tags"
on public.exercise_tags for insert
to authenticated
with check (
  public.is_active_coach()
  and owner_id = auth.uid()
  and not is_shared
);

create policy "active_coaches_update_personal_tags"
on public.exercise_tags for update
to authenticated
using (public.is_active_coach() and owner_id = auth.uid() and not is_shared)
with check (public.is_active_coach() and owner_id = auth.uid() and not is_shared);

create policy "active_coaches_delete_personal_tags"
on public.exercise_tags for delete
to authenticated
using (public.is_active_coach() and owner_id = auth.uid() and not is_shared);

create policy "active_coaches_read_visible_tag_links"
on public.exercise_tag_links for select
to authenticated
using (
  public.is_active_coach()
  and exists (
    select 1 from public.exercises e
    where e.id = exercise_id and (e.is_shared or e.owner_id = auth.uid())
  )
);

create policy "active_coaches_manage_personal_tag_links_insert"
on public.exercise_tag_links for insert
to authenticated
with check (
  public.is_active_coach()
  and exists (
    select 1 from public.exercises e
    where e.id = exercise_id and e.owner_id = auth.uid() and not e.is_shared
  )
  and exists (
    select 1 from public.exercise_tags t
    where t.id = tag_id and (t.is_shared or t.owner_id = auth.uid())
  )
);

create policy "active_coaches_manage_personal_tag_links_delete"
on public.exercise_tag_links for delete
to authenticated
using (
  public.is_active_coach()
  and exists (
    select 1 from public.exercises e
    where e.id = exercise_id and e.owner_id = auth.uid() and not e.is_shared
  )
);
