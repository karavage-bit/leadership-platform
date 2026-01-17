'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Send, Check, Mic, MicOff, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SocraticModalProps {
  type: 'do_now' | 'scenario' | 'exit_ticket'
  lesson: any
  userId: string
  classId: string
  userName?: string
  classSettings?: {
    interaction_mode: 'typing' | 'voice' | 'both'
    ai_difficulty: 'gentle' | 'standard' | 'intense'
    ai_persona: 'hype_man' | 'strategist' | 'sage'
    min_responses: number
  }
  batteryLevel?: number
  onClose: () => void
  onComplete?: () => void
  onScenarioComplete?: () => void
}

export default function SocraticModal({
  type,
  lesson,
  userId,
  classId,
  userName,
  classSettings,
  batteryLevel = 50,
  onClose,
  onComplete,
  onScenarioComplete
}: SocraticModalProps) {
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user', content: string }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [responseCount, setResponseCount] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const supabase = createClient()

  const MIN_RESPONSES = classSettings?.min_responses || 5
  const interactionMode = classSettings?.interaction_mode || 'typing'
  const showVoice = interactionMode === 'voice' || interactionMode === 'both'
  const showTyping = interactionMode === 'typing' || interactionMode === 'both'

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSpeechSupported(true)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(prev => prev + ' ' + transcript)
        setIsRecording(false)
      }
      
      recognitionRef.current.onerror = () => setIsRecording(false)
      recognitionRef.current.onend = () => setIsRecording(false)
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  // Initial greeting
  useEffect(() => {
    let greeting = ''
    if (type === 'do_now') {
      greeting = `Hey ${userName || 'there'}! Ready to charge up?\n\n**"${lesson?.compelling_question}"**\n\nWhat's your first instinct?`
    } else if (type === 'scenario') {
      greeting = `Time to put ${lesson?.skill_name} into practice. I'll challenge your thinking. Ready?`
    } else {
      greeting = `Let's lock in today's learning about ${lesson?.skill_name}. What stuck with you?`
    }
    setMessages([{ role: 'assistant', content: greeting }])
  }, [type, lesson, userName])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleRecording = () => {
    if (!recognitionRef.current) return
    
    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    
    // Enforce minimum word count
    if (userMessage.split(' ').length < 3 && responseCount < MIN_RESPONSES) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: "Give me at least a full sentence. What are you really thinking?" }
      ])
      setInput('')
      return
    }

    // FIX: Build next history BEFORE setting state (fixes stale state bug)
    const nextHistory = [...messages, { role: 'user' as const, content: userMessage }]
    
    setInput('')
    setMessages(nextHistory)
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
          conversation_history: messages, // Send previous messages (not including current)
          user_message: userMessage,
          lesson_context: lesson,
          response_count: responseCount + 1,
          min_responses: MIN_RESPONSES,
          battery_level: batteryLevel,
          ai_persona: classSettings?.ai_persona,
          ai_difficulty: classSettings?.ai_difficulty
        })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()

      if (data.crisis_detected) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        return
      }

      // Update messages with AI response
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])

      if (data.should_complete && responseCount >= MIN_RESPONSES - 1) {
        setComplete(true)

        // Save session with CORRECT conversation history
        const tableName = type === 'do_now' ? 'do_now_sessions' 
          : type === 'exit_ticket' ? 'exit_ticket_sessions' 
          : 'scenario_sessions'

        const fullConversation = [
          ...nextHistory,
          { role: 'assistant', content: data.message }
        ]

        await supabase.from(tableName).insert({
          student_id: userId,
          lesson_id: lesson?.id,
          class_id: classId,
          conversation: fullConversation,
          response_count: responseCount + 1,
          completed_at: new Date().toISOString(),
          ...(type !== 'scenario' ? { date: new Date().toISOString().split('T')[0] } : {})
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection unstable. Try again.' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, responseCount, type, lesson, userId, classId, batteryLevel, classSettings, MIN_RESPONSES, supabase])

  const handleComplete = async () => {
    // SECURE: Server derives student_id from JWT, controls energy values
    const { data, error } = await supabase.rpc('complete_step', {
      p_lesson_id: lesson?.id,
      p_step_type: type
    })

    if (error) {
      console.error('Complete step error:', error)
    }

    if (type === 'scenario' && onScenarioComplete) {
      onScenarioComplete()
    } else if (onComplete) {
      onComplete()
    }
    onClose()
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-surface-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">
              {type === 'do_now' ? '⚡ Do Now' : type === 'scenario' ? '🎯 Scenario' : '🔒 Exit Ticket'}
            </span>
            <div className="flex items-center gap-1 text-sm text-surface-400">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{responseCount}/{MIN_RESPONSES}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-surface-700 text-surface-100'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-700 rounded-2xl px-4 py-3">
                <span className="animate-pulse">Processing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <footer className="p-4 border-t border-surface-700">
          {!complete ? (
            <div className="flex gap-2">
              {showVoice && speechSupported && (
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-xl transition-colors ${
                    isRecording ? 'bg-red-500 text-white' : 'bg-surface-700 hover:bg-surface-600'
                  }`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
              {showTyping && (
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={isRecording ? "Listening..." : "Type your response..."}
                  className="flex-1 bg-surface-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isRecording}
                />
              )}
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-xl"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleComplete}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-400 hover:to-emerald-500 transition-all"
            >
              <Check className="w-5 h-5" />
              Lock In & Earn Energy
            </button>
          )}
        </footer>
      </motion.div>
    </motion.div>
  )
}
