'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lightbulb, Target, Heart, Users, Zap, X, Send, 
  Sparkles, ChevronRight, Loader2
} from 'lucide-react'

interface BrainstormMessage {
  role: 'user' | 'assistant'
  content: string
}

interface BrainstormAIProps {
  isOpen: boolean
  onClose: () => void
  onActionPlan?: (plan: string) => void
  studentSkills?: string[]
}

const sessionTypes = [
  { 
    id: 'show_skill', 
    label: 'Show a Skill', 
    description: 'Brainstorm ways to demonstrate a skill I learned',
    icon: Target,
    color: 'from-blue-600 to-cyan-600',
  },
  { 
    id: 'combine_skills', 
    label: 'Combine Skills', 
    description: 'Create a project using multiple skills together',
    icon: Zap,
    color: 'from-purple-600 to-pink-600',
  },
  { 
    id: 'give_back', 
    label: 'Give Back', 
    description: 'Find ways to help others or my community',
    icon: Heart,
    color: 'from-pink-600 to-red-600',
  },
  { 
    id: 'start_ripple', 
    label: 'Start a Ripple', 
    description: 'Do something that creates a chain reaction of good',
    icon: Sparkles,
    color: 'from-cyan-600 to-teal-600',
  },
  { 
    id: 'group_tier_up', 
    label: 'Group Project', 
    description: 'Plan something with friends to tier up together',
    icon: Users,
    color: 'from-amber-600 to-orange-600',
  },
]

export default function BrainstormAI({ isOpen, onClose, onActionPlan, studentSkills = [] }: BrainstormAIProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [messages, setMessages] = useState<BrainstormMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const getOpeningMessage = (typeId: string): string => {
    const skillsList = studentSkills.length > 0 
      ? `I see you've been working on skills like ${studentSkills.slice(0, 3).join(', ')}. ` 
      : ''
    
    switch (typeId) {
      case 'show_skill':
        return `${skillsList}What skill would you like to demonstrate? What are you passionate about outside of class? The best demonstrations combine learning with what you already love.`
      case 'combine_skills':
        return `${skillsList}Combining skills creates something more powerful than each alone. Tell me about 2-3 skills you'd like to weave together.`
      case 'give_back':
        return `${skillsList}Giving back means applying what you've learned to make real impact. What problems do you see around you? What frustrates you about your school or community?`
      case 'start_ripple':
        return `${skillsList}Ripples start small but spread far. The best ones don't just help one person—they inspire that person to help someone else. What's one small action that could multiply?`
      case 'group_tier_up':
        return `${skillsList}Group projects work best when everyone brings something different. Who's in your group, and what does each person care about?`
      default:
        return "Let's brainstorm together. What's on your mind?"
    }
  }
  
  const startSession = (typeId: string) => {
    setSelectedType(typeId)
    setMessages([{ role: 'assistant', content: getOpeningMessage(typeId) }])
  }
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const exchangeCount = messages.filter(m => m.role === 'user').length + 1
    let response = ''
    
    if (exchangeCount === 1) {
      response = `That's interesting! Let me dig deeper. Why does this matter to you personally? Who else might benefit?`
    } else if (exchangeCount === 2) {
      response = `I'm seeing a picture form. What would "success" look like for you? Not grades—how would YOU know you really made an impact?`
    } else if (exchangeCount === 3) {
      response = `Here's what I'm hearing: You want to make real impact by combining your interests with your skills.\n\n**Your Action Plan:**\n\n1. **This Week:** Start with one specific, small action\n2. **The Goal:** Create something that showcases your growth\n3. **The Measure:** You'll know it worked when someone else is inspired\n4. **Document It:** Photos, reflections, share your story\n\nDoes this feel doable? Want to commit to this plan?`
    } else {
      response = `Let's refine this further. What part feels most exciting to you? What part feels hardest?`
    }
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }])
    setIsLoading(false)
  }
  
  const commitToPlan = () => {
    const plan = messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
    onActionPlan?.(plan)
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-purple-500/30 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-700 flex items-center justify-between bg-gradient-to-r from-purple-900/50 to-pink-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Lightbulb className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-white">Brainstorm Mode</h2>
              <p className="text-xs text-purple-300">Find your next meaningful action</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="text-surface-400" size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedType ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">What do you want to brainstorm?</h3>
              <div className="grid gap-3">
                {sessionTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => startSession(type.id)}
                    className="p-4 rounded-xl border border-surface-700 hover:border-purple-500/50 bg-surface-800/50 text-left transition-all flex items-center gap-4"
                  >
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${type.color}`}>
                      <type.icon className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{type.label}</h4>
                      <p className="text-sm text-surface-400">{type.description}</p>
                    </div>
                    <ChevronRight className="text-surface-500" size={20} />
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-[300px]">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-surface-800 text-surface-200'
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-purple-400" />
                          <span className="text-xs text-purple-400 font-medium">Brainstorm AI</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-surface-800 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-purple-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input */}
              <div className="p-4 border-t border-surface-700 bg-surface-800/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Share your thoughts..."
                    className="flex-1 bg-surface-900 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder:text-surface-500 focus:border-purple-500 outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-surface-700 text-white rounded-xl transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
                
                {messages.length >= 6 && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={commitToPlan}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg"
                    >
                      ✓ Commit to This Plan
                    </button>
                    <button
                      onClick={() => setSelectedType(null)}
                      className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white text-sm rounded-lg"
                    >
                      Start Over
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
