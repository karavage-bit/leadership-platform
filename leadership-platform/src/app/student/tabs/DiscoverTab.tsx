'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { TeacherChallenge, Discovery } from '../types'

const TeacherChallenges = dynamic(() => import('@/components/TeacherChallenges'), { ssr: false })
const StudentDiscoveries = dynamic(() => import('@/components/StudentDiscoveries'), { ssr: false })

interface DiscoverTabProps {
  teacherChallenges: TeacherChallenge[]
  discoveries: Discovery[]
  userId?: string
  classId?: string
  onChallengeSubmit: (challengeId: string, response: string, connection: string, share: boolean) => Promise<void>
  onDiscoveryPost: (data: any) => Promise<void>
  onDiscoveryVote: (discoveryId: string) => Promise<void>
}

export default function DiscoverTab({
  teacherChallenges,
  discoveries,
  userId,
  classId,
  onChallengeSubmit,
  onDiscoveryPost,
  onDiscoveryVote
}: DiscoverTabProps) {
  return (
    <motion.div
      key="discover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Star className="text-yellow-400" />
          Discover
        </h2>
        <p className="text-sm text-surface-400">
          Teacher challenges & student discoveries
        </p>
      </div>
      
      {/* Teacher Challenges */}
      <TeacherChallenges 
        challenges={teacherChallenges}
        onSubmitResponse={onChallengeSubmit}
      />
      
      {/* Student Discoveries */}
      <StudentDiscoveries 
        discoveries={discoveries}
        onPost={onDiscoveryPost}
        onVote={onDiscoveryVote}
        onComment={() => {}}
      />
    </motion.div>
  )
}
