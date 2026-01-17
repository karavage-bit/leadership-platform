'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DeadServerOnboardingProps {
  onComplete: () => void
  userName?: string
}

export default function DeadServerOnboarding({ onComplete, userName }: DeadServerOnboardingProps) {
  const [stage, setStage] = useState(0)
  const [showButton, setShowButton] = useState(false)

  const stages = [
    {
      text: "Imagine a city built entirely on a server.",
      subtext: "It was perfect. Infinite bandwidth. Perfect weather. Everyone had a connection.",
      duration: 4000
    },
    {
      text: "But then, the battery started draining.",
      subtext: "At first, people just complained. 'Why is the wifi slow?' 'Why are the lights flickering?'",
      duration: 4000
    },
    {
      text: "They blamed the admins. They blamed the software.",
      subtext: "They shouted at the sky.",
      duration: 3000
    },
    {
      text: "But the city wasn't powered by a power plant.",
      subtext: "It was powered by connection.",
      duration: 3500
    },
    {
      text: "Every time a citizen solved a problem, created art, or helped a neighbor...",
      subtext: "They generated a tiny spark. That spark kept the server running.",
      duration: 4500
    },
    {
      text: "But slowly, everyone stopped making sparks.",
      subtext: "They started consuming instead. Watching instead of doing. Commenting instead of creating.",
      duration: 4000
    },
    {
      text: "Scrolling instead of connecting.",
      subtext: "The drain was faster than the charge.",
      duration: 3000
    },
    {
      text: "And one day...",
      subtext: "",
      duration: 2000
    },
    {
      text: "The server went black.",
      subtext: "",
      duration: 2500,
      dark: true
    },
    {
      text: "You aren't just a user in this city.",
      subtext: "",
      duration: 2500,
      reveal: true
    },
    {
      text: "You are the Battery.",
      subtext: "",
      duration: 2500,
      emphasis: true
    },
    {
      text: "If you don't generate your own light...",
      subtext: "The world stays dark.",
      duration: 3500
    },
    {
      text: "This platform is that city.",
      subtext: "The Core is your mind. If you don't charge it, you go dark.",
      duration: 4000
    },
    {
      text: "The Nexus is our class.",
      subtext: "If we don't overflow with energy, the system crashes.",
      duration: 4000
    },
    {
      text: "There are no teachers here to fix the server.",
      subtext: "There are no admins. There is only us.",
      duration: 4000
    },
    {
      text: "And the lights are flickering.",
      subtext: "",
      duration: 3000,
      final: true
    }
  ]

  useEffect(() => {
    if (stage < stages.length - 1) {
      const timer = setTimeout(() => {
        setStage(s => s + 1)
      }, stages[stage].duration)
      return () => clearTimeout(timer)
    } else {
      setTimeout(() => setShowButton(true), 1500)
    }
  }, [stage])

  const currentStage = stages[stage]

  return (
    <motion.div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-8 transition-colors duration-1000 ${
        currentStage.dark ? 'bg-black' : 'bg-gradient-to-b from-surface-900 via-surface-950 to-black'
      }`}
    >
      {/* Flickering background effect */}
      <motion.div 
        className="absolute inset-0 bg-primary-500/5"
        animate={{ 
          opacity: [0, 0.1, 0, 0.05, 0] 
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      />

      {/* Skip button */}
      <button 
        onClick={onComplete}
        className="absolute top-6 right-6 text-surface-500 hover:text-surface-300 text-sm"
      >
        Skip →
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-8 left-8 right-8">
        <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary-500"
            initial={{ width: 0 }}
            animate={{ width: `${((stage + 1) / stages.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl"
        >
          <motion.h1 
            className={`text-3xl md:text-4xl font-bold mb-4 ${
              currentStage.emphasis ? 'text-primary-400 text-5xl' : 
              currentStage.dark ? 'text-surface-600' : 'text-white'
            }`}
            animate={currentStage.emphasis ? { 
              scale: [1, 1.05, 1],
              textShadow: ['0 0 0px #8b5cf6', '0 0 30px #8b5cf6', '0 0 0px #8b5cf6']
            } : {}}
            transition={{ duration: 1.5, repeat: currentStage.emphasis ? Infinity : 0 }}
          >
            {currentStage.text}
          </motion.h1>
          
          {currentStage.subtext && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-surface-400"
            >
              {currentStage.subtext}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Final button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-24 px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-bold text-lg hover:from-primary-500 hover:to-purple-500 transition-all shadow-lg shadow-primary-500/25"
            onClick={onComplete}
          >
            ⚡ IGNITE THE SYSTEM
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
