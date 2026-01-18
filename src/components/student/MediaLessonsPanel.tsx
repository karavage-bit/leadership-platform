'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, BookOpen, MessageSquare, Play, Check, Calendar, ChevronRight, X } from 'lucide-react'

interface MediaLesson {
  id: string
  title: string
  media_type: 'video' | 'reading' | 'both'
  video_url: string | null
  reading_content: string | null
  socratic_prompt: string | null
  due_date: string | null
  completion?: {
    watched_video: boolean
    read_content: boolean
    socratic_completed: boolean
  }
}

interface MediaLessonsPanelProps {
  classId: string
  studentId: string
  onOpenSocratic?: (prompt: string, lessonId: string, lessonTitle: string) => void
}

export default function MediaLessonsPanel({ classId, studentId, onOpenSocratic }: MediaLessonsPanelProps) {
  const [lessons, setLessons] = useState<MediaLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingLesson, setViewingLesson] = useState<MediaLesson | null>(null)
  const [markingComplete, setMarkingComplete] = useState<{id: string; type: string} | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadLessons()
  }, [classId, studentId])

  const loadLessons = async () => {
    setLoading(true)
    
    const { data: lessonsData } = await supabase
      .from('media_lessons')
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const { data: completions } = await supabase
      .from('media_lesson_completions')
      .select('media_lesson_id, watched_video, read_content, socratic_completed')
      .eq('student_id', studentId)

    const completionMap: Record<string, any> = {}
    completions?.forEach(c => { completionMap[c.media_lesson_id] = c })
    
    setLessons((lessonsData || []).map(l => ({
      ...l,
      completion: completionMap[l.id] || { watched_video: false, read_content: false, socratic_completed: false }
    })))
    setLoading(false)
  }

  const markComplete = async (lessonId: string, type: 'watched_video' | 'read_content') => {
    setMarkingComplete({ id: lessonId, type })
    
    // Upsert completion
    const { data: existing } = await supabase
      .from('media_lesson_completions')
      .select('*')
      .eq('media_lesson_id', lessonId)
      .eq('student_id', studentId)
      .single()

    if (existing) {
      await supabase
        .from('media_lesson_completions')
        .update({ [type]: true })
        .eq('id', existing.id)
    } else {
      await supabase.from('media_lesson_completions').insert({
        media_lesson_id: lessonId,
        student_id: studentId,
        [type]: true
      })
    }

    // Log activity
    await supabase.from('student_activity_log').insert({
      student_id: studentId,
      class_id: classId,
      activity_type: type === 'watched_video' ? 'media_lesson_video_watched' : 'media_lesson_read',
      activity_data: { lesson_id: lessonId }
    })

    setMarkingComplete(null)
    loadLessons()
  }

  const handleDiscuss = async (lesson: MediaLesson) => {
    if (!lesson.socratic_prompt) return
    
    // Mark socratic as started
    const { data: existing } = await supabase
      .from('media_lesson_completions')
      .select('*')
      .eq('media_lesson_id', lesson.id)
      .eq('student_id', studentId)
      .single()

    if (!existing) {
      await supabase.from('media_lesson_completions').insert({
        media_lesson_id: lesson.id,
        student_id: studentId
      })
    }

    // Log activity
    await supabase.from('student_activity_log').insert({
      student_id: studentId,
      class_id: classId,
      activity_type: 'media_lesson_socratic_started',
      activity_data: { lesson_id: lesson.id, title: lesson.title }
    })

    onOpenSocratic?.(lesson.socratic_prompt, lesson.id, lesson.title)
    setViewingLesson(null)
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
    return url
  }

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  if (lessons.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-200 flex items-center gap-2">
        <Video className="text-purple-400" size={20} />
        Media Lessons
      </h3>

      <div className="space-y-3">
        {lessons.map(lesson => {
          const isVideoComplete = lesson.completion?.watched_video
          const isReadComplete = lesson.completion?.read_content
          const isSocraticComplete = lesson.completion?.socratic_completed
          const needsVideo = lesson.media_type === 'video' || lesson.media_type === 'both'
          const needsReading = lesson.media_type === 'reading' || lesson.media_type === 'both'
          const canDiscuss = lesson.socratic_prompt && (
            (!needsVideo || isVideoComplete) && (!needsReading || isReadComplete)
          )
          const isFullyComplete = (
            (!needsVideo || isVideoComplete) &&
            (!needsReading || isReadComplete) &&
            (!lesson.socratic_prompt || isSocraticComplete)
          )
          
          return (
            <motion.div
              key={lesson.id}
              className={`card p-4 cursor-pointer ${isFullyComplete ? 'opacity-60' : 'bg-gradient-to-r from-purple-900/20 to-surface-900 border-purple-500/30'}`}
              onClick={() => setViewingLesson(lesson)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isFullyComplete ? 'bg-green-500/20 text-green-400' :
                  lesson.media_type === 'video' ? 'bg-red-500/20 text-red-400' :
                  lesson.media_type === 'reading' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {isFullyComplete ? <Check size={20} /> :
                   lesson.media_type === 'video' ? <Video size={20} /> :
                   lesson.media_type === 'reading' ? <BookOpen size={20} /> :
                   <Play size={20} />}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${isFullyComplete ? 'text-surface-400 line-through' : 'text-surface-100'}`}>
                    {lesson.title}
                  </h4>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {needsVideo && (
                      <span className={`flex items-center gap-1 ${isVideoComplete ? 'text-green-400' : 'text-surface-500'}`}>
                        <Video size={12} />
                        {isVideoComplete ? 'Watched' : 'Video'}
                      </span>
                    )}
                    {needsReading && (
                      <span className={`flex items-center gap-1 ${isReadComplete ? 'text-green-400' : 'text-surface-500'}`}>
                        <BookOpen size={12} />
                        {isReadComplete ? 'Read' : 'Reading'}
                      </span>
                    )}
                    {lesson.socratic_prompt && (
                      <span className={`flex items-center gap-1 ${isSocraticComplete ? 'text-green-400' : canDiscuss ? 'text-purple-400' : 'text-surface-500'}`}>
                        <MessageSquare size={12} />
                        {isSocraticComplete ? 'Discussed' : 'Discuss with AI'}
                      </span>
                    )}
                  </div>
                  
                  {lesson.due_date && (
                    <div className="flex items-center gap-1 text-surface-500 text-xs mt-2">
                      <Calendar size={12} />
                      Due {new Date(lesson.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <ChevronRight size={16} className="text-surface-500" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Lesson Viewer Modal */}
      <AnimatePresence>
        {viewingLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingLesson(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-surface-800 flex items-center justify-between sticky top-0 bg-surface-900 z-10">
                <h2 className="font-semibold text-surface-100">{viewingLesson.title}</h2>
                <button onClick={() => setViewingLesson(null)} className="text-surface-500 hover:text-surface-300">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
                {/* Video */}
                {viewingLesson.video_url && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-surface-200 flex items-center gap-2">
                        <Video size={18} className="text-red-400" />
                        Video
                      </h3>
                      {!viewingLesson.completion?.watched_video && (
                        <button
                          onClick={() => markComplete(viewingLesson.id, 'watched_video')}
                          disabled={markingComplete?.id === viewingLesson.id}
                          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm flex items-center gap-1"
                        >
                          <Check size={14} /> Mark Watched
                        </button>
                      )}
                    </div>
                    <div className="aspect-video bg-black rounded-xl overflow-hidden">
                      <iframe
                        src={getYouTubeEmbedUrl(viewingLesson.video_url)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Reading */}
                {viewingLesson.reading_content && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-surface-200 flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-400" />
                        Reading
                      </h3>
                      {!viewingLesson.completion?.read_content && (
                        <button
                          onClick={() => markComplete(viewingLesson.id, 'read_content')}
                          disabled={markingComplete?.id === viewingLesson.id}
                          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm flex items-center gap-1"
                        >
                          <Check size={14} /> Mark Read
                        </button>
                      )}
                    </div>
                    <div className="p-4 bg-surface-800 rounded-xl text-surface-300 text-sm whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                      {viewingLesson.reading_content}
                    </div>
                  </div>
                )}

                {/* Discuss with AI */}
                {viewingLesson.socratic_prompt && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <h3 className="font-semibold text-purple-300 flex items-center gap-2 mb-2">
                      <MessageSquare size={18} />
                      Discuss with AI
                    </h3>
                    <p className="text-surface-400 text-sm mb-4">
                      After consuming the media, have a Socratic discussion to deepen your understanding.
                    </p>
                    {(() => {
                      const needsVideo = viewingLesson.media_type === 'video' || viewingLesson.media_type === 'both'
                      const needsReading = viewingLesson.media_type === 'reading' || viewingLesson.media_type === 'both'
                      const canDiscuss = (!needsVideo || viewingLesson.completion?.watched_video) && 
                                        (!needsReading || viewingLesson.completion?.read_content)
                      
                      if (viewingLesson.completion?.socratic_completed) {
                        return (
                          <div className="flex items-center gap-2 text-green-400">
                            <Check size={18} />
                            Discussion completed!
                          </div>
                        )
                      }
                      
                      if (!canDiscuss) {
                        return (
                          <p className="text-surface-500 text-sm">
                            Complete the {needsVideo && !viewingLesson.completion?.watched_video ? 'video' : 'reading'} first to unlock discussion.
                          </p>
                        )
                      }
                      
                      return (
                        <button
                          onClick={() => handleDiscuss(viewingLesson)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium flex items-center gap-2"
                        >
                          <MessageSquare size={18} />
                          Start Discussion
                        </button>
                      )
                    })()}
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
