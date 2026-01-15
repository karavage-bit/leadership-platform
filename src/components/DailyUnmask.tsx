'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Heart, Users, ArrowRight } from 'lucide-react'

interface DailyUnmaskProps {
  anonymousName: string
  realName: string
  reason: string
  rippleCount: number
  onContinue: () => void
}

export default function DailyUnmask({ anonymousName, realName, reason, rippleCount, onContinue }: DailyUnmaskProps) {
  const [revealed, setRevealed] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  useEffect(() => {
    // Auto-reveal after delay
    const timer1 = setTimeout(() => setRevealed(true), 2000)
    const timer2 = setTimeout(() => setShowDetails(true), 3500)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])
  
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center z-50">
      {/* Particle effects */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 100,
              opacity: 0.8 
            }}
            animate={{ 
              y: -100,
              opacity: 0 
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>
      
      <div className="relative text-center max-w-lg px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            ✨
          </motion.div>
          <h1 className="text-2xl font-bold text-purple-300 tracking-wide">
            DAILY SPOTLIGHT
          </h1>
        </motion.div>
        
        {/* Mask reveal animation */}
        <div className="relative mb-8">
          {/* Anonymous name (fades out) */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: revealed ? 0 : 1 }}
            className="text-4xl font-bold text-white flex items-center justify-center gap-3"
          >
            <span className="text-5xl">🎭</span>
            {anonymousName}
          </motion.div>
          
          {/* Transition effect */}
          {!revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, delay: 1 }}
              className="absolute inset-0 flex items-center justify-center text-purple-400"
            >
              <ArrowRight size={40} />
            </motion.div>
          )}
          
          {/* Real name (fades in) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.8 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="text-lg text-purple-400 mb-2">is revealed to be</div>
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 flex items-center gap-3">
              <span>⭐</span>
              {realName}
              <span>⭐</span>
            </div>
          </motion.div>
        </div>
        
        {/* Reason */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showDetails ? 1 : 0, y: showDetails ? 0 : 20 }}
          className="space-y-4"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-center gap-2 text-purple-300 mb-3">
              <Heart size={20} className="text-pink-400" />
              <span className="font-semibold">Recognized For</span>
            </div>
            <p className="text-white text-lg leading-relaxed">
              {reason}
            </p>
          </div>
          
          {/* Ripple impact */}
          {rippleCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-xl p-4 border border-cyan-500/30"
            >
              <div className="flex items-center justify-center gap-3">
                <Users className="text-cyan-400" size={24} />
                <span className="text-cyan-300">
                  Their actions created a ripple that touched <strong className="text-white">{rippleCount} people</strong>
                </span>
              </div>
            </motion.div>
          )}
          
          {/* Celebrate button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onContinue}
            className="mt-6 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Sparkles size={20} />
            Celebrate & Continue
          </motion.button>
        </motion.div>
        
        {/* Encouraging note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: showDetails ? 0.6 : 0 }}
          transition={{ delay: 1 }}
          className="text-slate-400 text-sm mt-8 italic"
        >
          Every day, one person's good deeds are celebrated.<br />
          Tomorrow, it could be you.
        </motion.p>
      </div>
    </div>
  )
}
