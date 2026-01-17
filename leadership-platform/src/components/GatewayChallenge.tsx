'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Send, Upload, Camera, Mail, MessageSquare, Mic, PenTool, CheckCircle, Sparkles } from 'lucide-react'

interface GatewayChallengeProps {
  onComplete: (data: {
    recipientDescription: string
    messageType: string
    messagePreview: string
    proofUrl?: string
    reflection: string
  }) => void
}

export default function GatewayChallenge({ onComplete }: GatewayChallengeProps) {
  const [step, setStep] = useState(1)
  const [recipient, setRecipient] = useState('')
  const [messageType, setMessageType] = useState('')
  const [messagePreview, setMessagePreview] = useState('')
  const [proofUploaded, setProofUploaded] = useState(false)
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const messageTypes = [
    { id: 'text', label: 'Text Message', icon: MessageSquare, color: 'bg-blue-500' },
    { id: 'email', label: 'Email', icon: Mail, color: 'bg-purple-500' },
    { id: 'handwritten', label: 'Handwritten Note', icon: PenTool, color: 'bg-pink-500' },
    { id: 'voice', label: 'Voice Message', icon: Mic, color: 'bg-green-500' },
    { id: 'in_person', label: 'In Person', icon: Heart, color: 'bg-red-500' },
  ]
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    onComplete({
      recipientDescription: recipient,
      messageType,
      messagePreview,
      reflection,
    })
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <motion.div 
        className="max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🌱
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Your Journey</h1>
          <p className="text-purple-300">Before you can build, you must give.</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={`w-3 h-3 rounded-full transition-all ${
                s < step ? 'bg-green-500' : 
                s === step ? 'bg-purple-500 scale-125' : 
                'bg-slate-700'
              }`}
            />
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          {/* Step 1: Introduction */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Heart className="text-purple-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Gratitude Gateway</h2>
              </div>
              
              <p className="text-slate-300 mb-6 leading-relaxed">
                Your world begins with gratitude. Think of someone who helped you—
                a teacher, friend, family member, or anyone—who never got the thanks they deserved.
              </p>
              
              <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-400 italic">
                  "The door to your world opens with gratitude. Every tree, every flower, every 
                  tower you build will grow from this first act of giving."
                </p>
              </div>
              
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                I'm Ready <Sparkles size={18} />
              </button>
            </motion.div>
          )}
          
          {/* Step 2: Who to thank */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
            >
              <h2 className="text-xl font-bold text-white mb-2">Who will you thank?</h2>
              <p className="text-slate-400 text-sm mb-4">
                Describe who this person is to you (no need for their real name)
              </p>
              
              <textarea
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Example: My math teacher from last year who stayed after school to help me..."
                className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={recipient.length < 10}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Step 3: Send the message */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
            >
              <h2 className="text-xl font-bold text-white mb-2">Send Your Gratitude</h2>
              <p className="text-slate-400 text-sm mb-4">
                Choose how you'll thank them, then actually do it!
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {messageTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setMessageType(type.id)}
                    className={`
                      p-4 rounded-xl border transition-all flex flex-col items-center gap-2
                      ${messageType === type.id 
                        ? 'bg-purple-600 border-purple-400 text-white' 
                        : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-purple-500/50'
                      }
                    `}
                  >
                    <type.icon size={24} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
              
              {messageType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="text-sm text-slate-400 block mb-2">
                    What did you say? (brief summary)
                  </label>
                  <textarea
                    value={messagePreview}
                    onChange={(e) => setMessagePreview(e.target.value)}
                    placeholder="I thanked them for..."
                    className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 focus:border-purple-500 outline-none resize-none mb-4"
                  />
                  
                  <div className="bg-slate-900/50 border border-dashed border-slate-600 rounded-xl p-6 text-center">
                    {proofUploaded ? (
                      <div className="text-green-400 flex flex-col items-center gap-2">
                        <CheckCircle size={32} />
                        <span>Proof uploaded!</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="mx-auto text-slate-500 mb-2" size={32} />
                        <p className="text-slate-400 text-sm mb-3">
                          Upload a screenshot or photo as proof
                        </p>
                        <button
                          onClick={() => setProofUploaded(true)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <Upload size={16} /> Upload Proof
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!messageType || !messagePreview || !proofUploaded}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Step 4: Reflection */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">✨</div>
                <h2 className="text-xl font-bold text-white mb-2">How did it feel?</h2>
                <p className="text-slate-400 text-sm">
                  Take a moment to reflect on the experience
                </p>
              </div>
              
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="When I sent the message, I felt... It made me realize..."
                className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 focus:border-purple-500 outline-none resize-none mb-6"
              />
              
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 mb-6 border border-purple-500/20">
                <p className="text-sm text-purple-200">
                  🌱 Your first act of gratitude will become a <strong>Memory Stone</strong> hidden 
                  in your world—a secret reminder of where your journey began.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={reflection.length < 20 || isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Your World...
                    </>
                  ) : (
                    <>
                      Enter Your World <Sparkles size={18} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Quote */}
        <p className="text-center text-slate-500 text-sm mt-8 italic">
          "Give, and you shall receive"
        </p>
      </motion.div>
    </div>
  )
}
