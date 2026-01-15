'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, Video, MessageSquare, Lightbulb, CheckCircle, 
  Clock, X, ExternalLink, Send, ChevronRight
} from 'lucide-react'

interface TeacherChallenge {
  id: string
  title: string
  type: 'reading' | 'video' | 'discussion' | 'reflection' | 'action'
  contentUrl?: string
  contentDescription?: string
  prompt: string
  relatedSkills: string[]
  rewardType: string
  rewardAmount: number
  dueDate?: string
  completed: boolean
}

interface TeacherChallengesProps {
  challenges: TeacherChallenge[]
  onSubmitResponse: (challengeId: string, response: string, personalConnection: string, shareWithClass: boolean) => void
}

export default function TeacherChallenges({ challenges, onSubmitResponse }: TeacherChallengesProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<TeacherChallenge | null>(null)
  const [response, setResponse] = useState('')
  const [personalConnection, setPersonalConnection] = useState('')
  const [shareWithClass, setShareWithClass] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const typeIcons = {
    reading: BookOpen,
    video: Video,
    discussion: MessageSquare,
    reflection: Lightbulb,
    action: CheckCircle,
  }
  
  const typeColors = {
    reading: 'from-blue-600 to-cyan-600',
    video: 'from-red-600 to-orange-600',
    discussion: 'from-green-600 to-emerald-600',
    reflection: 'from-purple-600 to-pink-600',
    action: 'from-yellow-600 to-amber-600',
  }
  
  const activeChallenges = challenges.filter(c => !c.completed)
  const completedChallenges = challenges.filter(c => c.completed)
  
  const handleSubmit = async () => {
    if (!selectedChallenge || response.length < 50) return
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    onSubmitResponse(selectedChallenge.id, response, personalConnection, shareWithClass)
    setIsSubmitting(false)
    setSelectedChallenge(null)
    setResponse('')
    setPersonalConnection('')
    setShareWithClass(false)
  }
  
  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="text-yellow-400" size={20} />
            Pop-Up Challenges
          </h3>
          
          <div className="grid gap-4">
            {activeChallenges.map((challenge) => {
              const Icon = typeIcons[challenge.type]
              return (
                <motion.div
                  key={challenge.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedChallenge(challenge)}
                  className="bg-surface-800/50 rounded-xl p-4 border border-surface-700 hover:border-purple-500/50 cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${typeColors[challenge.type]}`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-surface-300 capitalize">
                          {challenge.type}
                        </span>
                        <span className="text-xs text-yellow-400">
                          +{challenge.rewardAmount} 🌸
                        </span>
                      </div>
                      <h4 className="font-semibold text-white truncate">{challenge.title}</h4>
                      <p className="text-sm text-surface-400 line-clamp-2 mt-1">
                        {challenge.prompt}
                      </p>
                      {challenge.relatedSkills.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {challenge.relatedSkills.slice(0, 3).map((skill) => (
                            <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="text-surface-500" size={20} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Completed */}
      {completedChallenges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-surface-400 mb-3">
            Completed ({completedChallenges.length})
          </h3>
          <div className="space-y-2">
            {completedChallenges.slice(0, 3).map((challenge) => (
              <div 
                key={challenge.id}
                className="flex items-center gap-3 p-3 bg-surface-800/30 rounded-lg opacity-60"
              >
                <CheckCircle className="text-green-500" size={16} />
                <span className="text-sm text-surface-300">{challenge.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {challenges.length === 0 && (
        <div className="text-center py-8 text-surface-400">
          <BookOpen className="mx-auto mb-3 opacity-50" size={32} />
          <p>No challenges yet</p>
          <p className="text-sm mt-1">Your teacher will post challenges soon!</p>
        </div>
      )}
      
      {/* Challenge Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedChallenge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-surface-700"
            >
              {/* Header */}
              <div className={`p-6 bg-gradient-to-br ${typeColors[selectedChallenge.type]} rounded-t-2xl`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white capitalize mb-2 inline-block">
                      {selectedChallenge.type}
                    </span>
                    <h2 className="text-xl font-bold text-white">{selectedChallenge.title}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedChallenge(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="text-white" size={20} />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* External content link */}
                {selectedChallenge.contentUrl && (
                  <a
                    href={selectedChallenge.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-surface-800 rounded-xl hover:bg-surface-700 transition-colors border border-surface-700"
                  >
                    {selectedChallenge.type === 'video' ? (
                      <Video className="text-red-400" size={24} />
                    ) : (
                      <BookOpen className="text-blue-400" size={24} />
                    )}
                    <div className="flex-1">
                      <span className="text-white font-medium">
                        {selectedChallenge.type === 'video' ? 'Watch Video' : 'Read Content'}
                      </span>
                      <span className="text-surface-400 text-sm block">
                        Opens in new tab
                      </span>
                    </div>
                    <ExternalLink className="text-surface-400" size={20} />
                  </a>
                )}
                
                {/* Content description */}
                {selectedChallenge.contentDescription && (
                  <div className="prose prose-invert prose-sm">
                    <p className="text-surface-300">{selectedChallenge.contentDescription}</p>
                  </div>
                )}
                
                {/* Prompt */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <h3 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Your Challenge
                  </h3>
                  <p className="text-white">{selectedChallenge.prompt}</p>
                </div>
                
                {/* Response */}
                <div>
                  <label className="text-sm text-surface-400 mb-2 block">
                    Your Response (minimum 50 characters)
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full h-32 bg-surface-800 border border-surface-700 rounded-xl p-4 text-white placeholder:text-surface-500 focus:border-purple-500 outline-none resize-none"
                  />
                  <div className="text-xs text-surface-500 mt-1 text-right">
                    {response.length}/50 minimum
                  </div>
                </div>
                
                {/* Personal Connection */}
                <div>
                  <label className="text-sm text-surface-400 mb-2 block">
                    How does this apply to YOUR life or leadership journey?
                  </label>
                  <textarea
                    value={personalConnection}
                    onChange={(e) => setPersonalConnection(e.target.value)}
                    placeholder="In my own experience..."
                    className="w-full h-24 bg-surface-800 border border-surface-700 rounded-xl p-4 text-white placeholder:text-surface-500 focus:border-purple-500 outline-none resize-none"
                  />
                </div>
                
                {/* Share option */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareWithClass}
                    onChange={(e) => setShareWithClass(e.target.checked)}
                    className="w-5 h-5 rounded bg-surface-800 border-surface-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-surface-300 text-sm">
                    Share my response with the class (anonymously until unmasked)
                  </span>
                </label>
                
                {/* Reward info */}
                <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <span className="text-yellow-300 text-sm">Completing this earns you:</span>
                  <span className="text-yellow-400 font-bold">
                    +{selectedChallenge.rewardAmount} 🌸
                  </span>
                </div>
                
                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={response.length < 50 || isSubmitting}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-surface-700 disabled:text-surface-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Response
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
