'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, X, Users, User, School, Zap, Battery, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'

interface Mission {
  id: string
  title: string
  description: string
  mission_type: 'individual' | 'team' | 'class'
  xp_reward: number
  battery_reward: number
  deadline: string | null
  is_active: boolean
  created_at: string
  completion_count?: number
}

export default function MissionsManager({ classId, teacherId, studentCount }: { classId: string; teacherId: string; studentCount: number }) {
  const [missions, setMissions] = useState<Mission[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [missionType, setMissionType] = useState<'individual' | 'team' | 'class'>('individual')
  const [xpReward, setXpReward] = useState(50)
  const [batteryReward, setBatteryReward] = useState(10)
  const [deadline, setDeadline] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    loadMissions()
  }, [classId])

  const loadMissions = async () => {
    setLoading(true)
    const { data: missionsData } = await supabase
      .from('missions')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    // Get completion counts
    const { data: completions } = await supabase
      .from('mission_completions')
      .select('mission_id')
      .in('mission_id', missionsData?.map(m => m.id) || [])

    const completionCounts: Record<string, number> = {}
    completions?.forEach(c => {
      completionCounts[c.mission_id] = (completionCounts[c.mission_id] || 0) + 1
    })

    setMissions((missionsData || []).map(m => ({
      ...m,
      completion_count: completionCounts[m.id] || 0
    })))
    setLoading(false)
  }

  const createMission = async () => {
    if (!title.trim() || !description.trim()) return
    setSaving(true)
    
    await supabase.from('missions').insert({
      class_id: classId,
      teacher_id: teacherId,
      title: title.trim(),
      description: description.trim(),
      mission_type: missionType,
      xp_reward: xpReward,
      battery_reward: batteryReward,
      deadline: deadline || null,
      is_active: true
    })

    // Log activity
    await supabase.from('student_activity_log').insert({
      class_id: classId,
      activity_type: 'mission_created',
      activity_data: { title, mission_type: missionType }
    })

    setTitle('')
    setDescription('')
    setMissionType('individual')
    setXpReward(50)
    setBatteryReward(10)
    setDeadline('')
    setShowForm(false)
    setSaving(false)
    loadMissions()
  }

  const toggleMissionActive = async (id: string, currentActive: boolean) => {
    await supabase.from('missions').update({ is_active: !currentActive }).eq('id', id)
    loadMissions()
  }

  const deleteMission = async (id: string) => {
    await supabase.from('missions').delete().eq('id', id)
    setMissions(prev => prev.filter(m => m.id !== id))
  }

  const missionTypeIcons = {
    individual: User,
    team: Users,
    class: School
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
          <Target className="text-teal-400" size={24} />
          Missions
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <Plus size={18} /> New Mission
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
              <h3 className="font-semibold text-surface-100">Create Mission</h3>
              <button onClick={() => setShowForm(false)} className="text-surface-500 hover:text-surface-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Mission Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Help 3 classmates today"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Describe what students need to do..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    className="input"
                    value={missionType}
                    onChange={(e) => setMissionType(e.target.value as any)}
                  >
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                    <option value="class">Class</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">XP Reward</label>
                  <input
                    type="number"
                    className="input"
                    value={xpReward}
                    onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
                    min={0}
                    max={500}
                  />
                </div>
                
                <div>
                  <label className="label">Battery Reward</label>
                  <input
                    type="number"
                    className="input"
                    value={batteryReward}
                    onChange={(e) => setBatteryReward(parseInt(e.target.value) || 0)}
                    min={0}
                    max={50}
                  />
                </div>
                
                <div>
                  <label className="label">Deadline (optional)</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button 
                  onClick={createMission} 
                  disabled={saving || !title.trim() || !description.trim()}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Creating...' : 'Create Mission'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missions List */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : missions.length === 0 ? (
        <div className="card p-12 text-center">
          <Target size={48} className="mx-auto mb-4 text-surface-600" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">No missions</h3>
          <p className="text-surface-500">Create missions to motivate and challenge your students.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {missions.map(mission => {
            const TypeIcon = missionTypeIcons[mission.mission_type]
            const completionPercent = studentCount > 0 ? Math.round((mission.completion_count || 0) / studentCount * 100) : 0
            
            return (
              <div
                key={mission.id}
                className={`card p-4 ${mission.is_active ? '' : 'opacity-50'}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      mission.mission_type === 'individual' ? 'bg-blue-500/20 text-blue-400' :
                      mission.mission_type === 'team' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      <TypeIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-100">{mission.title}</h3>
                      <span className="text-xs text-surface-500 capitalize">{mission.mission_type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMissionActive(mission.id, mission.is_active)}
                    className={`p-2 rounded-lg transition-colors ${mission.is_active ? 'text-green-400' : 'text-surface-500'}`}
                  >
                    {mission.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
                
                <p className="text-surface-400 text-sm mb-3">{mission.description}</p>
                
                <div className="flex items-center gap-4 text-sm mb-3">
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
                      <span>{new Date(mission.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between text-xs text-surface-500 mb-1">
                      <span>Completions</span>
                      <span>{mission.completion_count || 0}/{studentCount}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill bg-teal-500" style={{ width: `${completionPercent}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMission(mission.id)}
                    className="text-surface-500 hover:text-red-400 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
