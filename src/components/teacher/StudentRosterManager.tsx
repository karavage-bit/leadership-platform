'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, RefreshCw, Key, Trash2, UserPlus, X, Battery, Flame, Clock } from 'lucide-react'

interface Student {
  id: string
  name: string
  pin_hash: string
  created_at: string
  last_active?: string
  battery_level?: number
  streak?: number
}

export default function StudentRosterManager({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [bulkNames, setBulkNames] = useState('')
  const [addingBulk, setAddingBulk] = useState(false)
  const [generatedPins, setGeneratedPins] = useState<{name: string; pin: string}[]>([])
  const [resettingPin, setResettingPin] = useState<string | null>(null)
  const [newPin, setNewPin] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadStudents()
  }, [classId])

  const loadStudents = async () => {
    setLoading(true)
    const { data: studentsData } = await supabase
      .from('users')
      .select('id, name, pin_hash, created_at')
      .eq('class_id', classId)
      .eq('role', 'student')
      .order('name')

    // Get battery and streak data
    const { data: coresData } = await supabase
      .from('student_cores')
      .select('student_id, battery_level, streak_count, last_active')
      .in('student_id', studentsData?.map(s => s.id) || [])

    const coresMap: Record<string, any> = {}
    coresData?.forEach(c => { coresMap[c.student_id] = c })

    setStudents((studentsData || []).map(s => ({
      ...s,
      battery_level: coresMap[s.id]?.battery_level || 0,
      streak: coresMap[s.id]?.streak_count || 0,
      last_active: coresMap[s.id]?.last_active
    })))
    setLoading(false)
  }

  const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const hashPin = async (pin: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const bulkAddStudents = async () => {
    const names = bulkNames.split('\n').map(n => n.trim()).filter(n => n.length > 0)
    if (names.length === 0) return
    
    setAddingBulk(true)
    const generated: {name: string; pin: string}[] = []

    for (const name of names) {
      const pin = generatePin()
      const pinHash = await hashPin(pin)
      
      await supabase.from('users').insert({
        name,
        class_id: classId,
        role: 'student',
        pin_hash: pinHash
      })
      
      generated.push({ name, pin })
    }

    setGeneratedPins(generated)
    setAddingBulk(false)
    setBulkNames('')
    loadStudents()
  }

  const resetStudentPin = async (studentId: string) => {
    setResettingPin(studentId)
    const pin = generatePin()
    const pinHash = await hashPin(pin)
    
    await supabase.from('users').update({ pin_hash: pinHash }).eq('id', studentId)
    
    setNewPin(pin)
    setResettingPin(null)
    loadStudents()
  }

  const removeStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from the class?`)) return
    
    await supabase.from('users').delete().eq('id', studentId)
    setStudents(prev => prev.filter(s => s.id !== studentId))
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getLastActiveText = (lastActive: string | undefined) => {
    if (!lastActive) return 'Never'
    const diff = Date.now() - new Date(lastActive).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
          <Users className="text-blue-400" size={24} />
          Student Roster ({students.length})
        </h2>
        <div className="flex gap-2">
          <button onClick={loadStudents} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowBulkAdd(true)} className="btn btn-primary">
            <UserPlus size={18} /> Bulk Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" size={18} />
        <input
          type="text"
          placeholder="Search students..."
          className="input pl-10 w-full md:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Student Table */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-surface-600" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">No students found</h3>
          <p className="text-surface-500">Add students using the Bulk Add button above.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-surface-800">
              <tr>
                <th className="text-left px-4 py-3 text-surface-400 font-medium text-sm">Student</th>
                <th className="text-center px-4 py-3 text-surface-400 font-medium text-sm">Battery</th>
                <th className="text-center px-4 py-3 text-surface-400 font-medium text-sm">Streak</th>
                <th className="text-center px-4 py-3 text-surface-400 font-medium text-sm">Last Active</th>
                <th className="text-center px-4 py-3 text-surface-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-t border-surface-800 hover:bg-surface-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {student.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className="text-surface-200 font-medium">{student.name}</span>
                        <p className="text-xs text-surface-500">Joined {new Date(student.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Battery size={16} className={student.battery_level! > 50 ? 'text-green-400' : student.battery_level! > 20 ? 'text-yellow-400' : 'text-red-400'} />
                      <span className="text-surface-200">{student.battery_level || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame size={16} className="text-orange-400" />
                      <span className="text-surface-200">{student.streak || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-surface-400">
                      <Clock size={14} />
                      <span className="text-sm">{getLastActiveText(student.last_active)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => resetStudentPin(student.id)}
                        disabled={resettingPin === student.id}
                        className="p-2 text-surface-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                        title="Reset PIN"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => removeStudent(student.id, student.name)}
                        className="p-2 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove Student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New PIN Modal */}
      <AnimatePresence>
        {newPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setNewPin(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface-900 rounded-2xl p-6 max-w-sm text-center"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Key size={48} className="mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-bold text-surface-100 mb-2">New PIN Generated</h3>
              <p className="text-surface-400 mb-4">Share this PIN with the student:</p>
              <div className="text-4xl font-mono font-bold text-primary-400 bg-surface-800 rounded-xl py-4 mb-4">
                {newPin}
              </div>
              <button onClick={() => setNewPin(null)} className="btn btn-primary w-full">Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Add Modal */}
      <AnimatePresence>
        {showBulkAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => { setShowBulkAdd(false); setGeneratedPins([]) }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-surface-800 flex items-center justify-between sticky top-0 bg-surface-900">
                <h2 className="font-semibold text-surface-100">Bulk Add Students</h2>
                <button onClick={() => { setShowBulkAdd(false); setGeneratedPins([]) }} className="text-surface-500 hover:text-surface-300">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {generatedPins.length === 0 ? (
                  <>
                    <p className="text-surface-400 text-sm">
                      Enter one student name per line. PINs will be auto-generated.
                    </p>
                    <textarea
                      className="input"
                      rows={8}
                      placeholder="John Smith&#10;Jane Doe&#10;Alex Johnson"
                      value={bulkNames}
                      onChange={(e) => setBulkNames(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button onClick={() => setShowBulkAdd(false)} className="btn btn-secondary flex-1">Cancel</button>
                      <button 
                        onClick={bulkAddStudents}
                        disabled={addingBulk || !bulkNames.trim()}
                        className="btn btn-primary flex-1"
                      >
                        {addingBulk ? 'Adding...' : 'Add Students'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 font-semibold">Students Added Successfully!</p>
                      <p className="text-surface-400 text-sm mt-1">Save these PINs - they cannot be recovered later.</p>
                    </div>
                    <div className="space-y-2">
                      {generatedPins.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg">
                          <span className="text-surface-200">{item.name}</span>
                          <span className="font-mono text-primary-400 font-bold">{item.pin}</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => { setShowBulkAdd(false); setGeneratedPins([]) }}
                      className="btn btn-primary w-full"
                    >
                      Done
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
