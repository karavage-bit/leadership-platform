'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogOut, Wifi, WifiOff, Clock, Sparkles, 
  Home, Users, Star, Trophy, Lightbulb
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Hooks and types
import { useStudentData } from './hooks/useStudentData'
import type { StudentTab } from './types'

// Tab components
import HomeTab from './tabs/HomeTab'
import WorldTab from './tabs/WorldTab'
import CommonsTab from './tabs/CommonsTab'
import DiscoverTab from './tabs/DiscoverTab'
import ProgressTab from './tabs/ProgressTab'

// Modal components (dynamic for code splitting)
const SocraticModal = dynamic(() => import('@/components/SocraticModal'), { ssr: false })
const ChallengeSubmissionModal = dynamic(() => import('@/components/ChallengeSubmissionModal'), { ssr: false })
const GatewayChallenge = dynamic(() => import('@/components/GatewayChallenge'), { ssr: false })
const DailyUnmask = dynamic(() => import('@/components/DailyUnmask'), { ssr: false })
const BrainstormAI = dynamic(() => import('@/components/BrainstormAI'), { ssr: false })
const DeadServerOnboarding = dynamic(() => import('@/components/DeadServerOnboarding'), { ssr: false })
const CoreView = dynamic(() => import('@/components/CoreView'), { ssr: false })
const NexusView = dynamic(() => import('@/components/NexusView'), { ssr: false })
const StreakDisplay = dynamic(() => import('@/components/StreakDisplay'), { ssr: false })
const PrivateNotes = dynamic(() => import('@/components/PrivateNotes'), { ssr: false })
const LofiPlayer = dynamic(() => import('@/components/LofiPlayer'), { ssr: false })
const GhostMode = dynamic(() => import('@/components/GhostMode'), { ssr: false })
const AvatarCustomization = dynamic(() => import('@/components/AvatarCustomization'), { ssr: false })
const SpotifyProgressCards = dynamic(() => import('@/components/SpotifyProgressCards'), { ssr: false })
const TimelineMemoryMap = dynamic(() => import('@/components/TimelineMemoryMap'), { ssr: false })

// Phase metadata
const phaseNames = {
  1: 'Self-Leadership',
  2: 'Team Leadership', 
  3: 'Community Leadership',
  4: 'Legacy Leadership'
}

export default function StudentDashboard() {
  // All data from custom hook
  const {
    user,
    lesson,
    progress,
    world,
    helpRequests,
    teacherChallenges,
    discoveries,
    journalData,
    connectionMapData,
    placedItems,
    inventoryItems,
    discoveredSecrets,
    gatewayComplete,
    dailyUnmaskData,
    studentSkills,
    loading,
    isOnline,
    error,
    loadData,
    handleLogout,
    refreshHelpRequests,
    markTextAnchorComplete,
    markMediaComplete,
    updateWorld,
    updateProgress
  } = useStudentData()

  // UI state
  const [activeTab, setActiveTab] = useState<StudentTab>('home')
  const [showWelcome, setShowWelcome] = useState(false)

  // Check for welcome popup and onboarding on mount
  React.useEffect(() => {
    const shouldShowWelcome = localStorage.getItem('leadership_show_welcome')
    if (shouldShowWelcome === 'true' && user?.name) {
      setShowWelcome(true)
      localStorage.removeItem('leadership_show_welcome')
    }
    // Check if first time user (show Dead Server onboarding)
    const hasSeenOnboarding = localStorage.getItem('radiance_onboarding_complete')
    if (!hasSeenOnboarding && user?.id) {
      setShowOnboarding(true)
    }
  }, [user])
  
  // Modal state
  const [showDoNow, setShowDoNow] = useState(false)
  const [showExitTicket, setShowExitTicket] = useState(false)
  const [showScenario, setShowScenario] = useState(false)
  const [showChallenge, setShowChallenge] = useState(false)
  const [showGateway, setShowGateway] = useState(false)
  const [showBrainstorm, setShowBrainstorm] = useState(false)
  const [showDailyUnmask, setShowDailyUnmask] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showCoreView, setShowCoreView] = useState(false)
  const [showNexusView, setShowNexusView] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showAvatar, setShowAvatar] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  // SECURE: Use complete_step RPC (auth.uid() handles identity server-side)
  const completeStep = async (stepType: 'do_now' | 'scenario' | 'challenge' | 'exit_ticket') => {
    if (!lesson?.id) return
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      // Only pass lesson_id and step_type - server derives student_id from JWT
      const { error } = await supabase.rpc('complete_step', {
        p_lesson_id: lesson.id,
        p_step_type: stepType
      })
      if (error) console.error('complete_step error:', error)
      loadData() // Refresh to get updated state
    } catch (e) {
      console.error('Failed to complete step:', e)
    }
  }

  // Check battery level for Oxygen Mask rule
  const [batteryLevel, setBatteryLevel] = React.useState(0)
  React.useEffect(() => {
    const checkBattery = async () => {
      if (!user?.id) return
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data } = await supabase
        .from('student_cores')
        .select('battery_level')
        .eq('student_id', user.id)
        .single()
      if (data) setBatteryLevel(data.battery_level || 0)
    }
    checkBattery()
  }, [user?.id])

  // Completion handlers
  const onDoNowComplete = async () => {
    await completeStep('do_now')
    setShowDoNow(false)
  }

  const onScenarioComplete = async () => {
    await completeStep('scenario')
    setShowScenario(false)
    setShowChallenge(true)
  }

  // Calculated values
  const totalWorldItems = (world?.trees || 0) + (world?.flowers || 0) + (world?.tower || 0) + (world?.bridge || 0)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div 
            className="text-6xl mb-6"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            🌱
          </motion.div>
          <div className="loading-dots justify-center mb-4">
            <span></span><span></span><span></span>
          </div>
          <p className="text-surface-400 gradient-text font-medium">Loading your journey...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-surface-400 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card rounded-none border-t-0 border-x-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="text-3xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              🌱
            </motion.div>
            <div>
              <h1 className="font-bold text-surface-100 text-lg">Leadership 2.0</h1>
              <p className="text-xs text-surface-500">
                Phase {lesson?.phase_id}: {phaseNames[lesson?.phase_id as keyof typeof phaseNames]}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            
            {/* Streak Display */}
            {user?.id && <StreakDisplay studentId={user.id} />}
            
            {/* World Items Count */}
            <div className="streak-counter text-xs">
              <Sparkles size={14} className="streak-fire" />
              <span className="font-bold">{totalWorldItems}</span>
            </div>
            
            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-surface-200 hidden sm:block">{user?.name}</span>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="p-2 text-surface-400 hover:text-surface-200 rounded-lg hover:bg-surface-800 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeTab 
              lesson={lesson}
              progress={progress}
              world={world}
              onDoNowClick={() => setShowDoNow(true)}
              onScenarioClick={() => setShowScenario(true)}
              onChallengeClick={() => setShowChallenge(true)}
              onTextAnchorComplete={markTextAnchorComplete}
              onMediaComplete={markMediaComplete}
            />
          )}

          {activeTab === 'world' && (
            <WorldTab 
              world={world}
              userName={user?.name || 'Student'}
              placedItems={placedItems}
              inventoryItems={inventoryItems}
              discoveredSecrets={discoveredSecrets}
              onBrainstormOpen={() => setShowBrainstorm(true)}
            />
          )}

          {activeTab === 'commons' && (
            <CommonsTab 
              helpRequests={helpRequests}
              userId={user?.id}
              classId={user?.class_id}
              onRefresh={refreshHelpRequests}
            />
          )}

          {activeTab === 'discover' && (
            <DiscoverTab 
              teacherChallenges={teacherChallenges}
              discoveries={discoveries}
              userId={user?.id}
              classId={user?.class_id}
              onChallengeSubmit={async (challengeId, response, connection, share) => {
                await fetch('/api/challenges/teacher/response', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    challengeId,
                    studentId: user?.id,
                    classId: user?.class_id,
                    responseText: response,
                    personalConnection: connection,
                    shareWithClass: share
                  })
                })
                loadData()
              }}
              onDiscoveryPost={async (data) => {
                await fetch('/api/discoveries', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    studentId: user?.id, 
                    classId: user?.class_id, 
                    ...data 
                  })
                })
                loadData()
              }}
              onDiscoveryVote={async (discoveryId) => {
                await fetch('/api/discoveries', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    discoveryId, 
                    studentId: user?.id, 
                    action: 'vote' 
                  })
                })
                loadData()
              }}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressTab 
              world={world}
              currentLesson={lesson?.id || 1}
              journalData={journalData}
              connectionMapData={connectionMapData}
              userId={user?.id}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-900/95 backdrop-blur-md border-t border-surface-800 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <NavButton icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavButton icon={Sparkles} label="World" active={activeTab === 'world'} onClick={() => setActiveTab('world')} />
            <NavButton icon={Users} label="Commons" active={activeTab === 'commons'} onClick={() => setActiveTab('commons')} badge={helpRequests.length} />
            <NavButton icon={Star} label="Discover" active={activeTab === 'discover'} onClick={() => setActiveTab('discover')} />
            <NavButton icon={Trophy} label="Progress" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
          </div>
        </div>
      </nav>

      {/* Exit Ticket Button */}
      <motion.button
        onClick={() => setShowExitTicket(true)}
        className="fixed bottom-20 right-4 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-xl shadow-lg z-40 flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Clock size={16} />
        Exit Ticket
      </motion.button>

      {/* Brainstorm FAB */}
      <motion.button
        onClick={() => setShowBrainstorm(true)}
        className="fixed bottom-20 left-4 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Brainstorm Ideas"
      >
        <Lightbulb size={20} />
      </motion.button>

      {/* Core/Nexus Quick Access */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-40">
        <motion.button
          onClick={() => setShowCoreView(true)}
          className="px-4 py-2 bg-blue-600/80 hover:bg-blue-500 text-white rounded-xl backdrop-blur-sm text-sm"
          whileHover={{ scale: 1.05 }}
        >
          🔮 My Core
        </motion.button>
        <motion.button
          onClick={() => {
            if (batteryLevel < 50) {
              alert('🔋 Oxygen Mask Rule: Reach 50% Core energy before accessing the Nexus. Focus on yourself first!')
              return
            }
            setShowNexusView(true)
          }}
          className={`px-4 py-2 ${batteryLevel >= 50 ? 'bg-purple-600/80 hover:bg-purple-500' : 'bg-zinc-600/50 cursor-not-allowed'} text-white rounded-xl backdrop-blur-sm text-sm`}
          whileHover={{ scale: batteryLevel >= 50 ? 1.05 : 1 }}
        >
          🌐 Class Nexus {batteryLevel < 50 && '🔒'}
        </motion.button>
      </div>

      {/* Lofi Player */}
      <LofiPlayer />

      {/* Modals */}
      <AnimatePresence>
        {showDoNow && (
          <SocraticModal 
            type="do_now" 
            lesson={lesson} 
            userId={user?.id}
            classId={user?.class_id}
            userName={user?.name}
            onClose={() => setShowDoNow(false)}
            onComplete={onDoNowComplete}
          />
        )}
        
        {showScenario && (
          <SocraticModal 
            type="scenario" 
            lesson={lesson}
            userId={user?.id}
            classId={user?.class_id}
            userName={user?.name}
            onClose={() => setShowScenario(false)}
            onScenarioComplete={onScenarioComplete}
          />
        )}

        {showExitTicket && (
          <SocraticModal 
            type="exit_ticket" 
            lesson={lesson}
            userId={user?.id}
            classId={user?.class_id}
            userName={user?.name}
            onClose={() => setShowExitTicket(false)}
          />
        )}
        
        {showChallenge && (
          <ChallengeSubmissionModal
            lesson={lesson}
            userId={user?.id}
            classId={user?.class_id}
            onClose={() => {
              setShowChallenge(false)
              loadData()
            }}
          />
        )}
      </AnimatePresence>

      {/* Gateway Challenge */}
      {showGateway && (
        <GatewayChallenge 
          onComplete={async (data: Record<string, unknown>) => {
            await fetch('/api/gateway', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId: user?.id, ...data })
            })
            setShowGateway(false)
            loadData()
          }}
        />
      )}

      {/* Daily Unmask Celebration */}
      {showDailyUnmask && dailyUnmaskData && (
        <DailyUnmask 
          anonymousName={dailyUnmaskData.anonymousName}
          realName={dailyUnmaskData.realName}
          reason={dailyUnmaskData.reason}
          rippleCount={dailyUnmaskData.rippleCount}
          onContinue={() => setShowDailyUnmask(false)}
        />
      )}

      {/* Dead Server Onboarding */}
      {showOnboarding && (
        <DeadServerOnboarding
          onComplete={() => {
            setShowOnboarding(false)
            localStorage.setItem('radiance_onboarding_complete', 'true')
          }}
        />
      )}

      {/* Core View Modal */}
      {showCoreView && user?.id && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80vh] relative">
            <button
              onClick={() => setShowCoreView(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-zinc-800 rounded-full text-white hover:bg-zinc-700"
            >
              ✕
            </button>
            <CoreView studentId={user.id} />
          </div>
        </div>
      )}

      {/* Nexus View Modal */}
      {showNexusView && user?.class_id && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80vh] relative">
            <button
              onClick={() => setShowNexusView(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-zinc-800 rounded-full text-white hover:bg-zinc-700"
            >
              ✕
            </button>
            <NexusView classId={user.class_id} studentId={user.id} />
          </div>
        </div>
      )}

      {/* Ghost Mode in World Tab */}
      {user?.id && user?.class_id && activeTab === 'world' && (
        <div className="fixed top-24 right-4 z-30">
          <GhostMode studentId={user.id} classId={user.class_id} />
        </div>
      )}

      {/* Brainstorm AI Modal */}
      <BrainstormAI 
        isOpen={showBrainstorm}
        onClose={() => setShowBrainstorm(false)}
        studentSkills={studentSkills}
        onActionPlan={(plan: unknown) => {
          console.log('Action plan committed:', plan)
          setShowBrainstorm(false)
        }}
      />

      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWelcome(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-surface-800 to-surface-900 rounded-2xl p-8 max-w-md text-center border border-surface-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: 2 }}
              >
                <Sparkles className="w-16 h-16 mx-auto text-primary-400" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Hello {user?.name}!
              </h2>
              <p className="text-xl text-primary-400 mb-6">Welcome back!</p>
              <p className="text-surface-400 mb-6">
                Ready to continue your leadership journey?
              </p>
              <motion.button
                onClick={() => setShowWelcome(false)}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Let's Go!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Nav Button Component
function NavButton({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  badge 
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative hover-scale ${
        active 
          ? 'text-primary-400 bg-primary-500/10 tab-glow-active' 
          : 'text-surface-500 hover:text-surface-300'
      }`}
    >
      <Icon size={22} />
      <span className="text-xs font-medium">{label}</span>
      {badge && badge > 0 && (
        <span className="notification-badge">
          {badge}
        </span>
      )}
    </button>
  )
}
