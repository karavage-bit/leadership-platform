'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Sparkles, TreePine, Flower2, Gem } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LessonProgress {
  lesson_id: number
  skill_name: string
  completed_at: string
  do_now_complete: boolean
  scenario_complete: boolean
  challenge_complete: boolean
}

interface TimelineMemoryMapProps {
  studentId: string
}

export default function TimelineMemoryMap({ studentId }: TimelineMemoryMapProps) {
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProgress()
  }, [studentId])

  const loadProgress = async () => {
    const { data } = await supabase
      .from('student_lessons')
      .select(`
        lesson_id,
        do_now_complete,
        scenario_complete,
        challenge_complete,
        updated_at,
        lessons (
          skill_name,
          phase_id
        )
      `)
      .eq('student_id', studentId)
      .order('lesson_id')

    if (data) {
      setProgress(data.map(d => ({
        lesson_id: d.lesson_id,
        skill_name: d.lessons?.skill_name || '',
        completed_at: d.updated_at,
        do_now_complete: d.do_now_complete,
        scenario_complete: d.scenario_complete,
        challenge_complete: d.challenge_complete
      })))
    }
    setLoading(false)
  }

  // Group by weeks
  const weeks = progress.reduce((acc, item) => {
    const weekNum = Math.floor((item.lesson_id - 1) / 5)
    if (!acc[weekNum]) acc[weekNum] = []
    acc[weekNum].push(item)
    return acc
  }, {} as Record<number, LessonProgress[]>)

  const weekKeys = Object.keys(weeks).map(Number).sort((a, b) => a - b)
  const currentWeekData = weeks[weekKeys[selectedWeek]] || []

  const getCompletionLevel = (item: LessonProgress) => {
    let level = 0
    if (item.do_now_complete) level++
    if (item.scenario_complete) level++
    if (item.challenge_complete) level++
    return level
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="bg-surface-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary-400" />
          <h2 className="text-xl font-bold text-white">Your Journey</h2>
        </div>
        
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
            disabled={selectedWeek === 0}
            className="p-2 bg-surface-700 hover:bg-surface-600 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-surface-300 px-3">
            Week {selectedWeek + 1}
          </span>
          <button
            onClick={() => setSelectedWeek(Math.min(weekKeys.length - 1, selectedWeek + 1))}
            disabled={selectedWeek >= weekKeys.length - 1}
            className="p-2 bg-surface-700 hover:bg-surface-600 rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-700" />
        
        {/* Lessons */}
        <div className="space-y-4">
          {currentWeekData.map((item, index) => {
            const level = getCompletionLevel(item)
            const isComplete = level === 3
            
            return (
              <motion.div
                key={item.lesson_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-16"
              >
                {/* Node */}
                <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                  isComplete ? 'bg-primary-500 border-primary-500' :
                  level > 0 ? 'bg-surface-800 border-primary-500' :
                  'bg-surface-800 border-surface-600'
                }`}>
                  {isComplete && (
                    <Sparkles className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                  )}
                </div>
                
                {/* Content */}
                <div className={`p-4 rounded-xl ${
                  isComplete ? 'bg-primary-500/10 border border-primary-500/30' :
                  'bg-surface-700/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">
                      {item.skill_name || `Lesson ${item.lesson_id}`}
                    </h3>
                    <span className="text-xs text-surface-400">
                      Day {index + 1}
                    </span>
                  </div>
                  
                  {/* Progress indicators */}
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 text-xs ${
                      item.do_now_complete ? 'text-primary-400' : 'text-surface-500'
                    }`}>
                      <Flower2 className="w-4 h-4" />
                      Do Now
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${
                      item.scenario_complete ? 'text-green-400' : 'text-surface-500'
                    }`}>
                      <TreePine className="w-4 h-4" />
                      Scenario
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${
                      item.challenge_complete ? 'text-purple-400' : 'text-surface-500'
                    }`}>
                      <Gem className="w-4 h-4" />
                      Challenge
                    </div>
                  </div>
                  
                  {/* Memory note (if completed) */}
                  {isComplete && (
                    <div className="mt-3 pt-3 border-t border-surface-600">
                      <p className="text-sm text-surface-300 italic">
                        "This is when I learned about {item.skill_name?.toLowerCase()}..."
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-6 border-t border-surface-700 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-400">
            {progress.filter(p => p.do_now_complete).length}
          </div>
          <div className="text-xs text-surface-400">Do Nows</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {progress.filter(p => p.scenario_complete).length}
          </div>
          <div className="text-xs text-surface-400">Scenarios</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {progress.filter(p => p.challenge_complete).length}
          </div>
          <div className="text-xs text-surface-400">Challenges</div>
        </div>
      </div>
    </div>
  )
}
