'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, RefreshCw, Zap, Target, Video, MessageSquare, Battery, Clock, Play, Check, Bell } from 'lucide-react'

interface ActivityItem {
  id: string
  student_id: string
  student_name?: string
  activity_type: string
  activity_data: any
  created_at: string
}

const activityConfig: Record<string, { icon: any; color: string; label: (data: any) => string }> = {
  do_now_started: { 
    icon: Play, 
    color: 'text-blue-400', 
    label: () => 'started Do Now'
  },
  do_now_complete: { 
    icon: MessageSquare, 
    color: 'text-green-400', 
    label: () => 'completed Do Now'
  },
  mission_completed: { 
    icon: Target, 
    color: 'text-teal-400', 
    label: (data) => `completed mission "${data?.title || 'Unknown'}"`
  },
  media_lesson_started: { 
    icon: Video, 
    color: 'text-red-400', 
    label: (data) => `started media lesson "${data?.title || 'Unknown'}"`
  },
  media_lesson_complete: { 
    icon: Check, 
    color: 'text-green-400', 
    label: (data) => `finished media lesson "${data?.title || 'Unknown'}"`
  },
  socratic_complete: { 
    icon: MessageSquare, 
    color: 'text-purple-400', 
    label: () => 'completed Socratic discussion'
  },
  battery_update: { 
    icon: Battery, 
    color: 'text-yellow-400', 
    label: (data) => `battery at ${data?.level || 0}%`
  },
  scenario_complete: { 
    icon: Zap, 
    color: 'text-orange-400', 
    label: () => 'completed Scenario'
  },
  challenge_submitted: { 
    icon: Target, 
    color: 'text-pink-400', 
    label: () => 'submitted Real-World Challenge'
  },
  announcement_created: {
    icon: Bell,
    color: 'text-primary-400',
    label: (data) => `New announcement: "${data?.title || 'Unknown'}"`
  },
  mission_created: {
    icon: Target,
    color: 'text-teal-400',
    label: (data) => `New mission created: "${data?.title || 'Unknown'}"`
  },
  media_lesson_created: {
    icon: Video,
    color: 'text-purple-400',
    label: (data) => `New media lesson: "${data?.title || 'Unknown'}"`
  }
}

export default function LiveActivityFeed({ classId, students }: { classId: string; students: Array<{ id: string; name: string }> }) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  const supabase = createClient()

  const loadActivities = useCallback(async () => {
    const { data } = await supabase
      .from('student_activity_log')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
      .limit(50)

    const studentMap = new Map(students.map(s => [s.id, s.name]))
    
    setActivities((data || []).map(a => ({
      ...a,
      student_name: studentMap.get(a.student_id) || 'System'
    })))
    setLastRefresh(new Date())
    setLoading(false)
  }, [classId, students, supabase])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(loadActivities, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, loadActivities])

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
          <Activity className="text-green-400" size={24} />
          Live Activity Feed
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-surface-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Auto-refresh (30s)
          </label>
          <button onClick={loadActivities} className="btn btn-secondary btn-sm">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="text-xs text-surface-500 flex items-center gap-2">
        <Clock size={12} />
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {loading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : activities.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity size={48} className="mx-auto mb-4 text-surface-600" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">No activity yet</h3>
          <p className="text-surface-500">Student activity will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {activities.map((activity, idx) => {
              const config = activityConfig[activity.activity_type] || {
                icon: Activity,
                color: 'text-surface-400',
                label: () => activity.activity_type
              }
              const Icon = config.icon
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="card p-3 flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color.replace('text-', 'bg-').replace('-400', '-500/20')}`}>
                    <Icon size={16} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-200 text-sm">
                      <span className="font-semibold">{activity.student_name}</span>
                      {' '}
                      <span className="text-surface-400">{config.label(activity.activity_data)}</span>
                    </p>
                  </div>
                  <span className="text-xs text-surface-500 whitespace-nowrap">
                    {getTimeAgo(activity.created_at)}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
