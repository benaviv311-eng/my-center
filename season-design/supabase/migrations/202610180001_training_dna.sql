-- Planning metadata belongs to the immutable exercise version, not a mutable exercise head.
alter table public.exercise_versions
  add column planning_metadata jsonb;

alter table public.exercise_versions
  add constraint exercise_versions_planning_metadata_object
  check (planning_metadata is null or jsonb_typeof(planning_metadata) = 'object');

comment on column public.exercise_versions.planning_metadata is
  'Optional Training DNA estimates. Null means unavailable; values are immutable with the exercise version.';
