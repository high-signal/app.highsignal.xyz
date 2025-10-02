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
      count(*) as active_users_count
    from user_project_scores ups
    where ups.project_id = any(string_to_array(project_ids, ',')::bigint[])
      and ups.total_score > 0
    group by ups.project_id
  )
  select json_agg(
    json_build_object(
      'project_id', project_id,
      'active_users_count', active_users_count
    )
  ) into result
  from project_counts;
  
  return coalesce(result, '[]'::json);
end;
$$;
