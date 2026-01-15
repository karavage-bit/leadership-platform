'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Users, BookOpen, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function HomePage() {
  const [mode, setMode] = useState<'student' | 'teacher'>('student')
  const [studentMode, setStudentMode] = useState<'join' | 'login'>('join')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPin, setShowPin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Student form - New Join
  const [studentName, setStudentName] = useState('')
  const [classCode, setClassCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  // Student form - Returning Login
  const [loginName, setLoginName] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [loginPin, setLoginPin] = useState('')

  // Teacher form
  const [teacherEmail, setTeacherEmail] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [teacherName, setTeacherName] = useState('')

  // Animated background particles
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; delay: number }[]>([])
  
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)
  }, [])

  // NEW STUDENT: Join class with PIN creation
  const handleStudentJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('PIN must be exactly 4 digits')
      setLoading(false)
      return
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match')
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
        setError('Class not found. Check your code.')
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
        setError('This name is already registered. Use "Returning Student" to log in.')
        setLoading(false)
        return
      }

      const uniqueEmail = `${studentName.toLowerCase().replace(/\s/g, '')}_${Date.now()}@student.leadership.local`
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password: `${newPin}_${crypto.randomUUID()}`,
      })

      if (authError) throw authError

      const { error: userError } = await supabase.from('users').insert({
        id: authData.user!.id,
        email: uniqueEmail,
        name: studentName.trim(),
        role: 'student',
        class_id: classData.id,
        pin: newPin,
        avatar_seed: crypto.randomUUID(),
      })

      if (userError) throw userError

      // Create initial world state
      await supabase.from('world_states').insert({
        student_id: authData.user!.id,
      })

      // Store session
      localStorage.setItem('leadership_user_id', authData.user!.id)
      localStorage.setItem('leadership_user_name', studentName.trim())
      localStorage.setItem('leadership_class_id', classData.id)

      router.push('/student')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // RETURNING STUDENT: Login with Name + Class Code + PIN
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('code', loginCode.toUpperCase())
        .single()

      if (classError || !classData) {
        setError('Class not found. Check your code.')
        setLoading(false)
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('name', loginName.trim())
        .eq('class_id', classData.id)
        .eq('pin', loginPin)
        .single()

      if (userError || !userData) {
        setError('Name, class code, or PIN is incorrect.')
        setLoading(false)
        return
      }

      localStorage.setItem('leadership_user_id', userData.id)
      localStorage.setItem('leadership_user_name', userData.name)
      localStorage.setItem('leadership_class_id', userData.class_id)

      window.location.href = '/student'
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // TEACHER: Login or Register
  const handleTeacherAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (authMode === 'register') {
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
          const classCode = Math.random().toString(36).substring(2, 5).toUpperCase() + config.suffix
          
          const { data: classData, error: classError } = await supabase
            .from('classes')
            .insert({
              name: config.name,
              code: classCode,
              teacher_id: authData.user!.id,
              current_lesson_id: 1,
            })
            .select()
            .single()

          if (classError) throw classError
          if (!firstClassId) firstClassId = classData.id
        }

        const { error: userError } = await supabase.from('users').insert({
          id: authData.user!.id,
          email: teacherEmail,
          name: teacherName,
          role: 'teacher',
          class_id: firstClassId,
        })

        if (userError) throw userError

        router.push('/teacher')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: teacherEmail,
          password: teacherPassword,
        })

        if (authError) throw authError

        router.push('/teacher')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-community/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-care/10 rounded-full blur-3xl" />
        
        {/* Particles */}
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 4,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo & Title */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative inline-block mb-4">
              <div className="text-7xl">🌱</div>
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="text-primary-400" size={24} />
              </motion.div>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Leadership 2.0</span>
            </h1>
            <p className="text-surface-400">Build real skills through real action</p>
          </motion.div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('student')}
              className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === 'student'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-surface-800/80 text-surface-400 hover:text-surface-200 hover:bg-surface-700/80'
              }`}
            >
              <BookOpen size={20} />
              Student
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('teacher')}
              className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === 'teacher'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-surface-800/80 text-surface-400 hover:text-surface-200 hover:bg-surface-700/80'
              }`}
            >
              <Users size={20} />
              Teacher
            </motion.button>
          </div>

          {/* Card */}
          <motion.div
            layout
            className="card-glow p-6 rounded-2xl"
          >
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-courage/10 border border-courage/30 rounded-xl text-courage text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {mode === 'student' ? (
                <motion.div
                  key="student"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Student Mode Tabs */}
                  <div className="flex gap-2 mb-5">
                    <button
                      onClick={() => setStudentMode('join')}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        studentMode === 'join'
                          ? 'bg-surface-700 text-surface-100'
                          : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800'
                      }`}
                    >
                      ✨ New Student
                    </button>
                    <button
                      onClick={() => setStudentMode('login')}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        studentMode === 'login'
                          ? 'bg-surface-700 text-surface-100'
                          : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800'
                      }`}
                    >
                      👋 Returning
                    </button>
                  </div>

                  {studentMode === 'join' ? (
                    <form onSubmit={handleStudentJoin} className="space-y-4">
                      <div>
                        <label className="label">Your Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Enter your full name"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Class Code</label>
                        <input
                          type="text"
                          className="input uppercase tracking-widest text-center font-mono text-lg"
                          placeholder="ABC123"
                          maxLength={6}
                          value={classCode}
                          onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Create a 4-Digit PIN</label>
                        <div className="relative">
                          <input
                            type={showPin ? 'text' : 'password'}
                            className="input text-center text-2xl tracking-[0.5em] font-mono"
                            placeholder="••••"
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                          >
                            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <p className="text-xs text-surface-500 mt-1.5">You'll use this PIN to log back in</p>
                      </div>
                      <div>
                        <label className="label">Confirm PIN</label>
                        <input
                          type={showPin ? 'text' : 'password'}
                          className="input text-center text-2xl tracking-[0.5em] font-mono"
                          placeholder="••••"
                          maxLength={4}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                          required
                        />
                      </div>
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn btn-primary w-full py-4 text-lg"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              ⏳
                            </motion.span>
                            Joining...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Join Class <ArrowRight size={20} />
                          </span>
                        )}
                      </motion.button>
                    </form>
                  ) : (
                    <form onSubmit={handleStudentLogin} className="space-y-4">
                      <div>
                        <label className="label">Your Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Enter your full name"
                          value={loginName}
                          onChange={(e) => setLoginName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Class Code</label>
                        <input
                          type="text"
                          className="input uppercase tracking-widest text-center font-mono text-lg"
                          placeholder="ABC123"
                          maxLength={6}
                          value={loginCode}
                          onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Your PIN</label>
                        <div className="relative">
                          <input
                            type={showPin ? 'text' : 'password'}
                            className="input text-center text-2xl tracking-[0.5em] font-mono"
                            placeholder="••••"
                            maxLength={4}
                            value={loginPin}
                            onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                          >
                            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn btn-primary w-full py-4 text-lg"
                      >
                        {loading ? 'Logging in...' : (
                          <span className="flex items-center gap-2">
                            Welcome Back <ArrowRight size={20} />
                          </span>
                        )}
                      </motion.button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="teacher"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Teacher Auth Tabs */}
                  <div className="flex gap-2 mb-5">
                    <button
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        authMode === 'login'
                          ? 'bg-surface-700 text-surface-100'
                          : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setAuthMode('register')}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        authMode === 'register'
                          ? 'bg-surface-700 text-surface-100'
                          : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800'
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  <form onSubmit={handleTeacherAuth} className="space-y-4">
                    {authMode === 'register' && (
                      <>
                        <div>
                          <label className="label">Your Name</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="Your name"
                            value={teacherName}
                            onChange={(e) => setTeacherName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="p-4 bg-surface-800/50 rounded-xl border border-surface-700">
                          <p className="font-medium text-surface-300 mb-2 flex items-center gap-2">
                            📚 3 Classes will be created:
                          </p>
                          <ul className="text-sm text-surface-400 space-y-1">
                            <li>• Leadership 1st Period</li>
                            <li>• Leadership 2nd A</li>
                            <li>• Leadership 2nd B</li>
                          </ul>
                        </div>
                      </>
                    )}
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="your@email.com"
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <input
                        type="password"
                        className="input"
                        placeholder="••••••••"
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn btn-primary w-full py-4 text-lg"
                    >
                      {loading ? 'Please wait...' : authMode === 'register' ? 'Create Account' : 'Login'}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.p
            className="text-center text-surface-500 text-sm mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-primary-400">The 51/49 Principle:</span> Master yourself before leading others.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
