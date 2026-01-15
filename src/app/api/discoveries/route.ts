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

// GET - Fetch discoveries for a class
export async function GET(request: NextRequest) {
  try {
    // Auth required
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId') || auth.userId
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    
    if (!classId || !validateUUID(classId)) {
      return badRequestResponse('Missing or invalid classId')
    }
    
    // Verify user has access to this class
    const hasAccess = await validateClassAccess(auth.userId, classId)
    if (!hasAccess) {
      return forbiddenResponse('You do not have access to this class')
    }

    const supabase = getServerSupabase()
    
    const { data: discoveries, error } = await supabase
      .from('student_discoveries')
      .select(`
        id,
        student_id,
        title,
        source_type,
        source_name,
        content_url,
        description,
        leadership_connection,
        related_skills,
        image_url,
        helpful_count,
        comment_count,
        show_author,
        created_at,
        users!student_id (
          name,
          anonymous_name,
          is_unmasked
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    // Get user's votes
    let votedIds: string[] = []
    if (studentId) {
      const { data: votes } = await supabase
        .from('discovery_helpful')
        .select('discovery_id')
        .eq('student_id', studentId)
      votedIds = votes?.map(v => v.discovery_id) || []
    }
    
    // Format response
    const formatted = discoveries?.map(d => ({
      id: d.id,
      authorName: d.show_author && (d.users as any)?.is_unmasked 
        ? (d.users as any)?.name 
        : (d.users as any)?.anonymous_name || 'Anonymous',
      isUnmasked: d.show_author && (d.users as any)?.is_unmasked,
      title: d.title,
      sourceType: d.source_type,
      sourceName: d.source_name,
      contentUrl: d.content_url,
      description: d.description,
      leadershipConnection: d.leadership_connection,
      relatedSkills: d.related_skills || [],
      imageUrl: d.image_url,
      helpfulCount: d.helpful_count || 0,
      commentCount: d.comment_count || 0,
      hasVoted: votedIds.includes(d.id),
      createdAt: d.created_at
    })) || []
    
    return NextResponse.json({ discoveries: formatted })
    
  } catch (error) {
    console.error('[DISCOVERIES] GET error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to fetch discoveries')
  }
}

// POST - Create a new discovery
export async function POST(request: NextRequest) {
  try {
    // Validate user
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }
    
    // Rate limit
    const rateLimit = checkRateLimit(`discovery:${auth.userId}`, RATE_LIMITS.write)
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
      classId, 
      title, 
      sourceType, 
      sourceName, 
      contentUrl, 
      description, 
      leadershipConnection, 
      relatedSkills,
      imageUrl 
    } = body
    
    // Validate required fields
    if (!validateUUID(studentId) || !validateUUID(classId)) {
      return badRequestResponse('Invalid studentId or classId')
    }
    if (!validateString(title, 200) || !validateString(sourceType, 50)) {
      return badRequestResponse('Invalid title or sourceType')
    }
    if (!validateString(description, 2000) || !validateString(leadershipConnection, 1000)) {
      return badRequestResponse('Invalid description or leadershipConnection')
    }
    
    // Verify the user is creating for themselves
    if (studentId !== auth.userId) {
      return forbiddenResponse('Cannot create discovery for another user')
    }
    
    // Verify class access
    const hasAccess = await validateClassAccess(auth.userId, classId)
    if (!hasAccess) {
      return forbiddenResponse('You do not have access to this class')
    }

    const supabase = getServerSupabase()
    
    const { data, error } = await supabase
      .from('student_discoveries')
      .insert({
        student_id: studentId,
        class_id: classId,
        title: title.slice(0, 200),
        source_type: sourceType.slice(0, 50),
        source_name: sourceName?.slice(0, 200),
        content_url: contentUrl?.slice(0, 500),
        description: description.slice(0, 2000),
        leadership_connection: leadershipConnection.slice(0, 1000),
        related_skills: Array.isArray(relatedSkills) ? relatedSkills.slice(0, 10) : [],
        image_url: imageUrl?.slice(0, 500),
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Add to activity feed (fire and forget)
    ;(async () => {
      try {
        await supabase.rpc('add_to_feed', {
          p_class_id: classId,
          p_student_id: studentId,
          p_activity_type: 'discovery_posted',
          p_description: `Shared a discovery: "${title.slice(0, 50)}"`,
          p_related_id: data.id,
          p_related_type: 'discovery'
        })
      } catch (e) {
        console.error('[DISCOVERIES] Feed insert failed:', e)
      }
    })()
    
    return NextResponse.json({ 
      success: true, 
      discovery: data,
      message: 'Discovery submitted for review'
    })
    
  } catch (error) {
    console.error('[DISCOVERIES] POST error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to create discovery')
  }
}

// PATCH - Vote on a discovery
export async function PATCH(request: NextRequest) {
  try {
    // Validate user
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }
    
    // Rate limit
    const rateLimit = checkRateLimit(`vote:${auth.userId}`, RATE_LIMITS.write)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return badRequestResponse('Invalid JSON body')
    }
    
    const { discoveryId, studentId, action } = body
    
    if (!validateUUID(discoveryId) || !validateUUID(studentId)) {
      return badRequestResponse('Invalid discoveryId or studentId')
    }
    if (action !== 'vote') {
      return badRequestResponse('Invalid action')
    }
    
    // Verify the user is voting as themselves
    if (studentId !== auth.userId) {
      return forbiddenResponse('Cannot vote on behalf of another user')
    }

    const supabase = getServerSupabase()
    
    if (action === 'vote') {
      // Use upsert/delete pattern to avoid race condition
      // First try to delete (if vote exists)
      const { data: deleted, error: deleteError } = await supabase
        .from('discovery_helpful')
        .delete()
        .eq('discovery_id', discoveryId)
        .eq('student_id', studentId)
        .select()
      
      if (deleteError) throw deleteError
      
      if (deleted && deleted.length > 0) {
        // Vote was removed
        await supabase.rpc('decrement_discovery_helpful', { p_discovery_id: discoveryId })
        return NextResponse.json({ voted: false })
      } else {
        // No vote existed, add one
        const { error: insertError } = await supabase
          .from('discovery_helpful')
          .insert({ discovery_id: discoveryId, student_id: studentId })
        
        if (insertError) {
          // Handle race condition - vote may have been added by concurrent request
          if (insertError.code === '23505') { // Unique violation
            return NextResponse.json({ voted: true })
          }
          throw insertError
        }
        
        await supabase.rpc('increment_discovery_helpful', { p_discovery_id: discoveryId })
        return NextResponse.json({ voted: true })
      }
    }
    
    return badRequestResponse('Invalid action')
    
  } catch (error) {
    console.error('[DISCOVERIES] PATCH error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to update discovery')
  }
}
