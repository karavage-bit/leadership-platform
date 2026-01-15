'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Plus, Heart, Clock, MessageSquare, 
  BookOpen, Code, Lightbulb, HelpCircle, X, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { HelpRequest } from '../types'

interface CommonsTabProps {
  helpRequests: HelpRequest[]
  userId?: string
  classId?: string
  onRefresh: () => void
}

const categoryIcons: Record<string, any> = {
  academic: BookOpen,
  technical: Code,
  creative: Lightbulb,
  personal: Heart,
  other: HelpCircle
}

const categoryColors: Record<string, string> = {
  academic: 'text-blue-400 bg-blue-500/20',
  technical: 'text-green-400 bg-green-500/20',
  creative: 'text-purple-400 bg-purple-500/20',
  personal: 'text-pink-400 bg-pink-500/20',
  other: 'text-gray-400 bg-gray-500/20'
}

export default function CommonsTab({
  helpRequests,
  userId,
  classId,
  onRefresh
}: CommonsTabProps) {
  const [showNewRequest, setShowNewRequest] = useState(false)
  const supabase = createClient()
  
  const handleOfferHelp = async (requestId: string) => {
    await supabase
      .from('help_requests')
      .update({ 
        helper_id: userId, 
        status: 'in_progress' 
      })
      .eq('id', requestId)
    
    // Update world state with proper RPC calls
    if (userId) {
      await supabase.rpc('increment_help_given', { p_student_id: userId })
      await supabase.rpc('increment_bridge', { p_student_id: userId })
    }
    
    onRefresh()
  }
  
  return (
    <motion.div
      key="commons"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-purple-400" />
            The Commons
          </h2>
          <p className="text-sm text-surface-400">Help others, grow together</p>
        </div>
        <motion.button
          onClick={() => setShowNewRequest(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={18} />
          Ask for Help
        </motion.button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-white">{helpRequests.length}</div>
          <div className="text-xs text-surface-400">Open Requests</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-pink-400">0</div>
          <div className="text-xs text-surface-400">You've Helped</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">0</div>
          <div className="text-xs text-surface-400">Helped You</div>
        </div>
      </div>
      
      {/* Help Requests List */}
      <div className="space-y-3">
        {helpRequests.length === 0 ? (
          <div className="card p-8 text-center">
            <Heart className="mx-auto mb-3 text-surface-500" size={40} />
            <h3 className="font-semibold text-surface-300 mb-1">No open requests</h3>
            <p className="text-sm text-surface-500">
              When classmates need help, their requests will appear here.
            </p>
          </div>
        ) : (
          helpRequests.map((request) => {
            const Icon = categoryIcons[request.category] || HelpCircle
            const colorClass = categoryColors[request.category] || categoryColors.other
            
            return (
              <motion.div
                key={request.id}
                className="card p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-surface-300">
                        🎭 {request.anonymous_name}
                      </span>
                      <span className="text-xs text-surface-500">
                        <Clock size={12} className="inline mr-1" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-white mb-1">{request.title}</h4>
                    <p className="text-sm text-surface-400">{request.description}</p>
                  </div>
                  <motion.button
                    onClick={() => handleOfferHelp(request.id)}
                    className="px-3 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg text-sm font-medium flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart size={14} />
                    Help
                  </motion.button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
      
      {/* New Request Modal */}
      <AnimatePresence>
        {showNewRequest && (
          <NewHelpRequestModal
            userId={userId}
            classId={classId}
            onClose={() => setShowNewRequest(false)}
            onSuccess={() => {
              setShowNewRequest(false)
              onRefresh()
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// New Help Request Modal
function NewHelpRequestModal({ 
  userId, 
  classId, 
  onClose, 
  onSuccess 
}: {
  userId?: string
  classId?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('academic')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const adjectives = ['Swift', 'Bright', 'Calm', 'Noble', 'Wise', 'Kind', 'Bold', 'Gentle']
    const nouns = ['Phoenix', 'Eagle', 'Oak', 'River', 'Star', 'Mountain', 'Wave', 'Wind']
    const anonymousName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`

    await supabase.from('help_requests').insert({
      requester_id: userId,
      class_id: classId,
      title,
      description,
      category,
      anonymous_name: anonymousName
    })

    setSubmitting(false)
    onSuccess()
  }

  const categories = [
    { id: 'academic', label: 'Academic', icon: BookOpen },
    { id: 'technical', label: 'Technical', icon: Code },
    { id: 'creative', label: 'Creative', icon: Lightbulb },
    { id: 'personal', label: 'Personal', icon: Heart },
    { id: 'other', label: 'Other', icon: HelpCircle }
  ]

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
        className="bg-surface-900 rounded-2xl w-full max-w-md"
      >
        <div className="p-4 border-b border-surface-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Ask for Help</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              What do you need help with?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title..."
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2 text-white placeholder:text-surface-500 focus:border-primary-500 outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Category
            </label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                    category === cat.id 
                      ? 'bg-primary-500/20 border border-primary-500' 
                      : 'bg-surface-800 border border-transparent hover:border-surface-600'
                  }`}
                >
                  <cat.icon size={18} className={category === cat.id ? 'text-primary-400' : 'text-surface-400'} />
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you're struggling with..."
              className="w-full h-24 bg-surface-800 border border-surface-700 rounded-xl px-4 py-2 text-white placeholder:text-surface-500 focus:border-primary-500 outline-none resize-none"
              required
            />
          </div>
          
          <div className="bg-surface-800/50 rounded-lg p-3 text-sm text-surface-400">
            💡 Your request will be posted anonymously. Someone who can help will reach out!
          </div>
          
          <button
            type="submit"
            disabled={submitting || !title || !description}
            className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-700 text-white rounded-xl font-medium transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Request'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
