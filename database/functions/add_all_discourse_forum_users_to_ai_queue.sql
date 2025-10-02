create or replace function public.add_all_discourse_forum_users_to_ai_queue()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_day date := (current_date - interval '1 day')::date;
begin
  insert into ai_request_queue (
    user_id,
    project_id,
    signal_strength_id,
    day,
    queue_item_unique_identifier,
    type,
    signal_strength_username
  )
  select
    forum_users.user_id,
    forum_users.project_id,
    signal_strengths.id,
    target_day,
    forum_users.user_id || '_' || forum_users.project_id || '_' || signal_strengths.id || '_' || target_day::text,
    'bulk_update',
    forum_users.forum_username
  from signal_strengths
  join project_signal_strengths
    on signal_strengths.id = project_signal_strengths.signal_strength_id
  join forum_users
    on forum_users.project_id = project_signal_strengths.project_id
  where
    signal_strengths.name = 'discourse_forum'
    and project_signal_strengths.enabled = true
    and forum_users.forum_username is not null
  on conflict (queue_item_unique_identifier) do nothing;
end;
$$;