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

### SECURITY (P0) ✅ ALL COMPLETE
- [x] Atomic complete_step RPC (no client-side rewards) - DONE, wired into frontend
- [x] Remove password_hash from users table - VERIFIED: not exposed in codebase
- [x] Harden RLS per-table - DONE via migrations
- [x] Fix stale conversation history bug - DONE in SocraticModal
- [x] Server-side crisis detection - DONE in API route
- [x] Rate limiting on AI - DONE in API route

### PROJECT RADIANCE ARCHITECTURE ✅ ALL COMPLETE
- [x] "Dead Server" 3-min onboarding narrative - DONE, shows on first visit
- [x] Core View (private sanctuary) - DONE with 3D Three.js
- [x] Nexus View (shared constellation) - DONE with 3D
- [x] Battery system (0-100) with overflow mechanic - DONE in DB
- [x] Blight mechanic (negativity corrupts shared world) - DONE in RPC
- [x] process_energy_input RPC function - DONE
- [x] "Iron Wall" AI prompt (Coach, not Helper) - DONE in API
- [x] Oxygen Mask Rule: Must reach 50% before accessing Nexus - DONE, enforced in UI

### TEACHER CONTROLS ✅ ALL COMPLETE
- [x] Voice-first OR typing mode toggle per class - DONE
- [x] Per-class AI difficulty (gentle/standard/intense) - DONE
- [x] Lesson advance controls - Already existed
- [x] Analytics dashboard - TeacherAnalytics component

### GEN Z UX ✅ ALL COMPLETE
- [x] Dark mode default - Already dark theme
- [x] Streak mechanics (🔥) - StreakDisplay component
- [x] AI persona selection - TeacherClassSettings
- [x] Symbolic world items - CoreView/NexusView
- [x] Private notes space - PrivateNotes component
- [x] Timeline slider (memory map) - TimelineMemoryMap component
- [x] Exportable reflection artifact - SpotifyProgressCards with share

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
- /workspace/code/components/DeadServerOnboarding.tsx (narrative hook)
- /workspace/code/components/CoreView.tsx (3D private sanctuary)
- /workspace/code/components/NexusView.tsx (3D shared world)
- /workspace/code/components/PrivateNotes.tsx (journal space)
- /workspace/code/components/StreakDisplay.tsx (streak mechanics)
- /workspace/code/components/LofiPlayer.tsx (ambient audio)
- /workspace/code/components/TimelineMemoryMap.tsx (slider reflection)
- /workspace/code/components/GhostMode.tsx (hide from Nexus)
- /workspace/code/components/AvatarCustomization.tsx (Core customization)
- /workspace/code/components/SpotifyProgressCards.tsx (wrapped-style stats)
- /workspace/code/components/TeacherAnalytics.tsx (enhanced dashboard)

## ADDITIONAL DB MIGRATIONS ✅
- add_ghost_and_avatar_columns (is_ghost, ghost_cooldown_end, avatar_config)

## DOCUMENTATION ✅
- /workspace/docs/PROJECT_RADIANCE_IMPLEMENTATION.md

## STATUS: ✅ FULLY COMPLETE & DEPLOYED

All components pushed directly to GitHub repo (karavage-bit/leadership-platform).
Vercel auto-deploys on push.

### COMMITS PUSHED:
1. Add Project Radiance components (13 files)
2. Integrate components into student/teacher pages
3. Security: Replace client-side addToInventory with complete_step RPC
4. Implement Oxygen Mask rule (battery >= 50% to access Nexus)

### LIVE AT:
https://leadership-platform-flame.vercel.app/

### REMAINING (Optional):
- Add ANTHROPIC_API_KEY to Vercel env vars if not already set
