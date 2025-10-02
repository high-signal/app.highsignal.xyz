create or replace function public.add_all_discord_users_to_ai_queue()
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
    users.id as user_id,
    project_signal_strengths.project_id,
    signal_strengths.id as signal_strength_id,
    target_day,
    users.id || '_' || project_signal_strengths.project_id || '_' || signal_strengths.id || '_' || target_day::text,
    'bulk_update',
    users.discord_username
  from signal_strengths
  join project_signal_strengths
    on signal_strengths.id = project_signal_strengths.signal_strength_id
  cross join (
    select id, discord_username from users
    where discord_username is not null
  ) as users
  where
    signal_strengths.name = 'discord'
    and project_signal_strengths.enabled = true
  on conflict (queue_item_unique_identifier) do nothing;
end;
$$;