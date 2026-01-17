import { NextRequest, NextResponse } from 'next/server'
import { 
  getServerSupabase,
  validateUser, 
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

export async function POST(request: NextRequest) {
  try {
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }
    
    const rateLimit = checkRateLimit(`response:${auth.userId}`, RATE_LIMITS.write)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    let body
    try { body = await request.json() } catch { return badRequestResponse('Invalid JSON body') }
    
    const { challengeId, studentId, classId, responseText, personalConnection, shareWithClass } = body
    
    if (!validateUUID(challengeId) || !validateUUID(studentId) || !validateUUID(classId)) {
      return badRequestResponse('Invalid IDs')
    }
    if (!validateString(responseText, 5000)) {
      return badRequestResponse('Invalid responseText')
    }
    
    if (studentId !== auth.userId) {
      return forbiddenResponse('Cannot submit response for another user')
    }

    const supabase = getServerSupabase()
    
    // Use upsert with conflict handling to prevent race condition
    const { data, error } = await supabase
      .from('teacher_challenge_responses')
      .insert({
        challenge_id: challengeId,
        student_id: studentId,
        class_id: classId,
        response_text: responseText.slice(0, 5000),
        personal_connection: personalConnection?.slice(0, 2000),
        share_with_class: shareWithClass || false,
        reward_granted: true
      })
      .select()
      .single()
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already responded to this challenge' }, { status: 400 })
      }
      throw error
    }
    
    // Get challenge details and grant reward (fire and forget)
    ;(async () => {
      try {
        const { data: challenge } = await supabase.from('teacher_challenges').select('reward_type, reward_amount, title').eq('id', challengeId).single()
        if (challenge) {
          const rewardField = challenge.reward_type === 'flower' ? 'flowers' : challenge.reward_type === 'tree' ? 'trees' : challenge.reward_type === 'crystal' ? 'crystals' : 'flowers'
          await Promise.all([
            supabase.rpc('increment_world_resource', { p_student_id: studentId, p_resource: rewardField, p_amount: challenge.reward_amount || 1 }),
            supabase.rpc('add_to_feed', { p_class_id: classId, p_student_id: studentId, p_activity_type: 'teacher_challenge_complete', p_description: `Completed challenge: "${challenge.title}"`, p_related_id: challengeId, p_related_type: 'teacher_challenge' }),
            supabase.rpc('increment_response_count', { p_challenge_id: challengeId })
          ])
        }
      } catch (e) {
        console.error('[RESPONSE] Reward/feed failed:', e)
      }
    })()
    
    return NextResponse.json({ success: true, response: data })
    
  } catch (error) {
    console.error('[RESPONSE] POST error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to submit response')
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get('challengeId')
    const studentId = searchParams.get('studentId')
    const teacherView = searchParams.get('teacherView') === 'true'
    
    if (!challengeId || !validateUUID(challengeId)) {
      return badRequestResponse('Missing or invalid challengeId')
    }

    const supabase = getServerSupabase()
    
    if (teacherView) {
      if (auth.role !== 'teacher') {
        return forbiddenResponse('Only teachers can view all responses')
      }
      
      const { data: responses, error } = await supabase
        .from('teacher_challenge_responses')
        .select(`id, response_text, personal_connection, share_with_class, submitted_at, users!student_id (name, anonymous_name, is_unmasked)`)
        .eq('challenge_id', challengeId)
        .order('submitted_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return NextResponse.json({ responses })
    } else if (studentId) {
      if (studentId !== auth.userId && auth.role !== 'teacher') {
        return forbiddenResponse('Cannot view another student\'s response')
      }
      
      const { data: response } = await supabase
        .from('teacher_challenge_responses')
        .select('id, submitted_at')
        .eq('challenge_id', challengeId)
        .eq('student_id', studentId)
        .single()
      
      return NextResponse.json({ responded: !!response, response })
    }
    
    return badRequestResponse('Invalid request')
    
  } catch (error) {
    console.error('[RESPONSE] GET error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to fetch responses')
  }
}
