begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select has_column('public','exercise_versions','planning_metadata',
  'exercise version planning metadata exists');
select col_type_is('public','exercise_versions','planning_metadata','jsonb',
  'version planning metadata is JSONB');
select has_table('public','training_practices','coaching practice table exists');
select has_table('public','training_feedback','coaching feedback table exists');
select has_table('public','training_recommendations','future recommendation table exists');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('aaaaaaaa-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','dna-a@example.com','',now(),'{}','{}',now(),now()),
  ('bbbbbbbb-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','dna-b@example.com','',now(),'{}','{}',now(),now());

insert into public.profiles (id,email,access_status) values
  ('aaaaaaaa-1111-4111-8111-111111111111','dna-a@example.com','active'),
  ('bbbbbbbb-2222-4222-8222-222222222222','dna-b@example.com','active');

insert into public.groups (id,coach_id,name,age_category,typical_player_count,general_level) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-1111-4111-8111-111111111111','A','high_school',12,'intermediate'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','bbbbbbbb-2222-4222-8222-222222222222','B','high_school',10,'basic');

select set_config('request.jwt.claim.sub','aaaaaaaa-1111-4111-8111-111111111111',true);
set local role authenticated;

select lives_ok($$
  insert into public.training_practices (id,coach_id,group_id,intent,blocks)
  values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
   'aaaaaaaa-1111-4111-8111-111111111111',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '{"durationSeconds":5400}','[{"seconds":5400}]')
$$,'owner can create own group practice');

select throws_ok($$
  insert into public.training_practices (coach_id,group_id,intent,blocks)
  values ('aaaaaaaa-1111-4111-8111-111111111111',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{}','[]')
$$, '42501', null, 'cannot forge another coach group ID');

reset role;
select set_config('request.jwt.claim.sub','bbbbbbbb-2222-4222-8222-222222222222',true);
set local role authenticated;

select is((select count(*)::int from public.training_practices),0,
  'other coach cannot read practice owned by coach A');

select * from finish();
rollback;
