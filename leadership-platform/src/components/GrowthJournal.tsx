'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, Calendar, TreePine, Flower2, Building2, 
  Link2, Heart, Sparkles, ChevronDown, ChevronRight,
  Award, Users, Lightbulb, Star
} from 'lucide-react'

interface JournalEntry {
  id: string
  date: string
  type: 'gateway' | 'do_now' | 'scenario' | 'challenge' | 'help_given' | 'help_received' | 'discovery' | 'unmask' | 'tier_up' | 'ripple' | 'teacher_challenge'
  title: string
  description: string
  skill?: string
  reward?: { type: string; amount: number }
  rippleCount?: number
}

interface JournalWeek {
  weekStart: string
  weekEnd: string
  entries: JournalEntry[]
  highlights: string[]
}

interface GrowthJournalProps {
  weeks: JournalWeek[]
  totalDaysActive: number
  longestStreak: number
  totalRipples: number
  skillsLearned: string[]
}

const entryIcons: Record<string, any> = {
  gateway: Heart,
  do_now: Lightbulb,
  scenario: TreePine,
  challenge: Building2,
  help_given: Heart,
  help_received: Users,
  discovery: Star,
  unmask: Sparkles,
  tier_up: Award,
  ripple: Sparkles,
  teacher_challenge: BookOpen,
}

const entryColors: Record<string, string> = {
  gateway: 'text-pink-400 bg-pink-500/20',
  do_now: 'text-yellow-400 bg-yellow-500/20',
  scenario: 'text-green-400 bg-green-500/20',
  challenge: 'text-blue-400 bg-blue-500/20',
  help_given: 'text-pink-400 bg-pink-500/20',
  help_received: 'text-purple-400 bg-purple-500/20',
  discovery: 'text-amber-400 bg-amber-500/20',
  unmask: 'text-yellow-400 bg-yellow-500/20',
  tier_up: 'text-cyan-400 bg-cyan-500/20',
  ripple: 'text-cyan-400 bg-cyan-500/20',
  teacher_challenge: 'text-indigo-400 bg-indigo-500/20',
}

const rewardEmojis: Record<string, string> = {
  tree: '🌲',
  flower: '🌸',
  tower: '🏛️',
  bridge: '🌉',
  crystal: '💎',
}

export default function GrowthJournal({ 
  weeks, 
  totalDaysActive, 
  longestStreak, 
  totalRipples,
  skillsLearned 
}: GrowthJournalProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set([weeks[0]?.weekStart]))
  
  const toggleWeek = (weekStart: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev)
      if (next.has(weekStart)) {
        next.delete(weekStart)
      } else {
        next.add(weekStart)
      }
      return next
    })
  }
  
  if (weeks.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto mb-4 text-surface-500" size={48} />
        <h3 className="text-lg font-semibold text-white mb-2">Your Journal Awaits</h3>
        <p className="text-surface-400 text-sm max-w-md mx-auto">
          As you complete challenges, help others, and grow, your journey will be 
          automatically documented here.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="text-purple-400" size={24} />
          Growth Journal
        </h2>
        <span className="text-sm text-surface-400">
          {weeks.length} weeks documented
        </span>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-surface-800/50 rounded-xl p-3 text-center border border-surface-700">
          <div className="text-2xl font-bold text-white">{totalDaysActive}</div>
          <div className="text-xs text-surface-400">Days Active</div>
        </div>
        <div className="bg-surface-800/50 rounded-xl p-3 text-center border border-surface-700">
          <div className="text-2xl font-bold text-orange-400">{longestStreak}</div>
          <div className="text-xs text-surface-400">Day Streak</div>
        </div>
        <div className="bg-surface-800/50 rounded-xl p-3 text-center border border-surface-700">
          <div className="text-2xl font-bold text-cyan-400">{totalRipples}</div>
          <div className="text-xs text-surface-400">Ripples</div>
        </div>
        <div className="bg-surface-800/50 rounded-xl p-3 text-center border border-surface-700">
          <div className="text-2xl font-bold text-purple-400">{skillsLearned.length}</div>
          <div className="text-xs text-surface-400">Skills</div>
        </div>
      </div>
      
      {/* Skills learned */}
      {skillsLearned.length > 0 && (
        <div className="bg-surface-800/30 rounded-xl p-4 border border-surface-700">
          <h3 className="text-sm font-medium text-surface-300 mb-2">Skills Explored</h3>
          <div className="flex flex-wrap gap-2">
            {skillsLearned.map((skill) => (
              <span 
                key={skill}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Timeline */}
      <div className="space-y-4">
        {weeks.map((week, weekIndex) => {
          const isExpanded = expandedWeeks.has(week.weekStart)
          const totalEntries = week.entries.length
          
          return (
            <motion.div 
              key={week.weekStart}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: weekIndex * 0.1 }}
              className="bg-surface-800/50 rounded-xl border border-surface-700 overflow-hidden"
            >
              {/* Week Header */}
              <button
                onClick={() => toggleWeek(week.weekStart)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-700 rounded-lg">
                    <Calendar className="text-surface-300" size={18} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">
                      Week of {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h3>
                    <p className="text-xs text-surface-400">
                      {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {week.highlights.length > 0 && (
                    <div className="hidden md:flex gap-1">
                      {week.highlights.slice(0, 3).map((h, i) => (
                        <span key={i} className="text-lg">{h}</span>
                      ))}
                    </div>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="text-surface-400" size={20} />
                  ) : (
                    <ChevronRight className="text-surface-400" size={20} />
                  )}
                </div>
              </button>
              
              {/* Week Entries */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-surface-700"
                  >
                    <div className="p-4 space-y-3">
                      {week.entries.map((entry, entryIndex) => {
                        const Icon = entryIcons[entry.type] || Sparkles
                        const colorClass = entryColors[entry.type] || 'text-gray-400 bg-gray-500/20'
                        
                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: entryIndex * 0.05 }}
                            className="flex gap-3"
                          >
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center">
                              <div className={`p-2 rounded-lg ${colorClass}`}>
                                <Icon size={16} />
                              </div>
                              {entryIndex < week.entries.length - 1 && (
                                <div className="w-px h-full bg-surface-700 mt-2" />
                              )}
                            </div>
                            
                            {/* Entry content */}
                            <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-white">{entry.title}</h4>
                                  <p className="text-sm text-surface-400 mt-0.5">
                                    {entry.description}
                                  </p>
                                </div>
                                <span className="text-xs text-surface-500">
                                  {new Date(entry.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                              
                              {/* Skill badge */}
                              {entry.skill && (
                                <span className="inline-block mt-2 px-2 py-0.5 bg-surface-700 text-surface-300 rounded text-xs">
                                  {entry.skill}
                                </span>
                              )}
                              
                              {/* Reward */}
                              {entry.reward && (
                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400">
                                  <span>{rewardEmojis[entry.reward.type] || '✨'}</span>
                                  <span>+{entry.reward.amount} earned</span>
                                </div>
                              )}
                              
                              {/* Ripple count */}
                              {entry.rippleCount && entry.rippleCount > 0 && (
                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400">
                                  <Sparkles size={12} />
                                  <span>Ripple reached {entry.rippleCount} people</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
      
      {/* Export hint */}
      <p className="text-xs text-surface-500 text-center">
        💡 Your growth journal is automatically generated from your activities
      </p>
    </div>
  )
}
