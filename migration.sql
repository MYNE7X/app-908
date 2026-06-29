-- ═══════════════════════════════════════════════════════════
-- Expert Solutions — Full Feature Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- ── 1. Add task_type to packages (video / task / both) ───────
ALTER TABLE packages ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'both'
  CHECK (task_type IN ('task', 'video', 'both'));

-- ── 2. Add daily_earning to packages ─────────────────────────
ALTER TABLE packages ADD COLUMN IF NOT EXISTS daily_earning NUMERIC DEFAULT 0;

-- ── 3. Add admin file + assignment fields to tasks ───────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS admin_file_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_instructions TEXT;

-- ── 4. Add watch duration to video_watch_logs ────────────────
ALTER TABLE video_watch_logs ADD COLUMN IF NOT EXISTS watch_duration_seconds INTEGER DEFAULT 0;

-- ── 5. Allow 'revoked' as a task status ──────────────────────
-- If status is an enum type:
DO $$ BEGIN
  ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'revoked';
EXCEPTION WHEN undefined_object THEN NULL; END $$;
-- If status is TEXT with a CHECK constraint, it may need manual update:
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
-- ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
--   CHECK (status IN ('assigned','submitted','approved','rejected','cancelled','revoked'));

-- ── 6. Function: get current user's package task_type ────────
CREATE OR REPLACE FUNCTION get_my_package_type()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_type TEXT;
BEGIN
  SELECT COALESCE(p.task_type, 'both') INTO v_type
  FROM activation_keys ak
  JOIN packages p ON p.id = ak.package_id
  WHERE ak.used_by = auth.uid()
  ORDER BY ak.used_at DESC NULLS LAST
  LIMIT 1;
  RETURN COALESCE(v_type, 'both');
END;
$$;
GRANT EXECUTE ON FUNCTION get_my_package_type() TO authenticated;

-- ── 7. Function: revoke a task (admin/super_admin only) ──────
CREATE OR REPLACE FUNCTION revoke_task(_task_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  UPDATE tasks SET status = 'revoked', rejection_reason = 'Task revoked by admin' WHERE id = _task_id;
  RETURN json_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION revoke_task(UUID) TO authenticated;

-- ── 8. Function: admin update task (file, instructions) ──────
CREATE OR REPLACE FUNCTION admin_update_task(
  _task_id UUID,
  _admin_file_url TEXT DEFAULT NULL,
  _assignment_instructions TEXT DEFAULT NULL,
  _title TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _reward NUMERIC DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  UPDATE tasks SET
    admin_file_url        = COALESCE(_admin_file_url, admin_file_url),
    assignment_instructions = COALESCE(_assignment_instructions, assignment_instructions),
    title                 = COALESCE(_title, title),
    description           = COALESCE(_description, description),
    reward                = COALESCE(_reward, reward)
  WHERE id = _task_id;
  RETURN json_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION admin_update_task(UUID,TEXT,TEXT,TEXT,TEXT,NUMERIC) TO authenticated;

-- ── 9. Update mark_video_watched to store duration ───────────
CREATE OR REPLACE FUNCTION mark_video_watched(
  _task_id UUID,
  _video_url TEXT,
  _duration_seconds INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO video_watch_logs (user_id, task_id, video_url, watch_duration_seconds, watched_at)
  VALUES (auth.uid(), _task_id, _video_url, _duration_seconds, NOW())
  ON CONFLICT (user_id, task_id, video_url)
  DO UPDATE SET
    watch_duration_seconds = GREATEST(video_watch_logs.watch_duration_seconds, _duration_seconds),
    watched_at = NOW();
  RETURN json_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION mark_video_watched(UUID,TEXT,INTEGER) TO authenticated;

-- ── 10. View: admin video summary ────────────────────────────
CREATE OR REPLACE VIEW admin_video_summary AS
SELECT
  t.id           AS task_id,
  t.title,
  t.assigned_to,
  pr.full_name   AS user_name,
  pr.username,
  t.status,
  t.reward,
  t.currency,
  t.submitted_at,
  t.proof_files,
  t.submission_text,
  t.rejection_reason,
  COALESCE((
    SELECT SUM(COALESCE(vwl.watch_duration_seconds,0))
    FROM video_watch_logs vwl
    WHERE vwl.task_id = t.id AND vwl.user_id = t.assigned_to
  ), 0)          AS total_watch_seconds,
  (
    SELECT COUNT(*)
    FROM video_watch_logs vwl
    WHERE vwl.task_id = t.id AND vwl.user_id = t.assigned_to
  )              AS videos_watched
FROM tasks t
LEFT JOIN profiles pr ON pr.id = t.assigned_to
WHERE t.task_type = 'video';

GRANT SELECT ON admin_video_summary TO authenticated;

-- ── 11. RLS policy so admins can read admin_video_summary ────
-- (The view inherits the RLS of the underlying tasks table.
--  If tasks has RLS, admins already have access via existing policies.)

-- ═══════════════════════════════════════════════════════════
-- Done! All columns and functions are now ready.
-- ═══════════════════════════════════════════════════════════
