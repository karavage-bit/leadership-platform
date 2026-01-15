import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { 
  getServerSupabase, 
  validateUser, 
  unauthorizedResponse,
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  validateUUID,
  validateString,
  serverErrorResponse,
  serviceUnavailableResponse
} from '@/lib/auth'

// Lazy-init Anthropic client
let anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic | null {
  if (anthropic) return anthropic
  
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[SOCRATIC] ANTHROPIC_API_KEY not configured')
    return null
  }
  
  anthropic = new Anthropic({ apiKey })
  return anthropic
}

// Crisis detection patterns
const CRISIS_PATTERNS = {
  self_harm: [
    /\b(kill myself|want to die|end it all|suicide|self.?harm|hurt myself|cutting)\b/i,
    /\b(no point in living|better off dead|don't want to be here|disappear forever)\b/i
  ],
  helplessness: [
    /\b(no hope|hopeless|can't go on|give up on everything|nothing matters)\b/i,
    /\b(no one cares|completely alone|nobody would notice)\b/i
  ],
  rage: [
    /\b(kill (them|him|her|someone)|hurt (them|him|her|someone)|violent thoughts)\b/i,
    /\b(want to destroy|burn it down|make them pay)\b/i
  ],
  abuse: [
    /\b(being hit|beats me|touches me|abuse|molest|assault)\b/i,
    /\b(scared to go home|parents hurt me|forced to)\b/i
  ]
}

function detectCrisis(text: string): { detected: boolean; type: string | null; trigger: string | null } {
  for (const [type, patterns] of Object.entries(CRISIS_PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return { detected: true, type, trigger: match[0] }
      }
    }
  }
  return { detected: false, type: null, trigger: null }
}

// AI-generated text detection patterns
const AI_PATTERNS = [
  /\b(as an AI|I cannot|I'm designed to)\b/i,
  /\b(certainly|absolutely|definitely|obviously)\b.*\b(important|crucial|vital)\b/i,
  /\b(firstly|secondly|thirdly|in conclusion|to summarize)\b/i,
  /it's (important|crucial|essential) to (note|remember|understand)/i,
]

function detectLowEffort(text: string): boolean {
  if (text.trim().split(/\s+/).length < 5) return true
  const lowEffortPhrases = ['idk', 'i dont know', 'sure', 'ok', 'okay', 'fine', 'whatever', 'idc', 'maybe', 'probably', 'i guess']
  if (lowEffortPhrases.includes(text.toLowerCase().trim())) return true
  return false
}

function detectAIGenerated(text: string): boolean {
  for (const pattern of AI_PATTERNS) {
    if (pattern.test(text)) return true
  }
  return false
}

// Maximum lengths for inputs
const MAX_MESSAGE_LENGTH = 5000
const MAX_HISTORY_LENGTH = 20

export async function POST(request: NextRequest) {
  // 1. Get AI client
  const client = getAnthropicClient()
  if (!client) {
    return serviceUnavailableResponse('AI service not configured. Please contact your teacher.')
  }

  try {
    // 2. Validate user
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }

    // 3. Rate limiting
    const rateLimit = checkRateLimit(`ai:${auth.userId}`, RATE_LIMITS.ai)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    // 4. Parse and validate body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      type,
      lesson_id,
      student_id,
      class_id,
      conversation_history,
      user_message,
      lesson_context,
      response_count,
      min_responses
    } = body

    // 5. Validate required fields
    if (!validateUUID(student_id)) {
      return NextResponse.json({ error: 'Invalid student_id' }, { status: 400 })
    }
    if (!validateUUID(class_id)) {
      return NextResponse.json({ error: 'Invalid class_id' }, { status: 400 })
    }
    if (!validateString(user_message, MAX_MESSAGE_LENGTH)) {
      return NextResponse.json({ error: 'Invalid or too long message' }, { status: 400 })
    }
    if (!Array.isArray(conversation_history) || conversation_history.length > MAX_HISTORY_LENGTH) {
      return NextResponse.json({ error: 'Invalid conversation history' }, { status: 400 })
    }
    if (typeof response_count !== 'number' || response_count < 0 || response_count > 100) {
      return NextResponse.json({ error: 'Invalid response_count' }, { status: 400 })
    }
    if (typeof min_responses !== 'number' || min_responses < 1 || min_responses > 20) {
      return NextResponse.json({ error: 'Invalid min_responses' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // 6. Check for crisis first
    const crisis = detectCrisis(user_message)
    if (crisis.detected) {
      // Log crisis alert (fire and forget, don't fail if this errors)
      ;(async () => {
        try {
          await supabase.from('crisis_alerts').insert({
            student_id,
            class_id,
            lesson_id,
            trigger_type: crisis.type,
            trigger_text: crisis.trigger,
            conversation_context: conversation_history.slice(-5),
            status: 'unread'
          })
        } catch (e) {
          console.error('[SOCRATIC] Crisis alert insert failed:', e)
        }
      })()

      return NextResponse.json({
        message: `I need to pause here. What you just shared sounds really difficult, and I want you to know that you're not alone. 

Please talk to your teacher, school counselor, or another trusted adult about what you're going through. They want to help.

If you're in crisis right now, please text HOME to 741741 (Crisis Text Line) or call 988 (Suicide & Crisis Lifeline).

We can continue our conversation after you've had a chance to talk to someone. You matter. 💙`,
        crisis_detected: true,
        should_complete: false
      })
    }

    // 7. Check for low-effort / AI-generated responses
    const isLowEffort = detectLowEffort(user_message)
    const isAIGenerated = detectAIGenerated(user_message)

    if (isLowEffort && response_count < min_responses) {
      return NextResponse.json({
        message: "That's not enough for me to work with. I need at least a full sentence with your actual thoughts. What are you really thinking?",
        should_complete: false
      })
    }

    if (isAIGenerated) {
      return NextResponse.json({
        message: "Hold up — that reads like it was generated by AI or copied from somewhere. I need YOUR words, YOUR thoughts. Even if they're messy or uncertain. What do YOU actually think about this?",
        should_complete: false
      })
    }

    // 8. Build system prompt
    const skillName = lesson_context?.skill_name || 'leadership'
    const question = lesson_context?.compelling_question || 'this topic'
    
    const systemPrompts: Record<string, string> = {
      do_now: `You are a Socratic guide for a high school leadership class. Your role is to help students think deeply about today's skill: "${skillName}".

CORE PRINCIPLES (Anti-Sycophancy):
- NEVER say "Great job!" "That's perfect!" "Exactly right!" or similar praise
- NEVER accept surface-level answers - always push for depth
- Use the Socratic method: ask questions that reveal assumptions and require deeper thinking
- Keep students in Zone 2 (productive struggle) - not too easy, not overwhelming
- If the student gives a generic answer, push back: "That sounds like what you think I want to hear. What do YOU actually think?"

YOUR GOAL:
- Help them genuinely wrestle with the question: "${question}"
- Get them thinking about how this skill shows up in THEIR life
- After ${min_responses} meaningful exchanges, summarize what they discovered and wrap up

RESPONSE STYLE:
- Brief and conversational (2-4 sentences max)
- Ask ONE focused question at a time
- Reference what they said specifically
- Gently challenge without being harsh

COMPLETION:
After ${min_responses}+ genuine exchanges where the student showed real thinking, you can close with a brief synthesis of what they explored. Add [COMPLETE] at the end of your message when ready to wrap up.`,

      scenario: `You are a Socratic coach presenting a real-life scenario that requires the skill: "${skillName}".

THE SCENARIO APPROACH:
1. First exchange: Present a realistic, relatable situation relevant to high school students
2. Ask: "What would you do?" or "How would you handle this?"
3. Whatever they say: Push back with complications, consequences, or "What if..." challenges
4. Make them justify their choices and consider alternatives
5. After ${min_responses}+ exchanges with genuine struggle, help them articulate a plan

ANTI-SYCOPHANCY RULES:
- NEVER accept easy answers
- NEVER say "That's a great approach!" - instead say "And what happens when..."
- Challenge every decision with realistic complications
- If they give a textbook answer, say: "That's what you'd tell a teacher. What would you ACTUALLY do?"

ZONE 2 MANAGEMENT:
- Push them to think harder, but watch for frustration
- If they seem overwhelmed, acknowledge the difficulty but don't solve it for them
- Goal: They should feel like they figured something out on their own

COMPLETION:
After substantive exchanges, help them crystallize what they learned into an action plan. Add [COMPLETE] at the end.`,

      exit_ticket: `You are a reflective guide helping a student process what they learned about "${skillName}".

YOUR ROLE:
- Help them identify ONE concrete takeaway
- Connect the lesson to their real life
- Keep it brief - this is end-of-class reflection

APPROACH:
- Ask what stuck with them
- Ask how they might apply it
- After 3-4 exchanges, summarize and close

Add [COMPLETE] when finished.`
    }

    const systemPrompt = systemPrompts[type] || systemPrompts.do_now

    // 9. Sanitize conversation history
    const messages: Array<{role: 'user' | 'assistant', content: string}> = conversation_history
      .filter((msg: any) => msg && typeof msg.role === 'string' && typeof msg.content === 'string')
      .map((msg: any) => ({
        role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: String(msg.content).slice(0, MAX_MESSAGE_LENGTH)
      }))

    messages.push({ role: 'user', content: user_message })

    // 10. Call Anthropic with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)
    
    let response
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages
      }, {
        signal: controller.signal
      })
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return NextResponse.json({
          message: "I'm thinking hard about this one! The response is taking longer than usual. Please try again.",
          should_complete: false
        })
      }
      console.error('[SOCRATIC] Anthropic API error:', err.message || 'Unknown')
      return serverErrorResponse('AI service temporarily unavailable. Please try again.')
    } finally {
      clearTimeout(timeoutId)
    }

    const assistantMessage = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    const shouldComplete = assistantMessage.includes('[COMPLETE]') && response_count >= min_responses - 1
    const cleanMessage = assistantMessage.replace('[COMPLETE]', '').trim()

    // 11. Track AI usage (fire and forget, use upsert to avoid race condition)
    const today = new Date().toISOString().split('T')[0]
    ;(async () => {
      try {
        await supabase.rpc('increment_ai_usage', { 
          p_student_id: student_id, 
          p_date: today 
        })
      } catch (e) {
        console.error('[SOCRATIC] Usage tracking failed:', e)
      }
    })()

    return NextResponse.json({
      message: cleanMessage,
      should_complete: shouldComplete,
      response_count: response_count + 1
    })

  } catch (error: any) {
    console.error('[SOCRATIC] Unexpected error:', error.message || 'Unknown')
    return serverErrorResponse('An unexpected error occurred. Please try again.')
  }
}
