'use client'

import { motion } from 'framer-motion'
import { 
  MessageSquare, Target, ChevronRight, Map, 
  BookOpen, Play, Zap, Award, Check, Lock
} from 'lucide-react'
import type { LessonData, ProgressData, WorldData } from '../types'

interface HomeTabProps {
  lesson: LessonData | null
  progress: ProgressData | null
  world: WorldData | null
  onDoNowClick: () => void
  onScenarioClick: () => void
  onChallengeClick: () => void
  onTextAnchorComplete: () => void
  onMediaComplete: () => void
}

const phaseNames = {
  1: 'Self-Leadership',
  2: 'Team Leadership', 
  3: 'Community Leadership',
  4: 'Legacy Leadership'
}

const phaseColors = {
  1: 'courage',
  2: 'care',
  3: 'community',
  4: 'creation'
}

export default function HomeTab({
  lesson,
  progress,
  world,
  onDoNowClick,
  onScenarioClick,
  onChallengeClick,
  onTextAnchorComplete,
  onMediaComplete
}: HomeTabProps) {
  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Do Now Card - Primary CTA */}
      {!progress?.do_now_complete && (
        <motion.div 
          className="card p-6 bg-gradient-to-r from-primary-900/40 to-surface-900 border-primary-700/50 relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-primary-400 text-sm font-semibold mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <MessageSquare size={18} />
                  </motion.div>
                  START HERE — TODAY'S DO NOW
                </div>
                <h2 className="text-xl font-bold text-surface-100 mb-2">
                  "{lesson?.compelling_question}"
                </h2>
                <p className="text-surface-400 text-sm">
                  5-minute Socratic conversation to prime your brain for today's skill.
                </p>
              </div>
              <motion.button 
                onClick={onDoNowClick}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium flex items-center gap-2 whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Begin <ChevronRight size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Skill Card */}
      <div className={`card p-6 phase-${lesson?.phase_id}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${phaseColors[lesson?.phase_id as keyof typeof phaseColors]}/20`}>
            <Target className={`text-${phaseColors[lesson?.phase_id as keyof typeof phaseColors]}`} size={24} />
          </div>
          <div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-${phaseColors[lesson?.phase_id as keyof typeof phaseColors]}/20 text-${phaseColors[lesson?.phase_id as keyof typeof phaseColors]}`}>
              Lesson {lesson?.id} of 45
            </span>
            <h2 className="text-2xl font-bold text-surface-100 mt-1">
              {lesson?.skill_name}
            </h2>
          </div>
        </div>
        <p className="text-surface-400">
          {lesson?.lesson_objective}
        </p>
      </div>

      {/* Pathway Steps */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-surface-200 flex items-center gap-2">
          <Map size={20} className="text-primary-400" />
          Your Pathway
        </h3>
        
        <PathwayStep
          icon={MessageSquare}
          title="Do Now"
          subtitle="Warm up your brain"
          complete={progress?.do_now_complete || false}
          locked={false}
          reward="🌸 Flower"
          onClick={onDoNowClick}
        />

        <PathwayStep
          icon={BookOpen}
          title={lesson?.text_anchor_title || 'Text Anchor'}
          subtitle={`Read ${lesson?.text_anchor_chapter || 'Chapter'}`}
          complete={progress?.text_anchor_complete || false}
          locked={!progress?.do_now_complete}
          reward="🪨 Stone"
          onClick={onTextAnchorComplete}
        />

        <PathwayStep
          icon={Play}
          title={lesson?.media_title || 'Media'}
          subtitle="Watch & reflect"
          complete={progress?.media_complete || false}
          locked={!progress?.text_anchor_complete}
          reward="🪨 Stone"
          onClick={onMediaComplete}
          mediaUrl={lesson?.media_url}
        />

        <PathwayStep
          icon={Zap}
          title="Socratic Scenario"
          subtitle="Apply your knowledge"
          complete={progress?.scenario_complete || false}
          locked={!progress?.media_complete}
          reward="🌲 Tree"
          onClick={onScenarioClick}
        />

        <PathwayStep
          icon={Award}
          title="Real-World Challenge"
          subtitle="Prove it in action"
          complete={progress?.challenge_complete || false}
          locked={!progress?.scenario_complete}
          reward="🏛️ Tower"
          onClick={onChallengeClick}
        />
      </div>

      {/* Daily Stats */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-surface-300 mb-3">Today's Progress</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          <StatItem label="Trees" value={world?.trees || 0} emoji="🌲" />
          <StatItem label="Flowers" value={world?.flowers || 0} emoji="🌸" />
          <StatItem label="Stones" value={world?.stones || 0} emoji="🪨" />
          <StatItem label="Tower" value={world?.tower || 0} emoji="🏛️" />
          <StatItem label="Helped" value={world?.help_given || 0} emoji="🤝" />
        </div>
      </div>
    </motion.div>
  )
}

// Pathway Step Component
function PathwayStep({
  icon: Icon,
  title,
  subtitle,
  complete,
  locked,
  reward,
  onClick,
  mediaUrl
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  complete: boolean
  locked: boolean
  reward: string
  onClick: () => void
  mediaUrl?: string
}) {
  const handleClick = () => {
    if (complete || locked) return
    
    // If there's a media URL, open it
    if (mediaUrl) {
      window.open(mediaUrl, '_blank')
      onClick()
      return
    }
    
    onClick()
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={locked}
      className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${
        complete 
          ? 'bg-green-500/10 border-green-500/30' 
          : locked 
            ? 'bg-surface-800/50 border-surface-700 opacity-50 cursor-not-allowed'
            : 'bg-surface-800/50 border-surface-700 hover:border-primary-500/50 hover:bg-surface-800'
      }`}
      whileHover={!locked && !complete ? { scale: 1.01 } : {}}
      whileTap={!locked && !complete ? { scale: 0.99 } : {}}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        complete 
          ? 'bg-green-500/20 text-green-400'
          : locked
            ? 'bg-surface-700 text-surface-500'
            : 'bg-primary-500/20 text-primary-400'
      }`}>
        {complete ? <Check size={20} /> : locked ? <Lock size={20} /> : <Icon size={20} />}
      </div>
      
      <div className="flex-1">
        <h4 className={`font-medium ${complete ? 'text-green-400' : 'text-surface-200'}`}>
          {title}
        </h4>
        <p className="text-xs text-surface-500">{subtitle}</p>
      </div>
      
      <div className="text-right">
        <span className="text-lg">{reward.split(' ')[0]}</span>
        <p className="text-xs text-surface-500">{reward.split(' ')[1]}</p>
      </div>
      
      {!complete && !locked && (
        <ChevronRight size={18} className="text-surface-500" />
      )}
    </motion.button>
  )
}

// Stat Item Component
function StatItem({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="p-2 bg-surface-800/50 rounded-lg">
      <div className="text-xl mb-1">{emoji}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-surface-500">{label}</div>
    </div>
  )
}
