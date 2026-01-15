-- =============================================
-- LEADERSHIP 2.0 SCHEMA ADDITIONS
-- Run this AFTER schema.sql in Supabase SQL Editor
-- =============================================

-- =============================================
-- GATEWAY SYSTEM (Give before you get)
-- =============================================

-- Gratitude gateway - must complete before building
CREATE TABLE IF NOT EXISTS gateway_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  challenge_type TEXT DEFAULT 'gratitude', -- 'gratitude', 'kindness', 'appreciation'
  recipient_description TEXT, -- Who they thanked (no real names stored)
  message_type TEXT CHECK (message_type IN ('text', 'email', 'handwritten', 'voice', 'in_person')),
  message_preview TEXT, -- First 100 chars or description
  proof_url TEXT, -- Screenshot or photo
  reflection TEXT, -- How it felt
  -- Status
  status TEXT CHECK (status IN ('pending', 'approved', 'needs_revision')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_feedback TEXT,
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Track if student has completed gateway
ALTER TABLE users ADD COLUMN IF NOT EXISTS gateway_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gateway_completed_at TIMESTAMPTZ;

-- =============================================
-- ANONYMOUS IDENTITY SYSTEM
-- =============================================

-- Anonymous names for week 1
ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymous_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_unmasked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unmasked_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unmask_reason TEXT;

-- Daily unmask selections
CREATE TABLE IF NOT EXISTS daily_unmasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unmask_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL, -- What they did to earn the spotlight
  ripple_count INTEGER DEFAULT 0, -- How many people their actions touched
  celebrated BOOLEAN DEFAULT FALSE, -- Has the class seen this yet
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, unmask_date) -- Only one unmask per class per day
);

-- =============================================
-- TEACHER POP-UP CHALLENGES
-- =============================================

CREATE TABLE IF NOT EXISTS teacher_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  -- Content
  title TEXT NOT NULL,
  challenge_type TEXT CHECK (challenge_type IN ('reading', 'video', 'discussion', 'reflection', 'action')) NOT NULL,
  content_url TEXT, -- Link to TED talk, article, etc.
  content_description TEXT, -- Or embedded text/instructions
  prompt TEXT NOT NULL, -- "How does this apply to your leadership journey?"
  -- Skill connection
  related_skills TEXT[], -- Array of skill names this connects to
  -- Timing
  available_from TIMESTAMPTZ DEFAULT NOW(),
  available_until TIMESTAMPTZ,
  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  requires_response BOOLEAN DEFAULT TRUE,
  min_response_length INTEGER DEFAULT 50,
  -- Rewards
  reward_type TEXT DEFAULT 'flower', -- What completing this earns
  reward_amount INTEGER DEFAULT 1,
  -- Stats
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student responses to teacher challenges
CREATE TABLE IF NOT EXISTS teacher_challenge_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES teacher_challenges(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  -- Response
  response_text TEXT NOT NULL,
  personal_connection TEXT, -- How it applies to THEIR life specifically
  -- Optional: share with class
  share_with_class BOOLEAN DEFAULT FALSE,
  -- Status
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  -- Reward granted
  reward_granted BOOLEAN DEFAULT FALSE,
  UNIQUE(challenge_id, student_id)
);

-- =============================================
-- STUDENT DISCOVERIES (User-Generated Content)
-- =============================================

CREATE TABLE IF NOT EXISTS student_discoveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  -- Content
  title TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('social_media', 'movie', 'tv_show', 'book', 'podcast', 'news', 'personal_experience', 'other')) NOT NULL,
  source_name TEXT, -- "TikTok", "The Office", etc.
  content_url TEXT, -- Link if applicable
  description TEXT NOT NULL, -- What they found
  leadership_connection TEXT NOT NULL, -- How it connects to leadership
  related_skills TEXT[], -- Skills this relates to
  -- Media
  image_url TEXT, -- Screenshot or image
  -- Moderation
  status TEXT CHECK (status IN ('pending', 'approved', 'hidden')) DEFAULT 'pending',
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  -- Engagement
  helpful_count INTEGER DEFAULT 0, -- How many found this helpful
  comment_count INTEGER DEFAULT 0,
  -- Anonymous until unmasked
  show_author BOOLEAN DEFAULT FALSE, -- Only true after student is unmasked
  -- Rewards
  reward_granted BOOLEAN DEFAULT FALSE,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on discoveries
CREATE TABLE IF NOT EXISTS discovery_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discovery_id UUID REFERENCES student_discoveries(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  show_author BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful votes on discoveries
CREATE TABLE IF NOT EXISTS discovery_helpful (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discovery_id UUID REFERENCES student_discoveries(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(discovery_id, student_id)
);

-- =============================================
-- RIPPLE TRACKING SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS ripples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id),
  -- The chain
  source_student_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Who started it
  source_action_type TEXT NOT NULL, -- 'help_given', 'challenge', 'discovery', etc.
  source_action_id UUID, -- Reference to the specific action
  source_description TEXT NOT NULL, -- What they did
  -- Chain tracking
  chain_position INTEGER DEFAULT 1, -- 1 = original, 2 = first ripple, etc.
  parent_ripple_id UUID REFERENCES ripples(id), -- The ripple that caused this one
  root_ripple_id UUID, -- The original ripple that started the chain
  -- Who was affected
  recipient_student_id UUID REFERENCES users(id),
  recipient_action_type TEXT, -- What the recipient then did
  recipient_action_id UUID,
  recipient_description TEXT,
  -- Status
  is_complete BOOLEAN DEFAULT FALSE, -- Did the recipient pay it forward?
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ripple stats per student
CREATE TABLE IF NOT EXISTS ripple_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  ripples_started INTEGER DEFAULT 0,
  total_people_reached INTEGER DEFAULT 0, -- Sum of all chain lengths
  longest_chain INTEGER DEFAULT 0,
  ripples_participated_in INTEGER DEFAULT 0, -- Ripples they were part of
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WORLD PLACEMENT SYSTEM
-- =============================================

-- Store where students place their items
CREATE TABLE IF NOT EXISTS world_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Item info
  item_type TEXT NOT NULL, -- 'tree', 'flower', 'tower', etc.
  item_variant INTEGER DEFAULT 0, -- Style variant
  -- Position on island (grid-based)
  pos_x FLOAT NOT NULL,
  pos_y FLOAT NOT NULL,
  pos_z FLOAT NOT NULL,
  rotation_y FLOAT DEFAULT 0,
  -- Memory attached to this item
  earned_from TEXT, -- 'do_now', 'scenario', 'challenge', 'help', etc.
  earned_description TEXT, -- What specifically earned this
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  related_lesson_id INTEGER REFERENCES lessons(id),
  related_skill TEXT,
  -- Timestamps
  placed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unplaced items in inventory
CREATE TABLE IF NOT EXISTS placement_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_variant INTEGER DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  earned_from TEXT,
  earned_description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, item_type, item_variant)
);

-- =============================================
-- TIER & WORLD MERGING SYSTEM
-- =============================================

-- Student tiers
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_level INTEGER DEFAULT 0;
-- 0 = No world yet (gateway incomplete)
-- 1 = Solo island
-- 2 = Partner (connected to 1 other)
-- 3 = Squad (4 people merged)
-- 4 = Collective (8+ people)

-- World connections (bridges between islands)
CREATE TABLE IF NOT EXISTS world_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id),
  -- The two connected students
  student_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Connection type
  connection_type TEXT CHECK (connection_type IN ('bridge', 'merged', 'visiting')) DEFAULT 'bridge',
  -- How it was earned
  earned_through TEXT, -- 'help_given', 'combined_mission', etc.
  mission_description TEXT,
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_a_id, student_b_id)
);

-- Group/Squad definitions
CREATE TABLE IF NOT EXISTS world_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id),
  group_name TEXT,
  tier_level INTEGER DEFAULT 3, -- 3 = Squad, 4 = Collective
  -- Members
  member_ids UUID[] NOT NULL,
  leader_id UUID REFERENCES users(id), -- Optional leader
  -- Shared zone
  has_shared_zone BOOLEAN DEFAULT FALSE,
  shared_zone_monument TEXT, -- What they built together
  -- Stats
  combined_ripple_count INTEGER DEFAULT 0,
  combined_help_count INTEGER DEFAULT 0,
  -- Timestamps
  formed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group missions
CREATE TABLE IF NOT EXISTS group_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES world_groups(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  -- Mission details
  mission_title TEXT NOT NULL,
  mission_description TEXT NOT NULL,
  mission_type TEXT CHECK (mission_type IN ('tier_up', 'monument', 'community_project')) NOT NULL,
  -- Requirements
  required_participants INTEGER DEFAULT 2,
  required_actions INTEGER DEFAULT 4,
  -- Progress
  current_participants UUID[] DEFAULT '{}',
  completed_actions INTEGER DEFAULT 0,
  -- AI brainstorm session
  brainstorm_conversation JSONB DEFAULT '[]',
  final_plan TEXT,
  -- Status
  status TEXT CHECK (status IN ('planning', 'active', 'completed', 'abandoned')) DEFAULT 'planning',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================
-- SECRETS & EASTER EGGS
-- =============================================

CREATE TABLE IF NOT EXISTS discovered_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  secret_type TEXT NOT NULL, -- 'memory_stone', 'ripple_pool', 'constellation', etc.
  secret_name TEXT NOT NULL,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, secret_type)
);

-- Class-wide secrets unlocked
CREATE TABLE IF NOT EXISTS class_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id),
  secret_type TEXT NOT NULL,
  trigger_description TEXT, -- What unlocked it
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, secret_type)
);

-- =============================================
-- VISITOR SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS world_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  visitor_student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Visit details
  visit_started_at TIMESTAMPTZ DEFAULT NOW(),
  visit_ended_at TIMESTAMPTZ,
  -- Gift left behind (optional)
  gift_type TEXT, -- 'flower', 'note', etc.
  gift_message TEXT,
  gift_position_x FLOAT,
  gift_position_z FLOAT
);

-- =============================================
-- THE FEED (Combined Activity Stream)
-- =============================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id),
  -- Actor (anonymous until unmasked)
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  show_real_name BOOLEAN DEFAULT FALSE,
  anonymous_name TEXT,
  -- Activity
  activity_type TEXT NOT NULL, 
  -- Types: 'gateway_complete', 'challenge_complete', 'help_given', 'help_received',
  -- 'discovery_posted', 'teacher_challenge_complete', 'ripple_started', 
  -- 'world_grew', 'tier_up', 'unmask', 'group_formed', 'group_mission_complete'
  activity_description TEXT NOT NULL,
  related_skill TEXT,
  -- References
  related_id UUID, -- ID of the related item
  related_type TEXT, -- 'challenge', 'help_request', 'discovery', etc.
  -- Impact
  ripple_count INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BRAINSTORM AI SESSIONS
-- =============================================

CREATE TABLE IF NOT EXISTS brainstorm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  -- Session type
  session_type TEXT CHECK (session_type IN (
    'show_skill', 'combine_skills', 'give_back', 'start_ripple', 'group_tier_up'
  )) NOT NULL,
  -- Participants (for group sessions)
  participant_ids UUID[] DEFAULT '{}',
  -- Conversation
  conversation JSONB DEFAULT '[]',
  -- Outcome
  generated_idea TEXT,
  action_plan TEXT,
  -- Follow-through
  action_taken BOOLEAN DEFAULT FALSE,
  action_proof TEXT,
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_ripples_source ON ripples(source_student_id);
CREATE INDEX IF NOT EXISTS idx_ripples_root ON ripples(root_ripple_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_class ON activity_feed(class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_placements_student ON world_placements(student_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_class ON student_discoveries(class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_challenges_class ON teacher_challenges(class_id, is_active);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate anonymous name
CREATE OR REPLACE FUNCTION generate_anonymous_name() RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['Brave', 'Quiet', 'Gentle', 'Swift', 'Wise', 'Kind', 'Bold', 'Calm', 'Bright', 'Noble', 'True', 'Free', 'Wild', 'Deep', 'Clear'];
  nouns TEXT[] := ARRAY['Falcon', 'River', 'Storm', 'Mountain', 'Forest', 'Ocean', 'Star', 'Moon', 'Sun', 'Wind', 'Fire', 'Stone', 'Cloud', 'Wave', 'Light'];
BEGIN
  RETURN adjectives[1 + floor(random() * array_length(adjectives, 1))] || ' ' || 
         nouns[1 + floor(random() * array_length(nouns, 1))];
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign anonymous name on user creation
CREATE OR REPLACE FUNCTION assign_anonymous_name() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.anonymous_name IS NULL THEN
    NEW.anonymous_name := generate_anonymous_name();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_anonymous_name ON users;
CREATE TRIGGER trigger_assign_anonymous_name
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_anonymous_name();

-- Function to add to activity feed
CREATE OR REPLACE FUNCTION add_to_feed(
  p_class_id UUID,
  p_student_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_skill TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_anon_name TEXT;
  v_show_name BOOLEAN;
  v_feed_id UUID;
BEGIN
  -- Get student's anonymous name and unmask status
  SELECT anonymous_name, is_unmasked INTO v_anon_name, v_show_name
  FROM users WHERE id = p_student_id;
  
  INSERT INTO activity_feed (
    class_id, student_id, show_real_name, anonymous_name,
    activity_type, activity_description, related_skill,
    related_id, related_type
  ) VALUES (
    p_class_id, p_student_id, v_show_name, v_anon_name,
    p_activity_type, p_description, p_skill,
    p_related_id, p_related_type
  ) RETURNING id INTO v_feed_id;
  
  RETURN v_feed_id;
END;
$$ LANGUAGE plpgsql;
