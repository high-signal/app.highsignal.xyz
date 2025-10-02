create or replace function public.add_all_forum_users_to_forum_queue()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_day date := (current_date - interval '1 day')::date;
begin
  insert into forum_request_queue (
    queue_item_unique_identifier,
    user_id,
    project_id,
    forum_username,
    day
  )
  select
    forum_users.user_id || '_' || forum_users.project_id || '_' || target_day::text,
    forum_users.user_id,
    forum_users.project_id,
    forum_users.forum_username,
    target_day
  from forum_users
  where forum_users.forum_username is not null
  on conflict (queue_item_unique_identifier) do nothing;
end;
$$;