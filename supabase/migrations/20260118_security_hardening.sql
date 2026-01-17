-- ============================================
-- SECURITY HARDENING MIGRATION
-- Fixes: IDOR, client-controlled params, RLS gaps
-- ============================================

-- ============================================
-- 1. SECURE complete_step RPC
-- Uses auth.uid() instead of accepting student_id
-- Energy values are server-controlled, not client-provided
-- ============================================

DROP FUNCTION IF EXISTS complete_step(uuid, integer, text, integer);

CREATE OR REPLACE FUNCTION complete_step(
  p_lesson_id integer,
  p_step_type text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_energy_earned integer;
  v_already_completed boolean;
  v_reward_item text;
  v_result jsonb;
BEGIN
  -- CRITICAL: Get student ID from authenticated session, NOT from parameter
  v_student_id := auth.uid();
  
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Server-controlled energy values (prevents client manipulation)
  v_energy_earned := CASE p_step_type
    WHEN 'do_now' THEN 10
    WHEN 'scenario' THEN 15
    WHEN 'challenge' THEN 20
    WHEN 'exit_ticket' THEN 10
    ELSE 10
  END;
  
  -- Validate step_type (prevent SQL injection via dynamic values)
  IF p_step_type NOT IN ('do_now', 'scenario', 'challenge', 'exit_ticket') THEN
    RAISE EXCEPTION 'Invalid step type: %', p_step_type;
  END IF;
  
  -- Check if already completed (idempotency)
  SELECT EXISTS(
    SELECT 1 FROM student_lessons
    WHERE student_id = v_student_id 
    AND lesson_id = p_lesson_id 
    AND step_type = p_step_type
    AND completed = true
  ) INTO v_already_completed;
  
  IF v_already_completed THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_completed', true,
      'energy_earned', 0
    );
  END IF;
  
  -- UPSERT student_lessons (handles first-time and updates)
  INSERT INTO student_lessons (student_id, lesson_id, step_type, completed, completed_at)
  VALUES (v_student_id, p_lesson_id, p_step_type, true, NOW())
  ON CONFLICT (student_id, lesson_id, step_type) 
  DO UPDATE SET completed = true, completed_at = NOW();
  
  -- UPSERT world_states (handles first-time students)
  INSERT INTO world_states (student_id, core_battery, nexus_connection, updated_at)
  VALUES (v_student_id, LEAST(v_energy_earned, 100), 0, NOW())
  ON CONFLICT (student_id)
  DO UPDATE SET 
    core_battery = LEAST(world_states.core_battery + v_energy_earned, 100),
    updated_at = NOW();
  
  -- Determine reward (challenge steps give inventory items)
  IF p_step_type = 'challenge' THEN
    v_reward_item := 'focus_crystal';
    
    -- Insert reward (with duplicate prevention)
    INSERT INTO student_inventory (student_id, item_type, earned_from, earned_at)
    VALUES (v_student_id, v_reward_item, 'lesson_' || p_lesson_id, NOW())
    ON CONFLICT (student_id, item_type, earned_from) DO NOTHING;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'already_completed', false,
    'energy_earned', v_energy_earned,
    'reward_item', v_reward_item
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION complete_step(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_step(integer, text) TO authenticated;

-- ============================================
-- 2. LOCK DOWN DIRECT TABLE ACCESS
-- Only allow modifications via RPC functions
-- ============================================

-- Revoke direct insert/update/delete on sensitive tables for authenticated role
-- These should only be modified via SECURITY DEFINER functions

REVOKE INSERT, UPDATE, DELETE ON student_inventory FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON student_inventory FROM anon;

-- Grant to service_role for admin/migration purposes
GRANT ALL ON student_inventory TO service_role;

-- ============================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all user-facing tables
ALTER TABLE student_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Students see own lessons" ON student_lessons;
DROP POLICY IF EXISTS "Students see own inventory" ON student_inventory;
DROP POLICY IF EXISTS "Students see own world state" ON world_states;
DROP POLICY IF EXISTS "Students insert crisis alerts" ON crisis_alerts;
DROP POLICY IF EXISTS "Teachers view class alerts" ON crisis_alerts;
DROP POLICY IF EXISTS "Students see own sessions" ON sessions;

-- STUDENT_LESSONS: Students can read/insert their own, teachers can read class
CREATE POLICY "Students see own lessons" ON student_lessons
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students insert own lessons" ON student_lessons
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update own lessons" ON student_lessons
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Teachers see class lessons" ON student_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN classes c ON c.id = u.class_id
      WHERE u.id = student_lessons.student_id 
      AND c.teacher_id = auth.uid()
    )
  );

-- STUDENT_INVENTORY: Read-only for students (inserts via RPC only)
CREATE POLICY "Students see own inventory" ON student_inventory
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers see class inventory" ON student_inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN classes c ON c.id = u.class_id
      WHERE u.id = student_inventory.student_id 
      AND c.teacher_id = auth.uid()
    )
  );

-- WORLD_STATES: Read-only for students (updates via RPC only)
CREATE POLICY "Students see own world state" ON world_states
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers see class world states" ON world_states
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN classes c ON c.id = u.class_id
      WHERE u.id = world_states.student_id 
      AND c.teacher_id = auth.uid()
    )
  );

-- CRISIS_ALERTS: Students can insert their own, teachers see their class
CREATE POLICY "Students insert own alerts" ON crisis_alerts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students should NOT be able to see their own alerts (prevents awareness of flagging)
-- Only teachers can view
CREATE POLICY "Teachers view class alerts" ON crisis_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = crisis_alerts.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers update class alerts" ON crisis_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = crisis_alerts.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- SESSIONS: Students see own, teachers see class
CREATE POLICY "Students see own sessions" ON sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers see class sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN classes c ON c.id = u.class_id
      WHERE u.id = sessions.student_id 
      AND c.teacher_id = auth.uid()
    )
  );

-- ============================================
-- 4. INCREMENT AI USAGE (secure version)
-- ============================================

CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_student_id uuid,
  p_date date
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
BEGIN
  v_caller_id := auth.uid();
  
  -- Only allow incrementing own usage (or service role)
  IF v_caller_id IS NOT NULL AND v_caller_id != p_student_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s usage';
  END IF;
  
  INSERT INTO ai_usage (student_id, usage_date, request_count)
  VALUES (p_student_id, p_date, 1)
  ON CONFLICT (student_id, usage_date)
  DO UPDATE SET request_count = ai_usage.request_count + 1;
END;
$$;

-- ============================================
-- 5. UNIQUE CONSTRAINTS (prevent duplicates)
-- ============================================

-- Prevent duplicate inventory items from same source
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_inventory_item 
ON student_inventory (student_id, item_type, earned_from);

-- Prevent duplicate lesson completion records
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_lesson_step
ON student_lessons (student_id, lesson_id, step_type);

-- ============================================
-- 6. AUDIT LOGGING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid,
  target_id uuid,
  details jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT NOW()
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- RLS: Only service role can read audit logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- No public access to audit logs
CREATE POLICY "No public access" ON audit_log
  FOR ALL USING (false);

-- ============================================
-- 7. HELPER: Log audit event
-- ============================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type text,
  p_target_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (event_type, user_id, target_id, details)
  VALUES (p_event_type, auth.uid(), p_target_id, p_details);
END;
$$;

GRANT EXECUTE ON FUNCTION log_audit_event(text, uuid, jsonb) TO authenticated;
