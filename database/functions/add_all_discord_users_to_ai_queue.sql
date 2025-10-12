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
    u.id as user_id,
    pss.project_id,
    ss.id as signal_strength_id,
    target_day,
    u.id || '_' || pss.project_id || '_' || ss.id || '_' || target_day::text,
    'bulk_update',
    u.discord_username
  from project_signal_strengths pss
  join signal_strengths ss
    on ss.id = pss.signal_strength_id
  join users u
    on true
  where
    ss.name = 'discord'
    and pss.enabled = true
    and u.discord_user_id is not null
    and u.discord_username is not null
    and pss.url is not null
    and exists (
      select 1
      from discord_messages dm
      where dm.guild_id = substring(rtrim(pss.url, '/') from '([^/]+)$')  -- last path token
        and dm.discord_user_id = u.discord_user_id
        and dm.created_timestamp >= (
              current_date - (coalesce(pss.previous_days, 0)::int * interval '1 day')
            )
    )
  on conflict (queue_item_unique_identifier) do nothing;
end;
$$;