import { NextRequest, NextResponse } from 'next/server'
import { 
  getServerSupabase,
  validateUser, 
  validateClassAccess,
  unauthorizedResponse, 
  forbiddenResponse,
  badRequestResponse,
  serverErrorResponse,
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  validateUUID,
  validateString
} from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId') || auth.userId
    
    if (!classId || !validateUUID(classId)) {
      return badRequestResponse('Missing or invalid classId')
    }
    
    const hasAccess = await validateClassAccess(auth.userId, classId)
    if (!hasAccess) {
      return forbiddenResponse('You do not have access to this class')
    }

    const supabase = getServerSupabase()
    
    const { data: challenges, error } = await supabase
      .from('teacher_challenges')
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .or(`available_until.is.null,available_until.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    
    let completedIds: string[] = []
    if (studentId && validateUUID(studentId)) {
      const { data: responses } = await supabase
        .from('teacher_challenge_responses')
        .select('challenge_id')
        .eq('student_id', studentId)
      completedIds = responses?.map(r => r.challenge_id) || []
    }
    
    const formatted = challenges?.map(c => ({
      id: c.id,
      title: c.title,
      type: c.challenge_type,
      contentUrl: c.content_url,
      contentDescription: c.content_description,
      prompt: c.prompt,
      relatedSkills: c.related_skills || [],
      rewardType: c.reward_type,
      rewardAmount: c.reward_amount,
      dueDate: c.available_until,
      completed: completedIds.includes(c.id)
    })) || []
    
    return NextResponse.json({ challenges: formatted })
    
  } catch (error) {
    console.error('[CHALLENGES] GET error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to fetch challenges')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }
    
    if (auth.role !== 'teacher') {
      return forbiddenResponse('Only teachers can create challenges')
    }
    
    const rateLimit = checkRateLimit(`challenge:${auth.userId}`, RATE_LIMITS.write)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    let body
    try { body = await request.json() } catch { return badRequestResponse('Invalid JSON body') }
    
    const { teacherId, classId, title, challengeType, contentUrl, contentDescription, prompt, relatedSkills, availableUntil, rewardType, rewardAmount } = body
    
    if (!validateUUID(classId) || !validateString(title, 200) || !validateString(challengeType, 50) || !validateString(prompt, 2000)) {
      return badRequestResponse('Missing or invalid required fields')
    }
    
    if (teacherId && teacherId !== auth.userId) {
      return forbiddenResponse('Cannot create challenges as another teacher')
    }

    const supabase = getServerSupabase()
    
    const { data, error } = await supabase
      .from('teacher_challenges')
      .insert({
        teacher_id: auth.userId,
        class_id: classId,
        title: title.slice(0, 200),
        challenge_type: challengeType.slice(0, 50),
        content_url: contentUrl?.slice(0, 500),
        content_description: contentDescription?.slice(0, 1000),
        prompt: prompt.slice(0, 2000),
        related_skills: Array.isArray(relatedSkills) ? relatedSkills.slice(0, 10) : [],
        available_until: availableUntil,
        reward_type: rewardType || 'flower',
        reward_amount: Math.min(rewardAmount || 1, 10)
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, challenge: data })
    
  } catch (error) {
    console.error('[CHALLENGES] POST error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to create challenge')
  }
}
