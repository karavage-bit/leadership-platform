import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { validateUser, unauthorizedResponse, checkRateLimit, rateLimitResponse, RATE_LIMITS, serverErrorResponse } from '@/lib/auth'

// Lazy-init Anthropic client
let anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic | null {
  if (anthropic) return anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  anthropic = new Anthropic({ apiKey })
  return anthropic
}

export async function POST(request: NextRequest) {
  const client = getAnthropicClient()
  if (!client) {
    return NextResponse.json(
      { error: 'AI service not configured. Please contact your teacher.' },
      { status: 503 }
    )
  }

  try {
    // Validate user
    const auth = await validateUser(request)
    if (!auth.authenticated || !auth.userId) {
      return unauthorizedResponse(auth.error)
    }
    
    // Rate limit
    const rateLimit = checkRateLimit(`brainstorm:${auth.userId}`, RATE_LIMITS.ai)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }
    
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    
    const { sessionType, messages, studentSkills, studentContext } = body
    
    if (!sessionType || !messages) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const systemPrompts: Record<string, string> = {
      show_skill: `You are a Socratic brainstorming partner helping a high school student find creative ways to demonstrate a skill they've learned. 
        
Your approach:
- Never give direct answers - ask questions that help them discover ideas
- Connect their interests to the skill they want to demonstrate
- Push them to think about WHO would benefit and WHY it matters
- Help them find ideas that are achievable this week, not "someday"
- Focus on real-world application, not just academic proof

Student skills: ${studentSkills?.join(', ') || 'various leadership skills'}
${studentContext ? `Context: ${studentContext}` : ''}

Keep responses concise (2-3 sentences max). Always end with a question.`,

      combine_skills: `You are a Socratic brainstorming partner helping a high school student create a project that combines multiple skills.

Your approach:
- Help them find the "thread" that connects different skills
- Ask about their passions outside of class
- Push for concrete, actionable projects (not vague ideas)
- Encourage them to think about impact, not just completion

Student skills: ${studentSkills?.join(', ') || 'various leadership skills'}
${studentContext ? `Context: ${studentContext}` : ''}

Keep responses concise. Always end with a question.`,

      give_back: `You are a Socratic brainstorming partner helping a high school student find meaningful ways to give back to their community.

Your approach:
- Help them identify problems they personally care about
- Ask what UNIQUE perspective or skill they bring
- Push them beyond one-time charity to sustainable impact
- Connect giving back to their personal growth

Student skills: ${studentSkills?.join(', ') || 'various leadership skills'}
${studentContext ? `Context: ${studentContext}` : ''}

Keep responses concise. Always end with a question.`,

      start_ripple: `You are a Socratic brainstorming partner helping a high school student create a "ripple" - an action that inspires others to pay it forward.

Your approach:
- Good ripples are: easy to start, meaningful to receive, inspiring to pass on
- Ask how their action could multiply beyond the first person
- Push them to think systemically, not just individually
- Help them see how small actions can have exponential impact

Student skills: ${studentSkills?.join(', ') || 'various leadership skills'}
${studentContext ? `Context: ${studentContext}` : ''}

Keep responses concise. Always end with a question.`,

      group_tier_up: `You are a Socratic facilitator helping a group of high school students plan a collaborative project to "tier up" their connected worlds.

Your approach:
- Help them find the intersection of their different passions
- Push for clear role division (everyone leads something)
- Focus on projects that require teamwork, not just parallel work
- Guide them toward community impact, not just personal benefit

Student skills: ${studentSkills?.join(', ') || 'various leadership skills'}
${studentContext ? `Context: ${studentContext}` : ''}

Keep responses concise. Always end with a question.`,
    }
    
    const systemPrompt = systemPrompts[sessionType] || systemPrompts.show_skill
    
    // Convert messages to Anthropic format
    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))
    
    // Create API call with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout
    
    let response
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: formattedMessages
      }, {
        signal: controller.signal
      })
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return NextResponse.json({
          message: "Still thinking... The AI is taking longer than usual. Please try again.",
          sessionType 
        })
      }
      console.error('[BRAINSTORM] Anthropic error:', err.message || 'Unknown')
      return serverErrorResponse('AI service temporarily unavailable')
    } finally {
      clearTimeout(timeoutId)
    }
    
    const assistantMessage = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''
    
    return NextResponse.json({ 
      message: assistantMessage,
      sessionType 
    })
    
  } catch (error) {
    console.error('[BRAINSTORM] Error:', error instanceof Error ? error.message : 'Unknown')
    return serverErrorResponse('Failed to process brainstorm request')
  }
}
