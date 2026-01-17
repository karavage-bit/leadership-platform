'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Upload, Send, Check, ArrowRight, MessageSquare, Mail, Phone, FileText, Camera } from 'lucide-react'

interface GratitudeGatewayProps {
  isOpen: boolean
  studentName: string
  onComplete: (proof: { type: string, recipient: string, message: string, proofUrl?: string }) => void
}

export default function GratitudeGateway({
  isOpen,
  studentName,
  onComplete
}: GratitudeGatewayProps) {
  const [stage, setStage] = useState<'intro' | 'form' | 'upload' | 'complete'>('intro')
  const [gratitudeType, setGratitudeType] = useState<string>('')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [proofUploaded, setProofUploaded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const gratitudeTypes = [
    { id: 'text', label: 'Text Message', icon: MessageSquare, description: 'Send a heartfelt text' },
    { id: 'email', label: 'Email', icon: Mail, description: 'Write a thoughtful email' },
    { id: 'call', label: 'Phone Call', icon: Phone, description: 'Call and say thank you' },
    { id: 'letter', label: 'Handwritten Note', icon: FileText, description: 'Write a physical letter' },
    { id: 'inperson', label: 'In Person', icon: Heart, description: 'Thank them face to face' },
  ]

  const handleSubmit = () => {
    if (recipient && message && proofUploaded) {
      setIsSubmitting(true)
      setTimeout(() => {
        setStage('complete')
        setIsSubmitting(false)
      }, 1500)
    }
  }

  const handleComplete = () => {
    onComplete({
      type: gratitudeType,
      recipient,
      message,
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950 z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="max-w-xl w-full">
            {/* Intro Stage */}
            {stage === 'intro' && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-8xl mb-6"
                >
                  🌱
                </motion.div>
                
                <h1 className="text-4xl font-bold text-white mb-4">
                  Welcome, {studentName}
                </h1>
                
                <p className="text-xl text-surface-300 mb-8">
                  Before you can build, you must give.
                </p>
                
                <div className="bg-surface-800/50 rounded-2xl p-8 border border-surface-700 mb-8 text-left">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Heart className="text-care" size={24} />
                    Your First Challenge
                  </h2>
                  
                  <p className="text-surface-300 mb-4">
                    Think of someone who helped you but never received proper thanks.
                    A teacher, family member, friend, coach, or anyone who made a difference.
                  </p>
                  
                  <p className="text-surface-300 mb-4">
                    <strong className="text-white">Send them a genuine thank you.</strong> Not "thanks for everything" — 
                    be specific about what they did and how it affected you.
                  </p>
                  
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <p className="text-primary text-sm">
                      💡 This isn't about getting credit. It's about recognizing that your journey 
                      started because someone else gave first. The door to your world opens with gratitude.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setStage('form')}
                  className="bg-gradient-to-r from-care to-pink-500 hover:from-pink-400 hover:to-pink-600 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                >
                  I'm Ready to Give Thanks
                  <ArrowRight size={24} />
                </button>
              </motion.div>
            )}

            {/* Form Stage */}
            {stage === 'form' && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-900 rounded-2xl border border-surface-700 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-care/20 to-pink-500/20 p-6 border-b border-surface-700">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Heart className="text-care" size={28} />
                    Gratitude Challenge
                  </h2>
                  <p className="text-surface-400 text-sm mt-1">Express genuine thanks to unlock your world</p>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Gratitude Type */}
                  <div>
                    <label className="text-sm font-medium text-surface-300 block mb-3">
                      How will you say thank you?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {gratitudeTypes.map(type => {
                        const Icon = type.icon
                        return (
                          <button
                            key={type.id}
                            onClick={() => setGratitudeType(type.id)}
                            className={`p-4 rounded-xl border transition-all text-left
                              ${gratitudeType === type.id 
                                ? 'bg-care/20 border-care text-care' 
                                : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-500'
                              }`}
                          >
                            <Icon size={24} className="mb-2" />
                            <div className="font-medium text-sm">{type.label}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Recipient */}
                  <div>
                    <label className="text-sm font-medium text-surface-300 block mb-2">
                      Who are you thanking?
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="Their name and relationship (e.g., Coach Martinez, my basketball coach)"
                      className="w-full bg-surface-800 border border-surface-600 rounded-xl p-4 text-white placeholder-surface-500 focus:border-care focus:outline-none"
                    />
                  </div>
                  
                  {/* Message Preview */}
                  <div>
                    <label className="text-sm font-medium text-surface-300 block mb-2">
                      What will you say? (write it here first)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Be specific! What did they do? How did it affect you? Why are you thanking them now?"
                      className="w-full bg-surface-800 border border-surface-600 rounded-xl p-4 text-white placeholder-surface-500 focus:border-care focus:outline-none resize-none"
                      rows={5}
                    />
                    <div className="flex justify-between mt-2 text-xs text-surface-500">
                      <span>Be genuine, not generic</span>
                      <span>{message.length} characters</span>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="pt-4 border-t border-surface-700">
                    <button
                      onClick={() => setStage('upload')}
                      disabled={!gratitudeType || !recipient || message.length < 50}
                      className="w-full bg-gradient-to-r from-care to-pink-500 hover:from-pink-400 hover:to-pink-600 disabled:from-surface-700 disabled:to-surface-700 disabled:text-surface-500 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={20} />
                      I've Sent My Thanks
                    </button>
                    <p className="text-xs text-surface-500 text-center mt-3">
                      Actually send the message before continuing
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Upload Stage */}
            {stage === 'upload' && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-900 rounded-2xl border border-surface-700 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-care/20 to-pink-500/20 p-6 border-b border-surface-700">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Camera className="text-care" size={28} />
                    Proof of Gratitude
                  </h2>
                  <p className="text-surface-400 text-sm mt-1">Show us that you actually sent it</p>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700">
                    <div className="text-sm text-surface-400 mb-2">You're thanking:</div>
                    <div className="text-white font-medium">{recipient}</div>
                    <div className="text-xs text-surface-500 mt-1 capitalize">Via {gratitudeType}</div>
                  </div>
                  
                  {/* Upload Area */}
                  <div
                    onClick={() => setProofUploaded(true)}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                      ${proofUploaded 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-surface-600 hover:border-surface-500 bg-surface-800/30'
                      }`}
                  >
                    {proofUploaded ? (
                      <div>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="text-green-400" size={32} />
                        </div>
                        <div className="text-green-400 font-semibold mb-1">Proof Uploaded!</div>
                        <div className="text-sm text-surface-400">Click to change</div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto text-surface-500 mb-4" size={48} />
                        <div className="text-white font-semibold mb-2">Upload Screenshot</div>
                        <div className="text-sm text-surface-400">
                          Screenshot of your sent message, or photo of handwritten note
                        </div>
                        <div className="text-xs text-surface-500 mt-2">
                          (Click here to simulate upload for demo)
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!proofUploaded || isSubmitting}
                    className="w-full bg-gradient-to-r from-care to-pink-500 hover:from-pink-400 hover:to-pink-600 disabled:from-surface-700 disabled:to-surface-700 disabled:text-surface-500 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Complete Challenge
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Complete Stage */}
            {stage === 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-8xl mb-6"
                >
                  🎉
                </motion.div>
                
                <h1 className="text-4xl font-bold text-white mb-4">
                  The Door Opens
                </h1>
                
                <p className="text-xl text-surface-300 mb-8">
                  You began with gratitude. Now you may build.
                </p>
                
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/30 mb-8">
                  <div className="text-green-400 font-semibold mb-2">🌱 Your Island Has Been Granted</div>
                  <p className="text-surface-300">
                    A small plot of land awaits you. What you build here reflects who you become.
                  </p>
                </div>
                
                <button
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/80 hover:to-purple-400 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                >
                  Enter Your World
                  <ArrowRight size={24} />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
