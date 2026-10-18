-- Training DNA coach-owned practice history, feedback, and future-only proposals.
create table public.training_practices (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  intent jsonb not null check (jsonb_typeof(intent) = 'object'),
  blocks jsonb not null check (jsonb_typeof(blocks) = 'array'),
  validation_warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(validation_warnings) = 'array'),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_practices_coach_group_date_idx
  on public.training_practices(coach_id, group_id, created_at desc);

create table public.training_feedback (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.training_practices(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);
create index training_feedback_practice_date_idx
  on public.training_feedback(practice_id, created_at desc);

create table public.training_recommendations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index training_recommendations_coach_group_idx
  on public.training_recommendations(coach_id,group_id,status);

grant select,insert,update,delete on public.training_practices to authenticated;
grant select,insert on public.training_feedback to authenticated;
grant select,insert,update on public.training_recommendations to authenticated;

alter table public.training_practices enable row level security;
alter table public.training_feedback enable row level security;
alter table public.training_recommendations enable row level security;

create policy "coach_read_own_practices"
  on public.training_practices for select to authenticated
  using (coach_id = auth.uid() and public.is_active_coach());
create policy "coach_create_own_practices"
  on public.training_practices for insert to authenticated
  with check (
    coach_id = auth.uid() and public.is_active_coach()
    and (group_id is null or public.owns_group(group_id))
  );
create policy "coach_update_own_practices"
  on public.training_practices for update to authenticated
  using (coach_id = auth.uid() and public.is_active_coach())
  with check (
    coach_id = auth.uid() and public.is_active_coach()
    and (group_id is null or public.owns_group(group_id))
  );
create policy "coach_delete_own_practices"
  on public.training_practices for delete to authenticated
  using (coach_id = auth.uid() and public.is_active_coach());

create policy "coach_read_own_training_feedback"
  on public.training_feedback for select to authenticated
  using (
    coach_id = auth.uid() and public.is_active_coach()
    and exists (
      select 1 from public.training_practices p
      where p.id = practice_id and p.coach_id = auth.uid()
    )
  );
create policy "coach_append_own_training_feedback"
  on public.training_feedback for insert to authenticated
  with check (
    coach_id = auth.uid() and public.is_active_coach()
    and exists (
      select 1 from public.training_practices p
      where p.id = practice_id and p.coach_id = auth.uid()
    )
  );

create policy "coach_read_own_training_recommendations"
  on public.training_recommendations for select to authenticated
  using (coach_id = auth.uid() and public.is_active_coach());
create policy "coach_insert_own_training_recommendations"
  on public.training_recommendations for insert to authenticated
  with check (
    coach_id = auth.uid() and public.is_active_coach()
    and (group_id is null or public.owns_group(group_id))
  );
create policy "coach_update_own_training_recommendations"
  on public.training_recommendations for update to authenticated
  using (coach_id = auth.uid() and public.is_active_coach())
  with check (
    coach_id = auth.uid() and public.is_active_coach()
    and (group_id is null or public.owns_group(group_id))
  );
