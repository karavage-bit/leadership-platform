-- =============================================
-- LEADERSHIP 2.0 DATABASE SCHEMA
-- Run this FIRST in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Classes table (must be created first for foreign keys)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  teacher_id UUID NOT NULL,
  current_lesson_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('teacher', 'student')) NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  pin TEXT, -- 4-digit PIN for student login
  avatar_seed TEXT DEFAULT NULL, -- For generating unique avatars
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases table
CREATE TABLE phases (
  id SERIAL PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  essential_question TEXT NOT NULL,
  outcome TEXT NOT NULL,
  focus TEXT NOT NULL,
  world_metaphor TEXT NOT NULL
);

-- Lessons table (45 lessons)
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  phase_id INTEGER REFERENCES phases(id),
  class_number INTEGER NOT NULL,
  skill_name TEXT NOT NULL,
  compelling_question TEXT NOT NULL,
  guided_questions JSONB DEFAULT '[]',
  lesson_objective TEXT NOT NULL,
  biological_reality TEXT,
  leadership_relevance TEXT,
  skill_stacking TEXT,
  the_win TEXT,
  the_obstacle TEXT,
  text_anchor_title TEXT,
  text_anchor_chapter TEXT,
  media_title TEXT,
  media_url TEXT,
  daily_system_emphasis TEXT,
  days_span INTEGER DEFAULT 1,
  activity_deliverable TEXT
);

-- Scenarios for Socratic AI
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id INTEGER REFERENCES lessons(id),
  situation_prompt TEXT NOT NULL,
  context TEXT,
  skill_being_tested TEXT NOT NULL,
  success_indicators JSONB DEFAULT '[]',
  zone2_notes TEXT
);

-- Challenges (physical/real-world)
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id INTEGER REFERENCES lessons(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reflection_prompts JSONB DEFAULT '[]',
  evidence_type TEXT CHECK (evidence_type IN ('text', 'photo', 'video', 'any')) DEFAULT 'any',
  estimated_duration TEXT
);

-- =============================================
-- STUDENT PROGRESS TABLES
-- =============================================

-- Student lesson progress
CREATE TABLE student_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id),
  class_id UUID REFERENCES classes(id),
  status TEXT CHECK (status IN ('locked', 'available', 'in_progress', 'complete')) DEFAULT 'locked',
  -- Do Now tracking
  do_now_complete BOOLEAN DEFAULT FALSE,
  do_now_at TIMESTAMPTZ,
  -- Text anchor tracking
  text_anchor_complete BOOLEAN DEFAULT FALSE,
  text_anchor_at TIMESTAMPTZ,
  -- Media tracking
  media_complete BOOLEAN DEFAULT FALSE,
  media_at TIMESTAMPTZ,
  -- Scenario tracking
  scenario_complete BOOLEAN DEFAULT FALSE,
  scenario_at TIMESTAMPTZ,
  -- Challenge tracking
  challenge_complete BOOLEAN DEFAULT FALSE,
  challenge_at TIMESTAMPTZ,
  -- Exit ticket tracking
  exit_ticket_complete BOOLEAN DEFAULT FALSE,
  exit_ticket_at TIMESTAMPTZ,
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Challenge submissions
CREATE TABLE challenge_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id),
  lesson_id INTEGER REFERENCES lessons(id),
  class_id UUID REFERENCES classes(id),
  reflections JSONB DEFAULT '{}',
  evidence_url TEXT,
  evidence_description TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  -- Teacher review
  review_status TEXT CHECK (review_status IN ('pending', 'reviewed', 'needs_revision')) DEFAULT 'pending',
  review_score INTEGER CHECK (review_score >= 1 AND review_score <= 4),
  review_feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  -- Civic world
  approved_for_civic BOOLEAN DEFAULT FALSE,
  civic_description TEXT
);

-- Do Now sessions
CREATE TABLE do_now_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id),
  class_id UUID REFERENCES classes(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  conversation JSONB DEFAULT '[]',
  response_count INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id, date)
);

-- Exit ticket sessions
CREATE TABLE exit_ticket_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id),
  class_id UUID REFERENCES classes(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  conversation JSONB DEFAULT '[]',
  response_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id, date)
);

-- Scenario sessions
CREATE TABLE scenario_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id),
  class_id UUID REFERENCES classes(id),
  conversation JSONB DEFAULT '[]',
  response_count INTEGER DEFAULT 0,
  challenge_plan TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================
-- WORLD BUILDING SYSTEM
-- =============================================

-- World states (what each student has built)
CREATE TABLE world_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- Resource counts
  trees INTEGER DEFAULT 0,
  flowers INTEGER DEFAULT 0,
  stones INTEGER DEFAULT 0,
  crystals INTEGER DEFAULT 0,
  -- Buildings
  tower INTEGER DEFAULT 0,
  bridge INTEGER DEFAULT 0,
  garden INTEGER DEFAULT 0,
  lighthouse INTEGER DEFAULT 0,
  library INTEGER DEFAULT 0,
  workshop INTEGER DEFAULT 0,
  -- Phase progress (0-100)
  phase1_progress INTEGER DEFAULT 0,
  phase2_progress INTEGER DEFAULT 0,
  phase3_progress INTEGER DEFAULT 0,
  phase4_progress INTEGER DEFAULT 0,
  -- Special items earned
  special_items JSONB DEFAULT '[]',
  -- Connections to other students
  connections JSONB DEFAULT '[]',
  -- Total help given/received
  help_given INTEGER DEFAULT 0,
  help_received INTEGER DEFAULT 0,
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Building blocks available to students
CREATE TABLE building_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('care', 'creation', 'courage', 'community')) NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')) DEFAULT 'common',
  -- How to earn
  earn_method TEXT NOT NULL, -- 'do_now', 'scenario', 'challenge', 'help_given', 'help_received', 'streak', 'spotlight'
  earn_amount INTEGER DEFAULT 1
);

-- Student inventory (blocks they can place)
CREATE TABLE student_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  block_id UUID REFERENCES building_blocks(id),
  quantity INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, block_id)
);

-- =============================================
-- THE COMMONS (Help System)
-- =============================================

-- Help requests
CREATE TABLE help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  -- Request details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('academic', 'creative', 'social', 'skills', 'other')) NOT NULL,
  -- Anonymous display name (generated)
  anonymous_name TEXT NOT NULL,
  -- Status
  status TEXT CHECK (status IN ('open', 'claimed', 'completed', 'expired')) DEFAULT 'open',
  -- Helper info
  helper_id UUID REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Completion notes
  completion_notes TEXT,
  requester_feedback TEXT,
  helper_feedback TEXT,
  -- Timestamps
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CIVIC WORLD (Anonymous class achievements)
-- =============================================

-- Civic events (anonymous celebrations)
CREATE TABLE civic_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id),
  phase_id INTEGER REFERENCES phases(id),
  skill_name TEXT NOT NULL,
  skill_category TEXT CHECK (skill_category IN ('care', 'creation', 'courage', 'community')) NOT NULL,
  anonymized_description TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('challenge_complete', 'help_given', 'streak', 'milestone')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spotlight nominations (bi-daily recognition)
CREATE TABLE spotlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  reason TEXT NOT NULL,
  category TEXT CHECK (category IN ('care', 'creation', 'courage', 'community')) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  display_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONNECTIONS (Bridges between students)
-- =============================================

-- Student connections (formed through helping)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  -- Connection strength (increases with each interaction)
  strength INTEGER DEFAULT 1,
  -- How the connection was formed
  formed_through TEXT NOT NULL, -- 'help_request', 'collaboration', 'challenge_together'
  -- Visual representation
  bridge_style TEXT DEFAULT 'wooden', -- 'wooden', 'stone', 'crystal', 'rainbow'
  -- Timestamps
  formed_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_a_id, student_b_id)
);

-- =============================================
-- CRISIS DETECTION & ALERTS
-- =============================================

-- Crisis alerts for teacher notification
CREATE TABLE crisis_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  lesson_id INTEGER REFERENCES lessons(id),
  trigger_type TEXT NOT NULL, -- 'self_harm', 'helplessness', 'rage', 'abuse'
  trigger_text TEXT NOT NULL,
  conversation_context JSONB,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT
);

-- =============================================
-- AI USAGE & RATE LIMITING
-- =============================================

-- AI usage tracking
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count INTEGER DEFAULT 0,
  UNIQUE(student_id, date)
);

-- =============================================
-- SKILL PROGRESSION TRACKING
-- =============================================

-- Skill mastery records
CREATE TABLE skill_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id),
  skill_name TEXT NOT NULL,
  -- Evidence of mastery
  do_now_evidence TEXT,
  scenario_evidence TEXT,
  challenge_evidence TEXT,
  -- Mastery level (1-4)
  mastery_level INTEGER CHECK (mastery_level >= 1 AND mastery_level <= 4),
  -- Connection to real life
  real_life_application TEXT,
  -- Timestamps
  demonstrated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_users_class ON users(class_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_student_lessons_student ON student_lessons(student_id);
CREATE INDEX idx_student_lessons_class ON student_lessons(class_id);
CREATE INDEX idx_challenge_submissions_student ON challenge_submissions(student_id);
CREATE INDEX idx_challenge_submissions_status ON challenge_submissions(review_status);
CREATE INDEX idx_help_requests_class ON help_requests(class_id);
CREATE INDEX idx_help_requests_status ON help_requests(status);
CREATE INDEX idx_crisis_alerts_class ON crisis_alerts(class_id);
CREATE INDEX idx_crisis_alerts_status ON crisis_alerts(status);
CREATE INDEX idx_civic_events_class ON civic_events(class_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE do_now_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_ticket_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_mastery ENABLE ROW LEVEL SECURITY;

-- Students can read their own data
CREATE POLICY "Students can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Students can read own lessons" ON student_lessons FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update own lessons" ON student_lessons FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own lessons" ON student_lessons FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Teachers can read all data for their classes
CREATE POLICY "Teachers can read class users" ON users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM classes c 
      WHERE c.id = users.class_id 
      AND c.teacher_id = auth.uid()
    )
  );

-- Allow public read on lessons, phases (curriculum data)
CREATE POLICY "Public can read lessons" ON lessons FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Public can read phases" ON phases FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Public can read challenges" ON challenges FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Public can read scenarios" ON scenarios FOR SELECT TO PUBLIC USING (true);

-- Civic events are visible to class members
CREATE POLICY "Class members can read civic events" ON civic_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.class_id = civic_events.class_id
    )
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update world state when challenge is reviewed
CREATE OR REPLACE FUNCTION update_world_on_challenge(
  p_student_id UUID,
  p_lesson_id INTEGER,
  p_score INTEGER
) RETURNS VOID AS $$
DECLARE
  v_phase_id INTEGER;
  v_category TEXT;
BEGIN
  -- Get lesson phase
  SELECT phase_id INTO v_phase_id FROM lessons WHERE id = p_lesson_id;
  
  -- Determine category based on phase
  v_category := CASE v_phase_id
    WHEN 1 THEN 'care'
    WHEN 2 THEN 'creation'
    WHEN 3 THEN 'courage'
    WHEN 4 THEN 'community'
    ELSE 'care'
  END;
  
  -- Update world state based on score
  UPDATE world_states SET
    trees = trees + CASE WHEN v_category = 'courage' THEN p_score ELSE 0 END,
    flowers = flowers + CASE WHEN v_category = 'care' THEN p_score ELSE 0 END,
    tower = tower + CASE WHEN v_category = 'creation' THEN (p_score / 2) ELSE 0 END,
    bridge = bridge + CASE WHEN v_category = 'community' THEN (p_score / 2) ELSE 0 END,
    phase1_progress = phase1_progress + CASE WHEN v_phase_id = 1 THEN p_score * 2 ELSE 0 END,
    phase2_progress = phase2_progress + CASE WHEN v_phase_id = 2 THEN p_score * 2 ELSE 0 END,
    phase3_progress = phase3_progress + CASE WHEN v_phase_id = 3 THEN p_score * 2 ELSE 0 END,
    phase4_progress = phase4_progress + CASE WHEN v_phase_id = 4 THEN p_score * 2 ELSE 0 END,
    updated_at = NOW()
  WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reward helping others
CREATE OR REPLACE FUNCTION reward_help_given(
  p_helper_id UUID,
  p_requester_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Reward the helper
  UPDATE world_states SET
    help_given = help_given + 1,
    crystals = crystals + 2,
    bridge = bridge + 1,
    updated_at = NOW()
  WHERE student_id = p_helper_id;
  
  -- Acknowledge the requester
  UPDATE world_states SET
    help_received = help_received + 1,
    flowers = flowers + 1,
    updated_at = NOW()
  WHERE student_id = p_requester_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate anonymous name
CREATE OR REPLACE FUNCTION generate_anonymous_name() 
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['Swift', 'Bright', 'Calm', 'Noble', 'Wise', 'Kind', 'Bold', 'Gentle', 'Brave', 'Keen'];
  nouns TEXT[] := ARRAY['Phoenix', 'Eagle', 'Oak', 'River', 'Star', 'Mountain', 'Wave', 'Wind', 'Falcon', 'Sage'];
BEGIN
  RETURN adjectives[1 + floor(random() * array_length(adjectives, 1))] || ' ' || 
         nouns[1 + floor(random() * array_length(nouns, 1))];
END;
$$ LANGUAGE plpgsql;
