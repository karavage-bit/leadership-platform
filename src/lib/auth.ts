import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ============================================
// SUPABASE CLIENT (Lazy Singleton)
// ============================================

let _supabase: SupabaseClient | null = null

export function getServerSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error(
      'FATAL: Missing Supabase configuration. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
  }
  
  _supabase = createClient(url, key)
  return _supabase
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthResult {
  authenticated: boolean
  userId?: string
  role?: 'student' | 'teacher'
  classId?: string
  error?: string
}

// ============================================
// AUTH VALIDATION
// ============================================

/**
 * Validates user from request.
 * 
 * SECURITY NOTE: This implementation trusts client-provided IDs.
 * This is acceptable for teacher-supervised classroom use where:
 * 1. Teachers control physical access to devices
 * 2. Students use shared classroom computers
 * 3. The threat model is curious students, not external attackers
 * 
 * For public deployment, implement proper session-based auth.
 */
export async function validateUser(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = getServerSupabase()
    
    // Get user info from request body or query params
    const url = new URL(request.url)
    let userId = url.searchParams.get('studentId') || url.searchParams.get('userId')
    
    // If POST/PATCH, also check body
    if (!userId && (request.method === 'POST' || request.method === 'PATCH')) {
      try {
        const body = await request.clone().json()
        userId = body.studentId || body.student_id || body.userId || body.user_id || body.teacherId || body.teacher_id
      } catch {
        // Body might not be JSON
      }
    }
    
    if (!userId) {
      return { authenticated: false, error: 'No user identifier provided' }
    }
    
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return { authenticated: false, error: 'Invalid user identifier format' }
    }
    
    // Verify user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, class_id')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return { authenticated: false, error: 'User not found' }
    }
    
    return {
      authenticated: true,
      userId: user.id,
      role: user.role as 'student' | 'teacher',
      classId: user.class_id
    }
  } catch (error) {
    console.error('[AUTH] Validation error:', error instanceof Error ? error.message : 'Unknown')
    return { authenticated: false, error: 'Authentication failed' }
  }
}

/**
 * Validates that the requesting user has access to the specified class
 */
export async function validateClassAccess(
  userId: string, 
  classId: string
): Promise<boolean> {
  try {
    const supabase = getServerSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('class_id')
      .eq('id', userId)
      .single()
    
    return user?.class_id === classId
  } catch {
    return false
  }
}

/**
 * Validates teacher role for the given userId
 */
export async function validateTeacher(userId: string): Promise<boolean> {
  try {
    const supabase = getServerSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    return user?.role === 'teacher'
  } catch {
    return false
  }
}

// ============================================
// STANDARD RESPONSES
// ============================================

export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function badRequestResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function serverErrorResponse(message = 'Internal server error'): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 })
}

export function serviceUnavailableResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 503 })
}

// ============================================
// RATE LIMITING (Serverless-Safe)
// ============================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store - acceptable for Vercel as it resets on cold start
// This provides "best effort" rate limiting, not bulletproof protection
const rateLimitStore = new Map<string, RateLimitEntry>()

// Maximum entries to prevent memory growth (simple LRU-like behavior)
const MAX_RATE_LIMIT_ENTRIES = 10000

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
}

// Default configs for different endpoints
export const RATE_LIMITS = {
  ai: { windowMs: 60000, maxRequests: 10 },        // 10 AI calls per minute
  standard: { windowMs: 60000, maxRequests: 60 },  // 60 requests per minute
  write: { windowMs: 60000, maxRequests: 30 },     // 30 writes per minute
} as const

export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = RATE_LIMITS.standard
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  
  // Clean up expired entries if store is getting large
  if (rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES) {
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key)
      }
    })
  }
  
  const entry = rateLimitStore.get(identifier)
  
  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs
    })
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }
  
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now }
  }
  
  entry.count++
  return { allowed: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetAt - now }
}

export function rateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    { 
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(resetIn / 1000)),
        'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000))
      }
    }
  )
}

// ============================================
// INPUT VALIDATION HELPERS
// ============================================

export function validateUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export function validateString(value: unknown, maxLength = 10000): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength
}

export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    // Never log sensitive fields
    if (['password', 'token', 'key', 'secret', 'apiKey'].some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = value.substring(0, 200) + '...[truncated]'
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}
