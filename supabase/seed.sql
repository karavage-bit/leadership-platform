-- =============================================
-- LEADERSHIP 2.0 SEED DATA
-- Run this AFTER schema.sql in Supabase SQL Editor
-- =============================================

-- Insert Phases
INSERT INTO phases (number, name, essential_question, outcome, focus, world_metaphor) VALUES
(1, 'Hardware', 'How do I build my operating system?', 'Self-aware, focused, in control of impulses', 'Metacognition, Inhibitory Control, Attention', 'Building foundations - roots growing deep'),
(2, 'Direction', 'What do I stand for and where am I going?', 'Clear values, resilient mindset, high standards', 'Values, Resilience, Standards', 'Planting seeds - garden taking shape'),
(3, 'Toolbelt', 'How do I navigate challenges effectively?', 'Strategic thinker, calculated risk-taker, agent of own life', 'Strategy, Risk, Agency', 'Building structures - workshop and lighthouse'),
(4, 'Blueprint', 'How do I lead and serve others?', 'Effective leader, servant-hearted, legacy-minded', 'Application, Service, Legacy', 'Connecting worlds - bridges and community');

-- Insert all 45 Lessons
-- Phase 1: Hardware (Lessons 1-10)
INSERT INTO lessons (id, phase_id, class_number, skill_name, compelling_question, lesson_objective, the_win, the_obstacle, text_anchor_title, text_anchor_chapter, daily_system_emphasis) VALUES

(1, 1, 1, 'Self-Awareness', 'Who are you when no one is watching?', 'Students will identify their automatic thoughts and behaviors in everyday situations', 'Recognizing your default patterns without judgment', 'Believing you already know yourself completely', 'Atomic Habits', 'Chapter 1: The Surprising Power of Atomic Habits', 'Notice one automatic reaction today'),

(2, 1, 2, 'Attention Control', 'What deserves your focus right now?', 'Students will practice directing attention intentionally rather than reactively', 'Choosing where your mind goes instead of letting it wander', 'The pull of notifications and distractions', 'Deep Work', 'Rule 1: Work Deeply', 'Practice 10 minutes of single-task focus'),

(3, 1, 3, 'Impulse Management', 'Can you pause before you react?', 'Students will develop strategies for creating space between stimulus and response', 'The power of the pause - responding vs reacting', 'Emotions that feel urgent and overwhelming', 'Thinking, Fast and Slow', 'Part 1: Two Systems', 'Count to 5 before responding when frustrated'),

(4, 1, 4, 'Working Memory', 'How do you hold ideas while working with them?', 'Students will practice techniques for maintaining information while processing', 'Juggling multiple pieces of information effectively', 'Information overload and mental clutter', 'Make It Stick', 'Chapter 1: Learning is Misunderstood', 'Practice recalling without notes'),

(5, 1, 5, 'Cognitive Flexibility', 'Can you see it differently?', 'Students will practice shifting perspectives and adapting thinking', 'Switching mental gears smoothly when needed', 'Getting stuck in one way of thinking', 'Mindset', 'Chapter 1: The Mindsets', 'Consider an opposing viewpoint today'),

(6, 1, 6, 'Task Initiation', 'What makes starting so hard?', 'Students will identify and overcome barriers to beginning tasks', 'Starting before you feel ready', 'Waiting for motivation or perfect conditions', 'Atomic Habits', 'Chapter 11: Walk Slowly, But Never Backward', 'Use the 2-minute rule to start something'),

(7, 1, 7, 'Time Perception', 'Where does your time actually go?', 'Students will audit their time use and identify patterns', 'Knowing where time goes vs where you think it goes', 'Underestimating how long things take', 'The Productivity Project', 'Chapter 3: Your Most Valuable Possession', 'Track your time for one day'),

(8, 1, 8, 'Planning Basics', 'What needs to happen and when?', 'Students will break down goals into actionable steps with timelines', 'Creating realistic plans that account for obstacles', 'Planning in ideal conditions only', '7 Habits of Highly Effective Teens', 'Habit 3: Put First Things First', 'Plan tomorrow before bed tonight'),

(9, 1, 9, 'Organization', 'Can you find what you need when you need it?', 'Students will create systems for organizing physical and digital spaces', 'Systems that work for YOUR brain', 'One-size-fits-all organization approaches', 'Getting Things Done', 'Chapter 2: Getting Control of Your Life', 'Organize one space using your system'),

(10, 1, 10, 'Self-Monitoring', 'How do you know if youre on track?', 'Students will develop methods for checking progress and adjusting', 'Catching yourself before you veer off course', 'Only checking results, not process', 'Atomic Habits', 'Chapter 16: How to Stick with Good Habits', 'Check in with yourself 3 times today'),

-- Phase 2: Direction (Lessons 11-22)
(11, 2, 11, 'Core Values', 'What do you stand for?', 'Students will identify and articulate their core personal values', 'Knowing what matters most to YOU, not others', 'Adopting values because they sound good', '7 Habits of Highly Effective Teens', 'Habit 2: Begin with the End in Mind', 'Identify one non-negotiable value'),

(12, 2, 12, 'Growth Mindset', 'Is your potential fixed or growing?', 'Students will recognize fixed mindset triggers and practice growth responses', 'Seeing challenges as growth opportunities', 'Protecting ego over pursuing growth', 'Mindset', 'Chapter 2: Inside the Mindsets', 'Replace "I cant" with "I cant yet"'),

(13, 2, 13, 'Embracing Discomfort', 'What good comes from struggle?', 'Students will understand the role of productive struggle in development', 'Seeking Zone 2 challenges intentionally', 'Avoiding anything difficult', 'Grit', 'Chapter 6: Interest', 'Do one uncomfortable thing today'),

(14, 2, 14, 'Delayed Gratification', 'Can you wait for what matters?', 'Students will practice choosing long-term benefits over immediate rewards', 'Playing the long game consistently', 'The pull of instant satisfaction', 'The Marshmallow Test', 'Chapter 1: In Stanford Universitys Surprise Room', 'Delay one small gratification today'),

(15, 2, 15, 'Frustration Tolerance', 'How do you handle not getting what you want?', 'Students will develop strategies for managing frustration productively', 'Using frustration as fuel, not fire', 'Giving up or lashing out when frustrated', 'Grit', 'Chapter 8: Purpose', 'Sit with frustration for 2 minutes'),

(16, 2, 16, 'Self-Talk', 'What does your inner voice say?', 'Students will identify and redirect negative self-talk patterns', 'Being your own coach, not critic', 'Automatic negative thoughts running unchecked', 'Chatter', 'Chapter 1: Why We Talk to Ourselves', 'Catch and reframe 3 negative thoughts'),

(17, 2, 17, 'Standards Setting', 'What quality of work represents you?', 'Students will define personal standards independent of minimum requirements', 'Your standard vs the minimum', 'Doing just enough to get by', 'Extreme Ownership', 'Chapter 4: Check the Ego', 'Do one thing above the minimum'),

(18, 2, 18, 'Resilience', 'How do you bounce back?', 'Students will develop personalized strategies for recovering from setbacks', 'Getting back up, different than before', 'Staying down or returning unchanged', 'Option B', 'Chapter 1: Breathing Again', 'Identify your bounce-back strategy'),

(19, 2, 19, 'Emotional Regulation', 'How do you manage big feelings?', 'Students will practice techniques for processing intense emotions', 'Feeling emotions without being controlled by them', 'Suppressing or exploding', 'Emotional Intelligence 2.0', 'Chapter 4: Self-Management Strategies', 'Name the emotion, then choose the response'),

(20, 2, 20, 'Stress Response', 'What happens when pressure builds?', 'Students will identify personal stress signals and develop coping strategies', 'Recognizing your stress signatures early', 'Ignoring stress until breakdown', 'Why Zebras Dont Get Ulcers', 'Chapter 1: Why Dont Zebras Get Ulcers?', 'Notice your first stress signal'),

(21, 2, 21, 'Energy Management', 'Where does your energy come from and go?', 'Students will audit energy sources and drains', 'Investing energy wisely across domains', 'Running on empty, wondering why', 'The Power of Full Engagement', 'Chapter 1: Fully Engaged', 'Identify top energy source and drain'),

(22, 2, 22, 'Digital Boundaries', 'Who controls your attention - you or your phone?', 'Students will establish intentional boundaries with technology', 'Choosing when tech serves you', 'Being constantly available to devices', 'Digital Minimalism', 'Part 1: Foundations', 'Create one tech-free zone or time'),

-- Phase 3: Toolbelt (Lessons 23-32)
(23, 3, 23, 'Problem Solving', 'How do you tackle problems systematically?', 'Students will apply structured approaches to complex problems', 'Breaking problems into solvable pieces', 'Jumping to solutions before understanding', 'Thinking in Systems', 'Part One: System Structure', 'Apply a problem-solving framework'),

(24, 3, 24, 'Decision Making', 'How do you choose when it matters?', 'Students will develop frameworks for making important decisions', 'Making decisions you can stand behind', 'Analysis paralysis or impulsive choices', 'Thinking, Fast and Slow', 'Part 4: Choices', 'Use a decision matrix for one choice'),

(25, 3, 25, 'Risk Assessment', 'When is risk worth taking?', 'Students will evaluate risks rationally and make calculated decisions', 'Calculated risks vs reckless chances', 'Avoiding all risk or ignoring consequences', 'Antifragile', 'Chapter 1: Between Damocles and Hydra', 'Assess one risk formally'),

(26, 3, 26, 'Communication', 'How do you make yourself understood?', 'Students will practice clear, effective communication in various contexts', 'Being clear AND kind in communication', 'Assuming others understand you', 'Crucial Conversations', 'Chapter 1: Whats a Crucial Conversation?', 'Practice one crucial conversation'),

(27, 3, 27, 'Active Listening', 'Do you hear to respond or to understand?', 'Students will practice deep listening without planning responses', 'Understanding before being understood', 'Listening just to reply', '7 Habits of Highly Effective People', 'Habit 5: Seek First to Understand', 'Listen for 2 full minutes without responding'),

(28, 3, 28, 'Conflict Navigation', 'How do you handle disagreement?', 'Students will develop strategies for productive conflict resolution', 'Addressing conflict directly and respectfully', 'Avoiding or escalating conflicts', 'Difficult Conversations', 'Chapter 1: Sort Out the Three Conversations', 'Have one difficult conversation'),

(29, 3, 29, 'Feedback Reception', 'Can you hear hard truths?', 'Students will practice receiving feedback without defensiveness', 'Seeing feedback as data, not attack', 'Defending, deflecting, or crumbling', 'Thanks for the Feedback', 'Chapter 1: Three Triggers', 'Seek feedback and say only "thank you"'),

(30, 3, 30, 'Initiative', 'Do you wait or do you start?', 'Students will practice identifying and acting on opportunities', 'Seeing opportunity and acting first', 'Waiting for permission or instruction', 'The 7 Habits of Highly Effective People', 'Habit 1: Be Proactive', 'Take initiative on one thing today'),

(31, 3, 31, 'Resourcefulness', 'How do you make do with what you have?', 'Students will solve problems with available resources creatively', 'Using constraints as creative fuel', 'Blaming lack of resources for inaction', 'The Lean Startup', 'Chapter 6: Test', 'Solve one problem with what you have'),

(32, 3, 32, 'Adaptability', 'How do you adjust when plans change?', 'Students will practice flexible responses to unexpected changes', 'Adjusting sails without losing direction', 'Rigid attachment to original plans', 'Range', 'Chapter 1: Roger vs. Tiger', 'Adapt gracefully to one change'),

-- Phase 4: Blueprint (Lessons 33-45)
(33, 4, 33, 'Influence Without Authority', 'How do you lead without a title?', 'Students will practice ethical influence techniques', 'Leading through trust, not position', 'Relying on authority you dont have', 'How to Win Friends and Influence People', 'Part Three: How to Win People to Your Way of Thinking', 'Influence one outcome without authority'),

(34, 4, 34, 'Empathy', 'Can you feel what others feel?', 'Students will practice perspective-taking and empathic responses', 'Understanding others experience deeply', 'Assuming others experience matches yours', 'Brene Brown: Atlas of the Heart', 'Chapter 1: Places We Go', 'Practice perspective-taking with someone'),

(35, 4, 35, 'Collaboration', 'How do you build something together?', 'Students will practice effective teamwork and collaborative creation', 'Creating something better together', 'Doing it yourself because its easier', 'The Five Dysfunctions of a Team', 'Dysfunction 1: Absence of Trust', 'Collaborate on one project genuinely'),

(36, 4, 36, 'Giving Feedback', 'How do you help others grow?', 'Students will practice delivering constructive feedback effectively', 'Helping others see what they cant', 'Being nice instead of helpful', 'Radical Candor', 'Chapter 1: Radical Candor', 'Give one piece of genuine feedback'),

(37, 4, 37, 'Mentorship', 'How do you lift others up?', 'Students will practice supporting others development', 'Investing in someone elses growth', 'Hoarding knowledge and opportunity', 'Leaders Eat Last', 'Chapter 1: Protection from Above', 'Help someone learn something you know'),

(38, 4, 38, 'Service Leadership', 'How do you lead by serving?', 'Students will practice servant leadership principles', 'Putting others needs alongside your own', 'Leading only for personal benefit', 'The Servant', 'Chapter 1: The Invitation', 'Serve someone without recognition'),

(39, 4, 39, 'Community Building', 'How do you create belonging?', 'Students will practice creating inclusive environments', 'Making space where others belong', 'Building clubs instead of communities', 'The Art of Gathering', 'Chapter 1: Decide Why Youre Really Gathering', 'Include someone who is outside'),

(40, 4, 40, 'Accountability', 'Do you own your outcomes?', 'Students will practice taking responsibility without excuses', 'Owning results - good and bad', 'Blaming circumstances or others', 'Extreme Ownership', 'Chapter 1: Extreme Ownership', 'Own one failure completely'),

(41, 4, 41, 'Vision Casting', 'Can you paint a picture others want to join?', 'Students will practice articulating compelling visions', 'Creating a future worth working toward', 'Goals only you care about', 'Start with Why', 'Chapter 1: Assume You Know', 'Articulate your vision to someone'),

(42, 4, 42, 'Succession Planning', 'Who comes after you?', 'Students will practice preparing others to continue important work', 'Building something that outlasts you', 'Being irreplaceable instead of impactful', 'Good to Great', 'Chapter 2: Level 5 Leadership', 'Prepare someone to do what you do'),

(43, 4, 43, 'Legacy Thinking', 'What will remain when you leave?', 'Students will define the lasting impact they want to have', 'The difference you make that lasts', 'Living for the moment only', 'Die Empty', 'Chapter 1: Die Empty', 'Define one legacy goal'),

(44, 4, 44, 'Integration', 'How does it all connect?', 'Students will synthesize skills from all phases into coherent practice', 'Seeing how every skill supports others', 'Treating skills as separate tools', 'The 7 Habits', 'Habit 7: Sharpen the Saw', 'Connect three skills in one action'),

(45, 4, 45, 'Continuous Growth', 'How do you keep growing?', 'Students will create personal development plans for ongoing growth', 'Building systems for lifetime growth', 'Thinking youve arrived', 'Mastery', 'Chapter 1: Discover Your Calling', 'Design your ongoing growth plan');

-- Insert default building blocks
INSERT INTO building_blocks (name, description, category, icon, rarity, earn_method, earn_amount) VALUES
-- Care blocks
('Flower Seed', 'Plant flowers in your world', 'care', '🌱', 'common', 'do_now', 1),
('Healing Spring', 'A calming water feature', 'care', '💧', 'uncommon', 'help_given', 1),
('Heart Tree', 'A tree that spreads compassion', 'care', '🌳', 'rare', 'challenge', 2),

-- Creation blocks  
('Building Stone', 'Basic construction material', 'creation', '🪨', 'common', 'scenario', 1),
('Workshop Gear', 'Adds to your workshop', 'creation', '⚙️', 'uncommon', 'challenge', 1),
('Crystal Spire', 'A tower of achievement', 'creation', '💎', 'rare', 'streak', 3),

-- Courage blocks
('Torch', 'Lights the way forward', 'courage', '🔥', 'common', 'do_now', 1),
('Courage Flag', 'Mark your territory', 'courage', '🚩', 'uncommon', 'challenge', 1),
('Lion Statue', 'Symbol of bravery', 'courage', '🦁', 'rare', 'challenge', 3),

-- Community blocks
('Bridge Plank', 'Connect to others', 'community', '🌉', 'common', 'help_given', 1),
('Gathering Circle', 'A place to meet', 'community', '⭕', 'uncommon', 'help_given', 2),
('Rainbow Arch', 'Ultimate connection', 'community', '🌈', 'legendary', 'spotlight', 1);

-- Insert scenarios for first few lessons
INSERT INTO scenarios (lesson_id, situation_prompt, skill_being_tested, success_indicators, zone2_notes) VALUES
(1, 'You notice yourself scrolling social media instead of working on an important project. Walk me through what happens in your mind during those moments.', 'Self-Awareness', '["Identifies automatic behavior", "Recognizes triggers", "Shows curiosity not judgment"]', 'Push for specifics about thoughts and feelings, not just behavior'),
(2, 'Your phone buzzes with a notification while youre studying. You have a test tomorrow. What do you do and why?', 'Attention Control', '["Acknowledges the pull", "Describes decision process", "Shows intentional choice"]', 'Explore the internal negotiation, not just the action'),
(3, 'Someone says something that makes you angry in front of your friends. What happens in the next 5 seconds?', 'Impulse Management', '["Describes the moment between trigger and response", "Shows awareness of options", "Considers consequences"]', 'Focus on the pause, not the resolution');

-- Insert challenges for first few lessons
INSERT INTO challenges (lesson_id, title, description, reflection_prompts, evidence_type, estimated_duration) VALUES
(1, 'The Observer', 'For one day, notice every time you do something automatically - checking your phone, snacking, saying "Im fine." Just notice, dont change anything.', '["What automatic behaviors did you discover?", "Which one surprised you most?", "What triggered each automatic behavior?"]', 'text', '24 hours'),
(2, 'The Single Focus', 'Complete one 25-minute task with zero interruptions. Phone in another room. No music. Just you and the task.', '["How did it feel to work without interruption?", "What thoughts tried to pull you away?", "What did you notice about your work quality?"]', 'text', '30 minutes'),
(3, 'The Pause Practice', 'Three times today, when you feel the urge to react quickly, pause for 5 seconds before responding. Count them.', '["What situations triggered your urge to react?", "What happened in those 5 seconds?", "Did your response change because of the pause?"]', 'text', '24 hours');
