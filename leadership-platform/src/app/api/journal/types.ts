// Journal API Types
// Proper TypeScript types for journal data processing

export interface DoNowRecord {
  completed_at: string | null
  lesson_id: number
  lessons: { skill_name: string } | null
}

export interface ScenarioRecord {
  completed_at: string | null
  lesson_id: number
  lessons: { skill_name: string } | null
}

export interface ChallengeRecord {
  submitted_at: string
  review_status: string
  challenges: { title: string } | null
  lessons: { skill_name: string } | null
}

export interface HelpRecord {
  completed_at: string
  title: string
  category: string
}

export interface DiscoveryRecord {
  created_at: string
  title: string
  source_type: string
  related_skills: string[] | null
}

export interface TeacherChallengeRecord {
  submitted_at: string
  teacher_challenges: { 
    title: string
    related_skills: string[] | null 
  } | null
}

export interface RippleRecord {
  created_at: string
  source_description: string
  chain_position: number
}

export interface JournalEntry {
  id: string
  date: string
  type: 'gateway' | 'do_now' | 'scenario' | 'challenge' | 'help_given' | 'help_received' | 'discovery' | 'unmask' | 'tier_up' | 'ripple' | 'teacher_challenge'
  title: string
  description: string
  skill?: string
  reward?: { type: string; amount: number }
  rippleCount?: number
}

export interface JournalWeek {
  weekStart: string
  weekEnd: string
  entries: JournalEntry[]
  highlights: string[]
}
