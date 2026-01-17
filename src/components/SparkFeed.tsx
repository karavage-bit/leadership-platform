'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Plus, Film, Tv, Music, BookOpen, Globe, Instagram, 
  Twitter, Youtube, Heart, MessageSquare, Sparkles, Send,
  ThumbsUp, Flame, Lightbulb, Share2
} from 'lucide-react'

interface SparkPost {
  id: string
  studentName: string
  anonymousName: string
  sourceType: 'movie' | 'tv' | 'tiktok' | 'youtube' | 'book' | 'podcast' | 'life' | 'other'
  sourceTitle: string
  sourceUrl?: string
  leadershipMoment: string
  reflection: string
  skillTags: string[]
  likes: number
  comments: Comment[]
  createdAt: string
  featured?: boolean
}

interface Comment {
  id: string
  studentName: string
  anonymousName: string
  text: string
  createdAt: string
}

interface SparkFeedProps {
  posts: SparkPost[]
  onCreatePost: (post: Omit<SparkPost, 'id' | 'likes' | 'comments' | 'createdAt' | 'studentName' | 'anonymousName'>) => void
  onLike: (postId: string) => void
  onComment: (postId: string, comment: string) => void
  currentUserAnonymousName: string
  isAnonymousMode: boolean
}

const SOURCE_ICONS: Record<string, any> = {
  movie: Film,
  tv: Tv,
  tiktok: Music,
  youtube: Youtube,
  book: BookOpen,
  podcast: Music,
  life: Sparkles,
  other: Globe
}

const SOURCE_COLORS: Record<string, string> = {
  movie: 'text-purple-400 bg-purple-500/20',
  tv: 'text-blue-400 bg-blue-500/20',
  tiktok: 'text-pink-400 bg-pink-500/20',
  youtube: 'text-red-400 bg-red-500/20',
  book: 'text-amber-400 bg-amber-500/20',
  podcast: 'text-green-400 bg-green-500/20',
  life: 'text-yellow-400 bg-yellow-500/20',
  other: 'text-gray-400 bg-gray-500/20'
}

export default function SparkFeed({
  posts,
  onCreatePost,
  onLike,
  onComment,
  currentUserAnonymousName,
  isAnonymousMode
}: SparkFeedProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={24} />
            Spark Feed
          </h2>
          <p className="text-sm text-surface-400">Leadership moments found by your classmates</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-xl font-semibold text-white transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Share a Spark
        </button>
      </div>

      {/* Featured Post */}
      {posts.filter(p => p.featured).slice(0, 1).map(post => (
        <motion.div
          key={post.id}
          className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl p-5 border border-yellow-500/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="text-orange-400" size={18} />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Featured Spark</span>
          </div>
          <SparkPostCard 
            post={post} 
            expanded={expandedPost === post.id}
            onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
            onLike={() => onLike(post.id)}
            onComment={(text) => onComment(post.id, text)}
            commentText={commentText}
            setCommentText={setCommentText}
            isAnonymousMode={isAnonymousMode}
          />
        </motion.div>
      ))}

      {/* Regular Posts */}
      <div className="space-y-3">
        {posts.filter(p => !p.featured).map(post => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-800/50 rounded-xl p-4 border border-surface-700"
          >
            <SparkPostCard 
              post={post} 
              expanded={expandedPost === post.id}
              onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              onLike={() => onLike(post.id)}
              onComment={(text) => onComment(post.id, text)}
              commentText={commentText}
              setCommentText={setCommentText}
              isAnonymousMode={isAnonymousMode}
            />
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="mx-auto text-surface-600 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-surface-400 mb-2">No sparks yet</h3>
          <p className="text-sm text-surface-500 mb-4">
            Be the first to share a leadership moment you found!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-xl font-semibold text-white transition-colors"
          >
            Share Your First Spark
          </button>
        </div>
      )}

      {/* Create Modal */}
      <CreateSparkModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={onCreatePost}
      />
    </div>
  )
}

// Individual Post Card
function SparkPostCard({
  post,
  expanded,
  onToggle,
  onLike,
  onComment,
  commentText,
  setCommentText,
  isAnonymousMode
}: {
  post: SparkPost
  expanded: boolean
  onToggle: () => void
  onLike: () => void
  onComment: (text: string) => void
  commentText: string
  setCommentText: (text: string) => void
  isAnonymousMode: boolean
}) {
  const SourceIcon = SOURCE_ICONS[post.sourceType]
  const colorClass = SOURCE_COLORS[post.sourceType]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <SourceIcon size={18} />
          </div>
          <div>
            <div className="font-medium text-white">{post.sourceTitle}</div>
            <div className="text-xs text-surface-400">
              Found by {isAnonymousMode ? post.anonymousName : post.studentName} • {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <div className="text-sm text-surface-300 mb-2">
          <span className="text-primary font-medium">The moment: </span>
          {post.leadershipMoment}
        </div>
        <div className="text-sm text-surface-400 italic">
          "{post.reflection}"
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {post.skillTags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-surface-700 rounded-full text-xs text-surface-300">
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-surface-700">
        <button 
          onClick={onLike}
          className="flex items-center gap-1 text-surface-400 hover:text-care transition-colors text-sm"
        >
          <Heart size={16} />
          <span>{post.likes}</span>
        </button>
        <button 
          onClick={onToggle}
          className="flex items-center gap-1 text-surface-400 hover:text-primary transition-colors text-sm"
        >
          <MessageSquare size={16} />
          <span>{post.comments.length}</span>
        </button>
        <button className="flex items-center gap-1 text-surface-400 hover:text-community transition-colors text-sm ml-auto">
          <Share2 size={16} />
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-surface-700 space-y-3">
              {post.comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-6 h-6 bg-surface-700 rounded-full flex items-center justify-center text-xs">
                    {(isAnonymousMode ? comment.anonymousName : comment.studentName).charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-surface-400">
                      {isAnonymousMode ? comment.anonymousName : comment.studentName}
                    </div>
                    <div className="text-sm text-surface-300">{comment.text}</div>
                  </div>
                </div>
              ))}
              
              {/* Add Comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-sm text-white placeholder-surface-500 focus:border-primary focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commentText.trim()) {
                      onComment(commentText)
                      setCommentText('')
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (commentText.trim()) {
                      onComment(commentText)
                      setCommentText('')
                    }
                  }}
                  className="p-2 bg-primary rounded-lg text-white hover:bg-primary/80 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Create Spark Modal
function CreateSparkModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (post: any) => void
}) {
  const [sourceType, setSourceType] = useState<SparkPost['sourceType']>('movie')
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [leadershipMoment, setLeadershipMoment] = useState('')
  const [reflection, setReflection] = useState('')
  const [skillTags, setSkillTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const sourceOptions = [
    { value: 'movie', label: 'Movie', icon: Film },
    { value: 'tv', label: 'TV Show', icon: Tv },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'tiktok', label: 'TikTok', icon: Music },
    { value: 'book', label: 'Book', icon: BookOpen },
    { value: 'podcast', label: 'Podcast', icon: Music },
    { value: 'life', label: 'Real Life', icon: Sparkles },
    { value: 'other', label: 'Other', icon: Globe },
  ]

  const addTag = () => {
    if (tagInput.trim() && !skillTags.includes(tagInput.trim())) {
      setSkillTags([...skillTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleSubmit = () => {
    if (sourceTitle && leadershipMoment && reflection) {
      onSubmit({
        sourceType,
        sourceTitle,
        sourceUrl: sourceUrl || undefined,
        leadershipMoment,
        reflection,
        skillTags
      })
      onClose()
      // Reset form
      setSourceTitle('')
      setSourceUrl('')
      setLeadershipMoment('')
      setReflection('')
      setSkillTags([])
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
            className="bg-surface-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-surface-700"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 border-b border-surface-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-xl">
                    <Sparkles className="text-yellow-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Share a Spark</h2>
                    <p className="text-xs text-surface-400">Found leadership in the wild? Share it!</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Source Type */}
              <div>
                <label className="text-sm font-medium text-surface-300 block mb-2">Where did you find it?</label>
                <div className="grid grid-cols-4 gap-2">
                  {sourceOptions.map(opt => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSourceType(opt.value as any)}
                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1
                          ${sourceType === opt.value 
                            ? 'bg-primary/20 border-primary text-primary' 
                            : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-500'
                          }`}
                      >
                        <Icon size={20} />
                        <span className="text-xs">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Source Title */}
              <div>
                <label className="text-sm font-medium text-surface-300 block mb-2">
                  What's it called?
                </label>
                <input
                  type="text"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder="e.g., The Office S3E10, 'Start with Why' TED Talk"
                  className="w-full bg-surface-800 border border-surface-600 rounded-xl p-3 text-white placeholder-surface-500 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Source URL (optional) */}
              <div>
                <label className="text-sm font-medium text-surface-300 block mb-2">
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-800 border border-surface-600 rounded-xl p-3 text-white placeholder-surface-500 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Leadership Moment */}
              <div>
                <label className="text-sm font-medium text-surface-300 block mb-2">
                  What was the leadership moment?
                </label>
                <textarea
                  value={leadershipMoment}
                  onChange={(e) => setLeadershipMoment(e.target.value)}
                  placeholder="Describe what happened that showed leadership..."
                  className="w-full bg-surface-800 border border-surface-600 rounded-xl p-3 text-white placeholder-surface-500 focus:border-primary focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              {/* Reflection */}
              <div>
                <label className="text-sm font-medium text-surface-300 block mb-2">
                  Why did this stand out to you?
                </label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="How does this connect to what we're learning or your own journey?"
                  className="w-full bg-surface-800 border border-surface-600 rounded-xl p-3 text-white placeholder-surface-500 focus:border-primary focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              {/* Skill Tags */}
              <div>
                <label className="text-sm font-medium text-surface-300 block mb-2">
                  What skills does this relate to?
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {skillTags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => setSkillTags(skillTags.filter(t => t !== tag))}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="e.g., Grit, Communication, Empathy"
                    className="flex-1 bg-surface-800 border border-surface-600 rounded-xl p-3 text-white placeholder-surface-500 focus:border-primary focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button onClick={addTag} className="p-3 bg-surface-700 rounded-xl text-white hover:bg-surface-600 transition-colors">
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!sourceTitle || !leadershipMoment || !reflection}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-surface-700 disabled:to-surface-700 disabled:text-surface-500 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Share Your Spark
              </button>
              
              <p className="text-xs text-surface-500 text-center">
                Sharing earns you 🌸 and helps others learn!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
