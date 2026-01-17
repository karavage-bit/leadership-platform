'use client'

import { motion } from 'framer-motion'
import { Flame, Snowflake } from 'lucide-react'

interface StreakDisplayProps {
  streakCount: number
  streakFreezes?: number
  lastActiveDate?: string
  onUseFreeze?: () => void
}

export default function StreakDisplay({ 
  streakCount, 
  streakFreezes = 0,
  lastActiveDate,
  onUseFreeze 
}: StreakDisplayProps) {
  const isActive = lastActiveDate === new Date().toISOString().split('T')[0]
  const isAtRisk = !isActive && streakCount > 0

  return (
    <motion.div 
      className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
        isAtRisk ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-surface-800'
      }`}
      animate={isAtRisk ? { 
        boxShadow: ['0 0 0px #f97316', '0 0 15px #f97316', '0 0 0px #f97316'] 
      } : {}}
      transition={{ duration: 1.5, repeat: isAtRisk ? Infinity : 0 }}
    >
      {/* Flame icon with animation */}
      <motion.div
        animate={streakCount > 0 ? {
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0]
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <Flame className={`w-6 h-6 ${
          streakCount >= 30 ? 'text-purple-500' :
          streakCount >= 14 ? 'text-orange-500' :
          streakCount >= 7 ? 'text-yellow-500' :
          streakCount > 0 ? 'text-red-500' : 'text-gray-500'
        }`} />
      </motion.div>
      
      {/* Streak count */}
      <div className="flex flex-col">
        <span className="text-xl font-bold text-white">{streakCount}</span>
        <span className="text-xs text-surface-400">
          {streakCount === 1 ? 'day' : 'days'}
        </span>
      </div>
      
      {/* Streak freezes */}
      {streakFreezes > 0 && (
        <div className="flex items-center gap-1 ml-2">
          <Snowflake className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400">{streakFreezes}</span>
        </div>
      )}
      
      {/* At risk warning */}
      {isAtRisk && (
        <motion.div 
          className="ml-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {streakFreezes > 0 ? (
            <button
              onClick={onUseFreeze}
              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-sm rounded-lg font-medium"
            >
              Use Freeze
            </button>
          ) : (
            <span className="text-xs text-orange-400 animate-pulse">
              Streak at risk!
            </span>
          )}
        </motion.div>
      )}
      
      {/* Milestone badges */}
      {streakCount >= 7 && (
        <div className="ml-2 flex gap-1">
          {streakCount >= 7 && (
            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full">
              🔥 Week
            </span>
          )}
          {streakCount >= 30 && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-500 rounded-full">
              👑 Month
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
