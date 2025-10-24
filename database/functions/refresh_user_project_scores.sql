create or replace function public.refresh_user_project_scores()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently user_project_scores;
end;
$$;