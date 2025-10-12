create or replace function public.fill_smart_score_gaps()
returns void
language plpgsql
as $$
declare
  r record;
  total_days int;
  gap_value_delta int;
  gap_max_value_delta int;
  gap_previous_days_delta int;
  gap_value_delta_per_day int;
  gap_max_value_delta_per_day int;
  gap_previous_days_delta_per_day int;
  current_date_iter date;
  yesterday date := current_date - interval '1 day';
  batch_size int := 50;
  inserted_count int := 0;
begin
  raise notice '🔍 Checking for smart score gaps...';

  -- Process up to 50 missing range rows, skipping gaps starting yesterday
  for r in
    select *
    from public.user_signal_strengths_missing_ranges
    where gap_start_date <> yesterday::date
    order by user_id, project_id, signal_strength_id, gap_start_date
    limit batch_size
  loop
    gap_value_delta := coalesce(r.value_after, 0) - coalesce(r.value_before, 0);
    gap_max_value_delta := coalesce(r.max_value_after, 0) - coalesce(r.max_value_before, 0);
    gap_previous_days_delta := coalesce(r.previous_days_after, 0) - coalesce(r.previous_days_before, 0);

    total_days := (r.gap_end_date - r.gap_start_date) + 1;

    gap_value_delta_per_day := ceil(gap_value_delta::numeric / (total_days + 1))::int;
    gap_max_value_delta_per_day := ceil(gap_max_value_delta::numeric / (total_days + 1))::int;
    gap_previous_days_delta_per_day := ceil(gap_previous_days_delta::numeric / (total_days + 1))::int;

    current_date_iter := r.gap_start_date;

    -- For each day in the gap, insert if not exists
    for i in 1..total_days loop
      begin
        if not exists (
          select 1
          from public.user_signal_strengths uss
          where uss.user_id = r.user_id
            and uss.project_id = r.project_id
            and uss.signal_strength_id = r.signal_strength_id
            and uss.day = current_date_iter
        ) then
          insert into public.user_signal_strengths (
            user_id,
            project_id,
            signal_strength_id,
            day,
            request_id,
            created,
            summary,
            value,
            max_value,
            previous_days
          )
          values (
            r.user_id,
            r.project_id,
            r.signal_strength_id,
            current_date_iter,
            r.user_id || '_' || r.project_id || '_' || r.signal_strength_id || '_' || current_date_iter || '_GAP_FILL',
            extract(epoch from now())::int,
            'Gap fill for ' || current_date_iter,
            coalesce(r.value_before, 0) + gap_value_delta_per_day * i,
            coalesce(r.max_value_before, 0) + gap_max_value_delta_per_day * i,
            coalesce(r.previous_days_before, 0) + gap_previous_days_delta_per_day * i
          );

          inserted_count := inserted_count + 1;

          -- Optional: update total score history if that function exists
          -- perform public.update_total_score_history(r.user_id, r.project_id, current_date_iter);
        end if;

      exception when others then
        -- Suppress insert errors in production
        null;
      end;

      current_date_iter := current_date_iter + 1;
    end loop;

  end loop;

  raise notice '✅ Finished filling smart score gaps. % rows inserted.', inserted_count;
end;
$$;