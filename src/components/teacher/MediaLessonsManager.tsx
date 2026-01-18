'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, BookOpen, MessageSquare, Plus, X, Calendar, ToggleLeft, ToggleRight, Eye } from 'lucide-react'

interface MediaLesson {
  id: string
  title: string
  media_type: 'video' | 'reading' | 'both'
  video_url: string | null
  reading_content: string | null
  socratic_prompt: string | null
  is_active: boolean
  due_date: string | null
  created_at: string
  completion_stats?: {
    watched: number
    read: number
    discussed: number
  }
}

export default function MediaLessonsManager({ classId, teacherId, studentCount }: { classId: string; teacherId: string; studentCount: number }) {
  const [lessons, setLessons] = useState<MediaLesson[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewingLesson, setViewingLesson] = useState<MediaLesson | null>(null)
  
  const [title, setTitle] = useState('')
  const [mediaType, setMediaType] = useState<'video' | 'reading' | 'both'>('video')
  const [videoUrl, setVideoUrl] = useState('')
  const [readingContent, setReadingContent] = useState('')
  const [socraticPrompt, setSocraticPrompt] = useState('')
  const [dueDate, setDueDate] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    loadLessons()
  }, [classId])

  const loadLessons = async () => {
    setLoading(true)
    const { data: lessonsData } = await supabase
      .from('media_lessons')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    // Get completion stats
    const { data: completions } = await supabase
      .from('media_lesson_completions')
      .select('media_lesson_id, watched_video, read_content, socratic_completed')
      .in('media_lesson_id', lessonsData?.map(l => l.id) || [])

    const stats: Record<string, { watched: number; read: number; discussed: number }> = {}
    completions?.forEach(c => {
      if (!stats[c.media_lesson_id]) {
        stats[c.media_lesson_id] = { watched: 0, read: 0, discussed: 0 }
      }
      if (c.watched_video) stats[c.media_lesson_id].watched++
      if (c.read_content) stats[c.media_lesson_id].read++
      if (c.socratic_completed) stats[c.media_lesson_id].discussed++
    })

    setLessons((lessonsData || []).map(l => ({
      ...l,
      completion_stats: stats[l.id] || { watched: 0, read: 0, discussed: 0 }
    })))
    setLoading(false)
  }

  const createLesson = async () => {
    if (!title.trim()) return
    if (mediaType === 'video' && !videoUrl.trim()) return
    if (mediaType === 'reading' && !readingContent.trim()) return
    if (mediaType === 'both' && (!videoUrl.trim() || !readingContent.trim())) return
    
    setSaving(true)
    
    await supabase.from('media_lessons').insert({
      class_id: classId,
      teacher_id: teacherId,
      title: title.trim(),
      media_type: mediaType,
      video_url: videoUrl.trim() || null,
      reading_content: readingContent.trim() || null,
      socratic_prompt: socraticPrompt.trim() || null,
      due_date: dueDate || null,
      is_active: true
    })

    // Log activity
    await supabase.from('student_activity_log').insert({
      class_id: classId,
      activity_type: 'media_lesson_created',
      activity_data: { title, media_type: mediaType }
    })

    setTitle('')
    setMediaType('video')
    setVideoUrl('')
    setReadingContent('')
    setSocraticPrompt('')
    setDueDate('')
    setShowForm(false)
    setSaving(false)
    loadLessons()
  }

  const toggleLessonActive = async (id: string, currentActive: boolean) => {
    await supabase.from('media_lessons').update({ is_active: !currentActive }).eq('id', id)
    loadLessons()
  }

  const deleteLesson = async (id: string) => {
    await supabase.from('media_lessons').delete().eq('id', id)
    setLessons(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
          <Video className="text-purple-400" size={24} />
          Media Lessons
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <Plus size={18} /> New Media Lesson
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-100">Create Media Lesson</h3>
              <button onClick={() => setShowForm(false)} className="text-surface-500 hover:text-surface-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Title</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Lesson title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Media Type</label>
                  <select
                    className="input"
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as any)}
                  >
                    <option value="video">Video Only</option>
                    <option value="reading">Reading Only</option>
                    <option value="both">Video + Reading</option>
                  </select>
                </div>
              </div>
              
              {(mediaType === 'video' || mediaType === 'both') && (
                <div>
                  <label className="label">Video URL (YouTube/Vimeo)</label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              )}
              
              {(mediaType === 'reading' || mediaType === 'both') && (
                <div>
                  <label className="label">Reading Content</label>
                  <textarea
                    className="input"
                    rows={6}
                    placeholder="Enter reading material..."
                    value={readingContent}
                    onChange={(e) => setReadingContent(e.target.value)}
                  />
                </div>
              )}
              
              <div>
                <label className="label">Socratic Prompt (for AI discussion after consuming media)</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="What questions should the AI guide students through after they finish? e.g., 'Help students reflect on how the concepts in this video apply to their leadership journey...'"
                  value={socraticPrompt}
                  onChange={(e) => setSocraticPrompt(e.target.value)}
                />
              </div>
              
              <div>
                <label className="label">Due Date (optional)</label>
                <input
                  type="datetime-local"
                  className="input w-auto"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button 
                  onClick={createLesson} 
                  disabled={saving || !title.trim()}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Creating...' : 'Create Lesson'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lessons List */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="card p-12 text-center">
          <Video size={48} className="mx-auto mb-4 text-surface-600" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">No media lessons</h3>
          <p className="text-surface-500">Create video or reading lessons with AI-powered discussions.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {lessons.map(lesson => (
            <div
              key={lesson.id}
              className={`card p-4 ${lesson.is_active ? '' : 'opacity-50'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    lesson.media_type === 'video' ? 'bg-red-500/20 text-red-400' :
                    lesson.media_type === 'reading' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {lesson.media_type === 'video' ? <Video size={20} /> :
                     lesson.media_type === 'reading' ? <BookOpen size={20} /> :
                     <><Video size={14} /><BookOpen size={14} /></>}
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-100">{lesson.title}</h3>
                    <span className="text-xs text-surface-500 capitalize">{lesson.media_type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingLesson(lesson)}
                    className="p-2 text-surface-500 hover:text-surface-300 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => toggleLessonActive(lesson.id, lesson.is_active)}
                    className={`p-2 rounded-lg transition-colors ${lesson.is_active ? 'text-green-400' : 'text-surface-500'}`}
                  >
                    {lesson.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>
              
              {lesson.socratic_prompt && (
                <div className="flex items-center gap-2 text-sm text-purple-400 mb-3">
                  <MessageSquare size={14} />
                  <span>AI Discussion Enabled</span>
                </div>
              )}
              
              {lesson.due_date && (
                <div className="flex items-center gap-2 text-sm text-surface-500 mb-3">
                  <Calendar size={14} />
                  <span>Due: {new Date(lesson.due_date).toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                {(lesson.media_type === 'video' || lesson.media_type === 'both') && (
                  <div className="p-2 bg-surface-800 rounded-lg">
                    <div className="text-lg font-bold text-red-400">{lesson.completion_stats?.watched || 0}</div>
                    <div className="text-surface-500">Watched</div>
                  </div>
                )}
                {(lesson.media_type === 'reading' || lesson.media_type === 'both') && (
                  <div className="p-2 bg-surface-800 rounded-lg">
                    <div className="text-lg font-bold text-blue-400">{lesson.completion_stats?.read || 0}</div>
                    <div className="text-surface-500">Read</div>
                  </div>
                )}
                <div className="p-2 bg-surface-800 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">{lesson.completion_stats?.discussed || 0}</div>
                  <div className="text-surface-500">Discussed</div>
                </div>
              </div>
              
              <button
                onClick={() => deleteLesson(lesson.id)}
                className="text-surface-500 hover:text-red-400 text-xs"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lesson Detail Modal */}
      <AnimatePresence>
        {viewingLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingLesson(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-surface-800 flex items-center justify-between sticky top-0 bg-surface-900">
                <h2 className="font-semibold text-surface-100">{viewingLesson.title}</h2>
                <button onClick={() => setViewingLesson(null)} className="text-surface-500 hover:text-surface-300">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {viewingLesson.video_url && (
                  <div>
                    <h3 className="font-semibold text-surface-200 mb-2 flex items-center gap-2">
                      <Video size={16} className="text-red-400" /> Video
                    </h3>
                    <p className="text-surface-400 text-sm break-all">{viewingLesson.video_url}</p>
                  </div>
                )}
                {viewingLesson.reading_content && (
                  <div>
                    <h3 className="font-semibold text-surface-200 mb-2 flex items-center gap-2">
                      <BookOpen size={16} className="text-blue-400" /> Reading Content
                    </h3>
                    <div className="p-4 bg-surface-800 rounded-lg text-surface-300 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {viewingLesson.reading_content}
                    </div>
                  </div>
                )}
                {viewingLesson.socratic_prompt && (
                  <div>
                    <h3 className="font-semibold text-surface-200 mb-2 flex items-center gap-2">
                      <MessageSquare size={16} className="text-purple-400" /> Socratic Prompt
                    </h3>
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg text-surface-300 text-sm">
                      {viewingLesson.socratic_prompt}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
