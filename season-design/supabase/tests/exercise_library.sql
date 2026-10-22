begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select has_table('public', 'exercises', 'exercises table exists');
select has_table('public', 'exercise_versions', 'exercise versions table exists');
select has_table('public', 'exercise_tags', 'exercise tags table exists');
select has_table('public', 'exercise_tag_links', 'exercise tag links table exists');
select has_table('public', 'sheet_sync_runs', 'sheet sync runs table exists');

select enum_has_labels(
  'public',
  'exercise_source',
  array['sheets', 'user', 'generated'],
  'exercise source values are locked'
);

select enum_has_labels(
  'public',
  'progression_stage',
  array['isolated', 'fixed', 'complex', 'game-situation'],
  'progression stage values are locked'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach-a@example.com', '', now(), '{}', '{}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach-b@example.com', '', now(), '{}', '{}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'disabled@example.com', '', now(), '{}', '{}', now(), now());

insert into public.profiles (id, email, access_status) values
  ('11111111-1111-1111-1111-111111111111', 'coach-a@example.com', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'coach-b@example.com', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'disabled@example.com', 'disabled');

insert into public.exercises (
  id, owner_id, source, kind, progression_stage, title,
  source_spreadsheet_id, source_tab, source_row, source_hash, normalized_signature, is_shared
) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'sheets', 'technical', 'isolated', 'תחתית בעמידה',
   'sheet-1', 'תחתית', 4, 'hash-a', 'תחתית|isolated|תחתית בעמידה', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'user', 'technical', 'fixed', 'תרגיל אישי א',
   null, null, null, null, null, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'generated', 'technical', 'complex', 'תרגיל אישי ב',
   null, null, null, null, null, false);

insert into public.exercise_versions (
  id, exercise_id, version_number, content_hash, title, description, content
) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'v1', 'תחתית בעמידה', 'גרסה ראשונה', '{"title":"תחתית בעמידה"}'::jsonb);

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select is((select count(*)::int from public.exercises), 2, 'active coach reads canonical and own personal content');
select is((select count(*)::int from public.exercise_versions), 1, 'active coach reads canonical versions');
reset role;

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;
select is((select count(*)::int from public.exercises), 0, 'disabled coach reads no exercise content');
reset role;

select throws_ok(
  $$update public.exercise_versions set description = 'mutated' where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'$$,
  'exercise_versions are immutable'
);

select is(
  (select description from public.exercise_versions where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'גרסה ראשונה',
  'immutable version remains unchanged'
);

select * from finish();
rollback;
