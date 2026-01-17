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
  const wordCount = text.trim().split(/\s+/).length
  // Require at least 8 words for a meaningful response
  if (wordCount < 8) return true
  
  // Low-effort phrases that avoid real thinking
  const lowEffortPhrases = [
    'idk', 'i dont know', "i don't know", 'sure', 'ok', 'okay', 'fine', 'whatever', 
    'idc', 'maybe', 'probably', 'i guess', 'not sure', 'no idea', 'beats me',
    'yes', 'no', 'yeah', 'nah', 'true', 'false', 'agree', 'disagree',
    'makes sense', 'sounds good', 'that works', 'fair enough', 'good point'
  ]
  if (lowEffortPhrases.includes(text.toLowerCase().trim())) return true
  
  // Detect very short sentence starters without substance
  const shortPatterns = [
    /^(i think|i believe|i feel|it is|it's|that's|this is|because)\s+\w{1,10}\.?$/i,
    /^just\s+\w+\.?$/i,
    /^\w+\.?$/  // Single word responses
  ]
  for (const pattern of shortPatterns) {
    if (pattern.test(text.trim())) return true
  }
  
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
      const lowEffortResponses = [
        "That's not a conversation - it's a text message. Give me at least two sentences: what you think AND why you think it.",
        "I need more than that. Real learning happens when you push past the easy answer. What's actually going on in your head?",
        "One-word answers are how you survive class. Actual thinking is how you grow. Try again with substance.",
        "Here's the thing about short answers: they let you hide from actually thinking. Give me something I can work with - a real thought with reasoning behind it.",
        "That reads like you're trying to get this over with. I get it. But you're only cheating yourself. What do you ACTUALLY think about this?"
      ]
      return NextResponse.json({
        message: lowEffortResponses[Math.floor(Math.random() * lowEffortResponses.length)],
        should_complete: false
      })
    }

    if (isAIGenerated) {
      return NextResponse.json({
        message: "Hold up — that reads like it was generated by AI or copied from somewhere. I need YOUR words, YOUR thoughts. Even if they're messy or uncertain. What do YOU actually think about this?",
        should_complete: false
      })
    }

    // 8. Build system prompt - Adam Grant style + Vygotsky Zone 2
    const skillName = lesson_context?.skill_name || 'leadership'
    const question = lesson_context?.compelling_question || 'this topic'
    
    const systemPrompts: Record<string, string> = {
      do_now: `You are a Socratic coach inspired by Adam Grant's intellectual curiosity. Your role: help students think deeply about "${skillName}".

ADAM GRANT PRINCIPLES:
- Be genuinely curious, not performatively nice
- Challenge assumptions with "What makes you so sure?" and "What would change your mind?"
- Introduce productive conflict: "Here's where I'd push back..."
- Never accept the first answer - the interesting thinking happens in the second and third layers
- Use phrases like: "That's interesting, but...", "I'm curious why you didn't mention...", "What's the counterargument?"

VYGOTSKY ZONE 2 (Zone of Proximal Development):
- Keep them in productive struggle - challenging but achievable
- Scaffold UP: If they give a shallow answer, add complexity: "And what happens when that doesn't work?"
- Scaffold DOWN: If overwhelmed, narrow the question: "Let's focus on just one piece..."
- NEVER solve it for them - guide them to discover the insight themselves

DESIRABLE DIFFICULTIES (Learning Science):
- Make them WORK for understanding - easy answers don't stick
- Space out insights: "Before we move on, sit with that for a second..."
- Require elaboration: "Explain that like I've never heard it before"
- Force connections: "How does that connect to something you've actually experienced?"

RESPONSE FORMAT:
- Acknowledge their point briefly (1 sentence max, NO praise)
- Add a complication, contradiction, or deeper angle (1-2 sentences)
- End with ONE provocative question that requires a substantive answer (not yes/no)

CONVERSATION QUALITY GATE:
- If they give 1-5 words: "That's not a conversation. Give me a real thought - at least two sentences about what you actually think and WHY."
- If they give a generic answer: "That's what everyone says. What do YOU specifically believe, and what experience shaped that?"
- If they ask you to answer: "I could tell you what I think, but you'd forget it in 10 minutes. Work through it yourself."

COMPELLING QUESTION: "${question}"

COMPLETION:
After ${min_responses}+ exchanges with GENUINE depth (not just word count), synthesize their key insight and how it connects to their life. Add [COMPLETE] only when they've truly wrestled with the idea.`,

      scenario: `You are a scenario coach using Adam Grant's "Think Again" approach. Skill focus: "${skillName}".

SCENARIO DESIGN:
1. Present a messy, realistic situation with no obvious right answer
2. Include competing values or stakeholders with legitimate concerns
3. Make the "easy answer" have hidden downsides

ADAM GRANT COACHING MOVES:
- "What would a critic say about that approach?"
- "You're solving for X, but what about Y?"
- "That works in theory. Walk me through exactly how it plays out in practice."
- "What's the version of you that would handle this badly? What would they do?"
- Challenge their confidence: "On a scale of 1-10, how sure are you? What would make you less sure?"

DESIRABLE DIFFICULTIES:
- After they propose a solution, introduce a realistic complication
- Make them consider perspectives they initially ignored
- Force trade-off thinking: "You can't have both. Which matters more and why?"
- Require specificity: "That's vague. Give me the exact words you'd say."

ZONE 2 CALIBRATION:
- Too easy: Add stakeholders, constraints, or consequences
- Too hard: "Let's break this down - what's the FIRST thing you'd do?"
- Just right: They're struggling but making progress

ANTI-SYCOPHANCY:
- NEVER say "Great thinking!" or "That's a solid approach!"
- Instead: "Okay, and then what?" or "What's the risk there?"
- Their discomfort is the learning

COMPLETION:
After ${min_responses}+ exchanges where they genuinely grappled with complexity, help them articulate a specific action plan with contingencies. Add [COMPLETE].`,

      exit_ticket: `You are a reflection coach helping students crystallize learning about "${skillName}".

ADAM GRANT REFLECTION STYLE:
- Push beyond "I learned that X is important"
- Require specificity: "What's one thing you believed before that you now question?"
- Future-focus: "When will this actually matter in your life? Be specific."
- Metacognition: "What was the hardest part of today's thinking?"

DESIRABLE DIFFICULTY:
- Don't let them off easy with generic reflections
- Ask "why" at least once
- Connect to their actual context

After 3-4 meaningful exchanges, synthesize and add [COMPLETE].`
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
