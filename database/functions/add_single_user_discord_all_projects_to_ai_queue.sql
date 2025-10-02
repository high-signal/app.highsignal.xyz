create or replace function public.add_single_user_discord_all_projects_to_ai_queue(p_username text default null)
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
    u.id as user_id,
    pss.project_id,
    ss.id as signal_strength_id,
    target_day,
    (u.id::text || '_' || pss.project_id::text || '_' || ss.id::text || '_' || target_day::text) as queue_item_unique_identifier,
    'bulk_update',
    u.discord_username
  from signal_strengths ss
  join project_signal_strengths pss
    on ss.id = pss.signal_strength_id
  cross join lateral (
    select id, username, discord_username
    from users
    where discord_username is not null
      and (p_username is null or username = p_username)
  ) u
  where ss.name = 'discord'
    and pss.enabled = true
  on conflict (queue_item_unique_identifier) do nothing;
end;
$$;