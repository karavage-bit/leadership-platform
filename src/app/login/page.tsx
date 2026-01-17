'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

type Stage = 'choice' | 'auth' | 'igniting'
type Role = 'student' | 'teacher' | null
type StudentMode = 'join' | 'login'
type TeacherMode = 'login' | 'register'

export default function AirlockLogin() {
  const router = useRouter()
  const supabase = createClient()
  
  const [stage, setStage] = useState<Stage>('choice')
  const [role, setRole] = useState<Role>(null)
  const [hoveredRole, setHoveredRole] = useState<Role>(null)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('day')
  const [idle, setIdle] = useState(false)

  // Student states
  const [studentMode, setStudentMode] = useState<StudentMode>('login')
  const [studentName, setStudentName] = useState('')
  const [classCode, setClassCode] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  // Teacher states
  const [teacherMode, setTeacherMode] = useState<TeacherMode>('login')
  const [teacherEmail, setTeacherEmail] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [teacherName, setTeacherName] = useState('')

  // Time of day for background
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 9) setTimeOfDay('morning')
    else if (hour >= 9 && hour < 17) setTimeOfDay('day')
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening')
    else setTimeOfDay('night')
  }, [])

  // Idle detection
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

  const selectRole = (selectedRole: 'student' | 'teacher') => {
    setRole(selectedRole)
    setError('')
    setTimeout(() => setStage('auth'), 300)
  }

  const triggerError = (msg: string) => {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  // NEW STUDENT: Join class
  const handleStudentJoin = async () => {
    setLoading(true)
    setError('')

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      triggerError('PIN must be exactly 4 digits')
      setLoading(false)
      return
    }
    if (pin !== confirmPin) {
      triggerError('PINs do not match')
      setLoading(false)
      return
    }

    try {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('code', classCode.toUpperCase())
        .single()

      if (classError || !classData) {
        triggerError('Signal not found. Check your code.')
        setLoading(false)
        return
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('name', studentName.trim())
        .eq('class_id', classData.id)
        .single()

      if (existingUser) {
        triggerError('Identity already registered. Use "Returning" to reconnect.')
        setLoading(false)
        return
      }

      const uniqueEmail = `${studentName.toLowerCase().replace(/\s/g, '')}_${Date.now()}@student.leadership.local`
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password: `${pin}_${crypto.randomUUID()}`,
      })

      if (authError) throw authError

      const { error: userError } = await supabase.from('users').insert({
        id: authData.user!.id,
        email: uniqueEmail,
        name: studentName.trim(),
        role: 'student',
        class_id: classData.id,
        pin: pin,
        avatar_seed: crypto.randomUUID(),
      })

      if (userError) throw userError

      await supabase.from('world_states').insert({ student_id: authData.user!.id })

      localStorage.setItem('leadership_user_id', authData.user!.id)
      localStorage.setItem('leadership_user_name', studentName.trim())
      localStorage.setItem('leadership_class_id', classData.id)

      setStage('igniting')
      setTimeout(() => router.push('/student'), 1500)
    } catch (err: any) {
      triggerError(err.message || 'Connection failed')
      setLoading(false)
    }
  }

  // RETURNING STUDENT: Login
  const handleStudentLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('code', classCode.toUpperCase())
        .single()

      if (classError || !classData) {
        triggerError('Signal not found. Check your code.')
        setLoading(false)
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('name', studentName.trim())
        .eq('class_id', classData.id)
        .eq('pin', pin)
        .single()

      if (userError || !userData) {
        triggerError("Key didn't fit. Check your credentials.")
        setLoading(false)
        return
      }

      localStorage.setItem('leadership_user_id', userData.id)
      localStorage.setItem('leadership_user_name', userData.name)
      localStorage.setItem('leadership_class_id', userData.class_id)
      localStorage.setItem('leadership_show_welcome', 'true')

      setStage('igniting')
      setTimeout(() => { window.location.href = '/student' }, 1500)
    } catch (err: any) {
      triggerError(err.message || 'Connection failed')
      setLoading(false)
    }
  }

  // TEACHER: Login or Register
  const handleTeacherAuth = async () => {
    setLoading(true)
    setError('')

    try {
      if (teacherMode === 'register') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: teacherEmail,
          password: teacherPassword,
        })
        if (authError) throw authError

        const classConfigs = [
          { name: 'Leadership 1st Period', suffix: '1ST' },
          { name: 'Leadership 2nd A', suffix: '2A' },
          { name: 'Leadership 2nd B', suffix: '2B' },
        ]
        let firstClassId = null

        for (const config of classConfigs) {
          const code = Math.random().toString(36).substring(2, 5).toUpperCase() + config.suffix
          const { data: classData, error: classError } = await supabase
            .from('classes')
            .insert({ name: config.name, code, teacher_id: authData.user!.id, current_lesson_id: 1 })
            .select()
            .single()
          if (classError) throw classError
          if (!firstClassId) firstClassId = classData.id
        }

        await supabase.from('users').insert({
          id: authData.user!.id,
          email: teacherEmail,
          name: teacherName,
          role: 'teacher',
          class_id: firstClassId,
        })

        setStage('igniting')
        setTimeout(() => router.push('/teacher'), 1500)
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: teacherEmail,
          password: teacherPassword,
        })
        if (authError) throw authError

        setStage('igniting')
        setTimeout(() => router.push('/teacher'), 1500)
      }
    } catch (err: any) {
      const msg = err.message || 'Connection failed'
      if (msg.includes('Email not confirmed')) {
        triggerError('Check your email to confirm, then retry.')
      } else if (msg.includes('Invalid login')) {
        triggerError("Key didn't fit. Check credentials.")
      } else {
        triggerError(msg)
      }
      setLoading(false)
    }
  }

  const bgGradient = {
    morning: 'from-amber-900/20 via-orange-950/40 to-slate-950',
    day: 'from-sky-900/20 via-slate-900/40 to-slate-950',
    evening: 'from-purple-900/20 via-indigo-950/40 to-slate-950',
    night: 'from-blue-950/30 via-slate-950/60 to-black'
  }[timeOfDay]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} transition-all duration-1000`}>
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
              onMouseEnter={() => setHoveredRole('student')}
              onMouseLeave={() => setHoveredRole(null)}
              className={`group relative w-64 h-80 rounded-2xl transition-all duration-500 ${
                hoveredRole === 'student' 
                  ? 'scale-105 shadow-[0_0_60px_10px_rgba(147,51,234,0.3)]' 
                  : 'scale-100'
              }`}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-900/40 to-violet-950/60 backdrop-blur-xl border border-purple-500/20" />
              <div className="relative h-full flex flex-col items-center justify-center p-6">
                <div className={`relative w-24 h-24 mb-6 ${idle ? 'animate-breathe' : ''}`}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 opacity-80 blur-xl animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-300 to-violet-500 shadow-inner" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wider mb-2">ENTER CORE</h2>
                <p className="text-purple-300/70 text-sm">Your private space.</p>
              </div>
            </button>

            {/* Teacher Card */}
            <button
              onClick={() => selectRole('teacher')}
              onMouseEnter={() => setHoveredRole('teacher')}
              onMouseLeave={() => setHoveredRole(null)}
              className={`group relative w-64 h-80 rounded-2xl transition-all duration-500 ${
                hoveredRole === 'teacher' 
                  ? 'scale-105 shadow-[0_0_60px_10px_rgba(6,182,212,0.3)]' 
                  : 'scale-100'
              }`}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-900/40 to-slate-950/60 backdrop-blur-xl border border-cyan-500/20" />
              <div className="relative h-full flex flex-col items-center justify-center p-6">
                <div className="relative w-24 h-24 mb-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="spireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                    <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke="url(#spireGrad)" strokeWidth="2" className="animate-pulse" />
                    <circle cx="50" cy="10" r="4" fill="#22d3ee" />
                    <circle cx="90" cy="30" r="4" fill="#22d3ee" />
                    <circle cx="90" cy="70" r="4" fill="#22d3ee" />
                    <circle cx="50" cy="90" r="4" fill="#22d3ee" />
                    <circle cx="10" cy="70" r="4" fill="#22d3ee" />
                    <circle cx="10" cy="30" r="4" fill="#22d3ee" />
                    <circle cx="50" cy="50" r="8" fill="#22d3ee" className="animate-pulse" />
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
          <div className={`w-full max-w-md transition-all duration-500 ${shake ? 'animate-shake' : ''}`}>
            <div className={`relative rounded-2xl overflow-hidden backdrop-blur-xl border ${
              role === 'student' 
                ? 'bg-gradient-to-br from-purple-900/40 to-violet-950/60 border-purple-500/20' 
                : 'bg-gradient-to-br from-cyan-900/40 to-slate-950/60 border-cyan-500/20'
            }`}>
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full animate-pulse ${
                    role === 'student' ? 'bg-gradient-to-br from-purple-400 to-violet-600' : 'bg-gradient-to-br from-cyan-400 to-cyan-600'
                  }`} />
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {role === 'student' ? 'ENTERING CORE' : 'ACCESSING NEXUS'}
                    </h2>
                    <p className="text-sm text-white/50">Authentication required</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {role === 'student' ? (
                  <>
                    {/* Student Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => { setStudentMode('login'); setError('') }}
                        className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                          studentMode === 'login' ? 'bg-purple-600/50 text-white' : 'bg-white/5 text-white/50'
                        }`}
                      >
                        👋 Returning
                      </button>
                      <button
                        onClick={() => { setStudentMode('join'); setError('') }}
                        className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                          studentMode === 'join' ? 'bg-purple-600/50 text-white' : 'bg-white/5 text-white/50'
                        }`}
                      >
                        ✨ New
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/50">Your Name</label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/50">Signal Frequency</label>
                      <input
                        type="text"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                        placeholder="CLASS-CODE"
                        className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 uppercase tracking-widest text-center font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/50">
                        {studentMode === 'join' ? 'Create 4-Digit Key' : 'Enter Key'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? 'text' : 'password'}
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="••••"
                          maxLength={4}
                          className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-center text-2xl tracking-[0.5em] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                        >
                          {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {studentMode === 'join' && (
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-white/50">Confirm Key</label>
                        <input
                          type={showPin ? 'text' : 'password'}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="••••"
                          maxLength={4}
                          className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-center text-2xl tracking-[0.5em] font-mono"
                        />
                      </div>
                    )}

                    <button
                      onClick={studentMode === 'join' ? handleStudentJoin : handleStudentLogin}
                      disabled={loading || !studentName || !classCode || !pin}
                      className="w-full py-4 rounded-lg font-bold text-lg tracking-widest bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '> SYNCING CORE...' : '[ IGNITE ]'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Teacher Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => { setTeacherMode('login'); setError('') }}
                        className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                          teacherMode === 'login' ? 'bg-cyan-600/50 text-white' : 'bg-white/5 text-white/50'
                        }`}
                      >
                        Login
                      </button>
                      <button
                        onClick={() => { setTeacherMode('register'); setError('') }}
                        className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                          teacherMode === 'register' ? 'bg-cyan-600/50 text-white' : 'bg-white/5 text-white/50'
                        }`}
                      >
                        Register
                      </button>
                    </div>

                    {teacherMode === 'register' && (
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-white/50">Your Name</label>
                        <input
                          type="text"
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/50">Email</label>
                      <input
                        type="email"
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/50">Password</label>
                      <input
                        type="password"
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>

                    <button
                      onClick={handleTeacherAuth}
                      disabled={loading || !teacherEmail || !teacherPassword}
                      className="w-full py-4 rounded-lg font-bold text-lg tracking-widest bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '> CONNECTING...' : '[ IGNITE ]'}
                    </button>
                  </>
                )}

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

      {/* Ignition State */}
      {stage === 'igniting' && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="text-center">
            <div className={`w-32 h-32 mx-auto mb-4 rounded-full shadow-[0_0_100px_30px] animate-ping ${
              role === 'student' 
                ? 'bg-gradient-to-br from-purple-400 to-violet-600 shadow-purple-500/50' 
                : 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-cyan-500/50'
            }`} />
          </div>
        </div>
      )}

      {/* Terminal Loading */}
      {loading && (
        <div className="fixed bottom-8 left-8 font-mono text-xs text-green-400/70 space-y-1">
          <p className="animate-pulse">{`>`} SYNCING CORE...</p>
          <p className="animate-pulse" style={{ animationDelay: '0.2s' }}>{`>`} LOADING ASSETS...</p>
          <p className="animate-pulse" style={{ animationDelay: '0.4s' }}>{`>`} ESTABLISHING CONNECTION...</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-20px); opacity: 0.6; }
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
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-breathe { animation: breathe 3s ease-in-out infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  )
}
