'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Send, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LessonData {
  id: number
  skill_name: string
  compelling_question: string
  lesson_objective: string
  text_anchor_title: string
  text_anchor_chapter: string
  media_title: string
  media_url: string
  the_win: string
  the_obstacle: string
  phase_id: number
}

interface SocraticModalProps {
  type: 'do_now' | 'scenario' | 'exit_ticket'
  lesson: LessonData | null
  userId: string | undefined
  classId: string | undefined
  userName: string | undefined
  onClose: () => void
  onComplete?: () => void
  onScenarioComplete?: (challengePlan: string) => void
}

export default function SocraticModal({ 
  type, 
  lesson, 
  userId,
  classId,
  userName,
  onClose,
  onComplete,
  onScenarioComplete
}: SocraticModalProps) {
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user', content: string }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [responseCount, setResponseCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const MIN_RESPONSES = 5 // Minimum exchanges required

  useEffect(() => {
    initializeConversation()
  }, [type, lesson])

  const initializeConversation = () => {
    let greeting = ''
    if (type === 'do_now') {
      greeting = `Hey ${userName || 'there'}! 👋 Ready to warm up that brain?\n\nHere's today's question to think about:\n\n**"${lesson?.compelling_question}"**\n\nTake a moment to really think about this. What comes to mind first?`
    } else if (type === 'scenario') {
      greeting = `Alright ${userName || 'there'}, time to put ${lesson?.skill_name} into practice.\n\nI'm going to present you with a real-life situation. Fair warning: I won't let you off easy. I'll push back, ask hard questions, and make you think.\n\nReady to begin?`
    } else {
      greeting = `Let's wrap up today's learning about ${lesson?.skill_name}.\n\nWhat's one thing that stuck with you from today?`
    }
    
    setMessages([{ role: 'assistant', content: greeting }])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    // Check for low-effort responses
    if (input.trim().split(' ').length < 3 && responseCount < MIN_RESPONSES) {
      setMessages(prev => [...prev, 
        { role: 'user', content: input.trim() },
        { role: 'assistant', content: "I need more than that! Give me at least a full sentence. What are you really thinking?" }
      ])
      setInput('')
      return
    }

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    setResponseCount(prev => prev + 1)

    try {
      const response = await fetch('/api/ai/socratic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          lesson_id: lesson?.id,
          student_id: userId,
          class_id: classId,
          conversation_history: messages,
          user_message: userMessage,
          lesson_context: lesson,
          response_count: responseCount + 1,
          min_responses: MIN_RESPONSES
        })
      })

      const data = await response.json()
      
      if (data.crisis_detected) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        return
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      
      if (data.should_complete && responseCount >= MIN_RESPONSES - 1) {
        setComplete(true)
        
        // Save session
        const tableName = type === 'do_now' ? 'do_now_sessions' : 
                          type === 'exit_ticket' ? 'exit_ticket_sessions' : 'scenario_sessions'
        
        await supabase.from(tableName).insert({
          student_id: userId,
          lesson_id: lesson?.id,
          class_id: classId,
          conversation: [...messages, { role: 'user', content: userMessage }, { role: 'assistant', content: data.message }],
          response_count: responseCount + 1,
          completed_at: new Date().toISOString(),
          ...(type !== 'scenario' ? { date: new Date().toISOString().split('T')[0] } : {})
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Connection issue. Your work is saved locally. Try again when you reconnect.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    if (type === 'do_now' && onComplete) {
      onComplete()
    } else if (type === 'scenario' && onScenarioComplete) {
      onScenarioComplete('')
    } else {
      onClose()
    }
  }

  const titles: Record<string, string> = {
    do_now: '🧠 Do Now',
    scenario: '⚡ Socratic Scenario',
    exit_ticket: '🎫 Exit Ticket'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-surface-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        <div className="p-4 border-b border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-surface-100">{titles[type]}</h2>
            <span className="text-xs text-surface-500 bg-surface-800 px-2 py-1 rounded-lg">
              {responseCount}/{MIN_RESPONSES} exchanges
            </span>
          </div>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              className={msg.role === 'assistant' ? 'chat-ai' : 'chat-user'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </motion.div>
          ))}
          {loading && (
            <div className="chat-ai">
              <div className="typing-indicator flex gap-1">
                <span className="w-2 h-2 bg-surface-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-surface-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 bg-surface-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-surface-800">
          {complete ? (
            <div className="text-center">
              <p className="text-green-400 mb-3 flex items-center justify-center gap-2">
                <Check size={20} /> Session complete!
              </p>
              <motion.button 
                onClick={handleComplete} 
                className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {type === 'scenario' ? 'Continue to Challenge' : 'Done'}
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-surface-800 border border-surface-700 rounded-xl px-4 py-2 text-white placeholder:text-surface-500 focus:border-primary-500 outline-none"
                placeholder="Type your response (be thoughtful!)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading}
              />
              <motion.button 
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-700 text-white rounded-xl transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send size={18} />
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
