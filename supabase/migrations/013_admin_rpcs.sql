-- Admin RPC helpers for admin dashboard queries
-- These functions run as SECURITY DEFINER so the admin UI can read and update
-- full system data even when row-level security prevents anonymous access.

CREATE OR REPLACE FUNCTION admin_get_support_tickets()
RETURNS SETOF support_tickets
SECURITY DEFINER
AS $$
  SELECT * FROM support_tickets ORDER BY created_at DESC;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION admin_get_support_tickets() TO public;

CREATE OR REPLACE FUNCTION admin_update_support_ticket(p_ticket_id uuid, p_updates jsonb)
RETURNS support_tickets
SECURITY DEFINER
AS $$
  UPDATE support_tickets
  SET
    status = COALESCE(p_updates->>'status', status),
    response_message = COALESCE(p_updates->>'response_message', response_message),
    priority = COALESCE(p_updates->>'priority', priority),
    updated_at = NOW(),
    resolved_at = CASE
      WHEN p_updates->>'status' = 'resolved' AND status != 'resolved' THEN NOW()
      ELSE resolved_at
    END
  WHERE id = p_ticket_id
  RETURNING *;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION admin_update_support_ticket(uuid, jsonb) TO public;

CREATE OR REPLACE FUNCTION admin_get_users_with_data()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  organization text,
  status text,
  created_at timestamptz,
  sensor_count bigint,
  active_alerts bigint
)
SECURITY DEFINER
AS $$
  SELECT
    u.id,
    u.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.organization,
    u.status,
    u.created_at,
    COALESCE(s.sensor_count, 0) AS sensor_count,
    COALESCE(a.active_alerts, 0) AS active_alerts
  FROM users_profile AS u
  LEFT JOIN (
    SELECT user_id, count(*) AS sensor_count
    FROM sensors
    GROUP BY user_id
  ) AS s ON s.user_id = u.user_id
  LEFT JOIN (
    SELECT sensors.user_id, count(*) AS active_alerts
    FROM alerts
    JOIN sensors ON alerts.sensor_id = sensors.id
    WHERE alerts.resolved = false
    GROUP BY sensors.user_id
  ) AS a ON a.user_id = u.user_id;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION admin_get_users_with_data() TO public;

CREATE OR REPLACE FUNCTION admin_get_sensor_summaries()
RETURNS TABLE(
  id uuid,
  device_id text,
  location_name text,
  user_id uuid,
  fill_level integer,
  status text,
  sensor_number integer,
  last_update timestamptz
)
SECURITY DEFINER
AS $$
  SELECT
    s.id,
    s.device_id,
    s.location_name,
    s.user_id,
    sr.fill_level,
    s.status,
    sr.sensor_number,
    sr.created_at AS last_update
  FROM sensors s
  LEFT JOIN LATERAL (
    SELECT fill_level, sensor_number, created_at
    FROM sensor_readings
    WHERE sensor_id = s.id
    ORDER BY created_at DESC
    LIMIT 1
  ) sr ON true;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION admin_get_sensor_summaries() TO public;

CREATE OR REPLACE FUNCTION admin_dashboard_stats()
RETURNS TABLE(
  total_users bigint,
  active_sensors bigint,
  critical_alerts bigint,
  warning_alerts bigint,
  open_tickets bigint,
  resolved_tickets bigint,
  avg_fill_level numeric
)
SECURITY DEFINER
AS $$
  SELECT
    (SELECT count(*) FROM users_profile) AS total_users,
    (SELECT count(*) FROM sensors WHERE status = 'active') AS active_sensors,
    (SELECT count(*) FROM alerts WHERE alert_type = 'critical' AND resolved = false) AS critical_alerts,
    (SELECT count(*) FROM alerts WHERE alert_type = 'warning' AND resolved = false) AS warning_alerts,
    (SELECT count(*) FROM support_tickets WHERE status = 'open') AS open_tickets,
    (SELECT count(*) FROM support_tickets WHERE status = 'resolved') AS resolved_tickets,
    COALESCE((SELECT avg(fill_level::numeric) FROM sensor_readings), 0) AS avg_fill_level;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION admin_dashboard_stats() TO public;
