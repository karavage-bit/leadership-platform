'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, Sparkles, Heart, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface Student {
  id: string
  name: string
  anonymousName: string
  isUnmasked: boolean
  ripplesStarted: number
  helpGiven: number
  tier: number
}

interface Connection {
  from: string
  to: string
  strength: number // Number of interactions
  type: 'help' | 'ripple' | 'bridge' | 'group'
}

interface ClassConnectionMapProps {
  students: Student[]
  connections: Connection[]
  currentUserId: string
  classStats: {
    totalConnections: number
    totalRipples: number
    averageHelpPerStudent: number
  }
}

export default function ClassConnectionMap({ 
  students, 
  connections, 
  currentUserId,
  classStats 
}: ClassConnectionMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [hoveredStudent, setHoveredStudent] = useState<Student | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  
  // Calculate positions in a circle
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {}
    const centerX = 250
    const centerY = 250
    const radius = 180
    
    students.forEach((student, i) => {
      const angle = (i / students.length) * Math.PI * 2 - Math.PI / 2
      pos[student.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      }
    })
    
    return pos
  }, [students])
  
  // Draw the network
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear
    ctx.clearRect(0, 0, 500, 500)
    
    // Draw connections
    connections.forEach((conn) => {
      const from = positions[conn.from]
      const to = positions[conn.to]
      if (!from || !to) return
      
      const isHighlighted = selectedStudent === conn.from || selectedStudent === conn.to
      const involvesCurrentUser = conn.from === currentUserId || conn.to === currentUserId
      
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      
      // Line style based on type and highlight
      if (isHighlighted || involvesCurrentUser) {
        ctx.strokeStyle = conn.type === 'ripple' ? '#22d3ee' : 
                          conn.type === 'bridge' ? '#a855f7' :
                          conn.type === 'group' ? '#f59e0b' : '#ec4899'
        ctx.lineWidth = 2 + Math.min(conn.strength, 5)
        ctx.globalAlpha = 1
      } else {
        ctx.strokeStyle = '#475569'
        ctx.lineWidth = 1 + Math.min(conn.strength / 2, 2)
        ctx.globalAlpha = 0.4
      }
      
      ctx.stroke()
      ctx.globalAlpha = 1
    })
    
    // Draw nodes
    students.forEach((student) => {
      const pos = positions[student.id]
      if (!pos) return
      
      const isCurrentUser = student.id === currentUserId
      const isSelected = student.id === selectedStudent
      const isHovered = hoveredStudent?.id === student.id
      
      // Node size based on activity
      const baseSize = 12
      const activityBonus = Math.min((student.helpGiven + student.ripplesStarted) / 5, 8)
      const size = baseSize + activityBonus
      
      // Glow for active nodes
      if (isCurrentUser || isSelected || isHovered) {
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, size + 8, 0, Math.PI * 2)
        ctx.fillStyle = isCurrentUser ? 'rgba(250, 204, 21, 0.3)' : 'rgba(168, 85, 247, 0.3)'
        ctx.fill()
      }
      
      // Node circle
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2)
      
      // Color based on tier
      const tierColors = ['#6b7280', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b']
      ctx.fillStyle = isCurrentUser ? '#facc15' : tierColors[student.tier] || tierColors[0]
      ctx.fill()
      
      // Border
      ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.3)'
      ctx.lineWidth = isSelected ? 3 : 1
      ctx.stroke()
    })
    
  }, [students, connections, positions, currentUserId, selectedStudent, hoveredStudent])
  
  // Find student at position
  const findStudentAt = (x: number, y: number): Student | null => {
    for (const student of students) {
      const pos = positions[student.id]
      if (!pos) continue
      
      const dx = x - pos.x
      const dy = y - pos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 20) return student
    }
    return null
  }
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    
    const student = findStudentAt(x, y)
    setSelectedStudent(student?.id || null)
  }
  
  const handleCanvasHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    
    const student = findStudentAt(x, y)
    setHoveredStudent(student)
  }
  
  // Get connections for selected student
  const selectedConnections = useMemo(() => {
    if (!selectedStudent) return []
    return connections.filter(c => c.from === selectedStudent || c.to === selectedStudent)
  }, [selectedStudent, connections])
  
  const selectedStudentData = students.find(s => s.id === selectedStudent)
  
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto mb-4 text-surface-500" size={48} />
        <h3 className="text-lg font-semibold text-white mb-2">No Connections Yet</h3>
        <p className="text-surface-400 text-sm">
          As classmates help each other, the connection map will grow.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="text-purple-400" size={24} />
          Class Connection Map
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-2 bg-surface-800 rounded-lg hover:bg-surface-700"
          >
            <ZoomOut size={16} className="text-surface-400" />
          </button>
          <span className="text-xs text-surface-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-2 bg-surface-800 rounded-lg hover:bg-surface-700"
          >
            <ZoomIn size={16} className="text-surface-400" />
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-800/50 rounded-xl p-3 text-center border border-surface-700">
          <div className="text-xl font-bold text-white">{classStats.totalConnections}</div>
          <div className="text-xs text-surface-400">Connections</div>
        </div>
        <div className="bg-surface-800/50 rounded-xl p-3 text-center border border-surface-700">
          <div className="text-xl font-bold text-cyan-400">{classStats.totalRipples}</div>
          <div className="text-xs text-surface-400">Total Ripples</div>
        </div>
        <div className="bg-surface-800/50 rounded-xl p-3 text-center border border-surface-700">
          <div className="text-xl font-bold text-pink-400">{classStats.averageHelpPerStudent.toFixed(1)}</div>
          <div className="text-xs text-surface-400">Avg Help/Student</div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="text-surface-400">You</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-pink-500" />
          <span className="text-surface-400">Help</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-cyan-400" />
          <span className="text-surface-400">Ripple</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-purple-500" />
          <span className="text-surface-400">Bridge</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-amber-500" />
          <span className="text-surface-400">Group</span>
        </div>
      </div>
      
      {/* Canvas */}
      <div 
        ref={containerRef}
        className="relative bg-surface-900 rounded-xl border border-surface-700 overflow-hidden"
        style={{ height: 400 }}
      >
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasHover}
          onMouseLeave={() => setHoveredStudent(null)}
          className="cursor-pointer"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: 500,
            height: 500
          }}
        />
        
        {/* Hover tooltip */}
        {hoveredStudent && (
          <div 
            className="absolute bg-black/90 px-3 py-2 rounded-lg text-sm pointer-events-none border border-surface-600"
            style={{
              left: positions[hoveredStudent.id]?.x * zoom + 20,
              top: positions[hoveredStudent.id]?.y * zoom - 20,
            }}
          >
            <div className="font-medium text-white">
              {hoveredStudent.isUnmasked ? hoveredStudent.name : `🎭 ${hoveredStudent.anonymousName}`}
            </div>
            <div className="text-xs text-surface-400 mt-1">
              {hoveredStudent.helpGiven} help given • {hoveredStudent.ripplesStarted} ripples
            </div>
          </div>
        )}
      </div>
      
      {/* Selected student details */}
      {selectedStudentData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-800/50 rounded-xl p-4 border border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              {selectedStudentData.id === currentUserId && <span className="text-yellow-400">⭐</span>}
              {selectedStudentData.isUnmasked ? selectedStudentData.name : `🎭 ${selectedStudentData.anonymousName}`}
            </h3>
            <span className="text-xs px-2 py-1 rounded-full bg-surface-700 text-surface-300">
              Tier {selectedStudentData.tier}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <div className="font-bold text-pink-400">{selectedStudentData.helpGiven}</div>
              <div className="text-xs text-surface-400">Help Given</div>
            </div>
            <div>
              <div className="font-bold text-cyan-400">{selectedStudentData.ripplesStarted}</div>
              <div className="text-xs text-surface-400">Ripples</div>
            </div>
            <div>
              <div className="font-bold text-purple-400">{selectedConnections.length}</div>
              <div className="text-xs text-surface-400">Connections</div>
            </div>
          </div>
          
          {selectedConnections.length > 0 && (
            <div className="mt-3 pt-3 border-t border-surface-700">
              <div className="text-xs text-surface-400 mb-2">Connected to:</div>
              <div className="flex flex-wrap gap-1">
                {selectedConnections.slice(0, 8).map((conn, i) => {
                  const otherId = conn.from === selectedStudent ? conn.to : conn.from
                  const other = students.find(s => s.id === otherId)
                  if (!other) return null
                  return (
                    <span 
                      key={i}
                      className="px-2 py-0.5 bg-surface-700 rounded text-xs text-surface-300"
                    >
                      {other.isUnmasked ? other.name : other.anonymousName}
                    </span>
                  )
                })}
                {selectedConnections.length > 8 && (
                  <span className="px-2 py-0.5 text-xs text-surface-500">
                    +{selectedConnections.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
      
      <p className="text-xs text-surface-500 text-center">
        Click on any node to see their connections • Thicker lines = stronger connections
      </p>
    </div>
  )
}
