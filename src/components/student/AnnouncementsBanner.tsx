'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Pin, AlertTriangle, X } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'normal' | 'important' | 'urgent'
  is_pinned: boolean
  created_at: string
}

export default function AnnouncementsBanner({ classId }: { classId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadAnnouncements()
    // Load dismissed from localStorage
    const dismissed = localStorage.getItem(`announcements_dismissed_${classId}`)
    if (dismissed) {
      setDismissedIds(new Set(JSON.parse(dismissed)))
    }
  }, [classId])

  const loadAnnouncements = async () => {
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('class_id', classId)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)
    
    setAnnouncements(data || [])
  }

  const dismissAnnouncement = (id: string) => {
    const newDismissed = new Set(dismissedIds)
    newDismissed.add(id)
    setDismissedIds(newDismissed)
    localStorage.setItem(`announcements_dismissed_${classId}`, JSON.stringify([...newDismissed]))
  }

  // Filter out dismissed non-pinned normal announcements
  const visibleAnnouncements = announcements.filter(a => {
    if (a.is_pinned || a.priority !== 'normal') return true
    return !dismissedIds.has(a.id)
  })

  const urgentAnnouncements = visibleAnnouncements.filter(a => a.priority === 'urgent')
  const importantAnnouncements = visibleAnnouncements.filter(a => a.priority === 'important' || a.is_pinned)
  const normalAnnouncements = visibleAnnouncements.filter(a => a.priority === 'normal' && !a.is_pinned)

  if (visibleAnnouncements.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {/* Urgent Announcements - Always prominent */}
      {urgentAnnouncements.map(a => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-500/40"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-300">{a.title}</h3>
              <p className="text-surface-300 text-sm mt-1">{a.content}</p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Important/Pinned Announcements */}
      {importantAnnouncements.map(a => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-amber-900/30 to-amber-800/10 border border-amber-500/30"
        >
          <div className="flex items-start gap-3">
            {a.is_pinned ? (
              <Pin className="text-primary-400 shrink-0 mt-0.5" size={18} />
            ) : (
              <Bell className="text-amber-400 shrink-0 mt-0.5" size={18} />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-amber-300">{a.title}</h3>
              <p className="text-surface-300 text-sm mt-1">{a.content}</p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Normal Announcements - Collapsible */}
      {normalAnnouncements.length > 0 && (
        <div className="space-y-2">
          {!expanded && normalAnnouncements.length > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full p-3 rounded-xl bg-surface-800/50 border border-surface-700 text-surface-400 text-sm hover:bg-surface-800 transition-colors flex items-center justify-center gap-2"
            >
              <Bell size={16} />
              {normalAnnouncements.length} announcement{normalAnnouncements.length > 1 ? 's' : ''}
            </button>
          )}
          
          <AnimatePresence>
            {expanded && normalAnnouncements.map(a => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-surface-800/50 border border-surface-700"
              >
                <div className="flex items-start gap-3">
                  <Bell className="text-surface-500 shrink-0 mt-0.5" size={16} />
                  <div className="flex-1">
                    <h3 className="font-medium text-surface-200">{a.title}</h3>
                    <p className="text-surface-400 text-sm mt-1">{a.content}</p>
                  </div>
                  <button
                    onClick={() => dismissAnnouncement(a.id)}
                    className="text-surface-500 hover:text-surface-300 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="text-surface-500 text-sm hover:text-surface-300"
            >
              Collapse
            </button>
          )}
        </div>
      )}
    </div>
  )
}
