'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { 
  UserData, LessonData, ProgressData, WorldData, 
  HelpRequest, CivicEvent, TeacherChallenge, Discovery,
  JournalData, ConnectionMapData, PlacedItem, InventoryItem,
  DailyUnmaskData
} from '../types'

interface UseStudentDataReturn {
  // Core data
  user: UserData | null
  lesson: LessonData | null
  progress: ProgressData | null
  world: WorldData | null
  
  // Social data
  helpRequests: HelpRequest[]
  civicEvents: CivicEvent[]
  
  // Extended features
  teacherChallenges: TeacherChallenge[]
  discoveries: Discovery[]
  journalData: JournalData | null
  connectionMapData: ConnectionMapData | null
  
  // World items
  placedItems: PlacedItem[]
  inventoryItems: InventoryItem[]
  discoveredSecrets: string[]
  
  // Gateway & unmask
  gatewayComplete: boolean
  dailyUnmaskData: DailyUnmaskData | null
  studentSkills: string[]
  
  // Status
  loading: boolean
  isOnline: boolean
  error: string | null
  
  // Actions
  loadData: () => Promise<void>
  handleLogout: () => Promise<void>
  refreshHelpRequests: () => Promise<void>
  refreshDiscoveries: () => Promise<void>
  
  // Progress updates
  markTextAnchorComplete: () => Promise<void>
  markMediaComplete: () => Promise<void>
  updateWorld: (updates: Partial<WorldData>) => void
  updateProgress: (updates: Partial<ProgressData>) => void
}

export function useStudentData(): UseStudentDataReturn {
  const router = useRouter()
  const supabase = createClient()
  
  // Core state
  const [user, setUser] = useState<UserData | null>(null)
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [world, setWorld] = useState<WorldData | null>(null)
  
  // Social state
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [civicEvents, setCivicEvents] = useState<CivicEvent[]>([])
  
  // Extended features
  const [teacherChallenges, setTeacherChallenges] = useState<TeacherChallenge[]>([])
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [journalData, setJournalData] = useState<JournalData | null>(null)
  const [connectionMapData, setConnectionMapData] = useState<ConnectionMapData | null>(null)
  
  // World items
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [discoveredSecrets, setDiscoveredSecrets] = useState<string[]>([])
  
  // Gateway & unmask
  const [gatewayComplete, setGatewayComplete] = useState(false)
  const [dailyUnmaskData, setDailyUnmaskData] = useState<DailyUnmaskData | null>(null)
  const [studentSkills, setStudentSkills] = useState<string[]>([])
  
  // Status
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load teacher challenges
  const loadTeacherChallenges = useCallback(async (classId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/challenges/teacher?classId=${classId}&studentId=${studentId}`)
      if (!res.ok) throw new Error('Failed to load challenges')
      const data = await res.json()
      setTeacherChallenges(data.challenges || [])
    } catch (e) { 
      console.error('Error loading teacher challenges:', e) 
    }
  }, [])
  
  // Load discoveries
  const loadDiscoveries = useCallback(async (classId: string, studentId?: string) => {
    try {
      const url = studentId 
        ? `/api/discoveries?classId=${classId}&studentId=${studentId}`
        : `/api/discoveries?classId=${classId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load discoveries')
      const data = await res.json()
      setDiscoveries(data.discoveries || [])
    } catch (e) { 
      console.error('Error loading discoveries:', e) 
    }
  }, [])
  
  // Load growth journal
  const loadJournalData = useCallback(async (studentId: string) => {
    try {
      const res = await fetch(`/api/journal?studentId=${studentId}`)
      if (!res.ok) throw new Error('Failed to load journal')
      const data = await res.json()
      setJournalData(data)
      setStudentSkills(data.skillsLearned || [])
    } catch (e) { 
      console.error('Error loading journal:', e) 
    }
  }, [])
  
  // Load inventory items
  const loadInventoryItems = useCallback(async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('placement_inventory')
        .select('item_type, quantity')
        .eq('student_id', studentId)
        .gt('quantity', 0)
      
      if (error) {
        console.error('Error loading inventory:', error)
        return
      }
      
      if (data && data.length > 0) {
        setInventoryItems(data.map(item => ({
          type: item.item_type,
          count: item.quantity
        })))
      }
    } catch (e) {
      console.error('Error loading inventory:', e)
    }
  }, [supabase])
  
  // Load placed items
  const loadPlacedItems = useCallback(async (studentId: string) => {
    try {
      const { data } = await supabase
        .from('world_placements')
        .select('*')
        .eq('student_id', studentId)
      
      if (data) {
        setPlacedItems(data.map(item => ({
          id: item.id,
          type: item.item_type,
          variant: item.item_variant || 0,
          x: item.pos_x,
          y: item.pos_y,
          z: item.pos_z,
          rotation: item.rotation_y || 0,
          memory: item.earned_description,
          earnedFrom: item.earned_from
        })))
      }
    } catch (e) {
      console.error('Error loading placed items:', e)
    }
  }, [supabase])
  
  // Load discovered secrets
  const loadDiscoveredSecrets = useCallback(async (studentId: string) => {
    try {
      const { data } = await supabase
        .from('discovered_secrets')
        .select('secret_name')
        .eq('student_id', studentId)
      
      if (data) {
        setDiscoveredSecrets(data.map(s => s.secret_name))
      }
    } catch (e) {
      console.error('Error loading secrets:', e)
    }
  }, [supabase])

  // Load connection map data
  const loadConnectionMapData = useCallback(async (classId: string, currentUserId: string) => {
    try {
      const { data: classStudents } = await supabase
        .from('users')
        .select('id, name, anonymous_name, is_unmasked')
        .eq('class_id', classId)
        .eq('role', 'student')
      
      const { data: worldStates } = await supabase
        .from('world_states')
        .select('student_id, help_given')
        .in('student_id', classStudents?.map(s => s.id) || [])
      
      const students = classStudents?.map(s => {
        const ws = worldStates?.find(w => w.student_id === s.id)
        return {
          id: s.id,
          name: s.name,
          anonymousName: s.anonymous_name || 'Anonymous',
          isUnmasked: s.is_unmasked || false,
          ripplesStarted: 0,
          helpGiven: ws?.help_given || 0,
          tier: 1
        }
      }) || []
      
      const { data: helpConnections } = await supabase
        .from('help_requests')
        .select('requester_id, helper_id')
        .eq('class_id', classId)
        .eq('status', 'completed')
      
      const connections = helpConnections?.map(h => ({
        from: h.helper_id,
        to: h.requester_id,
        strength: 1,
        type: 'help' as const
      })) || []
      
      setConnectionMapData({
        students,
        connections,
        stats: {
          totalConnections: connections.length,
          totalRipples: 0,
          averageHelpPerStudent: students.length > 0 
            ? students.reduce((sum, s) => sum + s.helpGiven, 0) / students.length 
            : 0
        }
      })
    } catch (e) { 
      console.error('Error loading connection map:', e) 
    }
  }, [supabase])

  // Main data loading function
  const loadData = useCallback(async () => {
    setError(null)
    
    try {
      // SECURITY: Check if authenticated user is a teacher - redirect them
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: teacherCheck } = await supabase
          .from('teachers')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .maybeSingle()
        
        if (teacherCheck) {
          // This is a teacher - redirect to teacher dashboard
          router.push('/teacher')
          return
        }
      }

      const storedUserId = localStorage.getItem('leadership_user_id')
      const storedUserName = localStorage.getItem('leadership_user_name')
      const storedClassId = localStorage.getItem('leadership_class_id')

      let userId = storedUserId
      let userData: UserData | null = null

      if (storedUserId && storedUserName && storedClassId) {
        const { data: verifyUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', storedUserId)
          .single()

        if (verifyUser) {
          userData = verifyUser
          userId = verifyUser.id
        } else {
          localStorage.removeItem('leadership_user_id')
          localStorage.removeItem('leadership_user_name')
          localStorage.removeItem('leadership_class_id')
          router.push('/')
          return
        }
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/')
          return
        }

        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!dbUser || dbUser.role !== 'student') {
          router.push('/')
          return
        }

        userData = dbUser
        userId = dbUser.id
        localStorage.setItem('leadership_user_id', dbUser.id)
        localStorage.setItem('leadership_user_name', dbUser.name)
        localStorage.setItem('leadership_class_id', dbUser.class_id)
      }

      setUser(userData)
      setGatewayComplete(userData?.gateway_complete || false)

      // Get class current lesson
      const { data: classData } = await supabase
        .from('classes')
        .select('current_lesson_id')
        .eq('id', userData!.class_id)
        .single()

      const currentLessonId = classData?.current_lesson_id || 1

      // Get lesson data
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', currentLessonId)
        .single()

      setLesson(lessonData)

      // Get or create progress
      let { data: progressData } = await supabase
        .from('student_lessons')
        .select('*')
        .eq('student_id', userId)
        .eq('lesson_id', currentLessonId)
        .single()

      if (!progressData) {
        const { data: newProgress } = await supabase
          .from('student_lessons')
          .insert({
            student_id: userId,
            lesson_id: currentLessonId,
            class_id: userData!.class_id,
            status: 'available'
          })
          .select()
          .single()
        progressData = newProgress
      }

      setProgress(progressData)

      // Get world state
      let { data: worldData } = await supabase
        .from('world_states')
        .select('*')
        .eq('student_id', userId)
        .single()

      if (!worldData) {
        const { data: newWorld } = await supabase
          .from('world_states')
          .insert({ student_id: userId })
          .select()
          .single()
        worldData = newWorld
      }

      setWorld(worldData)

      // Get help requests
      const { data: helpData } = await supabase
        .from('help_requests')
        .select('*')
        .eq('class_id', userData!.class_id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10)

      setHelpRequests(helpData || [])

      // Get civic events
      const { data: civicData } = await supabase
        .from('civic_events')
        .select('*')
        .eq('class_id', userData!.class_id)
        .order('created_at', { ascending: false })
        .limit(10)

      setCivicEvents(civicData || [])
      
      // Load extended features in parallel
      await Promise.all([
        loadTeacherChallenges(userData!.class_id, userId!),
        loadDiscoveries(userData!.class_id, userId!),
        loadJournalData(userId!),
        loadConnectionMapData(userData!.class_id, userId!),
        loadInventoryItems(userId!),
        loadPlacedItems(userId!),
        loadDiscoveredSecrets(userId!)
      ])
      
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [router, supabase, loadTeacherChallenges, loadDiscoveries, loadJournalData, loadConnectionMapData, loadInventoryItems, loadPlacedItems, loadDiscoveredSecrets])

  // Logout
  const handleLogout = useCallback(async () => {
    localStorage.removeItem('leadership_user_id')
    localStorage.removeItem('leadership_user_name')
    localStorage.removeItem('leadership_class_id')
    localStorage.removeItem('leadership_draft_conversation')
    await supabase.auth.signOut()
    router.push('/')
  }, [router, supabase])

  // Refresh help requests
  const refreshHelpRequests = useCallback(async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('help_requests')
      .select('*')
      .eq('class_id', user.class_id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10)
    
    setHelpRequests(data || [])
  }, [user, supabase])

  // Refresh discoveries
  const refreshDiscoveries = useCallback(async () => {
    if (!user) return
    await loadDiscoveries(user.class_id, user.id)
  }, [user, loadDiscoveries])

  // Mark text anchor complete
  const markTextAnchorComplete = useCallback(async () => {
    if (!progress || !user || !lesson) return
    
    await supabase
      .from('student_lessons')
      .update({ 
        text_anchor_complete: true, 
        text_anchor_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .eq('student_id', user.id)
      .eq('lesson_id', lesson.id)

    await supabase
      .from('world_states')
      .update({ 
        stones: (world?.stones || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', user.id)

    setProgress({ ...progress, text_anchor_complete: true, status: 'in_progress' })
    setWorld(prev => prev ? { ...prev, stones: (prev.stones || 0) + 1 } : null)
  }, [progress, user, lesson, world, supabase])

  // Mark media complete
  const markMediaComplete = useCallback(async () => {
    if (!progress || !user || !lesson) return
    
    await supabase
      .from('student_lessons')
      .update({ 
        media_complete: true, 
        media_at: new Date().toISOString() 
      })
      .eq('student_id', user.id)
      .eq('lesson_id', lesson.id)

    await supabase
      .from('world_states')
      .update({ 
        stones: (world?.stones || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', user.id)

    setProgress({ ...progress, media_complete: true })
    setWorld(prev => prev ? { ...prev, stones: (prev.stones || 0) + 1 } : null)
  }, [progress, user, lesson, world, supabase])

  // Update world
  const updateWorld = useCallback((updates: Partial<WorldData>) => {
    setWorld(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  // Update progress
  const updateProgress = useCallback((updates: Partial<ProgressData>) => {
    setProgress(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    user,
    lesson,
    progress,
    world,
    helpRequests,
    civicEvents,
    teacherChallenges,
    discoveries,
    journalData,
    connectionMapData,
    placedItems,
    inventoryItems,
    discoveredSecrets,
    gatewayComplete,
    dailyUnmaskData,
    studentSkills,
    loading,
    isOnline,
    error,
    loadData,
    handleLogout,
    refreshHelpRequests,
    refreshDiscoveries,
    markTextAnchorComplete,
    markMediaComplete,
    updateWorld,
    updateProgress
  }
}
