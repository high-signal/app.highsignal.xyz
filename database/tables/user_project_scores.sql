/*
- The MATERIALIZED view requires an extra command after creation to create a unique index row so that refreshes can be concurrent.
- It needs to be one massive input like this so that it drops the tables in order of their dependencies
*/

drop view if exists user_project_scores_stale_data;
drop MATERIALIZED view if exists user_project_scores;

create MATERIALIZED view public.user_project_scores as
with
  latest_values as (
    select distinct
      on (
        uss.user_id,
        uss.project_id,
        uss.signal_strength_id
      ) uss.user_id,
      uss.project_id,
      uss.signal_strength_id,
      uss.value,
      uss.day
    from
      user_signal_strengths uss
      join project_signal_strengths pss on pss.project_id = uss.project_id
      and pss.signal_strength_id = uss.signal_strength_id
    where
      uss.value is not null
      and uss.test_requesting_user is null
      and pss.enabled = true
    order by
      uss.user_id,
      uss.project_id,
      uss.signal_strength_id,
      uss.day desc
  ),
  total_scores as (
    select
      lv.user_id,
      lv.project_id,
      sum(lv.value) as total_score_uncapped
    from
      latest_values lv
    group by
      lv.user_id,
      lv.project_id
  ),
  latest_enabled_activity as (
    select
      uss.user_id,
      uss.project_id,
      max(uss.day) as latest_activity_day
    from
      user_signal_strengths uss
      join project_signal_strengths pss on pss.project_id = uss.project_id
      and pss.signal_strength_id = uss.signal_strength_id
    where
      uss.raw_value is not null
      and uss.test_requesting_user is null
      and pss.enabled = true
    group by
      uss.user_id,
      uss.project_id
  ),
  activity_counts as (
    select
      uss.user_id,
      uss.project_id,
      count(*) as raw_value_count
    from
      user_signal_strengths uss
      join project_signal_strengths pss on pss.project_id = uss.project_id
      and pss.signal_strength_id = uss.signal_strength_id
    where
      uss.raw_value is not null
      and uss.test_requesting_user is null
      and pss.enabled = true
      and uss.day >= (CURRENT_DATE - interval '360 days')
    group by
      uss.user_id,
      uss.project_id
  )
select
  u.id as user_id,
  u.username,
  u.display_name,
  u.profile_image_url,
  p.project_id,
  case
    when lea.latest_activity_day is null then 0::bigint
    when lea.latest_activity_day < (CURRENT_DATE - interval '360 days') then 0::bigint
    else LEAST(
      COALESCE(ts.total_score_uncapped, 0::bigint),
      100::bigint
    )
  end as total_score,
  row_number() over (
    partition by
      p.project_id
    order by
      (COALESCE(ts.total_score_uncapped, 0::bigint)) desc,
      (COALESCE(ac.raw_value_count, 0::bigint)) desc,
      (
        COALESCE(lea.latest_activity_day, '1900-01-01'::date)
      ) desc,
      u.username
  ) as rank
from
  users u
  cross join (
    select distinct
      project_signal_strengths.project_id
    from
      project_signal_strengths
    where
      project_signal_strengths.enabled = true
  ) p
  left join total_scores ts on ts.user_id = u.id
  and ts.project_id = p.project_id
  left join latest_enabled_activity lea on lea.user_id = u.id
  and lea.project_id = p.project_id
  left join activity_counts ac on ac.user_id = u.id
  and ac.project_id = p.project_id
where
  case
    when lea.latest_activity_day is null then 0
    when lea.latest_activity_day < (CURRENT_DATE - interval '360 days') then 0
    else LEAST(COALESCE(ts.total_score_uncapped, 0), 100)
  end > 0;

CREATE UNIQUE INDEX IF NOT EXISTS user_project_scores_user_project_idx
  ON public.user_project_scores (user_id, project_id);

grant select, insert, update, delete on table public.user_project_scores to service_role;
grant usage, select on all sequences in schema public to service_role;

-- --------------------------------------------------------
-- View for comparing live vs materialized data consistency
-- --------------------------------------------------------

CREATE OR REPLACE VIEW public.user_project_scores_stale_data AS
WITH
  live AS (
    WITH
      latest_values AS (
        SELECT DISTINCT ON (uss.user_id, uss.project_id, uss.signal_strength_id)
          uss.user_id,
          uss.project_id,
          uss.signal_strength_id,
          uss.value,
          uss.day
        FROM user_signal_strengths uss
        JOIN project_signal_strengths pss
          ON pss.project_id = uss.project_id
         AND pss.signal_strength_id = uss.signal_strength_id
        WHERE uss.value IS NOT NULL
          AND uss.test_requesting_user IS NULL
          AND pss.enabled = TRUE
        ORDER BY uss.user_id, uss.project_id, uss.signal_strength_id, uss.day DESC
      ),
      total_scores AS (
        SELECT lv.user_id, lv.project_id, SUM(lv.value) AS total_score_uncapped
        FROM latest_values lv
        GROUP BY lv.user_id, lv.project_id
      ),
      latest_enabled_activity AS (
        SELECT uss.user_id, uss.project_id, MAX(uss.day) AS latest_activity_day
        FROM user_signal_strengths uss
        JOIN project_signal_strengths pss
          ON pss.project_id = uss.project_id
         AND pss.signal_strength_id = uss.signal_strength_id
        WHERE uss.raw_value IS NOT NULL
          AND uss.test_requesting_user IS NULL
          AND pss.enabled = TRUE
        GROUP BY uss.user_id, uss.project_id
      ),
      activity_counts AS (
        SELECT uss.user_id, uss.project_id, COUNT(*) AS raw_value_count
        FROM user_signal_strengths uss
        JOIN project_signal_strengths pss
          ON pss.project_id = uss.project_id
         AND pss.signal_strength_id = uss.signal_strength_id
        WHERE uss.raw_value IS NOT NULL
          AND uss.test_requesting_user IS NULL
          AND pss.enabled = TRUE
          AND uss.day >= (CURRENT_DATE - interval '360 days')
        GROUP BY uss.user_id, uss.project_id
      )
    SELECT
      u.id AS user_id,
      p.project_id,
      CASE
        WHEN lea.latest_activity_day IS NULL THEN 0::bigint
        WHEN lea.latest_activity_day < (CURRENT_DATE - interval '360 days') THEN 0::bigint
        ELSE LEAST(COALESCE(ts.total_score_uncapped, 0::bigint), 100::bigint)
      END AS total_score,
      ROW_NUMBER() OVER (
        PARTITION BY p.project_id
        ORDER BY
          (COALESCE(ts.total_score_uncapped, 0::bigint)) DESC,
          (COALESCE(ac.raw_value_count, 0::bigint)) DESC,
          (COALESCE(lea.latest_activity_day, '1900-01-01'::date)) DESC,
          u.username
      ) AS rank
    FROM users u
    CROSS JOIN (
      SELECT DISTINCT project_id
      FROM project_signal_strengths
      WHERE enabled = TRUE
    ) p
    LEFT JOIN total_scores ts
      ON ts.user_id = u.id AND ts.project_id = p.project_id
    LEFT JOIN latest_enabled_activity lea
      ON lea.user_id = u.id AND lea.project_id = p.project_id
    LEFT JOIN activity_counts ac
      ON ac.user_id = u.id AND ac.project_id = p.project_id
    WHERE
      CASE
        WHEN lea.latest_activity_day IS NULL THEN 0
        WHEN lea.latest_activity_day < (CURRENT_DATE - interval '360 days') THEN 0
        ELSE LEAST(COALESCE(ts.total_score_uncapped, 0), 100)
      END > 0
  )

SELECT
  COALESCE(l.user_id, m.user_id) AS user_id,
  COALESCE(l.project_id, m.project_id) AS project_id,
  l.total_score AS live_total_score,
  m.total_score AS materialized_total_score,
  l.rank AS live_rank,
  m.rank AS materialized_rank,
  CASE
    WHEN m.user_id IS NULL THEN 'MISSING IN MATERIALIZED'
    WHEN l.user_id IS NULL THEN 'EXTRA IN MATERIALIZED'
    WHEN l.total_score IS DISTINCT FROM m.total_score
      AND l.rank IS DISTINCT FROM m.rank THEN 'SCORE + RANK MISMATCH'
    WHEN l.total_score IS DISTINCT FROM m.total_score THEN 'SCORE MISMATCH'
    WHEN l.rank IS DISTINCT FROM m.rank THEN 'RANK MISMATCH'
    ELSE 'OK'
  END AS status
FROM live l
FULL OUTER JOIN user_project_scores m
  ON l.user_id = m.user_id
 AND l.project_id = m.project_id
WHERE
  l.user_id IS NULL
  OR m.user_id IS NULL
  OR l.total_score IS DISTINCT FROM m.total_score
  OR l.rank IS DISTINCT FROM m.rank;

grant select, insert, update, delete on table public.user_project_scores_stale_data to service_role;
grant usage, select on all sequences in schema public to service_role;