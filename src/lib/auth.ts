import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ============================================
// SUPABASE CLIENTS
// ============================================

/**
 * Service role client - ONLY for server-only operations
 * NEVER use this for user-driven actions
 */
export function getServiceSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase service configuration')
  }
  
  return createClient(url, key)
}

/**
 * User-scoped Supabase client - uses JWT from request
 * This respects RLS policies and provides secure user context
 */
export function getUserSupabase(request: NextRequest): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  const authHeader = request.headers.get('Authorization')
  
  return createClient(url, anonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {}
    }
  })
}

// Backward compatibility alias
export const getServerSupabase = getServiceSupabase

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
// SECURE AUTH VALIDATION (JWT-based)
// ============================================

/**
 * Validates user from JWT session - SECURE
 * Extracts user ID from cryptographically verified token
 * NEVER trusts client-provided IDs
 */
export async function validateUser(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = getUserSupabase(request)
    
    // Get user from JWT - this is cryptographically verified
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { authenticated: false, error: 'Invalid or expired session' }
    }
    
    // Get additional user data (role, class)
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, role, class_id')
      .eq('id', user.id)
      .single()
    
    if (dbError || !userData) {
      return { authenticated: false, error: 'User profile not found' }
    }
    
    return {
      authenticated: true,
      userId: user.id, // Crypto-verified from JWT
      role: userData.role as 'student' | 'teacher',
      classId: userData.class_id
    }
  } catch (error) {
    console.error('[AUTH] Validation error:', error instanceof Error ? error.message : 'Unknown')
    return { authenticated: false, error: 'Authentication failed' }
  }
}

/**
 * Validates teacher role from session
 */
export async function validateTeacher(request: NextRequest): Promise<AuthResult> {
  const auth = await validateUser(request)
  
  if (!auth.authenticated) return auth
  
  if (auth.role !== 'teacher') {
    return { authenticated: false, error: 'Teacher access required' }
  }
  
  return auth
}

/**
 * Validates student role from session
 */
export async function validateStudent(request: NextRequest): Promise<AuthResult> {
  const auth = await validateUser(request)
  
  if (!auth.authenticated) return auth
  
  if (auth.role !== 'student') {
    return { authenticated: false, error: 'Student access required' }
  }
  
  return auth
}

/**
 * Validates that the authenticated user has access to the specified class
 */
export async function validateClassAccess(
  request: NextRequest, 
  classId: string
): Promise<AuthResult> {
  const auth = await validateUser(request)
  
  if (!auth.authenticated) return auth
  
  // Teachers can access classes they own
  if (auth.role === 'teacher') {
    const supabase = getUserSupabase(request)
    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('teacher_id', auth.userId)
      .single()
    
    if (!cls) {
      return { authenticated: false, error: 'Not authorized for this class' }
    }
  }
  // Students can only access their own class
  else if (auth.classId !== classId) {
    return { authenticated: false, error: 'Not authorized for this class' }
  }
  
  return auth
}

/**
 * Validates teacher access to a specific class they own
 */
export async function validateTeacherClassAccess(
  request: NextRequest,
  classId: string
): Promise<AuthResult> {
  const auth = await validateTeacher(request)
  
  if (!auth.authenticated) return auth
  
  const supabase = getUserSupabase(request)
  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', auth.userId)
    .single()
  
  if (!cls) {
    return { authenticated: false, error: 'Not authorized for this class' }
  }
  
  return { ...auth, classId }
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
// RATE LIMITING (Serverless-Safe with fallback)
// ============================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store - best effort for serverless
// TODO: Replace with Upstash Redis for production
const rateLimitStore = new Map<string, RateLimitEntry>()
const MAX_RATE_LIMIT_ENTRIES = 10000

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export const RATE_LIMITS = {
  ai: { windowMs: 60000, maxRequests: 10 },
  standard: { windowMs: 60000, maxRequests: 60 },
  write: { windowMs: 60000, maxRequests: 30 },
} as const

export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = RATE_LIMITS.standard
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  
  if (rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES) {
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetAt < now) rateLimitStore.delete(key)
    })
  }
  
  const entry = rateLimitStore.get(identifier)
  
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + config.windowMs })
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

export function validateString(value: unknown, maxLength = 5000): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= maxLength
}

export function validateStepType(value: unknown): value is 'do_now' | 'scenario' | 'challenge' | 'exit_ticket' {
  return typeof value === 'string' && ['do_now', 'scenario', 'challenge', 'exit_ticket'].includes(value)
}

export function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim()
}

export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
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
