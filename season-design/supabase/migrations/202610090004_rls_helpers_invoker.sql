alter function public.is_active_coach() security invoker;
alter function public.owns_group(uuid) security invoker;
alter function public.can_read_exercise(uuid) security invoker;
alter function public.owns_exercise(uuid) security invoker;
