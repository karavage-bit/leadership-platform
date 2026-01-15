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

// GET - Check gateway status for a student
export async function GET(request: NextRequest) {
  try {
    // Auth required
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId') || auth.userId
    
    if (!validateUUID(studentId)) {
      return badRequestResponse('Invalid studentId')
    }
    
    // Users can only check their own status (unless teacher)
    if (studentId !== auth.userId && auth.role !== 'teacher') {
      return forbiddenResponse('Cannot view another student\'s gateway status')
    }

    const supabase = getServerSupabase()
    
    // Check user's gateway status
    const { data: user, error } = await supabase
      .from('users')
      .select('gateway_complete, gateway_completed_at, tier_level')
      .eq('id', studentId)
      .single()
    
    if (error) throw error
    
    // Get gateway challenge details if exists
    const { data: challenge } = await supabase
      .from('gateway_challenges')
      .select('status, submitted_at, review_feedback')
      .eq('student_id', studentId)
      .single()
    
    return NextResponse.json({
      gatewayComplete: user?.gateway_complete || false,
      completedAt: user?.gateway_completed_at,
      tierLevel: user?.tier_level || 0,
      challengeStatus: challenge?.status,
      submittedAt: challenge?.submitted_at,
      feedback: challenge?.review_feedback
    })
    
  } catch (error) {
    console.error('[GATEWAY] GET error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to check gateway status')
  }
}

// POST - Submit gateway challenge
export async function POST(request: NextRequest) {
  try {
    // Auth required
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }
    
    // Rate limit
    const rateLimit = checkRateLimit(`gateway:${auth.userId}`, RATE_LIMITS.write)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return badRequestResponse('Invalid JSON body')
    }
    
    const { 
      studentId,
      recipientDescription,
      messageType,
      messagePreview,
      proofUrl,
      reflection
    } = body
    
    // Validate required fields
    if (!validateUUID(studentId)) {
      return badRequestResponse('Invalid studentId')
    }
    if (!validateString(recipientDescription, 500) || !validateString(messageType, 50)) {
      return badRequestResponse('Invalid recipientDescription or messageType')
    }
    if (!validateString(reflection, 2000)) {
      return badRequestResponse('Invalid reflection')
    }
    
    // Users can only submit for themselves
    if (studentId !== auth.userId) {
      return forbiddenResponse('Cannot submit gateway challenge for another user')
    }

    const supabase = getServerSupabase()
    
    // Check if already submitted
    const { data: existing } = await supabase
      .from('gateway_challenges')
      .select('id, status')
      .eq('student_id', studentId)
      .single()
    
    if (existing) {
      return NextResponse.json({ 
        error: 'Gateway challenge already submitted',
        status: existing.status
      }, { status: 400 })
    }
    
    // Create gateway challenge
    const { data, error } = await supabase
      .from('gateway_challenges')
      .insert({
        student_id: studentId,
        challenge_type: 'gratitude',
        recipient_description: recipientDescription.slice(0, 500),
        message_type: messageType.slice(0, 50),
        message_preview: messagePreview?.slice(0, 1000),
        proof_url: proofUrl?.slice(0, 500),
        reflection: reflection.slice(0, 2000),
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      challenge: data,
      message: 'Gateway challenge submitted for review'
    })
    
  } catch (error) {
    console.error('[GATEWAY] POST error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to submit gateway challenge')
  }
}

// PATCH - Approve/reject gateway challenge (teachers only)
export async function PATCH(request: NextRequest) {
  try {
    // Auth required
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }
    
    // Must be a teacher
    if (auth.role !== 'teacher') {
      return forbiddenResponse('Only teachers can review gateway challenges')
    }

    let body
    try {
      body = await request.json()
    } catch {
      return badRequestResponse('Invalid JSON body')
    }
    
    const { 
      challengeId,
      teacherId,
      status,
      feedback
    } = body
    
    // Validate
    if (!validateUUID(challengeId)) {
      return badRequestResponse('Invalid challengeId')
    }
    if (!['approved', 'needs_revision'].includes(status)) {
      return badRequestResponse('Invalid status')
    }
    
    // Teacher must be acting as themselves
    if (teacherId && teacherId !== auth.userId) {
      return forbiddenResponse('Cannot approve as another teacher')
    }

    const supabase = getServerSupabase()
    
    // Update challenge status
    const { data: challenge, error } = await supabase
      .from('gateway_challenges')
      .update({
        status,
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
        review_feedback: feedback?.slice(0, 1000),
        completed_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', challengeId)
      .select('student_id')
      .single()
    
    if (error) throw error
    
    // If approved, update user's gateway status and tier
    if (status === 'approved' && challenge) {
      // Update user
      const { error: userError } = await supabase
        .from('users')
        .update({
          gateway_complete: true,
          gateway_completed_at: new Date().toISOString(),
          tier_level: 1
        })
        .eq('id', challenge.student_id)
      
      if (userError) {
        console.error('[GATEWAY] User update failed:', userError.message)
      }
      
      // Create initial world state (upsert to be safe)
      try {
        await supabase
          .from('world_states')
          .upsert({
            student_id: challenge.student_id,
            trees: 0,
            flowers: 1,
            stones: 0,
            crystals: 0,
            tower: 0,
            bridge: 0
          }, { onConflict: 'student_id' })
      } catch (e) {
        console.error('[GATEWAY] World state upsert failed:', e)
      }
      
      // Get class_id for feed (fire and forget)
      ;(async () => {
        try {
          const { data: student } = await supabase
            .from('users')
            .select('class_id')
            .eq('id', challenge.student_id)
            .single()
          
          if (student?.class_id) {
            await supabase.rpc('add_to_feed', {
              p_class_id: student.class_id,
              p_student_id: challenge.student_id,
              p_activity_type: 'gateway_complete',
              p_description: 'Completed the Gateway Challenge and entered their world',
              p_related_id: challengeId,
              p_related_type: 'gateway'
            })
          }
        } catch (e) {
          console.error('[GATEWAY] Feed insert failed:', e)
        }
      })()
      
      // Add discovered secret (fire and forget)
      ;(async () => {
        try {
          await supabase
            .from('discovered_secrets')
            .insert({
              student_id: challenge.student_id,
              secret_type: 'memory_stone',
              secret_name: 'Memory Stone'
            })
        } catch (e) {
          console.error('[GATEWAY] Secret insert failed:', e)
        }
      })()
    }
    
    return NextResponse.json({ 
      success: true, 
      status,
      message: status === 'approved' 
        ? 'Gateway approved! Student world unlocked.' 
        : 'Revision requested'
    })
    
  } catch (error) {
    console.error('[GATEWAY] PATCH error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to review gateway challenge')
  }
}
