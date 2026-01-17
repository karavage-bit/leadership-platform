'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, BookOpen, Network, ChevronRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { WorldData, JournalData, ConnectionMapData } from '../types'

const GrowthJournal = dynamic(() => import('@/components/GrowthJournal'), { ssr: false })
const ClassConnectionMap = dynamic(() => import('@/components/ClassConnectionMap'), { ssr: false })

interface ProgressTabProps {
  world: WorldData | null
  currentLesson: number
  journalData: JournalData | null
  connectionMapData: ConnectionMapData | null
  userId?: string
}

type SubView = 'overview' | 'journal' | 'connections'

export default function ProgressTab({
  world,
  currentLesson,
  journalData,
  connectionMapData,
  userId
}: ProgressTabProps) {
  const [subView, setSubView] = useState<SubView>('overview')
  
  if (subView === 'journal') {
    return (
      <motion.div
        key="journal"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <button 
          onClick={() => setSubView('overview')}
          className="mb-4 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          ← Back to Progress
        </button>
        <GrowthJournal 
          weeks={journalData?.weeks || []}
          totalDaysActive={journalData?.totalDaysActive || 0}
          longestStreak={journalData?.longestStreak || 0}
          totalRipples={journalData?.totalRipples || 0}
          skillsLearned={journalData?.skillsLearned || []}
        />
      </motion.div>
    )
  }
  
  if (subView === 'connections') {
    return (
      <motion.div
        key="connections"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <button 
          onClick={() => setSubView('overview')}
          className="mb-4 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          ← Back to Progress
        </button>
        <ClassConnectionMap 
          students={connectionMapData?.students || []}
          connections={connectionMapData?.connections || []}
          currentUserId={userId || ''}
          classStats={connectionMapData?.stats || { totalConnections: 0, totalRipples: 0, averageHelpPerStudent: 0 }}
        />
      </motion.div>
    )
  }
  
  return (
    <motion.div
      key="progress"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-400" />
          Your Progress
        </h2>
        <p className="text-sm text-surface-400">Track your leadership journey</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-white">{currentLesson}</div>
          <div className="text-sm text-surface-400">Lessons Complete</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-primary-400">
            {Math.round(((currentLesson - 1) / 45) * 100)}%
          </div>
          <div className="text-sm text-surface-400">Journey Progress</div>
        </div>
      </div>
      
      {/* Phase Progress Cards */}
      <div className="space-y-3">
        <PhaseCard 
          phase={1}
          name="Self-Leadership"
          description="Understanding yourself as a leader"
          progress={world?.phase1_progress || 0}
          lessons="1-12"
          color="courage"
          currentLesson={currentLesson}
        />
        <PhaseCard 
          phase={2}
          name="Team Leadership"
          description="Leading and collaborating with others"
          progress={world?.phase2_progress || 0}
          lessons="13-24"
          color="care"
          currentLesson={currentLesson}
        />
        <PhaseCard 
          phase={3}
          name="Community Leadership"
          description="Making impact beyond your circle"
          progress={world?.phase3_progress || 0}
          lessons="25-36"
          color="community"
          currentLesson={currentLesson}
        />
        <PhaseCard 
          phase={4}
          name="Legacy Leadership"
          description="Creating lasting change"
          progress={world?.phase4_progress || 0}
          lessons="37-45"
          color="creation"
          currentLesson={currentLesson}
        />
      </div>
      
      {/* Quick Links */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-surface-300">Deep Dive</h3>
        
        <button
          onClick={() => setSubView('journal')}
          className="w-full card p-4 flex items-center justify-between hover:border-primary-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <BookOpen className="text-purple-400" size={20} />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-white">Growth Journal</h4>
              <p className="text-xs text-surface-400">Your complete journey timeline</p>
            </div>
          </div>
          <ChevronRight className="text-surface-500" size={20} />
        </button>
        
        <button
          onClick={() => setSubView('connections')}
          className="w-full card p-4 flex items-center justify-between hover:border-primary-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Network className="text-cyan-400" size={20} />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-white">Class Connections</h4>
              <p className="text-xs text-surface-400">See how the class is connected</p>
            </div>
          </div>
          <ChevronRight className="text-surface-500" size={20} />
        </button>
      </div>
    </motion.div>
  )
}

// Phase Card Component
function PhaseCard({ 
  phase, 
  name, 
  description, 
  progress, 
  lessons, 
  color,
  currentLesson
}: {
  phase: number
  name: string
  description: string
  progress: number
  lessons: string
  color: string
  currentLesson: number
}) {
  const lessonRange = lessons.split('-').map(Number)
  const isActive = currentLesson >= lessonRange[0] && currentLesson <= lessonRange[1]
  const isComplete = progress >= 100
  const isLocked = currentLesson < lessonRange[0]
  
  return (
    <div className={`card p-4 ${isActive ? `border-${color}/50` : ''} ${isLocked ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}/20 flex items-center justify-center text-lg font-bold text-${color}`}>
          {phase}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{name}</h3>
            {isComplete && <span className="text-green-400">✓</span>}
            {isActive && <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full">Current</span>}
          </div>
          <p className="text-xs text-surface-400">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">{progress}%</div>
          <div className="text-xs text-surface-500">Lessons {lessons}</div>
        </div>
      </div>
      <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full bg-${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}
