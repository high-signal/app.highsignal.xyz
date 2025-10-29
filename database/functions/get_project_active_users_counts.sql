create or replace function public.get_project_active_users_counts(project_ids text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  with project_counts as (
    select 
      ups.project_id,
      count(*) as active_users_count,
      count(*) filter (where ups.total_score >= 80) as high_signal_users,
      count(*) filter (where ups.total_score >= 30 and ups.total_score < 80) as mid_signal_users,
      count(*) filter (where ups.total_score < 30) as low_signal_users
    from user_project_scores ups
    where ups.project_id = any(string_to_array(project_ids, ',')::bigint[])
      and ups.total_score > 0
    group by ups.project_id
  )
  select json_agg(
    json_build_object(
      'project_id', project_id,
      'active_users_count', active_users_count,
      'high_signal_users', high_signal_users,
      'mid_signal_users', mid_signal_users,
      'low_signal_users', low_signal_users
    )
  ) into result
  from project_counts;
  
  return coalesce(result, '[]'::json);
end;
$$;