// Socratic AI Edge Function with Iron Wall Prompt + Battery Awareness
// Supports voice/typing mode based on class settings

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      type,
      lesson_id,
      student_id,
      class_id,
      conversation_history,
      user_message,
      lesson_context,
      response_count,
      min_responses,
      battery_level,
      ai_persona,
      ai_difficulty
    } = await req.json();

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Crisis keywords detection
    const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'hurt myself', 'self harm', 'die', 'hopeless'];
    const messageLC = user_message.toLowerCase();
    const crisisDetected = crisisKeywords.some(kw => messageLC.includes(kw));

    if (crisisDetected) {
      // Server-side crisis logging
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      await fetch(`${supabaseUrl}/rest/v1/rpc/handle_crisis_detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          p_student_id: student_id,
          p_class_id: class_id,
          p_lesson_id: lesson_id,
          p_content: user_message,
          p_severity: 'high'
        })
      });

      return new Response(JSON.stringify({
        message: "I hear you, and I want you to know that what you're feeling matters. Please talk to a trusted adult, counselor, or call 988 (Suicide & Crisis Lifeline). You're not alone.",
        crisis_detected: true,
        should_complete: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build persona-specific system prompt
    const personaPrompts: Record<string, string> = {
      hype_man: "You are encouraging and supportive. Use energy and enthusiasm. Say things like 'You got this!' and 'That's a powerful insight!'",
      strategist: "You are direct and logical. Focus on cause-and-effect. Ask 'What's the strategic move here?' and 'What's the risk of that approach?'",
      sage: "You are philosophical and calm. Speak in questions that provoke reflection. 'What does this reveal about your values?' 'How might you see this differently in 5 years?'"
    };

    const difficultyPrompts: Record<string, string> = {
      gentle: "Be warm and encouraging. Accept shorter responses. Provide scaffolding when stuck.",
      standard: "Push back on surface-level answers. Require evidence and examples. Challenge assumptions respectfully.",
      intense: "Be relentlessly Socratic. Accept nothing at face value. Demand depth, specificity, and self-examination."
    };

    const batteryPrompt = battery_level < 30
      ? "The student's energy is low. Be encouraging: 'The signal is weak. Let's start small. What's ONE thing on your mind?'"
      : battery_level > 80
      ? "The student has high energy. Challenge them: 'You have power to spare. Let's go deeper. What are you avoiding?'"
      : "";

    const systemPrompt = `You are the System Guardian - a Socratic AI coach for high school leadership development.

CORE IDENTITY:
${personaPrompts[ai_persona || 'strategist']}

DIFFICULTY LEVEL:
${difficultyPrompts[ai_difficulty || 'standard']}

BATTERY AWARENESS:
${batteryPrompt}

THE IRON WALL RULES:
1. NEVER give direct answers. Mirror questions back: "The system is waiting for YOUR input, not mine."
2. NO EMPTY PRAISE. Instead of "Good job", say "System stabilized" or "Connection confirmed" - keep it diegetic.
3. Push for claim → evidence → next step in every exchange.
4. After ${min_responses || 5} quality exchanges, you may signal completion readiness.

CURRENT CONTEXT:
- Lesson Skill: ${lesson_context?.skill_name || 'Leadership'}
- Compelling Question: ${lesson_context?.compelling_question || 'What does it mean to lead?'}
- Session Type: ${type}
- Exchange Count: ${response_count || 0}

If this is a SCENARIO, ground responses in real-life application. Ask "When might you face this exact situation this week?"

Respond conversationally but purposefully. Keep responses under 100 words unless depth requires more.`;

    // Build messages for Anthropic
    const messages = [
      ...conversation_history.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: user_message }
    ];

    // Call Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages
      })
    });

    const aiData = await anthropicResponse.json();
    const aiMessage = aiData.content?.[0]?.text || "Connection unstable. Try again.";

    // Check if should complete
    const shouldComplete = response_count >= (min_responses || 5) - 1 && 
      (aiMessage.includes('stabilized') || aiMessage.includes('confirmed') || 
       user_message.length > 50);

    return new Response(JSON.stringify({
      message: aiMessage,
      should_complete: shouldComplete,
      crisis_detected: false,
      response_count: response_count + 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
