// Student Dashboard Types
// Centralized type definitions for the student experience

export interface UserData {
  id: string
  name: string
  role: string
  class_id: string
  avatar_seed: string
  gateway_complete?: boolean
  anonymous_name?: string
  is_unmasked?: boolean
  tier_level?: number
}

export interface LessonData {
  id: number
  skill_name: string
  compelling_question: string
  lesson_objective: string
  text_anchor_title: string
  text_anchor_chapter: string
  media_title: string
  media_url: string
  the_win: string
  the_obstacle: string
  phase_id: number
}

export interface ProgressData {
  do_now_complete: boolean
  text_anchor_complete: boolean
  media_complete: boolean
  scenario_complete: boolean
  challenge_complete: boolean
  status: string
}

export interface WorldData {
  trees: number
  flowers: number
  stones: number
  crystals: number
  tower: number
  bridge: number
  garden: number
  lighthouse: number
  help_given: number
  help_received: number
  phase1_progress: number
  phase2_progress: number
  phase3_progress: number
  phase4_progress: number
}

export interface HelpRequest {
  id: string
  title: string
  description: string
  category: string
  anonymous_name: string
  status: string
  created_at: string
  requester_id?: string
  helper_id?: string
}

export interface CivicEvent {
  id: string
  skill_name: string
  skill_category: string
  anonymized_description: string
  created_at: string
}

export interface TeacherChallenge {
  id: string
  title: string
  type: 'reading' | 'video' | 'discussion' | 'reflection' | 'action'
  contentUrl?: string
  contentDescription?: string
  prompt: string
  relatedSkills: string[]
  rewardType: string
  rewardAmount: number
  dueDate?: string
  completed: boolean
}

export interface Discovery {
  id: string
  authorName: string
  isUnmasked: boolean
  title: string
  sourceType: string
  sourceName?: string
  contentUrl?: string
  description: string
  leadershipConnection: string
  relatedSkills: string[]
  imageUrl?: string
  helpfulCount: number
  commentCount: number
  hasVoted: boolean
  createdAt: string
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

export interface JournalData {
  weeks: JournalWeek[]
  totalDaysActive: number
  longestStreak: number
  totalRipples: number
  skillsLearned: string[]
}

export interface ConnectionStudent {
  id: string
  name: string
  anonymousName: string
  isUnmasked: boolean
  ripplesStarted: number
  helpGiven: number
  tier: number
}

export interface Connection {
  from: string
  to: string
  strength: number
  type: 'help' | 'ripple' | 'bridge' | 'group'
}

export interface ConnectionMapData {
  students: ConnectionStudent[]
  connections: Connection[]
  stats: {
    totalConnections: number
    totalRipples: number
    averageHelpPerStudent: number
  }
}

export interface PlacedItem {
  id: string
  type: string
  variant: number
  x: number
  y: number
  z: number
  rotation: number
  memory?: string
  earnedFrom?: string
}

export interface InventoryItem {
  type: string
  count: number
}

export interface DailyUnmaskData {
  anonymousName: string
  realName: string
  reason: string
  rippleCount: number
}

// Tab types
export type StudentTab = 'home' | 'world' | 'commons' | 'discover' | 'progress' | 'journal' | 'connections'
