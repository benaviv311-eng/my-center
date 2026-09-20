create index if not exists site_edit_approvals_user_idx
  on public.site_edit_approvals(user_id);

create index if not exists site_edit_events_user_idx
  on public.site_edit_events(user_id);

create index if not exists site_edit_requests_thread_idx
  on public.site_edit_requests(thread_id);

create index if not exists site_edit_requests_undo_idx
  on public.site_edit_requests(undo_of_request_id);
