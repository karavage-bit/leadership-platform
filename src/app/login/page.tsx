'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Stage = 'choice' | 'auth' | 'igniting'
type Role = 'student' | 'teacher' | null

export default function AirlockLogin() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('choice')
  const [role, setRole] = useState<Role>(null)
  const [hoveredRole, setHoveredRole] = useState<Role>(null)
  const [classCode, setClassCode] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [welcomeName, setWelcomeName] = useState('')
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('day')
  const [idle, setIdle] = useState(false)

  // Determine time of day for background sync
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 9) setTimeOfDay('morning')
    else if (hour >= 9 && hour < 17) setTimeOfDay('day')
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening')
    else setTimeOfDay('night')
  }, [])

  // Idle detection for breathing orb
  useEffect(() => {
    let timeout: NodeJS.Timeout
    const resetIdle = () => {
      setIdle(false)
      clearTimeout(timeout)
      timeout = setTimeout(() => setIdle(true), 10000)
    }
    
    window.addEventListener('mousemove', resetIdle)
    window.addEventListener('keydown', resetIdle)
    resetIdle()
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', resetIdle)
      window.removeEventListener('keydown', resetIdle)
    }
  }, [])

  // Enable audio on first interaction
  const enableAudio = useCallback(() => {
    if (!audioEnabled) {
      setAudioEnabled(true)
    }
  }, [audioEnabled])

  // Play sound effect
  const playSound = useCallback((type: 'hover' | 'click' | 'error' | 'success' | 'type') => {
    if (!audioEnabled) return
    
    const sounds: Record<string, string> = {
      hover: 'data:audio/wav;base64,UklGRl9vT19teleGFtcGxlX2hvdmVy', // Placeholder - would use real audio
      click: 'data:audio/wav;base64,UklGRl9vT19teleGFtcGxlX2NsaWNr',
      error: 'data:audio/wav;base64,UklGRl9vT19teleGFtcGxlX2Vycm9y',
      success: 'data:audio/wav;base64,UklGRl9vT19teleGFtcGxlX3N1Y2Nlc3M=',
      type: 'data:audio/wav;base64,UklGRl9vT19teleGFtcGxlX3R5cGU='
    }
    
    // In production, use actual audio files
    try {
      const audio = new Audio()
      audio.volume = 0.3
      // audio.src = sounds[type]
      // audio.play().catch(() => {})
    } catch {}
  }, [audioEnabled])

  // Handle role selection
  const selectRole = (selectedRole: 'student' | 'teacher') => {
    enableAudio()
    playSound('click')
    setRole(selectedRole)
    setTimeout(() => setStage('auth'), 300)
  }

  // Validate class code
  const validateClassCode = async (code: string) => {
    setClassCode(code)
    if (code.length >= 4) {
      // Simulate validation - in production, check against DB
      setWelcomeName('')
    }
  }

  // Handle login
  const handleIgnite = async () => {
    enableAudio()
    setError('')
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      // Construct email from class code and identifier
      const email = `${identifier.toLowerCase()}@${classCode.toLowerCase().replace('-', '')}.radiance.edu`
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (authError) {
        setShake(true)
        setError("Key didn't fit.")
        playSound('error')
        setTimeout(() => setShake(false), 500)
        setLoading(false)
        return
      }
      
      // Success!
      playSound('success')
      setStage('igniting')
      
      // Dramatic pause then redirect
      setTimeout(() => {
        router.push(role === 'teacher' ? '/teacher' : '/student')
      }, 1500)
      
    } catch (e) {
      setShake(true)
      setError("Connection lost.")
      setTimeout(() => setShake(false), 500)
      setLoading(false)
    }
  }

  // Background gradient based on time
  const bgGradient = {
    morning: 'from-amber-900/20 via-orange-950/40 to-slate-950',
    day: 'from-sky-900/20 via-slate-900/40 to-slate-950',
    evening: 'from-purple-900/20 via-indigo-950/40 to-slate-950',
    night: 'from-blue-950/30 via-slate-950/60 to-black'
  }[timeOfDay]

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      onClick={enableAudio}
    >
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} transition-all duration-1000`}>
        {/* Simulated "Core Room" - In production, use video */}
        <div 
          className={`absolute inset-0 transition-all duration-700 ${
            hoveredRole === 'student' || stage === 'igniting' ? 'blur-none opacity-100' : 'blur-xl opacity-60'
          }`}
        >
          {/* Room elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-96 h-64 transform perspective-1000 rotate-x-12">
              {/* Desk */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-16 bg-gradient-to-t from-amber-900/40 to-amber-800/30 rounded-t-lg border border-amber-700/20" />
              {/* Monitor glow */}
              <div className={`absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-24 rounded-lg ${
                timeOfDay === 'night' ? 'bg-blue-500/20 shadow-[0_0_60px_20px_rgba(59,130,246,0.3)]' : 'bg-slate-700/30'
              }`} />
              {/* Window */}
              <div className={`absolute top-0 right-8 w-24 h-32 rounded-lg border border-white/10 ${
                timeOfDay === 'morning' ? 'bg-gradient-to-b from-orange-300/20 to-yellow-200/10' :
                timeOfDay === 'day' ? 'bg-gradient-to-b from-sky-300/20 to-blue-200/10' :
                timeOfDay === 'evening' ? 'bg-gradient-to-b from-purple-400/20 to-pink-300/10' :
                'bg-gradient-to-b from-slate-800/30 to-slate-900/20'
              }`}>
                {timeOfDay === 'night' && (
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute w-0.5 h-4 bg-blue-300/30 animate-pulse"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Particle overlay */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/50 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Glassmorphism Overlay */}
      <div className={`absolute inset-0 backdrop-blur-md bg-black/20 transition-opacity duration-700 ${
        stage === 'igniting' ? 'opacity-0' : 'opacity-100'
      }`} />

      {/* Main Content */}
      <div className={`relative z-10 min-h-screen flex items-center justify-center p-8 transition-all duration-700 ${
        stage === 'igniting' ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
      }`}>
        
        {/* Stage 1: The Choice */}
        {stage === 'choice' && (
          <div className="flex gap-8 md:gap-16">
            {/* Student Card */}
            <button
              onClick={() => selectRole('student')}
              onMouseEnter={() => { setHoveredRole('student'); playSound('hover') }}
              onMouseLeave={() => setHoveredRole(null)}
              className={`group relative w-64 h-80 rounded-2xl transition-all duration-500 ${
                hoveredRole === 'student' 
                  ? 'scale-105 shadow-[0_0_60px_10px_rgba(147,51,234,0.3)]' 
                  : 'scale-100'
              }`}
            >
              {/* Card background */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-900/40 to-violet-950/60 backdrop-blur-xl border border-purple-500/20" />
              
              {/* Card content */}
              <div className="relative h-full flex flex-col items-center justify-center p-6">
                {/* The Orb (Battery) */}
                <div className={`relative w-24 h-24 mb-6 ${idle ? 'animate-breathe' : ''}`}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 opacity-80 blur-xl animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-300 to-violet-500 shadow-inner" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
                </div>
                
                <h2 className="text-2xl font-bold text-white tracking-wider mb-2">ENTER CORE</h2>
                <p className="text-purple-300/70 text-sm">Your private space.</p>
              </div>
              
              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-2xl bg-purple-500/10 transition-opacity duration-300 ${
                hoveredRole === 'student' ? 'opacity-100' : 'opacity-0'
              }`} />
            </button>

            {/* Teacher Card */}
            <button
              onClick={() => selectRole('teacher')}
              onMouseEnter={() => { setHoveredRole('teacher'); playSound('hover') }}
              onMouseLeave={() => setHoveredRole(null)}
              className={`group relative w-64 h-80 rounded-2xl transition-all duration-500 ${
                hoveredRole === 'teacher' 
                  ? 'scale-105 shadow-[0_0_60px_10px_rgba(6,182,212,0.3)]' 
                  : 'scale-100'
              }`}
            >
              {/* Card background */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-900/40 to-slate-950/60 backdrop-blur-xl border border-cyan-500/20" />
              
              {/* Card content */}
              <div className="relative h-full flex flex-col items-center justify-center p-6">
                {/* The Spire (Network node) */}
                <div className="relative w-24 h-24 mb-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="spireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                    {/* Hexagonal network */}
                    <polygon 
                      points="50,10 90,30 90,70 50,90 10,70 10,30" 
                      fill="none" 
                      stroke="url(#spireGrad)" 
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                    <circle cx="50" cy="10" r="4" fill="#22d3ee" />
                    <circle cx="90" cy="30" r="4" fill="#22d3ee" />
                    <circle cx="90" cy="70" r="4" fill="#22d3ee" />
                    <circle cx="50" cy="90" r="4" fill="#22d3ee" />
                    <circle cx="10" cy="70" r="4" fill="#22d3ee" />
                    <circle cx="10" cy="30" r="4" fill="#22d3ee" />
                    <circle cx="50" cy="50" r="8" fill="#22d3ee" className="animate-pulse" />
                    {/* Connection lines */}
                    <line x1="50" y1="50" x2="50" y2="10" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                    <line x1="50" y1="50" x2="90" y2="30" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                    <line x1="50" y1="50" x2="90" y2="70" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                    <line x1="50" y1="50" x2="50" y2="90" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                    <line x1="50" y1="50" x2="10" y2="70" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                    <line x1="50" y1="50" x2="10" y2="30" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-white tracking-wider mb-2">ACCESS NEXUS</h2>
                <p className="text-cyan-300/70 text-sm">System control.</p>
              </div>
            </button>
          </div>
        )}

        {/* Stage 2: Authentication */}
        {stage === 'auth' && (
          <div className={`w-full max-w-md transition-all duration-500 ${
            shake ? 'animate-shake' : ''
          }`}>
            {/* The Card */}
            <div className={`relative rounded-2xl overflow-hidden backdrop-blur-xl border ${
              role === 'student' 
                ? 'bg-gradient-to-br from-purple-900/40 to-violet-950/60 border-purple-500/20' 
                : 'bg-gradient-to-br from-cyan-900/40 to-slate-950/60 border-cyan-500/20'
            }`}>
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {role === 'student' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 animate-pulse" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 animate-pulse" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {role === 'student' ? 'ENTERING CORE' : 'ACCESSING NEXUS'}
                    </h2>
                    <p className="text-sm text-white/50">Authentication required</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                {/* Class Code */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50">Signal Frequency</label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => validateClassCode(e.target.value.toUpperCase())}
                    placeholder="CLASS-CODE"
                    className={`w-full px-4 py-3 rounded-lg bg-black/30 border text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                      classCode.length >= 4 
                        ? 'border-green-500/50 focus:ring-green-500/30' 
                        : 'border-white/10 focus:ring-purple-500/30'
                    }`}
                  />
                  {classCode.length >= 4 && (
                    <p className="text-xs text-green-400/70">✓ Signal found</p>
                  )}
                </div>

                {/* Identifier */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50">Identify Self</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Student ID or Email"
                    className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                  />
                  {welcomeName && (
                    <p className="text-xs text-purple-300/70">Welcome back, {welcomeName}.</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50">Enter Key</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-lg bg-black/30 border text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                      error ? 'border-red-500/50' : 'border-white/10 focus:ring-purple-500/30'
                    }`}
                    onKeyDown={(e) => e.key === 'Enter' && handleIgnite()}
                  />
                  {error && (
                    <p className="text-xs text-red-400/70">{error}</p>
                  )}
                </div>

                {/* Ignite Button */}
                <button
                  onClick={handleIgnite}
                  disabled={loading || !classCode || !identifier || !password}
                  className={`w-full py-4 rounded-lg font-bold text-lg tracking-widest transition-all ${
                    loading
                      ? 'bg-white/10 text-white/50 cursor-wait'
                      : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg hover:shadow-purple-500/25 active:scale-95'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-pulse">{'>'} SYNCING CORE...</span>
                    </span>
                  ) : (
                    '[ IGNITE ]'
                  )}
                </button>

                {/* Back button */}
                <button
                  onClick={() => { setStage('choice'); setRole(null); setError('') }}
                  className="w-full py-2 text-white/50 hover:text-white/80 text-sm transition-colors"
                >
                  ← Return to Airlock
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State (Terminal style) */}
      {loading && (
        <div className="fixed bottom-8 left-8 font-mono text-xs text-green-400/70 space-y-1">
          <p className="animate-pulse">{`>`} SYNCING CORE...</p>
          <p className="animate-pulse" style={{ animationDelay: '0.2s' }}>{`>`} LOADING ASSETS...</p>
          <p className="animate-pulse" style={{ animationDelay: '0.4s' }}>{`>`} ESTABLISHING CONNECTION...</p>
        </div>
      )}

      {/* Ignition Success State */}
      {stage === 'igniting' && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="text-center animate-pulse">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 shadow-[0_0_100px_30px_rgba(147,51,234,0.5)] animate-ping" />
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
