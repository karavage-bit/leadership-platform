'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Save, X, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PrivateNotesProps {
  studentId: string
  isOpen: boolean
  onClose: () => void
}

export default function PrivateNotes({ studentId, isOpen, onClose }: PrivateNotesProps) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && studentId) {
      loadNotes()
    }
  }, [isOpen, studentId])

  const loadNotes = async () => {
    const { data } = await supabase
      .from('private_notes')
      .select('content, updated_at')
      .eq('student_id', studentId)
      .single()

    if (data) {
      setNotes(data.content || '')
      setLastSaved(new Date(data.updated_at))
    }
  }

  const saveNotes = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('private_notes')
      .upsert({
        student_id: studentId,
        content: notes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id' })

    setSaving(false)
    if (!error) {
      setLastSaved(new Date())
    }
  }

  // Auto-save after 2 seconds of no typing
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (notes && studentId) {
        saveNotes()
      }
    }, 2000)
    return () => clearTimeout(timeout)
  }, [notes])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-surface-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-surface-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-surface-700 rounded-lg">
                  <Lock className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Private Notes</h2>
                  <p className="text-xs text-surface-400">
                    Only you can see this. Never graded. Never shared.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Editor */}
            <div className="flex-1 p-4 overflow-hidden">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write whatever's on your mind. This is your space to think freely, process emotions, or just vent. No one else will ever see this..."
                className="w-full h-full min-h-[300px] bg-surface-900 rounded-xl p-4 text-surface-100 placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-between p-4 border-t border-surface-700">
              <div className="flex items-center gap-2 text-sm text-surface-400">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    Saving...
                  </span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Start writing...
                  </span>
                )}
              </div>
              
              <button
                onClick={saveNotes}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
