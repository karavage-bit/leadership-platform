'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Heart, Users, ArrowRight, X } from 'lucide-react'

interface UnmaskingData {
  anonymousName: string
  realName: string
  achievement: string
  rippleCount: number
  rippleChain: string[]
  date: string
}

interface DailyUnmaskingProps {
  unmasking: UnmaskingData | null
  isOpen: boolean
  onClose: () => void
  onCelebrate: () => void
}

export default function DailyUnmasking({
  unmasking,
  isOpen,
  onClose,
  onCelebrate
}: DailyUnmaskingProps) {
  const [stage, setStage] = useState<'intro' | 'reveal' | 'details'>('intro')
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStage('intro')
      setShowConfetti(false)
    }
  }, [isOpen])

  const handleReveal = () => {
    setStage('reveal')
    setShowConfetti(true)
    setTimeout(() => setStage('details'), 2000)
  }

  if (!unmasking) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#fbbf24', '#a855f7', '#22c55e', '#3b82f6', '#ec4899'][i % 5],
                  }}
                  initial={{ top: -20, rotate: 0 }}
                  animate={{
                    top: '120%',
                    rotate: Math.random() * 720,
                    x: (Math.random() - 0.5) * 200
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    ease: 'easeOut',
                    delay: Math.random() * 0.5
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            className="relative max-w-lg w-full"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {/* Close button */}
            {stage === 'details' && (
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            )}

            {/* Stage: Intro */}
            {stage === 'intro' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-6"
                >
                  ✨
                </motion.div>
                
                <h1 className="text-3xl font-bold text-white mb-4">
                  Daily Unmasking
                </h1>
                
                <p className="text-surface-300 mb-8">
                  One person's anonymous actions have stood out.<br />
                  Let's reveal who they are!
                </p>
                
                <motion.div
                  className="bg-surface-800/50 rounded-2xl p-6 mb-8 border border-surface-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-sm text-surface-400 mb-2">Today's spotlight falls on...</div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl">🎭</span>
                    <span className="text-2xl font-bold text-primary">{unmasking.anonymousName}</span>
                  </div>
                </motion.div>
                
                <button
                  onClick={handleReveal}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                >
                  <Sparkles size={24} />
                  Reveal Their Identity
                  <ArrowRight size={24} />
                </button>
              </motion.div>
            )}

            {/* Stage: Reveal */}
            {stage === 'reveal' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5, 1] }}
                  transition={{ duration: 0.8 }}
                  className="mb-8"
                >
                  <div className="text-8xl mb-4">🎭</div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl text-surface-400"
                  >
                    is revealed to be
                  </motion.div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400"
                >
                  ⭐ {unmasking.realName} ⭐
                </motion.div>
              </motion.div>
            )}

            {/* Stage: Details */}
            {stage === 'details' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-900 rounded-2xl overflow-hidden border border-yellow-500/30 shadow-2xl shadow-yellow-500/10"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-pink-500/20 p-6 text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <h2 className="text-3xl font-bold text-white mb-1">{unmasking.realName}</h2>
                  <div className="text-surface-400">
                    formerly known as <span className="text-primary">{unmasking.anonymousName}</span>
                  </div>
                </div>
                
                {/* Achievement */}
                <div className="p-6 border-b border-surface-700">
                  <div className="text-sm text-surface-400 uppercase tracking-wide mb-2">
                    Recognized For
                  </div>
                  <p className="text-lg text-white">
                    {unmasking.achievement}
                  </p>
                </div>
                
                {/* Ripple Impact */}
                {unmasking.rippleCount > 0 && (
                  <div className="p-6 bg-surface-800/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="text-care" size={20} />
                      <span className="text-sm text-surface-400 uppercase tracking-wide">
                        Ripple Impact
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {unmasking.rippleChain.map((name, i) => (
                        <div key={i} className="flex items-center">
                          <div className="bg-surface-700 px-3 py-1 rounded-full text-sm text-white">
                            {name}
                          </div>
                          {i < unmasking.rippleChain.length - 1 && (
                            <ArrowRight className="text-primary mx-1" size={16} />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center text-surface-300 text-sm">
                      <span className="text-2xl font-bold text-care">{unmasking.rippleCount}</span>
                      {' '}people touched by this chain of kindness
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="p-6 flex gap-3">
                  <button
                    onClick={() => { onCelebrate(); onClose(); }}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} />
                    Celebrate!
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-surface-700 hover:bg-surface-600 rounded-xl text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Smaller notification version for the main screen
export function UnmaskingNotification({
  unmasking,
  onClick
}: {
  unmasking: UnmaskingData
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      onClick={onClick}
      className="fixed top-20 left-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30 shadow-lg max-w-xs text-left z-30 hover:border-yellow-500/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl animate-pulse">✨</div>
        <div>
          <div className="text-xs text-yellow-400 uppercase tracking-wide font-semibold">
            Daily Unmasking
          </div>
          <div className="text-white text-sm">
            See who <span className="text-primary">{unmasking.anonymousName}</span> really is!
          </div>
        </div>
      </div>
    </motion.button>
  )
}
