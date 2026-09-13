alter policy "raika feed cards own rows"
  on public.raika_feed_cards
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "raika feed feedback own rows"
  on public.raika_feed_feedback
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
