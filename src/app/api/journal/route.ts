import { NextRequest, NextResponse } from 'next/server'
import { 
  getServerSupabase,
  validateUser, 
  unauthorizedResponse, 
  forbiddenResponse,
  badRequestResponse,
  serverErrorResponse,
  validateUUID
} from '@/lib/auth'

const MAX_ENTRIES_PER_QUERY = 100

export async function GET(request: NextRequest) {
  try {
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId') || auth.userId
    
    if (!validateUUID(studentId)) {
      return badRequestResponse('Invalid studentId')
    }
    
    if (studentId !== auth.userId && auth.role !== 'teacher') {
      return forbiddenResponse('Cannot view another student\'s journal')
    }

    const supabase = getServerSupabase()
    
    const [
      { data: gateway },
      { data: doNows },
      { data: scenarios },
      { data: challenges },
      { data: helpGiven },
      { data: helpReceived },
      { data: discoveries },
      { data: teacherChallenges },
      { data: ripples }
    ] = await Promise.all([
      supabase.from('gateway_challenges').select('completed_at, recipient_description').eq('student_id', studentId).eq('status', 'approved').single(),
      supabase.from('do_now_sessions').select('completed_at, lesson_id, lessons(skill_name)').eq('student_id', studentId).not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(MAX_ENTRIES_PER_QUERY),
      supabase.from('scenario_sessions').select('completed_at, lesson_id, lessons(skill_name)').eq('student_id', studentId).not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(MAX_ENTRIES_PER_QUERY),
      supabase.from('challenge_submissions').select('submitted_at, review_status, challenges(title), lessons(skill_name)').eq('student_id', studentId).eq('review_status', 'reviewed').order('submitted_at', { ascending: false }).limit(MAX_ENTRIES_PER_QUERY),
      supabase.from('help_requests').select('completed_at, title, category').eq('helper_id', studentId).eq('status', 'completed').order('completed_at', { ascending: false }).limit(MAX_ENTRIES_PER_QUERY),
      supabase.from('help_requests').select('completed_at, title, category').eq('requester_id', studentId).eq('status', 'completed').order('completed_at', { ascending: false }).limit(MAX_ENTRIES_PER_QUERY),
      supabase.from('student_discoveries').select('created_at, title, source_type, related_skills').eq('student_id', studentId).eq('status', 'approved').order('created_at', { ascending: false }).limit(MAX_ENTRIES_PER_QUERY),
      supabase.from('teacher_challenge_responses').select('submitted_at, teacher_challenges(title, related_skills)').eq('student_id', studentId).order('submitted_at', { ascending: false }).limit(MAX_ENTRIES_PER_QUERY),
      supabase.from('ripples').select('created_at, source_description, chain_position').eq('source_student_id', studentId).eq('chain_position', 1).order('created_at', { ascending: false }).limit(MAX_ENTRIES_PER_QUERY)
    ])
    
    const entries: any[] = []
    
    if (gateway?.completed_at) {
      entries.push({ id: 'gateway', date: gateway.completed_at, type: 'gateway', title: 'Completed Gateway Challenge', description: `Sent gratitude to: ${gateway.recipient_description}`, reward: { type: 'flower', amount: 1 } })
    }
    
    doNows?.forEach((d: any) => entries.push({ id: `donow-${d.lesson_id}`, date: d.completed_at, type: 'do_now', title: 'Completed Do Now', description: `Explored thoughts on ${d.lessons?.skill_name || 'leadership'}`, skill: d.lessons?.skill_name, reward: { type: 'flower', amount: 1 } }))
    scenarios?.forEach((s: any) => entries.push({ id: `scenario-${s.lesson_id}`, date: s.completed_at, type: 'scenario', title: 'Completed Scenario', description: `Applied ${s.lessons?.skill_name || 'skills'} to a real situation`, skill: s.lessons?.skill_name, reward: { type: 'tree', amount: 1 } }))
    challenges?.forEach((c: any) => entries.push({ id: `challenge-${c.submitted_at}`, date: c.submitted_at, type: 'challenge', title: c.challenges?.title || 'Completed Challenge', description: `Proved ${c.lessons?.skill_name || 'skills'} in real life`, skill: c.lessons?.skill_name, reward: { type: 'tower', amount: 1 } }))
    helpGiven?.forEach((h: any) => entries.push({ id: `help-given-${h.completed_at}`, date: h.completed_at, type: 'help_given', title: 'Helped a Classmate', description: h.title, reward: { type: 'bridge', amount: 1 } }))
    helpReceived?.forEach((h: any) => entries.push({ id: `help-received-${h.completed_at}`, date: h.completed_at, type: 'help_received', title: 'Received Help', description: h.title }))
    discoveries?.forEach((d: any) => entries.push({ id: `discovery-${d.created_at}`, date: d.created_at, type: 'discovery', title: `Shared: ${d.title}`, description: `Found leadership in ${d.source_type}`, skill: d.related_skills?.[0], reward: { type: 'flower', amount: 1 } }))
    teacherChallenges?.forEach((t: any) => entries.push({ id: `teacher-${t.submitted_at}`, date: t.submitted_at, type: 'teacher_challenge', title: t.teacher_challenges?.title || 'Completed Challenge', description: 'Responded to teacher challenge', skill: t.teacher_challenges?.related_skills?.[0], reward: { type: 'flower', amount: 1 } }))
    ripples?.forEach((r: any) => entries.push({ id: `ripple-${r.created_at}`, date: r.created_at, type: 'ripple', title: 'Started a Ripple', description: r.source_description, reward: { type: 'crystal', amount: 1 } }))
    
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const weeks: any[] = []
    let currentWeek: any = null
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.date)
      const weekStart = new Date(entryDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      
      if (!currentWeek || currentWeek.weekStart !== weekStartStr) {
        if (currentWeek) weeks.push(currentWeek)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        currentWeek = { weekStart: weekStartStr, weekEnd: weekEnd.toISOString().split('T')[0], entries: [], highlights: [] }
      }
      
      currentWeek.entries.push(entry)
      
      if (entry.reward) {
        const emoji = entry.reward.type === 'tree' ? '🌲' : entry.reward.type === 'flower' ? '🌸' : entry.reward.type === 'tower' ? '🏛️' : entry.reward.type === 'bridge' ? '🌉' : entry.reward.type === 'crystal' ? '💎' : '✨'
        if (!currentWeek.highlights.includes(emoji)) currentWeek.highlights.push(emoji)
      }
    })
    
    if (currentWeek) weeks.push(currentWeek)
    
    const uniqueDates = new Set(entries.map(e => new Date(e.date).toDateString()))
    const totalDaysActive = uniqueDates.size
    
    let longestStreak = 0, currentStreak = 0
    const sortedDates = Array.from(uniqueDates).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime())
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) { currentStreak = 1 }
      else {
        const diff = (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24)
        currentStreak = diff <= 1 ? currentStreak + 1 : 1
      }
      longestStreak = Math.max(longestStreak, currentStreak)
    }
    
    const skillsLearned = Array.from(new Set(entries.filter(e => e.skill).map(e => e.skill)))
    
    return NextResponse.json({ weeks: weeks.reverse(), totalDaysActive, longestStreak, totalRipples: ripples?.length || 0, skillsLearned })
    
  } catch (error) {
    console.error('[JOURNAL] GET error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to generate growth journal')
  }
}
