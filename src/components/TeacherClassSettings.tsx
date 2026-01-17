'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Mic, Keyboard, MessageSquare, Sparkles, Flame, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ClassSettingsProps {
  classId: string
  onSave?: () => void
}

interface ClassSettings {
  interaction_mode: 'typing' | 'voice' | 'both'
  ai_difficulty: 'gentle' | 'standard' | 'intense'
  ai_persona: 'hype_man' | 'strategist' | 'sage'
  min_responses: number
  streak_enabled: boolean
  dark_mode_default: boolean
}

export default function TeacherClassSettings({ classId, onSave }: ClassSettingsProps) {
  const [settings, setSettings] = useState<ClassSettings>({
    interaction_mode: 'typing',
    ai_difficulty: 'standard',
    ai_persona: 'strategist',
    min_responses: 5,
    streak_enabled: true,
    dark_mode_default: true
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [classId])

  const loadSettings = async () => {
    const { data } = await supabase
      .from('classes')
      .select('interaction_mode, ai_difficulty, ai_persona, min_responses, streak_enabled, dark_mode_default')
      .eq('id', classId)
      .single()

    if (data) {
      setSettings({
        interaction_mode: data.interaction_mode || 'typing',
        ai_difficulty: data.ai_difficulty || 'standard',
        ai_persona: data.ai_persona || 'strategist',
        min_responses: data.min_responses || 5,
        streak_enabled: data.streak_enabled ?? true,
        dark_mode_default: data.dark_mode_default ?? true
      })
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('classes')
      .update(settings)
      .eq('id', classId)

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSave?.()
    }
  }

  const interactionOptions = [
    { value: 'typing', label: 'Typing Only', icon: Keyboard, desc: 'Students type responses' },
    { value: 'voice', label: 'Voice Only', icon: Mic, desc: 'Students speak responses' },
    { value: 'both', label: 'Both Options', icon: MessageSquare, desc: 'Students choose method' }
  ]

  const difficultyOptions = [
    { value: 'gentle', label: 'Gentle', desc: 'Encouraging, accepts shorter responses', color: 'bg-green-500' },
    { value: 'standard', label: 'Standard', desc: 'Pushback on surface answers', color: 'bg-yellow-500' },
    { value: 'intense', label: 'Intense', desc: 'Relentlessly Socratic', color: 'bg-red-500' }
  ]

  const personaOptions = [
    { value: 'hype_man', label: 'The Hype Man', emoji: '🔥', desc: 'Supportive & energetic' },
    { value: 'strategist', label: 'The Strategist', emoji: '🎯', desc: 'Direct & logical' },
    { value: 'sage', label: 'The Sage', emoji: '🧘', desc: 'Philosophical & calm' }
  ]

  return (
    <div className="space-y-8 p-6 bg-surface-800 rounded-2xl">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary-500" />
        Class AI Settings
      </h2>

      {/* Interaction Mode */}
      <section className="space-y-3">
        <h3 className="font-semibold text-surface-200">Student Input Method</h3>
        <div className="grid grid-cols-3 gap-3">
          {interactionOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, interaction_mode: opt.value as any }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.interaction_mode === opt.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-surface-600 hover:border-surface-500'
              }`}
            >
              <opt.icon className={`w-6 h-6 mx-auto mb-2 ${
                settings.interaction_mode === opt.value ? 'text-primary-500' : 'text-surface-400'
              }`} />
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-surface-400 mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* AI Difficulty */}
      <section className="space-y-3">
        <h3 className="font-semibold text-surface-200">AI Pushback Level</h3>
        <div className="grid grid-cols-3 gap-3">
          {difficultyOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, ai_difficulty: opt.value as any }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.ai_difficulty === opt.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-surface-600 hover:border-surface-500'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${opt.color} mx-auto mb-2`} />
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-surface-400 mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* AI Persona */}
      <section className="space-y-3">
        <h3 className="font-semibold text-surface-200">AI Personality</h3>
        <div className="grid grid-cols-3 gap-3">
          {personaOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, ai_persona: opt.value as any }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.ai_persona === opt.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-surface-600 hover:border-surface-500'
              }`}
            >
              <div className="text-2xl mb-2">{opt.emoji}</div>
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-surface-400 mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Min Responses */}
      <section className="space-y-3">
        <h3 className="font-semibold text-surface-200">Minimum Exchanges Required</h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={3}
            max={10}
            value={settings.min_responses}
            onChange={(e) => setSettings(s => ({ ...s, min_responses: parseInt(e.target.value) }))}
            className="flex-1"
          />
          <span className="text-2xl font-bold text-primary-500 w-12 text-center">
            {settings.min_responses}
          </span>
        </div>
        <p className="text-sm text-surface-400">
          Students must complete at least this many exchanges before unlocking rewards
        </p>
      </section>

      {/* Toggles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-surface-700 rounded-xl">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <div className="font-medium">Streak System</div>
              <div className="text-sm text-surface-400">Track daily engagement streaks</div>
            </div>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, streak_enabled: !s.streak_enabled }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.streak_enabled ? 'bg-primary-500' : 'bg-surface-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              settings.streak_enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-surface-700 rounded-xl">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <div>
              <div className="font-medium">Dark Mode Default</div>
              <div className="text-sm text-surface-400">Students start in dark mode</div>
            </div>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, dark_mode_default: !s.dark_mode_default }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.dark_mode_default ? 'bg-primary-500' : 'bg-surface-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              settings.dark_mode_default ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </section>

      {/* Save Button */}
      <motion.button
        onClick={saveSettings}
        disabled={saving}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
          saved 
            ? 'bg-green-500 text-white' 
            : 'bg-primary-600 hover:bg-primary-500 text-white'
        }`}
      >
        <Save className="w-5 h-5" />
        {saving ? 'Saving...' : saved ? 'Settings Saved!' : 'Save Settings'}
      </motion.button>
    </div>
  )
}
