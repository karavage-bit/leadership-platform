# Project Radiance - Code Verification Prompt

Use this prompt with ChatGPT, Gemini, or Claude to verify all updates made to the Leadership Platform.

---

## PROMPT FOR AI CODE REVIEWER:

```
I need you to verify code changes made to my Next.js + Supabase education platform called "Project Radiance." Please review the following implementations for correctness, security, and completeness.

## PROJECT CONTEXT
- **Stack:** Next.js 14, Supabase (PostgreSQL + Auth + Edge Functions), React Three Fiber, TailwindCSS, Anthropic Claude API
- **Repo:** github.com/karavage-bit/leadership-platform
- **Live URL:** https://leadership-platform-flame.vercel.app/
- **Purpose:** Gamified leadership development for students with AI-powered Socratic dialogue

## WHAT WAS IMPLEMENTED

### 1. SECURITY FIXES (Critical - Verify First)

**A. Client-Side Exploit Fix**
- OLD (vulnerable): `addToInventory()` function made direct API calls from client
- NEW (secure): `completeStep()` RPC function calls `complete_step` stored procedure
- LOCATION: `src/app/student/page.tsx`
- VERIFY: Search for "addToInventory" - should NOT exist. Search for "completeStep" - should call `supabase.rpc('complete_step', ...)`

**B. Atomic Database Transaction**
The `complete_step` RPC should:
- Check if step already completed (prevent double rewards)
- Update `student_lessons` table with step completion
- Insert reward into `student_inventory`
- Update `world_states`
- All in one transaction

**C. Stale State Bug Fix**
- In SocraticModal, conversation history was stale due to React state timing
- FIXED: Build `nextHistory` before `setMessages()`, use that for API call
- LOCATION: `src/components/SocraticModal.tsx` around line 126-130

### 2. DATABASE SCHEMA (Supabase)

New tables that should exist:
```sql
-- student_cores: Battery/energy system per student
student_cores (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  battery_level INTEGER DEFAULT 50 (0-100),
  overflow_generated INTEGER DEFAULT 0,
  current_state TEXT ('dim'/'stable'/'radiant'),
  current_streak INTEGER DEFAULT 0,
  is_ghost BOOLEAN DEFAULT FALSE,
  ghost_cooldown_end TIMESTAMPTZ,
  avatar_config JSONB
)

-- class_nexus: Shared class world state
class_nexus (
  id UUID PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  integrity_score INTEGER DEFAULT 100,
  blight_nodes JSONB DEFAULT '[]',
  weather_state TEXT DEFAULT 'clear'
)

-- nexus_beams: Connections between students
nexus_beams (
  id UUID PRIMARY KEY,
  class_id UUID,
  from_student UUID,
  to_student UUID,
  beam_type TEXT,
  created_at TIMESTAMPTZ
)
```

RPC functions that should exist:
- `complete_step(p_student_id, p_lesson_id, p_class_id, p_step_type, p_reward_type)`
- `process_energy_input(p_student_id, p_energy_change, p_source)`
- `update_student_streak(p_student_id)`
- `handle_crisis_detection(p_student_id, p_class_id, p_trigger_type, p_trigger_text)`

### 3. NEW REACT COMPONENTS

Verify these files exist in `src/components/`:

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| DeadServerOnboarding.tsx | 3-min narrative intro for new users | onComplete |
| CoreView.tsx | 3D visualization of student's private space | studentId |
| NexusView.tsx | 3D visualization of shared class world | classId, studentId |
| StreakDisplay.tsx | Shows 🔥 streak counter | studentId |
| PrivateNotes.tsx | Private journal space | studentId |
| LofiPlayer.tsx | Ambient audio player | none |
| TimelineMemoryMap.tsx | Slider to revisit past reflections | studentId |
| GhostMode.tsx | Toggle to hide from shared Nexus | studentId, classId |
| AvatarCustomization.tsx | Customize Core appearance | studentId |
| SpotifyProgressCards.tsx | Wrapped-style progress cards | studentId |
| TeacherClassSettings.tsx | Voice/typing mode, AI difficulty | classId |
| TeacherAnalytics.tsx | Enhanced class analytics | classId |

### 4. OXYGEN MASK RULE

Students must have battery_level >= 50 before accessing the Nexus (shared world).

VERIFY in `src/app/student/page.tsx`:
- There should be a `batteryLevel` state variable
- useEffect that fetches battery from `student_cores`
- The Nexus button should check `if (batteryLevel < 50)` and show alert
- Button should show lock icon 🔒 when locked

### 5. PAGE INTEGRATIONS

**Student Page (`src/app/student/page.tsx`):**
- Dynamic imports for all new components
- State variables: showOnboarding, showCoreView, showNexusView, batteryLevel
- useEffect for onboarding check (localStorage 'radiance_onboarding_complete')
- StreakDisplay in header
- Core/Nexus buttons with Oxygen Mask check
- LofiPlayer always rendered
- GhostMode when on World tab

**Teacher Page (`src/app/teacher/page.tsx`):**
- Import TeacherClassSettings and TeacherAnalytics
- TeacherAnalytics in OverviewTab
- TeacherClassSettings in SettingsTab

### 6. AI/API SECURITY

**`src/app/api/ai/socratic/route.ts`** should have:
- Rate limiting via `checkRateLimit()`
- Crisis detection with patterns for self_harm, helplessness, rage, abuse
- Low-effort response detection (< 8 words, single words, etc.)
- AI-generated text detection
- Timeout handling (25 second AbortController)
- Server-side validation of all inputs

## VERIFICATION CHECKLIST

Please check:

1. [ ] `completeStep()` uses RPC instead of direct API call
2. [ ] No `addToInventory()` function exists
3. [ ] Battery level check blocks Nexus when < 50
4. [ ] All 12 new components exist and have correct TypeScript types
5. [ ] SocraticModal builds `nextHistory` before calling API
6. [ ] Crisis detection patterns are comprehensive
7. [ ] Rate limiting is implemented
8. [ ] TeacherClassSettings allows voice/typing toggle
9. [ ] DeadServerOnboarding shows on first visit only
10. [ ] 3D components (CoreView, NexusView) use React Three Fiber

## POTENTIAL ISSUES TO FLAG

- Missing environment variables (ANTHROPIC_API_KEY, SUPABASE_URL, etc.)
- RLS policies not applied to new tables
- Missing indexes on frequently queried columns
- Three.js components not wrapped in Suspense
- TypeScript type errors in new components

## RESPONSE FORMAT

Please provide:
1. **Security Assessment** - Are the fixes adequate?
2. **Code Quality** - Any bugs, type errors, or anti-patterns?
3. **Completeness** - Any missing pieces from the requirements?
4. **Recommendations** - What would you improve?
```

---

## FILES TO SHARE WITH THE AI

If the AI needs to see actual code, share these files from your repo:

1. `src/app/student/page.tsx` - Main student dashboard
2. `src/app/teacher/page.tsx` - Teacher dashboard
3. `src/components/SocraticModal.tsx` - AI chat component
4. `src/app/api/ai/socratic/route.ts` - AI API route
5. Any of the 12 new components listed above

## HOW TO GET THE FILES

```bash
# Clone your repo
git clone https://github.com/karavage-bit/leadership-platform.git
cd leadership-platform

# View specific files
cat src/app/student/page.tsx
cat src/components/CoreView.tsx
# etc.
```

Or view directly on GitHub: https://github.com/karavage-bit/leadership-platform
