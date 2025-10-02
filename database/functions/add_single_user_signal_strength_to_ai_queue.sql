-- NOTE: z_ must be used as the objects are ordered alphabetically in the 
-- function cache, and since testing_data is conditional, it must be the last 
-- parameter so it does not change the order of the other parameters.

create or replace function public.add_single_user_signal_strength_to_ai_queue(
  p_queue_item_unique_identifier text,
  p_user_id integer,
  p_project_id integer,
  p_signal_strength_id integer,
  p_day date,
  p_signal_strength_username text,
  z_testing_data jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into ai_request_queue (
    queue_item_unique_identifier,
    user_id,
    project_id,
    signal_strength_id,
    day,
    signal_strength_username,
    test_data,
    type
  )
  values (
    p_queue_item_unique_identifier,
    p_user_id,
    p_project_id,
    p_signal_strength_id,
    p_day,
    p_signal_strength_username,
    z_testing_data,
    'single_update'
  )
  on conflict (queue_item_unique_identifier) do nothing;
end;
$$;