'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, ArrowRight, Users, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface RippleNode {
  id: string
  name: string
  anonymousName: string
  action: string
  timestamp: string
  children: RippleNode[]
}

interface RippleChain {
  id: string
  rootAction: string
  rootUser: string
  rootAnonymousName: string
  startDate: string
  totalReach: number
  nodes: RippleNode[]
}

interface RippleVisualizationProps {
  chains: RippleChain[]
  isOpen: boolean
  onClose: () => void
  isAnonymousMode: boolean
  currentUserId: string
}

export default function RippleVisualization({
  chains,
  isOpen,
  onClose,
  isAnonymousMode,
  currentUserId
}: RippleVisualizationProps) {
  const [expandedChain, setExpandedChain] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list')

  const stats = useMemo(() => {
    const totalRipples = chains.length
    const totalReach = chains.reduce((acc, c) => acc + c.totalReach, 0)
    const longestChain = Math.max(...chains.map(c => {
      const countDepth = (nodes: RippleNode[]): number => {
        if (nodes.length === 0) return 0
        return 1 + Math.max(...nodes.map(n => countDepth(n.children)))
      }
      return countDepth(c.nodes)
    }), 0)
    return { totalRipples, totalReach, longestChain }
  }, [chains])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-surface-900 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-surface-700 flex flex-col"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-5 border-b border-surface-700 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-xl">
                      <Heart className="text-cyan-400" size={24} />
                    </div>
                    Your Ripple Impact
                  </h2>
                  <p className="text-surface-400 text-sm mt-1">
                    See how your actions spread through others
                  </p>
                </div>
                <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-surface-800/30 border-b border-surface-700 flex-shrink-0">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">{stats.totalRipples}</div>
                <div className="text-xs text-surface-400">Ripples Started</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.totalReach}</div>
                <div className="text-xs text-surface-400">People Reached</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{stats.longestChain}</div>
                <div className="text-xs text-surface-400">Longest Chain</div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {chains.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="mx-auto text-surface-600 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-surface-400 mb-2">No ripples yet</h3>
                  <p className="text-sm text-surface-500 max-w-sm mx-auto">
                    When you help someone in The Commons and they help someone else, 
                    you'll see the chain of kindness here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chains.map((chain) => (
                    <RippleChainCard
                      key={chain.id}
                      chain={chain}
                      isExpanded={expandedChain === chain.id}
                      onToggle={() => setExpandedChain(expandedChain === chain.id ? null : chain.id)}
                      isAnonymousMode={isAnonymousMode}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-surface-700 bg-surface-800/30 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-surface-400">
                  <span className="text-cyan-400">💡</span> Help others in The Commons to start new ripples
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-surface-700 hover:bg-surface-600 rounded-lg text-white text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Individual chain card
function RippleChainCard({
  chain,
  isExpanded,
  onToggle,
  isAnonymousMode
}: {
  chain: RippleChain
  isExpanded: boolean
  onToggle: () => void
  isAnonymousMode: boolean
}) {
  return (
    <div className="bg-surface-800/50 rounded-xl border border-surface-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-surface-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Heart className="text-cyan-400" size={20} />
          </div>
          <div className="text-left">
            <div className="font-medium text-white">{chain.rootAction}</div>
            <div className="text-xs text-surface-400">
              Started by {isAnonymousMode ? chain.rootAnonymousName : chain.rootUser} • {new Date(chain.startDate).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-cyan-400 text-sm">
            <Users size={16} />
            <span>{chain.totalReach}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="text-surface-400" size={20} />
          ) : (
            <ChevronDown className="text-surface-400" size={20} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-surface-700">
              <div className="text-xs text-surface-500 uppercase tracking-wide mb-3">Ripple Chain</div>
              <RippleTree nodes={chain.nodes} isAnonymousMode={isAnonymousMode} depth={0} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Recursive tree component
function RippleTree({
  nodes,
  isAnonymousMode,
  depth
}: {
  nodes: RippleNode[]
  isAnonymousMode: boolean
  depth: number
}) {
  if (nodes.length === 0) return null

  return (
    <div className="space-y-2">
      {nodes.map((node, index) => (
        <div key={node.id} style={{ marginLeft: depth * 24 }}>
          <div className="flex items-start gap-2">
            {depth > 0 && (
              <div className="flex items-center gap-1 text-surface-600 mt-2">
                <div className="w-4 h-px bg-surface-600" />
                <ArrowRight size={12} />
              </div>
            )}
            <div className="flex-1 bg-surface-800 rounded-lg p-3 border border-surface-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">
                  {isAnonymousMode ? node.anonymousName : node.name}
                </span>
                <span className="text-xs text-surface-500">
                  {new Date(node.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-surface-400">{node.action}</div>
            </div>
          </div>
          
          {node.children.length > 0 && (
            <RippleTree nodes={node.children} isAnonymousMode={isAnonymousMode} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  )
}

// Mini visualization for the world view
export function RippleMiniMap({ chains, onClick }: { chains: RippleChain[], onClick: () => void }) {
  const totalReach = chains.reduce((acc, c) => acc + c.totalReach, 0)
  
  if (chains.length === 0) return null
  
  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/30 hover:border-cyan-500/50 transition-colors text-left w-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Heart className="text-cyan-400" size={20} />
          </div>
          <div>
            <div className="text-white font-medium">Your Ripple Impact</div>
            <div className="text-xs text-surface-400">
              {chains.length} ripples • {totalReach} people reached
            </div>
          </div>
        </div>
        <div className="flex -space-x-2">
          {chains.slice(0, 3).map((_, i) => (
            <div key={i} className="w-8 h-8 bg-cyan-500/30 rounded-full border-2 border-surface-900 flex items-center justify-center">
              <Heart size={12} className="text-cyan-400" />
            </div>
          ))}
          {chains.length > 3 && (
            <div className="w-8 h-8 bg-surface-700 rounded-full border-2 border-surface-900 flex items-center justify-center text-xs text-surface-300">
              +{chains.length - 3}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// Connection lines visualization for the class
export function ClassRippleMap({
  connections,
  isAnonymousMode
}: {
  connections: Array<{
    from: string
    fromAnonymous: string
    to: string
    toAnonymous: string
    action: string
  }>
  isAnonymousMode: boolean
}) {
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>()
    connections.forEach(c => {
      users.add(isAnonymousMode ? c.fromAnonymous : c.from)
      users.add(isAnonymousMode ? c.toAnonymous : c.to)
    })
    return Array.from(users)
  }, [connections, isAnonymousMode])

  // Simple force-directed-ish layout
  const positions = useMemo(() => {
    const pos: Record<string, { x: number, y: number }> = {}
    const centerX = 200
    const centerY = 150
    const radius = 100
    
    uniqueUsers.forEach((user, i) => {
      const angle = (i / uniqueUsers.length) * Math.PI * 2 - Math.PI / 2
      pos[user] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      }
    })
    return pos
  }, [uniqueUsers])

  return (
    <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700">
      <div className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Users className="text-community" size={18} />
        Class Connection Map
      </div>
      
      <svg width="400" height="300" className="w-full">
        {/* Connection lines */}
        {connections.map((conn, i) => {
          const fromKey = isAnonymousMode ? conn.fromAnonymous : conn.from
          const toKey = isAnonymousMode ? conn.toAnonymous : conn.to
          const from = positions[fromKey]
          const to = positions[toKey]
          
          if (!from || !to) return null
          
          return (
            <g key={i}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeOpacity="0.3"
              />
              {/* Arrow */}
              <circle
                cx={to.x + (from.x - to.x) * 0.2}
                cy={to.y + (from.y - to.y) * 0.2}
                r="3"
                fill="#0ea5e9"
              />
            </g>
          )
        })}
        
        {/* User nodes */}
        {uniqueUsers.map((user) => {
          const pos = positions[user]
          if (!pos) return null
          
          return (
            <g key={user}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="20"
                fill="#1e293b"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fill="white"
                fontSize="10"
              >
                {user.slice(0, 2)}
              </text>
            </g>
          )
        })}
      </svg>
      
      <div className="text-xs text-surface-500 text-center mt-2">
        {uniqueUsers.length} people connected • {connections.length} help interactions
      </div>
    </div>
  )
}
