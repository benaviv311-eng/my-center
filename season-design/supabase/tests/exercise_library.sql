begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

select has_table('public', 'exercises', 'exercises table exists');
select has_table('public', 'exercise_versions', 'exercise versions table exists');
select has_table('public', 'exercise_tags', 'exercise tags table exists');
select has_table('public', 'exercise_tag_links', 'exercise tag links table exists');
select has_table('public', 'sheet_sync_runs', 'sheet sync runs table exists');

select enum_has_labels(
  'public', 'exercise_source',
  array['sheets', 'user', 'generated'],
  'exercise sources are constrained'
);
select enum_has_labels(
  'public', 'progression_stage',
  array['isolated', 'fixed', 'complex', 'game-situation'],
  'progression stages are constrained'
);

select ok(
  not has_function_privilege('anon', 'public.is_active_coach()', 'EXECUTE'),
  'anon cannot execute is_active_coach'
);
select ok(
  not has_function_privilege('anon', 'public.owns_group(uuid)', 'EXECUTE'),
  'anon cannot execute owns_group'
);
select ok(
  not has_function_privilege('anon', 'public.can_read_exercise(uuid)', 'EXECUTE'),
  'anon cannot execute can_read_exercise'
);
select ok(
  not has_function_privilege('anon', 'public.owns_exercise(uuid)', 'EXECUTE'),
  'anon cannot execute owns_exercise'
);
select ok(
  has_function_privilege('authenticated', 'public.is_active_coach()', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.owns_group(uuid)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.can_read_exercise(uuid)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.owns_exercise(uuid)', 'EXECUTE'),
  'authenticated role retains helper function access'
);
select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('is_active_coach', 'owns_group', 'can_read_exercise', 'owns_exercise')
      and p.prosecdef
  ),
  'RLS helper functions execute as invoker'
);
select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'reject_exercise_version_mutation'
      and coalesce(p.proconfig, '{}'::text[]) && array['search_path=pg_catalog, public', 'search_path=public, pg_temp']::text[]
  ),
  'immutable-version trigger function pins its search_path'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('41111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'library-a@example.com', '', now(), '{}', '{}', now(), now()),
  ('42222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'library-b@example.com', '', now(), '{}', '{}', now(), now());

insert into public.profiles (id, email, access_status) values
  ('41111111-1111-1111-1111-111111111111', 'library-a@example.com', 'active'),
  ('42222222-2222-2222-2222-222222222222', 'library-b@example.com', 'active');

insert into public.exercises (
  id, owner_id, source, kind, title, progression_stage,
  source_spreadsheet_id, source_tab, source_row, source_key,
  normalized_signature, current_version_number
) values
  ('aaaaaaaa-1111-1111-1111-111111111111', null, 'sheets', 'technical', 'קבלת תחתית', 'isolated', 'sheet-1', 'תחתית', 4, 'תחתית:4', 'תחתית|isolated|קבלת תחתית', 1),
  ('bbbbbbbb-2222-2222-2222-222222222222', '41111111-1111-1111-1111-111111111111', 'user', 'technical', 'תרגיל אישי א', 'fixed', null, null, null, null, null, 1),
  ('cccccccc-3333-3333-3333-333333333333', '42222222-2222-2222-2222-222222222222', 'user', 'technical', 'תרגיל אישי ב', 'fixed', null, null, null, null, null, 1);

insert into public.exercise_versions (
  exercise_id, version_number, title, description, content_hash, source_snapshot
) values
  ('aaaaaaaa-1111-1111-1111-111111111111', 1, 'קבלת תחתית', 'גרסה ראשונה', 'hash-v1', '{"tab":"תחתית","row":4}'::jsonb),
  ('bbbbbbbb-2222-2222-2222-222222222222', 1, 'תרגיל אישי א', 'פרטי', 'hash-personal-a', '{}'::jsonb),
  ('cccccccc-3333-3333-3333-333333333333', 1, 'תרגיל אישי ב', 'פרטי', 'hash-personal-b', '{}'::jsonb);

select set_config('request.jwt.claim.sub', '41111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select is((select count(*)::int from public.exercises), 2, 'coach sees canonical plus own personal exercise');
select is((select count(*)::int from public.exercises where id = 'cccccccc-3333-3333-3333-333333333333'), 0, 'coach cannot read another coach personal exercise');
select is((select count(*)::int from public.exercise_versions), 2, 'version visibility follows exercise visibility');
update public.exercise_versions
set description = 'mutated'
where exercise_id = 'aaaaaaaa-1111-1111-1111-111111111111'
  and version_number = 1;
select is(
  (select description from public.exercise_versions where exercise_id = 'aaaaaaaa-1111-1111-1111-111111111111' and version_number = 1),
  'גרסה ראשונה',
  'authenticated coach cannot mutate immutable exercise versions'
);
reset role;

select lives_ok(
  $$ insert into public.exercise_versions (exercise_id, version_number, title, description, content_hash, source_snapshot)
     values ('aaaaaaaa-1111-1111-1111-111111111111', 2, 'קבלת תחתית', 'גרסה שנייה', 'hash-v2', '{"tab":"תחתית","row":4}'::jsonb) $$,
  'service context can append a new immutable version'
);
select is((select count(*)::int from public.exercise_versions where exercise_id = 'aaaaaaaa-1111-1111-1111-111111111111'), 2, 'old version remains after appending a new version');
select is((select description from public.exercise_versions where exercise_id = 'aaaaaaaa-1111-1111-1111-111111111111' and version_number = 1), 'גרסה ראשונה', 'old version content remains unchanged');
select throws_ok(
  $$ update public.exercise_versions set description = 'service mutation' where exercise_id = 'aaaaaaaa-1111-1111-1111-111111111111' and version_number = 1 $$,
  '55000',
  'exercise versions are immutable',
  'service context cannot rewrite an existing immutable version'
);
select is((select source_tab from public.exercises where id = 'aaaaaaaa-1111-1111-1111-111111111111'), 'תחתית', 'canonical exercise stores source tab metadata');
select is((select source_row from public.exercises where id = 'aaaaaaaa-1111-1111-1111-111111111111'), 4, 'canonical exercise stores source row metadata');

select * from finish();
rollback;
