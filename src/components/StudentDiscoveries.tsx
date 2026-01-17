'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Film, Tv, Book, Podcast, Newspaper, Sparkles, User, 
  ThumbsUp, MessageSquare, X, Send, ExternalLink, Image,
  Instagram, Twitter, Youtube
} from 'lucide-react'

interface Discovery {
  id: string
  authorName: string
  isUnmasked: boolean
  title: string
  sourceType: string
  sourceName?: string
  contentUrl?: string
  description: string
  leadershipConnection: string
  relatedSkills: string[]
  imageUrl?: string
  helpfulCount: number
  commentCount: number
  hasVoted: boolean
  createdAt: string
}

interface StudentDiscoveriesProps {
  discoveries: Discovery[]
  onPost: (data: {
    title: string
    sourceType: string
    sourceName: string
    contentUrl?: string
    description: string
    leadershipConnection: string
    relatedSkills: string[]
    imageUrl?: string
  }) => void
  onVote: (discoveryId: string) => void
  onComment: (discoveryId: string, comment: string) => void
}

const sourceTypes = [
  { id: 'social_media', label: 'Social Media', icon: Instagram },
  { id: 'movie', label: 'Movie', icon: Film },
  { id: 'tv_show', label: 'TV Show', icon: Tv },
  { id: 'book', label: 'Book', icon: Book },
  { id: 'podcast', label: 'Podcast', icon: Podcast },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'personal_experience', label: 'Personal', icon: User },
  { id: 'other', label: 'Other', icon: Sparkles },
]

const skillOptions = [
  'Grit', 'Self-Awareness', 'Communication', 'Empathy', 'Resilience',
  'Goal Setting', 'Time Management', 'Conflict Resolution', 'Teamwork',
  'Decision Making', 'Emotional Intelligence', 'Adaptability', 'Initiative'
]

export default function StudentDiscoveries({ discoveries, onPost, onVote, onComment }: StudentDiscoveriesProps) {
  const [showPostModal, setShowPostModal] = useState(false)
  const [selectedDiscovery, setSelectedDiscovery] = useState<Discovery | null>(null)
  const [commentText, setCommentText] = useState('')
  
  // Post form state
  const [title, setTitle] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [description, setDescription] = useState('')
  const [leadershipConnection, setLeadershipConnection] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handlePost = async () => {
    if (!title || !sourceType || !description || !leadershipConnection) return
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    onPost({
      title,
      sourceType,
      sourceName,
      contentUrl: contentUrl || undefined,
      description,
      leadershipConnection,
      relatedSkills: selectedSkills,
    })
    setIsSubmitting(false)
    setShowPostModal(false)
    // Reset form
    setTitle('')
    setSourceType('')
    setSourceName('')
    setContentUrl('')
    setDescription('')
    setLeadershipConnection('')
    setSelectedSkills([])
  }
  
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill].slice(0, 5)
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Post button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="text-yellow-400" size={20} />
          Leadership Discoveries
        </h3>
        <button
          onClick={() => setShowPostModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Share a Discovery
        </button>
      </div>
      
      <p className="text-surface-400 text-sm">
        Found something in a movie, social media, or life that relates to leadership? Share it!
      </p>
      
      {/* Discoveries Feed */}
      <div className="space-y-4">
        {discoveries.map((discovery) => {
          const SourceIcon = sourceTypes.find(s => s.id === discovery.sourceType)?.icon || Sparkles
          return (
            <motion.div
              key={discovery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-800/50 rounded-xl p-4 border border-surface-700"
            >
              {/* Author & Source */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center">
                    <User size={16} className="text-surface-400" />
                  </div>
                  <span className="text-surface-300 text-sm">
                    {discovery.isUnmasked ? discovery.authorName : '🎭 ' + discovery.authorName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-surface-500 text-xs">
                  <SourceIcon size={14} />
                  <span>{discovery.sourceName || sourceTypes.find(s => s.id === discovery.sourceType)?.label}</span>
                </div>
              </div>
              
              {/* Title & Description */}
              <h4 className="font-semibold text-white mb-2">{discovery.title}</h4>
              <p className="text-surface-300 text-sm mb-3">{discovery.description}</p>
              
              {/* Leadership Connection */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-3">
                <span className="text-purple-400 text-xs font-medium">Leadership Connection:</span>
                <p className="text-purple-200 text-sm mt-1">{discovery.leadershipConnection}</p>
              </div>
              
              {/* Skills */}
              {discovery.relatedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {discovery.relatedSkills.map((skill) => (
                    <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-surface-300">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Link */}
              {discovery.contentUrl && (
                <a
                  href={discovery.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 text-sm hover:underline mb-3"
                >
                  <ExternalLink size={14} />
                  View Source
                </a>
              )}
              
              {/* Actions */}
              <div className="flex items-center gap-4 pt-3 border-t border-surface-700">
                <button
                  onClick={() => onVote(discovery.id)}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    discovery.hasVoted ? 'text-green-400' : 'text-surface-400 hover:text-green-400'
                  }`}
                >
                  <ThumbsUp size={16} fill={discovery.hasVoted ? 'currentColor' : 'none'} />
                  <span>{discovery.helpfulCount} helpful</span>
                </button>
                <button
                  onClick={() => setSelectedDiscovery(discovery)}
                  className="flex items-center gap-1 text-sm text-surface-400 hover:text-blue-400 transition-colors"
                >
                  <MessageSquare size={16} />
                  <span>{discovery.commentCount} comments</span>
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* Empty state */}
      {discoveries.length === 0 && (
        <div className="text-center py-12 text-surface-400">
          <Sparkles className="mx-auto mb-3 opacity-50" size={40} />
          <p className="font-medium">No discoveries yet</p>
          <p className="text-sm mt-1">Be the first to share something you found!</p>
        </div>
      )}
      
      {/* Post Modal */}
      <AnimatePresence>
        {showPostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPostModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-surface-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-surface-700"
            >
              {/* Header */}
              <div className="p-6 border-b border-surface-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Share a Discovery</h2>
                  <button onClick={() => setShowPostModal(false)} className="p-2 hover:bg-surface-800 rounded-lg">
                    <X className="text-surface-400" size={20} />
                  </button>
                </div>
                <p className="text-surface-400 text-sm mt-1">
                  Found something that relates to leadership? Share it with the class!
                </p>
              </div>
              
              {/* Form */}
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="text-sm text-surface-400 mb-2 block">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give it a catchy title..."
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder:text-surface-500 focus:border-purple-500 outline-none"
                  />
                </div>
                
                {/* Source Type */}
                <div>
                  <label className="text-sm text-surface-400 mb-2 block">Where did you find this?</label>
                  <div className="grid grid-cols-4 gap-2">
                    {sourceTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSourceType(type.id)}
                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                          sourceType === type.id
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-purple-500/50'
                        }`}
                      >
                        <type.icon size={20} />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Source Name & URL */}
                {sourceType && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div>
                      <label className="text-sm text-surface-400 mb-2 block">
                        {sourceType === 'movie' ? 'Movie name' :
                         sourceType === 'tv_show' ? 'Show name' :
                         sourceType === 'book' ? 'Book title' :
                         sourceType === 'podcast' ? 'Podcast name' :
                         sourceType === 'social_media' ? 'Platform (TikTok, Instagram, etc.)' :
                         'Source name'}
                      </label>
                      <input
                        type="text"
                        value={sourceName}
                        onChange={(e) => setSourceName(e.target.value)}
                        placeholder="e.g., The Office, TikTok, ..."
                        className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder:text-surface-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-surface-400 mb-2 block">Link (optional)</label>
                      <input
                        type="url"
                        value={contentUrl}
                        onChange={(e) => setContentUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder:text-surface-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </motion.div>
                )}
                
                {/* Description */}
                <div>
                  <label className="text-sm text-surface-400 mb-2 block">What did you find?</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you saw/read/heard..."
                    className="w-full h-24 bg-surface-800 border border-surface-700 rounded-xl p-4 text-white placeholder:text-surface-500 focus:border-purple-500 outline-none resize-none"
                  />
                </div>
                
                {/* Leadership Connection */}
                <div>
                  <label className="text-sm text-surface-400 mb-2 block">
                    How does this connect to leadership?
                  </label>
                  <textarea
                    value={leadershipConnection}
                    onChange={(e) => setLeadershipConnection(e.target.value)}
                    placeholder="This shows leadership because... / This relates to the skill of..."
                    className="w-full h-24 bg-surface-800 border border-surface-700 rounded-xl p-4 text-white placeholder:text-surface-500 focus:border-purple-500 outline-none resize-none"
                  />
                </div>
                
                {/* Related Skills */}
                <div>
                  <label className="text-sm text-surface-400 mb-2 block">
                    Related Skills (select up to 5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          selectedSkills.includes(skill)
                            ? 'bg-purple-600 text-white'
                            : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Submit */}
                <button
                  onClick={handlePost}
                  disabled={!title || !sourceType || !description || !leadershipConnection || isSubmitting}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-surface-700 disabled:text-surface-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Share Discovery
                    </>
                  )}
                </button>
                
                <p className="text-xs text-surface-500 text-center">
                  Your discovery will be reviewed before appearing publicly.
                  You'll earn 🌸 flowers when approved!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
