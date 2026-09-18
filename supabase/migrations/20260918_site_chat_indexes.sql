create index if not exists site_chat_actions_thread_idx on public.site_chat_actions(thread_id);
create index if not exists site_chat_memories_source_message_idx on public.site_chat_memories(source_message_id);
create index if not exists site_chat_memories_source_thread_idx on public.site_chat_memories(source_thread_id);
create index if not exists site_chat_messages_pending_action_idx on public.site_chat_messages(pending_action_id);
create index if not exists site_chat_messages_user_idx on public.site_chat_messages(user_id);
create index if not exists site_chat_revisions_action_idx on public.site_chat_revisions(action_id);
create index if not exists site_chat_revisions_user_idx on public.site_chat_revisions(user_id);
