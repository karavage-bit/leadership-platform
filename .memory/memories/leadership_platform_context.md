# PROJECT RADIANCE - Master Build Plan

## Live URL
https://leadership-platform-flame.vercel.app/

## I AM THE MAIN BUILDER - FULL ACCOUNTABILITY

## EXISTING CODEBASE (from PDF)
- Stack: Next.js 14 + Supabase + Three.js + Anthropic Claude
- Tables: users, classes, lessons, do_now_sessions, student_lessons, student_inventory, world_placements
- Key Files: StudentDashboard, SocraticModal, TeacherDashboard
- Known Bugs: client-side addToInventory, stale messages state, password_hash in users

## CONSOLIDATED REQUIREMENTS

### SECURITY (P0)
- [ ] Atomic complete_step RPC (no client-side rewards)
- [ ] Remove password_hash from users table
- [ ] Harden RLS per-table
- [ ] Fix stale conversation history bug
- [ ] Server-side crisis detection
- [ ] Rate limiting on AI

### PROJECT RADIANCE ARCHITECTURE
- [ ] "Dead Server" 3-min onboarding narrative
- [ ] Core View (private sanctuary) - 3 states: Dim/Stable/Radiant
- [ ] Nexus View (shared constellation) - Spire + Beams
- [ ] Battery system (0-100) with overflow mechanic
- [ ] Blight mechanic (negativity corrupts shared world)
- [ ] process_energy_input RPC function
- [ ] "Iron Wall" AI prompt (Coach, not Helper)
- [ ] Oxygen Mask Rule: Must reach 50% before accessing Nexus

### TEACHER CONTROLS (NEW)
- [ ] Voice-first OR typing mode toggle per class
- [ ] Per-class AI difficulty (gentle/standard/intense)
- [ ] Lesson advance controls
- [ ] Analytics dashboard

### GEN Z UX
- [ ] Dark mode default
- [ ] Streak mechanics (🔥)
- [ ] AI persona selection
- [ ] Symbolic world items
- [ ] Private notes space
- [ ] Timeline slider (memory map)
- [ ] Exportable reflection artifact

### DATABASE SCHEMA (New)
- student_cores (battery_level, overflow_generated, current_state, is_locked)
- class_nexus (integrity_score, blight_nodes, weather_state)
- nexus_beams (student connections visualization)

## COMPLETED DATABASE MIGRATIONS ✅
1. ✅ Teacher class settings (interaction_mode, ai_difficulty, ai_persona, min_responses)
2. ✅ student_cores table (battery, overflow, state, streak)
3. ✅ class_nexus table (integrity, blight, weather)
4. ✅ nexus_beams table (connection visualization)
5. ✅ complete_step RPC (atomic task completion)
6. ✅ process_energy_input RPC (overflow/blight mechanics)
7. ✅ update_student_streak RPC
8. ✅ handle_crisis_detection RPC (server-side)
9. ✅ RLS policies for new tables
10. ✅ Unique constraint on student_lessons
11. ✅ Performance indexes

## COMPLETED EDGE FUNCTIONS ✅
- socratic-ai: https://apakkhzuydsfyvypewwa.supabase.co/functions/v1/socratic-ai
  - Iron Wall prompt
  - Battery-aware responses
  - AI personas + difficulty levels
  - Server-side crisis detection

## COMPLETED FRONTEND COMPONENTS ✅
- /workspace/code/components/SocraticModal.tsx (voice support, fixed stale state)
- /workspace/code/components/TeacherClassSettings.tsx (teacher controls)

## DOCUMENTATION ✅
- /workspace/docs/PROJECT_RADIANCE_IMPLEMENTATION.md

## STATUS: READY FOR INTEGRATION
User needs to:
1. Add ANTHROPIC_API_KEY to Supabase Edge Function secrets
2. Copy components to their Next.js project
3. Update StudentDashboard to pass classSettings
4. Add TeacherClassSettings to teacher dashboard
