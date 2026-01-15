'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, BookOpen, MessageSquare, ExternalLink, Send, Heart, Lightbulb } from 'lucide-react'

interface Challenge {
  id: string
  type: 'reading' | 'video' | 'discussion' | 'reflection'
  title: string
  description: string
  content?: string // For readings
  videoUrl?: string // For videos
  discussionPrompt?: string
  skill: string
  createdAt: string
  teacherName: string
  responses: ChallengeResponse[]
}

interface ChallengeResponse {
  id: string
  studentName: string
  anonymousName: string
  response: string
  appliedTo: string // How it applies to their journey
  createdAt: string
  likes: number
}

interface TeacherChallengeProps {
  challenge: Challenge
  isOpen: boolean
  onClose: () => void
  onSubmit: (response: string, appliedTo: string) => void
  currentUserAnonymousName: string
  isAnonymousMode: boolean
}

export default function TeacherChallenge({
  challenge,
  isOpen,
  onClose,
  onSubmit,
  currentUserAnonymousName,
  isAnonymousMode
}: TeacherChallengeProps) {
  const [response, setResponse] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showResponses, setShowResponses] = useState(false)

  const handleSubmit = () => {
    if (response.trim() && appliedTo.trim()) {
      onSubmit(response, appliedTo)
      setSubmitted(true)
      setShowResponses(true)
    }
  }

  const getIcon = () => {
    switch (challenge.type) {
      case 'reading': return <BookOpen className="text-blue-400" size={24} />
      case 'video': return <Play className="text-red-400" size={24} />
      case 'discussion': return <MessageSquare className="text-green-400" size={24} />
      case 'reflection': return <Lightbulb className="text-yellow-400" size={24} />
    }
  }

  const getTypeLabel = () => {
    switch (challenge.type) {
      case 'reading': return 'Quick Read'
      case 'video': return 'Watch & Reflect'
      case 'discussion': return 'Open Discussion'
      case 'reflection': return 'Personal Reflection'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-surface-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-surface-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-4 border-b border-surface-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-800 rounded-xl">
                    {getIcon()}
                  </div>
                  <div>
                    <div className="text-xs text-surface-400 uppercase tracking-wide">{getTypeLabel()}</div>
                    <h2 className="text-xl font-bold text-white">{challenge.title}</h2>
                    <div className="text-xs text-surface-400 mt-1">
                      Skill: <span className="text-primary">{challenge.skill}</span> • Posted by {challenge.teacherName}
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Challenge Content */}
              <div className="space-y-4 mb-6">
                <p className="text-surface-300">{challenge.description}</p>

                {/* Reading Content */}
                {challenge.type === 'reading' && challenge.content && (
                  <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-surface-200">{challenge.content}</div>
                    </div>
                  </div>
                )}

                {/* Video Embed */}
                {challenge.type === 'video' && challenge.videoUrl && (
                  <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700">
                    <a 
                      href={challenge.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <div className="p-3 bg-red-500/20 rounded-xl">
                        <Play size={32} />
                      </div>
                      <div>
                        <div className="font-semibold">Watch Video</div>
                        <div className="text-xs text-surface-400 flex items-center gap-1">
                          Opens in new tab <ExternalLink size={12} />
                        </div>
                      </div>
                    </a>
                  </div>
                )}

                {/* Discussion Prompt */}
                {challenge.discussionPrompt && (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                    <div className="text-xs text-green-400 uppercase tracking-wide mb-2">Discussion Prompt</div>
                    <p className="text-white font-medium">{challenge.discussionPrompt}</p>
                  </div>
                )}
              </div>

              {/* Response Section */}
              {!submitted ? (
                <div className="space-y-4">
                  <div className="border-t border-surface-700 pt-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <MessageSquare size={18} className="text-primary" />
                      Your Response
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-surface-400 block mb-1">What stood out to you?</label>
                        <textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Share your thoughts on this content..."
                          className="w-full bg-surface-800 border border-surface-600 rounded-xl p-3 text-white placeholder-surface-500 focus:border-primary focus:outline-none resize-none"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-surface-400 block mb-1">
                          How does this apply to YOUR leadership journey?
                        </label>
                        <textarea
                          value={appliedTo}
                          onChange={(e) => setAppliedTo(e.target.value)}
                          placeholder="Connect this to something in your own life or growth..."
                          className="w-full bg-surface-800 border border-surface-600 rounded-xl p-3 text-white placeholder-surface-500 focus:border-primary focus:outline-none resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-surface-500">
                      Responding as: <span className="text-primary">{isAnonymousMode ? currentUserAnonymousName : 'Your Name'}</span>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!response.trim() || !appliedTo.trim()}
                      className="bg-primary hover:bg-primary/80 disabled:bg-surface-700 disabled:text-surface-500 px-6 py-2 rounded-xl font-semibold text-white transition-colors flex items-center gap-2"
                    >
                      <Send size={16} />
                      Share Response
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                  <div className="text-green-400 font-semibold mb-1">✓ Response Submitted!</div>
                  <div className="text-sm text-surface-300">You've earned a flower for reflecting on this content 🌸</div>
                </div>
              )}

              {/* Other Responses */}
              {(submitted || showResponses) && challenge.responses.length > 0 && (
                <div className="mt-6 border-t border-surface-700 pt-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Heart size={18} className="text-care" />
                    Classmate Responses ({challenge.responses.length})
                  </h3>
                  
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {challenge.responses.map((r) => (
                      <div key={r.id} className="bg-surface-800/50 rounded-xl p-3 border border-surface-700">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-primary">
                            {isAnonymousMode ? r.anonymousName : r.studentName}
                          </span>
                          <span className="text-xs text-surface-500">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-surface-300 mb-2">{r.response}</p>
                        <div className="text-xs text-surface-400 italic">
                          "Applied to: {r.appliedTo}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Pop-up notification component for new challenges
export function ChallengeNotification({ 
  challenge, 
  onView, 
  onDismiss 
}: { 
  challenge: Challenge
  onView: () => void
  onDismiss: () => void
}) {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed top-20 right-4 bg-surface-900 rounded-xl p-4 shadow-2xl border border-primary/30 max-w-sm z-40"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Lightbulb className="text-primary" size={20} />
        </div>
        <div className="flex-1">
          <div className="text-xs text-primary uppercase tracking-wide">New Challenge</div>
          <h4 className="font-semibold text-white">{challenge.title}</h4>
          <p className="text-xs text-surface-400 mt-1 line-clamp-2">{challenge.description}</p>
          
          <div className="flex gap-2 mt-3">
            <button 
              onClick={onView}
              className="bg-primary hover:bg-primary/80 px-3 py-1 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              View Challenge
            </button>
            <button 
              onClick={onDismiss}
              className="text-surface-400 hover:text-white px-3 py-1 text-xs transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
