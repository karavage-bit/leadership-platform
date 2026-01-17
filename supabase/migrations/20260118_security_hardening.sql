-- ============================================
-- SECURITY HARDENING MIGRATION
-- Applied: 2026-01-18
-- ============================================

-- 1. Secure increment_ai_usage
DROP FUNCTION IF EXISTS increment_ai_usage(uuid, date);

CREATE FUNCTION increment_ai_usage(p_student_id uuid, p_date date) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_caller_id uuid;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NOT NULL AND v_caller_id != p_student_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s usage';
  END IF;
  INSERT INTO ai_usage (student_id, usage_date, request_count) VALUES (p_student_id, p_date, 1)
  ON CONFLICT (student_id, usage_date) DO UPDATE SET request_count = ai_usage.request_count + 1;
END;
$$;

-- 2. SECURE complete_step: Uses auth.uid() instead of p_student_id
DROP FUNCTION IF EXISTS complete_step(uuid, integer, text, integer);

CREATE OR REPLACE FUNCTION complete_step(
  p_lesson_id integer,
  p_step_type text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student_id UUID;
  v_class_id UUID;
  v_already_complete BOOLEAN;
  v_item_type TEXT;
  v_energy_earned INTEGER;
BEGIN
  v_student_id := auth.uid();
  
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  v_energy_earned := CASE p_step_type
    WHEN 'do_now' THEN 10
    WHEN 'scenario' THEN 15
    WHEN 'challenge' THEN 20
    WHEN 'exit_ticket' THEN 10
    ELSE 10
  END;
  
  IF p_step_type NOT IN ('do_now', 'scenario', 'challenge', 'exit_ticket') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid step type');
  END IF;
  
  SELECT class_id INTO v_class_id FROM users WHERE id = v_student_id;
  
  SELECT 
    CASE p_step_type
      WHEN 'do_now' THEN do_now_complete
      WHEN 'scenario' THEN scenario_complete
      WHEN 'challenge' THEN challenge_complete
      WHEN 'exit_ticket' THEN exit_ticket_complete
      ELSE FALSE
    END INTO v_already_complete
  FROM student_lessons 
  WHERE student_id = v_student_id AND lesson_id = p_lesson_id;
  
  IF v_already_complete = TRUE THEN
    RETURN jsonb_build_object('success', true, 'already_completed', true, 'energy_earned', 0);
  END IF;
  
  v_item_type := CASE p_step_type
    WHEN 'do_now' THEN 'flower'
    WHEN 'scenario' THEN 'tree'
    WHEN 'challenge' THEN 'crystal'
    ELSE 'spark'
  END;
  
  INSERT INTO student_lessons (student_id, lesson_id, class_id, do_now_complete, scenario_complete, challenge_complete, exit_ticket_complete, status)
  VALUES (v_student_id, p_lesson_id, v_class_id,
    p_step_type = 'do_now', p_step_type = 'scenario', p_step_type = 'challenge', p_step_type = 'exit_ticket', 'in_progress')
  ON CONFLICT (student_id, lesson_id) 
  DO UPDATE SET
    do_now_complete = CASE WHEN p_step_type = 'do_now' THEN TRUE ELSE student_lessons.do_now_complete END,
    do_now_at = CASE WHEN p_step_type = 'do_now' THEN NOW() ELSE student_lessons.do_now_at END,
    scenario_complete = CASE WHEN p_step_type = 'scenario' THEN TRUE ELSE student_lessons.scenario_complete END,
    scenario_at = CASE WHEN p_step_type = 'scenario' THEN NOW() ELSE student_lessons.scenario_at END,
    challenge_complete = CASE WHEN p_step_type = 'challenge' THEN TRUE ELSE student_lessons.challenge_complete END,
    challenge_at = CASE WHEN p_step_type = 'challenge' THEN NOW() ELSE student_lessons.challenge_at END,
    exit_ticket_complete = CASE WHEN p_step_type = 'exit_ticket' THEN TRUE ELSE student_lessons.exit_ticket_complete END,
    exit_ticket_at = CASE WHEN p_step_type = 'exit_ticket' THEN NOW() ELSE student_lessons.exit_ticket_at END,
    status = CASE WHEN p_step_type IN ('challenge', 'exit_ticket') THEN 'complete' ELSE 'in_progress' END;
  
  INSERT INTO world_states (student_id, flowers, trees, crystals, updated_at)
  VALUES (v_student_id, 
    CASE WHEN p_step_type = 'do_now' THEN 1 ELSE 0 END,
    CASE WHEN p_step_type = 'scenario' THEN 1 ELSE 0 END,
    CASE WHEN p_step_type = 'challenge' THEN 1 ELSE 0 END,
    NOW())
  ON CONFLICT (student_id)
  DO UPDATE SET
    flowers = CASE WHEN p_step_type = 'do_now' THEN COALESCE(world_states.flowers, 0) + 1 ELSE world_states.flowers END,
    trees = CASE WHEN p_step_type = 'scenario' THEN COALESCE(world_states.trees, 0) + 1 ELSE world_states.trees END,
    crystals = CASE WHEN p_step_type = 'challenge' THEN COALESCE(world_states.crystals, 0) + 1 ELSE world_states.crystals END,
    updated_at = NOW();
  
  RETURN jsonb_build_object('success', true, 'already_completed', false, 'item_earned', v_item_type, 'energy_earned', v_energy_earned);
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION complete_step(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_step(integer, text) TO authenticated;

-- 3. Lock down student_inventory
REVOKE INSERT, UPDATE, DELETE ON student_inventory FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON student_inventory FROM anon;
GRANT ALL ON student_inventory TO service_role;

-- 4. Enable RLS
ALTER TABLE student_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Students see own lessons" ON student_lessons;
DROP POLICY IF EXISTS "Students manage own lessons" ON student_lessons;
DROP POLICY IF EXISTS "Teachers see class lessons" ON student_lessons;
CREATE POLICY "Students see own lessons" ON student_lessons FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students manage own lessons" ON student_lessons FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers see class lessons" ON student_lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u JOIN classes c ON c.id = u.class_id WHERE u.id = student_lessons.student_id AND c.teacher_id = auth.uid())
);

DROP POLICY IF EXISTS "Students see own inventory" ON student_inventory;
DROP POLICY IF EXISTS "Teachers see class inventory" ON student_inventory;
CREATE POLICY "Students see own inventory" ON student_inventory FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers see class inventory" ON student_inventory FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u JOIN classes c ON c.id = u.class_id WHERE u.id = student_inventory.student_id AND c.teacher_id = auth.uid())
);

DROP POLICY IF EXISTS "Students see own world state" ON world_states;
DROP POLICY IF EXISTS "Students manage own world" ON world_states;
DROP POLICY IF EXISTS "Teachers see class world states" ON world_states;
CREATE POLICY "Students see own world state" ON world_states FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students manage own world" ON world_states FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers see class world states" ON world_states FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u JOIN classes c ON c.id = u.class_id WHERE u.id = world_states.student_id AND c.teacher_id = auth.uid())
);

DROP POLICY IF EXISTS "Students insert own alerts" ON crisis_alerts;
DROP POLICY IF EXISTS "Teachers view class alerts" ON crisis_alerts;
DROP POLICY IF EXISTS "Teachers update class alerts" ON crisis_alerts;
CREATE POLICY "Students insert own alerts" ON crisis_alerts FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Teachers view class alerts" ON crisis_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM classes WHERE classes.id = crisis_alerts.class_id AND classes.teacher_id = auth.uid())
);
CREATE POLICY "Teachers update class alerts" ON crisis_alerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM classes WHERE classes.id = crisis_alerts.class_id AND classes.teacher_id = auth.uid())
);

-- 6. Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY, event_type text NOT NULL, user_id uuid, target_id uuid,
  details jsonb, ip_address inet, created_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event_type);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No public access" ON audit_log;
CREATE POLICY "No public access" ON audit_log FOR ALL USING (false);

CREATE OR REPLACE FUNCTION log_audit_event(p_event_type text, p_target_id uuid DEFAULT NULL, p_details jsonb DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO audit_log (event_type, user_id, target_id, details) VALUES (p_event_type, auth.uid(), p_target_id, p_details);
END;
$$;
GRANT EXECUTE ON FUNCTION log_audit_event(text, uuid, jsonb) TO authenticated;
