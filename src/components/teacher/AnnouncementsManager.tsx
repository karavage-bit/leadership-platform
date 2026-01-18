'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Pin, AlertTriangle, Trash2, Plus, X } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'normal' | 'important' | 'urgent'
  is_pinned: boolean
  created_at: string
  expires_at: string | null
}

export default function AnnouncementsManager({ classId, teacherId }: { classId: string; teacherId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal')
  const [isPinned, setIsPinned] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    loadAnnouncements()
  }, [classId])

  const loadAnnouncements = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('class_id', classId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    
    setAnnouncements(data || [])
    setLoading(false)
  }

  const createAnnouncement = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    
    await supabase.from('announcements').insert({
      class_id: classId,
      teacher_id: teacherId,
      title: title.trim(),
      content: content.trim(),
      priority,
      is_pinned: isPinned,
      expires_at: expiresAt || null
    })

    // Log activity
    await supabase.from('student_activity_log').insert({
      class_id: classId,
      activity_type: 'announcement_created',
      activity_data: { title, priority }
    })

    setTitle('')
    setContent('')
    setPriority('normal')
    setIsPinned(false)
    setExpiresAt('')
    setShowForm(false)
    setSaving(false)
    loadAnnouncements()
  }

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const togglePin = async (id: string, currentPin: boolean) => {
    await supabase.from('announcements').update({ is_pinned: !currentPin }).eq('id', id)
    loadAnnouncements()
  }

  const priorityColors = {
    normal: 'bg-surface-800 border-surface-700',
    important: 'bg-amber-900/20 border-amber-500/30',
    urgent: 'bg-red-900/20 border-red-500/30'
  }

  const priorityBadges = {
    normal: 'badge bg-surface-700 text-surface-300',
    important: 'badge bg-amber-500/20 text-amber-400',
    urgent: 'badge bg-red-500/20 text-red-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
          <Bell className="text-primary-400" size={24} />
          Announcements
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <Plus size={18} /> New Announcement
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-100">Create Announcement</h3>
              <button onClick={() => setShowForm(false)} className="text-surface-500 hover:text-surface-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Announcement title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="label">Content</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Write your announcement..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-surface-200">Pin to top</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button 
                  onClick={createAnnouncement} 
                  disabled={saving || !title.trim() || !content.trim()}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Creating...' : 'Create Announcement'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements List */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={48} className="mx-auto mb-4 text-surface-600" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">No announcements</h3>
          <p className="text-surface-500">Create your first announcement to notify students.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(announcement => (
            <div
              key={announcement.id}
              className={`card p-4 border ${priorityColors[announcement.priority]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.is_pinned && (
                      <Pin size={14} className="text-primary-400" />
                    )}
                    {announcement.priority === 'urgent' && (
                      <AlertTriangle size={14} className="text-red-400" />
                    )}
                    <h3 className="font-semibold text-surface-100">{announcement.title}</h3>
                    <span className={priorityBadges[announcement.priority]}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-surface-400 text-sm">{announcement.content}</p>
                  <p className="text-surface-600 text-xs mt-2">
                    {new Date(announcement.created_at).toLocaleString()}
                    {announcement.expires_at && ` | Expires: ${new Date(announcement.expires_at).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePin(announcement.id, announcement.is_pinned)}
                    className={`p-2 rounded-lg transition-colors ${announcement.is_pinned ? 'bg-primary-500/20 text-primary-400' : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800'}`}
                  >
                    <Pin size={16} />
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="p-2 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
