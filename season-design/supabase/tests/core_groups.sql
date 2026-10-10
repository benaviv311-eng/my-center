begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'groups', 'groups table exists');
select has_table('public', 'skills', 'skills table exists');
select has_table('public', 'group_skill_levels', 'group skill levels table exists');

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

insert into public.groups (id, coach_id, name, age_category, age_grade_label, typical_player_count, general_level) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'A group', 'middle_school', 'ז׳', 12, 'intermediate'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'B group', 'high_school', 'י׳', 10, 'advanced');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select is((select count(*)::int from public.groups), 1, 'active coach sees only own groups');
select is((select count(*)::int from public.skills), 9, 'active coach sees all canonical skills');
reset role;

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;
select is((select count(*)::int from public.groups), 0, 'disabled coach cannot read private group data');
update public.profiles set access_status = 'active' where id = '33333333-3333-3333-3333-333333333333';
select is(
  (select access_status::text from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'disabled',
  'ordinary user cannot self-promote profile access'
);

select * from finish();
rollback;
