-- =============================================
-- MISSING DATABASE FUNCTIONS
-- Run this AFTER schema.sql and schema_additions.sql
-- These functions are called by the application but were not defined
-- =============================================

-- Function to increment tower count
CREATE OR REPLACE FUNCTION increment_tower(p_student_id UUID) 
RETURNS INTEGER AS $$
DECLARE 
  current_val INTEGER;
BEGIN
  UPDATE world_states 
  SET tower = COALESCE(tower, 0) + 1, updated_at = NOW()
  WHERE student_id = p_student_id 
  RETURNING tower INTO current_val;
  RETURN current_val;
END;
$$ LANGUAGE plpgsql;

-- Function to increment help_given count
CREATE OR REPLACE FUNCTION increment_help_given(p_student_id UUID) 
RETURNS INTEGER AS $$
DECLARE 
  current_val INTEGER;
BEGIN
  UPDATE world_states 
  SET help_given = COALESCE(help_given, 0) + 1, updated_at = NOW()
  WHERE student_id = p_student_id 
  RETURNING help_given INTO current_val;
  RETURN current_val;
END;
$$ LANGUAGE plpgsql;

-- Function to increment bridge count
CREATE OR REPLACE FUNCTION increment_bridge(p_student_id UUID) 
RETURNS INTEGER AS $$
DECLARE 
  current_val INTEGER;
BEGIN
  UPDATE world_states 
  SET bridge = COALESCE(bridge, 0) + 1, updated_at = NOW()
  WHERE student_id = p_student_id 
  RETURNING bridge INTO current_val;
  RETURN current_val;
END;
$$ LANGUAGE plpgsql;

-- Generic function to increment any world resource
CREATE OR REPLACE FUNCTION increment_world_resource(
  p_student_id UUID,
  p_resource TEXT,
  p_amount INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE 
  current_val INTEGER;
  query TEXT;
BEGIN
  -- Validate resource name to prevent SQL injection
  IF p_resource NOT IN ('trees', 'flowers', 'stones', 'crystals', 'tower', 'bridge', 'garden', 'lighthouse', 'help_given', 'help_received') THEN
    RAISE EXCEPTION 'Invalid resource name: %', p_resource;
  END IF;
  
  query := format(
    'UPDATE world_states SET %I = COALESCE(%I, 0) + $1, updated_at = NOW() WHERE student_id = $2 RETURNING %I',
    p_resource, p_resource, p_resource
  );
  
  EXECUTE query INTO current_val USING p_amount, p_student_id;
  RETURN current_val;
END;
$$ LANGUAGE plpgsql;

-- Function to increment response count on teacher challenges
CREATE OR REPLACE FUNCTION increment_response_count(p_challenge_id UUID) 
RETURNS INTEGER AS $$
DECLARE 
  current_val INTEGER;
BEGIN
  UPDATE teacher_challenges 
  SET response_count = COALESCE(response_count, 0) + 1
  WHERE id = p_challenge_id 
  RETURNING response_count INTO current_val;
  RETURN current_val;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement discovery helpful count
CREATE OR REPLACE FUNCTION decrement_discovery_helpful(p_discovery_id UUID) 
RETURNS INTEGER AS $$
DECLARE 
  current_val INTEGER;
BEGIN
  UPDATE student_discoveries 
  SET helpful_count = GREATEST(COALESCE(helpful_count, 0) - 1, 0)
  WHERE id = p_discovery_id 
  RETURNING helpful_count INTO current_val;
  RETURN current_val;
END;
$$ LANGUAGE plpgsql;

-- Function to increment discovery helpful count
CREATE OR REPLACE FUNCTION increment_discovery_helpful(p_discovery_id UUID) 
RETURNS INTEGER AS $$
DECLARE 
  current_val INTEGER;
BEGIN
  UPDATE student_discoveries 
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = p_discovery_id 
  RETURNING helpful_count INTO current_val;
  RETURN current_val;
END;
$$ LANGUAGE plpgsql;

-- Add response_count column to teacher_challenges if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_challenges' AND column_name = 'response_count'
  ) THEN
    ALTER TABLE teacher_challenges ADD COLUMN response_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Function to increment AI usage (upsert pattern for race-condition safety)
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_student_id UUID,
  p_date DATE
) RETURNS INTEGER AS $$
DECLARE 
  current_val INTEGER;
BEGIN
  INSERT INTO ai_usage (student_id, date, call_count)
  VALUES (p_student_id, p_date, 1)
  ON CONFLICT (student_id, date) 
  DO UPDATE SET call_count = ai_usage.call_count + 1
  RETURNING call_count INTO current_val;
  RETURN current_val;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint for ai_usage if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_student_date_unique'
  ) THEN
    ALTER TABLE ai_usage ADD CONSTRAINT ai_usage_student_date_unique UNIQUE (student_id, date);
  END IF;
EXCEPTION WHEN duplicate_table THEN
  -- Constraint already exists
  NULL;
END $$;
