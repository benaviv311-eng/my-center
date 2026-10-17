revoke execute on function public.is_active_coach() from PUBLIC, anon;
revoke execute on function public.owns_group(uuid) from PUBLIC, anon;
revoke execute on function public.can_read_exercise(uuid) from PUBLIC, anon;
revoke execute on function public.owns_exercise(uuid) from PUBLIC, anon;

-- Keep the helpers available only to signed-in coaches. RLS policies call them
-- in the authenticated request context, while anonymous clients do not need
-- direct execute privileges.
grant execute on function public.is_active_coach() to authenticated;
grant execute on function public.owns_group(uuid) to authenticated;
grant execute on function public.can_read_exercise(uuid) to authenticated;
grant execute on function public.owns_exercise(uuid) to authenticated;

-- This function is invoked only by the immutable-version triggers. Pinning the
-- search path prevents object-shadowing attacks when the trigger executes.
alter function public.reject_exercise_version_mutation()
  set search_path = pg_catalog, public;

revoke execute on function public.reject_exercise_version_mutation() from PUBLIC, anon, authenticated;
