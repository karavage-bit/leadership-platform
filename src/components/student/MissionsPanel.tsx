'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Zap, Battery, Calendar, Users, User, School, Check, ChevronRight } from 'lucide-react'

interface Mission {
  id: string
  title: string
  description: string
  mission_type: 'individual' | 'team' | 'class'
  xp_reward: number
  battery_reward: number
  deadline: string | null
  is_completed?: boolean
}

export default function MissionsPanel({ classId, studentId, onMissionComplete }: { 
  classId: string
  studentId: string
  onMissionComplete?: () => void 
}) {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadMissions()
  }, [classId, studentId])

  const loadMissions = async () => {
    setLoading(true)
    
    // Get active missions
    const { data: missionsData } = await supabase
      .from('missions')
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Get student's completions
    const { data: completions } = await supabase
      .from('mission_completions')
      .select('mission_id')
      .eq('student_id', studentId)

    const completedIds = new Set(completions?.map(c => c.mission_id) || [])
    
    setMissions((missionsData || []).map(m => ({
      ...m,
      is_completed: completedIds.has(m.id)
    })))
    setLoading(false)
  }

  const completeMission = async (missionId: string, mission: Mission) => {
    setCompleting(missionId)
    
    // Insert completion
    await supabase.from('mission_completions').insert({
      mission_id: missionId,
      student_id: studentId,
      completed_at: new Date().toISOString()
    })

    // Update battery
    const { data: core } = await supabase
      .from('student_cores')
      .select('battery_level')
      .eq('student_id', studentId)
      .single()

    if (core) {
      const newBattery = Math.min(100, (core.battery_level || 0) + mission.battery_reward)
      await supabase
        .from('student_cores')
        .update({ battery_level: newBattery })
        .eq('student_id', studentId)
    }

    // Log activity
    await supabase.from('student_activity_log').insert({
      student_id: studentId,
      class_id: classId,
      activity_type: 'mission_completed',
      activity_data: { mission_id: missionId, title: mission.title }
    })

    setCompleting(null)
    loadMissions()
    onMissionComplete?.()
  }

  const missionTypeIcons = {
    individual: User,
    team: Users,
    class: School
  }

  const activeMissions = missions.filter(m => !m.is_completed)
  const completedMissions = missions.filter(m => m.is_completed)

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  if (missions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-200 flex items-center gap-2">
        <Target className="text-teal-400" size={20} />
        Missions
      </h3>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div className="space-y-3">
          {activeMissions.map(mission => {
            const TypeIcon = missionTypeIcons[mission.mission_type]
            const isExpired = mission.deadline && new Date(mission.deadline) < new Date()
            
            if (isExpired) return null
            
            return (
              <motion.div
                key={mission.id}
                className="card p-4 bg-gradient-to-r from-teal-900/20 to-surface-900 border-teal-500/30"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    mission.mission_type === 'individual' ? 'bg-blue-500/20 text-blue-400' :
                    mission.mission_type === 'team' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    <TypeIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-surface-100">{mission.title}</h4>
                    <p className="text-surface-400 text-sm mt-1">{mission.description}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Zap size={14} />
                        <span>{mission.xp_reward} XP</span>
                      </div>
                      <div className="flex items-center gap-1 text-teal-400">
                        <Battery size={14} />
                        <span>+{mission.battery_reward}%</span>
                      </div>
                      {mission.deadline && (
                        <div className="flex items-center gap-1 text-surface-500">
                          <Calendar size={14} />
                          <span>Due {new Date(mission.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => completeMission(mission.id, mission)}
                    disabled={completing === mission.id}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {completing === mission.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>Complete <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <div className="space-y-2">
          <p className="text-surface-500 text-sm">Completed ({completedMissions.length})</p>
          {completedMissions.slice(0, 3).map(mission => (
            <div
              key={mission.id}
              className="p-3 rounded-xl bg-surface-800/30 border border-surface-700/50 flex items-center gap-3 opacity-60"
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                <Check size={16} />
              </div>
              <span className="text-surface-400 line-through">{mission.title}</span>
              <span className="text-green-400 text-xs ml-auto">+{mission.xp_reward} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
