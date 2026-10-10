create extension if not exists pgcrypto;

create type public.profile_access_status as enum ('active', 'disabled');
create type public.skill_level as enum ('beginner', 'basic', 'intermediate', 'advanced', 'competitive');
create type public.age_category as enum ('elementary', 'middle_school', 'high_school', 'adults');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  access_status public.profile_access_status not null default 'disabled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_he text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

insert into public.skills (slug, label_he, sort_order) values
  ('forearm_pass', 'תחתית', 1),
  ('overhead_setting', 'עילית', 2),
  ('serve', 'הגשה', 3),
  ('attack', 'התקפה', 4),
  ('block', 'חסימה', 5),
  ('defense', 'הגנה', 6),
  ('reception', 'קבלה', 7),
  ('coverage', 'חיפוי', 8),
  ('transitions', 'מעברים', 9);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  age_category public.age_category not null,
  age_grade_label text not null default '',
  typical_player_count integer not null check (typical_player_count > 0),
  general_level public.skill_level not null,
  notes text not null default '',
  recurring_constraints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index groups_coach_id_idx on public.groups(coach_id);

create table public.group_skill_levels (
  group_id uuid not null references public.groups(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  approved_level public.skill_level not null,
  system_suggested_level public.skill_level,
  suggestion_reason text,
  updated_at timestamptz not null default now(),
  primary key (group_id, skill_id)
);

create table public.skill_level_history (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  from_level public.skill_level,
  to_level public.skill_level not null,
  source text not null check (source in ('coach', 'system_approved', 'initial')),
  reason text,
  changed_at timestamptz not null default now()
);

create index skill_level_history_group_idx on public.skill_level_history(group_id, changed_at desc);

create or replace function public.is_active_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.access_status = 'active'
  );
$$;

create or replace function public.owns_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_coach()
    and exists (
      select 1
      from public.groups g
      where g.id = target_group_id
        and g.coach_id = auth.uid()
    );
$$;

grant execute on function public.is_active_coach() to authenticated;
grant execute on function public.owns_group(uuid) to authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.skills to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.group_skill_levels to authenticated;
grant select, insert, update, delete on public.skill_level_history to authenticated;

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.groups enable row level security;
alter table public.group_skill_levels enable row level security;
alter table public.skill_level_history enable row level security;

create policy "profiles_select_self"
on public.profiles for select
to authenticated
using (id = auth.uid());

-- There is intentionally no insert/update/delete policy on profiles for authenticated users.
-- Invitation activation is performed only by the server-side service-role client.

create policy "active_coaches_read_skills"
on public.skills for select
to authenticated
using (public.is_active_coach());

create policy "active_coaches_read_own_groups"
on public.groups for select
to authenticated
using (public.is_active_coach() and coach_id = auth.uid());

create policy "active_coaches_create_own_groups"
on public.groups for insert
to authenticated
with check (public.is_active_coach() and coach_id = auth.uid());

create policy "active_coaches_update_own_groups"
on public.groups for update
to authenticated
using (public.is_active_coach() and coach_id = auth.uid())
with check (public.is_active_coach() and coach_id = auth.uid());

create policy "active_coaches_delete_own_groups"
on public.groups for delete
to authenticated
using (public.is_active_coach() and coach_id = auth.uid());

create policy "active_coaches_read_own_skill_levels"
on public.group_skill_levels for select
to authenticated
using (public.owns_group(group_id));

create policy "active_coaches_create_own_skill_levels"
on public.group_skill_levels for insert
to authenticated
with check (public.owns_group(group_id));

create policy "active_coaches_update_own_skill_levels"
on public.group_skill_levels for update
to authenticated
using (public.owns_group(group_id))
with check (public.owns_group(group_id));

create policy "active_coaches_delete_own_skill_levels"
on public.group_skill_levels for delete
to authenticated
using (public.owns_group(group_id));

create policy "active_coaches_read_own_skill_history"
on public.skill_level_history for select
to authenticated
using (public.owns_group(group_id));

create policy "active_coaches_create_own_skill_history"
on public.skill_level_history for insert
to authenticated
with check (public.owns_group(group_id));
