'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Check, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LessonData {
  id: number
  skill_name: string
  compelling_question: string
  lesson_objective: string
  text_anchor_title: string
  text_anchor_chapter: string
  media_title: string
  media_url: string
  the_win: string
  the_obstacle: string
  phase_id: number
}

interface ChallengeSubmissionModalProps {
  lesson: LessonData | null
  userId: string | undefined
  classId: string | undefined
  onClose: () => void
}

export default function ChallengeSubmissionModal({
  lesson,
  userId,
  classId,
  onClose
}: ChallengeSubmissionModalProps) {
  const [step, setStep] = useState<'intro' | 'plan' | 'evidence' | 'submit'>('intro')
  const [plan, setPlan] = useState('')
  const [evidence, setEvidence] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [reflection, setReflection] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!plan || !evidence || !reflection) return
    
    setSubmitting(true)
    try {
      // Create submission
      await supabase.from('challenge_submissions').insert({
        student_id: userId,
        lesson_id: lesson?.id,
        class_id: classId,
        plan_description: plan,
        evidence_description: evidence,
        evidence_url: evidenceUrl || null,
        reflection,
        review_status: 'pending'
      })

      // Update student_lessons
      await supabase
        .from('student_lessons')
        .update({ 
          challenge_complete: true, 
          challenge_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('student_id', userId)
        .eq('lesson_id', lesson?.id)

      // Award tower piece
      await supabase.rpc('increment_tower', { p_student_id: userId })

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting challenge:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-surface-900 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="text-green-400" size={40} />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Challenge Submitted!</h2>
          <p className="text-surface-400 mb-4">
            Your teacher will review your evidence. You've earned a tower piece for your world! 🏛️
          </p>
          <motion.button
            onClick={onClose}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-surface-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        <div className="p-4 border-b border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="text-blue-400" size={24} />
            <h2 className="font-semibold text-surface-100">Real-World Challenge</h2>
          </div>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'intro' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Prove Your {lesson?.skill_name} Skills
                </h3>
                <p className="text-surface-400">
                  Time to take what you've learned and apply it in the real world.
                  This isn't about perfect execution—it's about genuine effort and reflection.
                </p>
              </div>

              <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700">
                <h4 className="font-semibold text-white mb-2">The Win:</h4>
                <p className="text-surface-300">{lesson?.the_win}</p>
              </div>

              <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700">
                <h4 className="font-semibold text-white mb-2">The Obstacle:</h4>
                <p className="text-surface-300">{lesson?.the_obstacle}</p>
              </div>

              <motion.button
                onClick={() => setStep('plan')}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                I'm Ready to Plan My Challenge
              </motion.button>
            </div>
          )}

          {step === 'plan' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Your Plan</h3>
                <p className="text-surface-400 mb-4">
                  What specifically will you do to demonstrate {lesson?.skill_name}?
                  Be concrete—include who, what, when, where.
                </p>
                <textarea
                  className="w-full h-40 bg-surface-800 border border-surface-700 rounded-xl p-4 text-white placeholder:text-surface-500 focus:border-primary-500 outline-none resize-none"
                  placeholder="Describe your plan in detail..."
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('intro')}
                  className="flex-1 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-medium"
                >
                  Back
                </button>
                <motion.button
                  onClick={() => setStep('evidence')}
                  disabled={plan.length < 50}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-700 disabled:text-surface-500 text-white rounded-xl font-medium"
                  whileHover={{ scale: plan.length >= 50 ? 1.02 : 1 }}
                  whileTap={{ scale: plan.length >= 50 ? 0.98 : 1 }}
                >
                  Continue
                </motion.button>
              </div>
            </div>
          )}

          {step === 'evidence' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Your Evidence</h3>
                <p className="text-surface-400 mb-4">
                  Describe what happened when you executed your plan.
                  What worked? What didn't? How did people respond?
                </p>
                <textarea
                  className="w-full h-32 bg-surface-800 border border-surface-700 rounded-xl p-4 text-white placeholder:text-surface-500 focus:border-primary-500 outline-none resize-none"
                  placeholder="What happened when you did it..."
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Evidence Link (optional)
                </label>
                <div className="flex items-center gap-2">
                  <Upload size={18} className="text-surface-500" />
                  <input
                    type="url"
                    className="flex-1 bg-surface-800 border border-surface-700 rounded-xl px-4 py-2 text-white placeholder:text-surface-500 focus:border-primary-500 outline-none"
                    placeholder="Link to photo, video, or document..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('plan')}
                  className="flex-1 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-medium"
                >
                  Back
                </button>
                <motion.button
                  onClick={() => setStep('submit')}
                  disabled={evidence.length < 50}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-700 disabled:text-surface-500 text-white rounded-xl font-medium"
                  whileHover={{ scale: evidence.length >= 50 ? 1.02 : 1 }}
                  whileTap={{ scale: evidence.length >= 50 ? 0.98 : 1 }}
                >
                  Continue
                </motion.button>
              </div>
            </div>
          )}

          {step === 'submit' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Your Reflection</h3>
                <p className="text-surface-400 mb-4">
                  What did this experience teach you about {lesson?.skill_name}?
                  How might you apply this learning in the future?
                </p>
                <textarea
                  className="w-full h-32 bg-surface-800 border border-surface-700 rounded-xl p-4 text-white placeholder:text-surface-500 focus:border-primary-500 outline-none resize-none"
                  placeholder="Reflect on what you learned..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h4 className="font-medium text-blue-400 mb-2">Summary</h4>
                <div className="text-sm text-surface-300 space-y-2">
                  <p><strong>Plan:</strong> {plan.slice(0, 100)}...</p>
                  <p><strong>Evidence:</strong> {evidence.slice(0, 100)}...</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('evidence')}
                  className="flex-1 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-medium"
                >
                  Back
                </button>
                <motion.button
                  onClick={handleSubmit}
                  disabled={reflection.length < 30 || submitting}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-surface-700 disabled:text-surface-500 text-white rounded-xl font-medium"
                  whileHover={{ scale: reflection.length >= 30 ? 1.02 : 1 }}
                  whileTap={{ scale: reflection.length >= 30 ? 0.98 : 1 }}
                >
                  {submitting ? 'Submitting...' : 'Submit Challenge'}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
