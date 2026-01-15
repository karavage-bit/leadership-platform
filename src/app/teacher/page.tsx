'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, BookOpen, AlertTriangle, ChevronRight, Check, X,
  LogOut, Clock, Award, MessageSquare, TrendingUp, Eye,
  Sparkles, Bell, Settings, ChevronDown, Play, Pause,
  BarChart3, Calendar, Filter, Search, RefreshCw
} from 'lucide-react'

interface ClassData {
  id: string
  name: string
  code: string
  current_lesson_id: number
}

interface StudentData {
  id: string
  name: string
  created_at: string
}

interface LessonData {
  id: number
  skill_name: string
  compelling_question: string
  phase_id: number
}

interface SubmissionData {
  id: string
  student_id: string
  lesson_id: number
  class_id: string
  reflections: any
  submitted_at: string
  review_status: string
  student?: StudentData
  lesson?: LessonData
}

interface CrisisAlert {
  id: string
  student_id: string
  trigger_type: string
  trigger_text: string
  status: string
  created_at: string
  student?: StudentData
}

interface DoNowStats {
  completed: number
  total: number
}

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [students, setStudents] = useState<StudentData[]>([])
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null)
  const [pendingReviews, setPendingReviews] = useState<SubmissionData[]>([])
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([])
  const [doNowStats, setDoNowStats] = useState<DoNowStats>({ completed: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'students' | 'alerts' | 'settings'>('overview')
  const [showClassDropdown, setShowClassDropdown] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadClassData(selectedClass.id)
    }
  }, [selectedClass])

  const loadInitialData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userData || userData.role !== 'teacher') {
        router.push('/')
        return
      }

      setUser(userData)

      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', authUser.id)
        .order('name')

      if (classesData && classesData.length > 0) {
        setClasses(classesData)
        setSelectedClass(classesData[0])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClassData = async (classId: string) => {
    setRefreshing(true)
    try {
      const { data: studentsData } = await supabase
        .from('users')
        .select('*')
        .eq('class_id', classId)
        .eq('role', 'student')
        .order('name')

      setStudents(studentsData || [])

      const classData = classes.find(c => c.id === classId)
      if (classData) {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', classData.current_lesson_id)
          .single()

        setCurrentLesson(lessonData)
      }

      const { data: reviewsData } = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('class_id', classId)
        .eq('review_status', 'pending')
        .order('submitted_at', { ascending: false })

      // Fetch student and lesson data separately
      const reviewsWithDetails = await Promise.all((reviewsData || []).map(async (review) => {
        const { data: student } = await supabase
          .from('users')
          .select('id, name')
          .eq('id', review.student_id)
          .single()
        
        const { data: lesson } = await supabase
          .from('lessons')
          .select('id, skill_name, phase_id')
          .eq('id', review.lesson_id)
          .single()

        return { ...review, student, lesson }
      }))

      setPendingReviews(reviewsWithDetails)

      const { data: alertsData } = await supabase
        .from('crisis_alerts')
        .select('*')
        .eq('class_id', classId)
        .eq('status', 'unread')
        .order('created_at', { ascending: false })

      // Fetch student data for alerts
      const alertsWithStudents = await Promise.all((alertsData || []).map(async (alert) => {
        const { data: student } = await supabase
          .from('users')
          .select('id, name')
          .eq('id', alert.student_id)
          .single()
        return { ...alert, student }
      }))

      setCrisisAlerts(alertsWithStudents)

      const today = new Date().toISOString().split('T')[0]
      const { data: doNowData } = await supabase
        .from('do_now_sessions')
        .select('id')
        .eq('class_id', classId)
        .eq('date', today)

      setDoNowStats({
        completed: doNowData?.length || 0,
        total: studentsData?.length || 0
      })
    } catch (error) {
      console.error('Error loading class data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const advanceLesson = async () => {
    if (!selectedClass || !currentLesson) return
    
    const nextLessonId = Math.min(currentLesson.id + 1, 45)
    
    await supabase
      .from('classes')
      .update({ current_lesson_id: nextLessonId })
      .eq('id', selectedClass.id)

    const studentInserts = students.map(s => ({
      student_id: s.id,
      lesson_id: nextLessonId,
      class_id: selectedClass.id,
      status: 'available'
    }))

    await supabase
      .from('student_lessons')
      .upsert(studentInserts, { onConflict: 'student_id,lesson_id' })

    setSelectedClass({ ...selectedClass, current_lesson_id: nextLessonId })
    loadClassData(selectedClass.id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const markAlertRead = async (alertId: string) => {
    await supabase
      .from('crisis_alerts')
      .update({ status: 'read' })
      .eq('id', alertId)

    setCrisisAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📚</span>
              <div>
                <h1 className="font-bold text-surface-100 text-lg">Teacher Dashboard</h1>
                <p className="text-xs text-surface-500">{user?.name}</p>
              </div>
            </div>

            {/* Class Selector */}
            <div className="relative">
              <button
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-surface-800 rounded-xl hover:bg-surface-700 transition-colors"
              >
                <span className="text-surface-200 font-medium">{selectedClass?.name}</span>
                <ChevronDown size={16} className="text-surface-400" />
              </button>
              
              <AnimatePresence>
                {showClassDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-0 bg-surface-800 rounded-xl border border-surface-700 shadow-xl overflow-hidden min-w-[200px] z-50"
                  >
                    {classes.map(cls => (
                      <button
                        key={cls.id}
                        onClick={() => {
                          setSelectedClass(cls)
                          setShowClassDropdown(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-surface-700 transition-colors flex items-center justify-between ${
                          selectedClass?.id === cls.id ? 'bg-primary-500/10 text-primary-400' : 'text-surface-200'
                        }`}
                      >
                        <span>{cls.name}</span>
                        <span className="text-xs text-surface-500 font-mono">{cls.code}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {crisisAlerts.length > 0 && (
              <motion.button
                onClick={() => setActiveTab('alerts')}
                className="flex items-center gap-2 px-3 py-2 bg-courage/20 border border-courage/30 rounded-xl text-courage"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle size={18} />
                <span className="font-semibold">{crisisAlerts.length} Alert{crisisAlerts.length !== 1 ? 's' : ''}</span>
              </motion.button>
            )}

            <button
              onClick={() => selectedClass && loadClassData(selectedClass.id)}
              className={`p-2 text-surface-400 hover:text-surface-200 rounded-lg hover:bg-surface-800 transition-all ${
                refreshing ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw size={20} />
            </button>

            <button 
              onClick={handleLogout} 
              className="p-2 text-surface-400 hover:text-surface-200 rounded-lg hover:bg-surface-800 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 -mb-px">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={BarChart3} label="Overview" />
            <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon={Award} label="Reviews" badge={pendingReviews.length} />
            <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={Users} label="Students" />
            <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={AlertTriangle} label="Alerts" badge={crisisAlerts.length} urgent={crisisAlerts.length > 0} />
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Settings" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab 
              currentLesson={currentLesson}
              students={students}
              doNowStats={doNowStats}
              pendingReviews={pendingReviews.length}
              selectedClass={selectedClass}
              onAdvanceLesson={advanceLesson}
            />
          )}
          
          {activeTab === 'reviews' && (
            <ReviewsTab 
              reviews={pendingReviews}
              onReviewComplete={() => selectedClass && loadClassData(selectedClass.id)}
            />
          )}
          
          {activeTab === 'students' && (
            <StudentsTab 
              students={students}
              classId={selectedClass?.id}
              currentLessonId={currentLesson?.id || 1}
            />
          )}
          
          {activeTab === 'alerts' && (
            <AlertsTab 
              alerts={crisisAlerts}
              onMarkRead={markAlertRead}
            />
          )}
          
          {activeTab === 'settings' && (
            <SettingsTab 
              selectedClass={selectedClass}
              classes={classes}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label, badge, urgent }: {
  active: boolean
  onClick: () => void
  icon: any
  label: string
  badge?: number
  urgent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 ${
        active 
          ? 'text-primary-400 border-primary-500 bg-primary-500/5' 
          : 'text-surface-400 border-transparent hover:text-surface-200 hover:bg-surface-800/50'
      }`}
    >
      <Icon size={18} />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
          urgent ? 'bg-courage text-white' : 'bg-surface-700 text-surface-300'
        }`}>
          {badge}
        </span>
      )}
    </button>
  )
}

function OverviewTab({ currentLesson, students, doNowStats, pendingReviews, selectedClass, onAdvanceLesson }: {
  currentLesson: LessonData | null
  students: StudentData[]
  doNowStats: DoNowStats
  pendingReviews: number
  selectedClass: ClassData | null
  onAdvanceLesson: () => void
}) {
  const phaseColors: Record<number, string> = { 1: 'care', 2: 'creation', 3: 'courage', 4: 'community' }
  const phaseNames: Record<number, string> = { 1: 'Hardware', 2: 'Direction', 3: 'Toolbelt', 4: 'Blueprint' }

  return (
    <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className={`card p-6 phase-${currentLesson?.phase_id}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`badge badge-${phaseColors[currentLesson?.phase_id as keyof typeof phaseColors]}`}>
                Phase {currentLesson?.phase_id}: {phaseNames[currentLesson?.phase_id as keyof typeof phaseNames]}
              </span>
              <span className="text-surface-500 text-sm">Lesson {currentLesson?.id} of 45</span>
            </div>
            <h2 className="text-2xl font-bold text-surface-100 mb-2">{currentLesson?.skill_name}</h2>
            <p className="text-surface-400 italic">"{currentLesson?.compelling_question}"</p>
          </div>
          <motion.button
            onClick={onAdvanceLesson}
            className="btn btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentLesson?.id === 45}
          >
            Advance to Next Lesson <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Students" value={students.length} color="primary" />
        <StatCard icon={MessageSquare} label="Do Now Today" value={`${doNowStats.completed}/${doNowStats.total}`} color="care" progress={(doNowStats.completed / Math.max(doNowStats.total, 1)) * 100} />
        <StatCard icon={Award} label="Pending Reviews" value={pendingReviews} color="creation" />
        <StatCard icon={TrendingUp} label="Course Progress" value={`${Math.round(((currentLesson?.id || 1) / 45) * 100)}%`} color="community" progress={((currentLesson?.id || 1) / 45) * 100} />
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-surface-100 mb-4 flex items-center gap-2">
          <Sparkles className="text-primary-400" size={20} />
          Class Join Code
        </h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="px-6 py-4 bg-surface-800 rounded-xl border-2 border-dashed border-surface-600">
            <span className="text-4xl font-mono font-bold tracking-widest text-primary-400">
              {selectedClass?.code}
            </span>
          </div>
          <div className="text-surface-400 text-sm">
            <p>Share this code with students to join the class.</p>
            <p className="mt-1">Students enter their name + this code + create a PIN.</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value, color, progress }: {
  icon: any; label: string; value: string | number; color: string; progress?: number
}) {
  return (
    <motion.div className="card p-5" whileHover={{ scale: 1.02 }}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}/20 flex items-center justify-center`}>
          <Icon className={`text-${color}`} size={20} />
        </div>
        <span className="text-surface-400 text-sm">{label}</span>
      </div>
      <div className="text-3xl font-bold text-surface-100">{value}</div>
      {progress !== undefined && (
        <div className="mt-3 progress-bar">
          <div className={`progress-fill bg-${color}`} style={{ width: `${progress}%` }} />
        </div>
      )}
    </motion.div>
  )
}

function ReviewsTab({ reviews, onReviewComplete }: { reviews: SubmissionData[]; onReviewComplete: () => void }) {
  const [selectedReview, setSelectedReview] = useState<SubmissionData | null>(null)

  return (
    <motion.div key="reviews" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-surface-100">Pending Reviews</h2>
        <span className="badge badge-creation">{reviews.length} pending</span>
      </div>

      {reviews.length === 0 ? (
        <div className="card p-12 text-center">
          <Award size={48} className="mx-auto mb-4 text-surface-600" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">All caught up!</h3>
          <p className="text-surface-500">No challenge submissions waiting for review.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              className="card p-5 cursor-pointer hover:border-primary-500/30"
              onClick={() => setSelectedReview(review)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-surface-100">{review.student?.name}</h3>
                  <p className="text-sm text-surface-500">Lesson {review.lesson_id}: {review.lesson?.skill_name}</p>
                </div>
                <span className="badge badge-primary">
                  <Clock size={12} className="mr-1" />
                  {new Date(review.submitted_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-surface-400 text-sm line-clamp-2">
                {review.reflections?.['What I did'] || 'No description provided'}
              </p>
              <button className="btn btn-primary btn-sm mt-3">Review <ChevronRight size={16} /></button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedReview && (
          <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} onComplete={() => { setSelectedReview(null); onReviewComplete() }} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ReviewModal({ review, onClose, onComplete }: { review: SubmissionData; onClose: () => void; onComplete: () => void }) {
  const [score, setScore] = useState<number>(3)
  const [feedback, setFeedback] = useState('')
  const [civicDescription, setCivicDescription] = useState('')
  const [approveForCivic, setApproveForCivic] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await supabase.from('challenge_submissions').update({
        review_status: 'reviewed',
        review_score: score,
        review_feedback: feedback,
        reviewed_at: new Date().toISOString(),
        approved_for_civic: approveForCivic,
        civic_description: approveForCivic ? civicDescription : null
      }).eq('id', review.id)

      // Update world state
      await supabase.from('world_states').update({
        trees: score >= 3 ? 1 : 0,
        tower: score === 4 ? 1 : 0
      }).eq('student_id', review.student_id)

      if (approveForCivic && civicDescription) {
        await supabase.from('civic_events').insert({
          class_id: review.class_id,
          phase_id: review.lesson?.phase_id || 1,
          skill_name: review.lesson?.skill_name || 'Unknown',
          skill_category: ['care', 'creation', 'courage', 'community'][(review.lesson?.phase_id || 1) - 1],
          anonymized_description: civicDescription,
          event_type: 'challenge_complete'
        })
      }

      onComplete()
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const rubricDescriptions: Record<number, string> = {
    1: 'Developing - Needs more effort and depth',
    2: 'Approaching - Shows understanding but incomplete',
    3: 'Meeting - Solid demonstration of skill',
    4: 'Exceeding - Exceptional application of skill'
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-surface-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-surface-800 flex items-center justify-between sticky top-0 bg-surface-900 z-10">
          <div>
            <h2 className="font-semibold text-surface-100">{review.student?.name}'s Challenge</h2>
            <p className="text-sm text-surface-500">Lesson {review.lesson_id}: {review.lesson?.skill_name}</p>
          </div>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300 p-1"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-surface-200 mb-3">Student's Response</h3>
            <div className="card p-4 bg-surface-800/50">
              <p className="text-surface-300 whitespace-pre-wrap">{review.reflections?.['What I did'] || 'No description provided'}</p>
              {review.reflections?.['Evidence/Proof'] && (
                <div className="mt-3 pt-3 border-t border-surface-700">
                  <span className="text-xs text-surface-500 uppercase tracking-wide">Evidence</span>
                  <p className="text-surface-400 mt-1">{review.reflections['Evidence/Proof']}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-surface-200 mb-3">Mastery Score</h3>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((s) => (
                <button key={s} onClick={() => setScore(s)} className={`p-4 rounded-xl text-center transition-all ${score === s ? 'bg-primary-500 text-white ring-2 ring-primary-400' : 'bg-surface-800 text-surface-400 hover:bg-surface-700'}`}>
                  <div className="text-2xl font-bold">{s}</div>
                </button>
              ))}
            </div>
            <p className="text-sm text-surface-400 mt-2 text-center">{rubricDescriptions[score]}</p>
          </div>

          <div>
            <label className="label">Feedback for Student</label>
            <textarea className="input" rows={3} placeholder="What did they do well? What could they improve?" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>

          <div className="card p-4 bg-community/10 border-community/30">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={approveForCivic} onChange={(e) => setApproveForCivic(e.target.checked)} className="w-5 h-5 rounded bg-surface-800 border-surface-600" />
              <span className="text-surface-200">Share anonymized version in Civic World</span>
            </label>
            {approveForCivic && (
              <div className="mt-4">
                <label className="label">Write an anonymized description</label>
                <textarea className="input" rows={2} placeholder="A student demonstrated active listening by..." value={civicDescription} onChange={(e) => setCivicDescription(e.target.value)} />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary flex-1">{submitting ? 'Submitting...' : 'Submit Review'}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StudentsTab({ students, classId, currentLessonId }: { students: StudentData[]; classId: string | undefined; currentLessonId: number }) {
  const [studentProgress, setStudentProgress] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadStudentProgress()
  }, [students, currentLessonId])

  const loadStudentProgress = async () => {
    if (!classId) return
    const { data } = await supabase.from('student_lessons').select('*').eq('class_id', classId).eq('lesson_id', currentLessonId)
    const progressMap: Record<string, any> = {}
    data?.forEach(p => { progressMap[p.student_id] = p })
    setStudentProgress(progressMap)
  }

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <motion.div key="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-surface-100">Students ({students.length})</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" size={18} />
          <input type="text" placeholder="Search students..." className="input pl-10 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-surface-600" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">No students yet</h3>
          <p className="text-surface-500">Share your class code with students to get started.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-surface-800">
              <tr>
                <th className="text-left px-4 py-3 text-surface-400 font-medium text-sm">Student</th>
                <th className="text-center px-4 py-3 text-surface-400 font-medium text-sm">Do Now</th>
                <th className="text-center px-4 py-3 text-surface-400 font-medium text-sm">Text</th>
                <th className="text-center px-4 py-3 text-surface-400 font-medium text-sm">Scenario</th>
                <th className="text-center px-4 py-3 text-surface-400 font-medium text-sm">Challenge</th>
                <th className="text-center px-4 py-3 text-surface-400 font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const progress = studentProgress[student.id] || {}
                return (
                  <tr key={student.id} className="border-t border-surface-800 hover:bg-surface-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-community flex items-center justify-center text-white font-bold text-sm">{student.name[0]}</div>
                        <span className="text-surface-200 font-medium">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusDot complete={progress.do_now_complete} /></td>
                    <td className="px-4 py-3 text-center"><StatusDot complete={progress.text_anchor_complete} /></td>
                    <td className="px-4 py-3 text-center"><StatusDot complete={progress.scenario_complete} /></td>
                    <td className="px-4 py-3 text-center"><StatusDot complete={progress.challenge_complete} /></td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${progress.status === 'complete' ? 'badge-care' : progress.status === 'in_progress' ? 'badge-creation' : 'bg-surface-800 text-surface-500'}`}>
                        {progress.status || 'Not started'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

function StatusDot({ complete }: { complete: boolean }) {
  return (
    <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${complete ? 'bg-care/20' : 'bg-surface-800'}`}>
      {complete ? <Check size={14} className="text-care" /> : <div className="w-2 h-2 rounded-full bg-surface-600" />}
    </div>
  )
}

function AlertsTab({ alerts, onMarkRead }: { alerts: CrisisAlert[]; onMarkRead: (id: string) => void }) {
  const triggerLabels: Record<string, { label: string; color: string }> = {
    self_harm: { label: 'Self-Harm Concern', color: 'courage' },
    helplessness: { label: 'Helplessness', color: 'creation' },
    rage: { label: 'Intense Anger', color: 'courage' },
    abuse: { label: 'Possible Abuse', color: 'courage' }
  }

  return (
    <motion.div key="alerts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-surface-100">Crisis Alerts</h2>
        {alerts.length > 0 && <span className="badge bg-courage text-white">{alerts.length} unread</span>}
      </div>

      <div className="card p-4 bg-surface-800/50 border-surface-700">
        <p className="text-surface-300 text-sm">
          <strong className="text-surface-100">Important:</strong> These alerts are triggered when a student's conversation indicates they may be struggling. Reach out privately and consider involving school counselors.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <Check size={48} className="mx-auto mb-4 text-care" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">No active alerts</h3>
          <p className="text-surface-500">All students appear to be doing well.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <motion.div key={alert.id} className="card p-5 border-courage/50 bg-courage/5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <AlertTriangle className="text-courage" size={20} />
                    <span className={`badge badge-${triggerLabels[alert.trigger_type]?.color || 'courage'}`}>
                      {triggerLabels[alert.trigger_type]?.label || alert.trigger_type}
                    </span>
                    <span className="text-surface-500 text-sm">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="font-semibold text-surface-100 mb-2">{alert.student?.name}</h3>
                  <div className="bg-surface-900 rounded-xl p-4 border border-surface-700">
                    <p className="text-surface-300 text-sm italic">"{alert.trigger_text}"</p>
                  </div>
                </div>
                <button onClick={() => onMarkRead(alert.id)} className="btn btn-secondary btn-sm">Mark as Read</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function SettingsTab({ selectedClass, classes }: { selectedClass: ClassData | null; classes: ClassData[] }) {
  return (
    <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-surface-100">Settings</h2>

      <div className="card p-6">
        <h3 className="font-semibold text-surface-100 mb-4">Class Codes</h3>
        <div className="space-y-3">
          {classes.map(cls => (
            <div key={cls.id} className="flex items-center justify-between p-4 bg-surface-800/50 rounded-xl">
              <span className="text-surface-200">{cls.name}</span>
              <span className="font-mono text-xl font-bold text-primary-400">{cls.code}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-surface-100 mb-4">Curriculum Overview</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-care/10 rounded-xl border border-care/30">
            <h4 className="font-semibold text-care mb-2">Phase 1: Hardware</h4>
            <p className="text-surface-400 text-sm">Lessons 1-10: Self-Awareness, Attention, Impulse Control</p>
          </div>
          <div className="p-4 bg-creation/10 rounded-xl border border-creation/30">
            <h4 className="font-semibold text-creation mb-2">Phase 2: Direction</h4>
            <p className="text-surface-400 text-sm">Lessons 11-22: Values, Resilience, Standards</p>
          </div>
          <div className="p-4 bg-courage/10 rounded-xl border border-courage/30">
            <h4 className="font-semibold text-courage mb-2">Phase 3: Toolbelt</h4>
            <p className="text-surface-400 text-sm">Lessons 23-32: Strategy, Risk, Agency</p>
          </div>
          <div className="p-4 bg-community/10 rounded-xl border border-community/30">
            <h4 className="font-semibold text-community mb-2">Phase 4: Blueprint</h4>
            <p className="text-surface-400 text-sm">Lessons 33-45: Leadership, Service, Legacy</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-surface-100 mb-4">About Leadership 2.0</h3>
        <p className="text-surface-400 mb-4">
          A research-backed leadership development platform that builds real skills through real action. 
          Students develop executive function, resilience, and leadership capacity through daily practice.
        </p>
        <p className="text-surface-500 text-sm">
          <strong>Principle:</strong> "The 51/49 Rule" — Master yourself before leading others. 
          Consistency over intensity. Deeds not words.
        </p>
      </div>
    </motion.div>
  )
}
