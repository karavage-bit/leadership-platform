'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TreePine, Flower2, Building2, Link2, Gem, HelpCircle, Hammer, Package } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { WorldData, PlacedItem, InventoryItem } from '../types'

// Dynamically import VoxelWorld
const VoxelWorld = dynamic(() => import('@/components/VoxelWorld'), { 
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-surface-900 rounded-2xl flex items-center justify-center">
      <div className="text-surface-400 animate-pulse">Loading 3D World...</div>
    </div>
  )
})

interface WorldTabProps {
  world: WorldData | null
  userName: string
  placedItems: PlacedItem[]
  inventoryItems: InventoryItem[]
  discoveredSecrets: string[]
  onItemPlace?: (type: string, x: number, z: number) => void
  onBrainstormOpen?: () => void
}

export default function WorldTab({
  world,
  userName,
  placedItems,
  inventoryItems,
  discoveredSecrets,
  onItemPlace,
  onBrainstormOpen
}: WorldTabProps) {
  const totalItems = (world?.trees || 0) + (world?.flowers || 0) + (world?.tower || 0) + (world?.bridge || 0)
  
  return (
    <motion.div
      key="world"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* 3D World */}
      <div className="relative">
        <VoxelWorld 
          world={world}
          userName={userName}
          placedItems={placedItems}
          discoveredSecrets={discoveredSecrets}
          inventoryItems={inventoryItems}
          onItemPlace={onItemPlace}
          onOpenBrainstorm={onBrainstormOpen}
        />
        
        {/* World HUD Overlay */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white">
          <div className="font-semibold mb-1">{userName}'s World</div>
          <div className="text-surface-300">{totalItems} items placed</div>
        </div>
        
        {/* Controls Help */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-surface-300">
          <div className="flex items-center gap-1 mb-1">
            <HelpCircle size={12} />
            <span>Controls</span>
          </div>
          <div>WASD - Move</div>
          <div>P - Place items</div>
          <div>E - Interact</div>
          <div>B - Brainstorm</div>
        </div>
      </div>
      
      {/* Build Inventory Panel */}
      {inventoryItems.length > 0 && (
        <motion.div 
          className="card p-4 border-yellow-500/30 bg-gradient-to-r from-yellow-900/20 to-surface-900"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
              <Package size={16} />
              Items Ready to Place
            </h3>
            <div className="text-xs text-surface-400">Press P in world to build</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {inventoryItems.map((item, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-surface-800 rounded-lg"
              >
                <span className="text-lg">
                  {item.type === 'tree' && '🌲'}
                  {item.type === 'flower' && '🌸'}
                  {item.type === 'tower' && '🏛️'}
                  {item.type === 'crystal' && '💎'}
                  {item.type === 'stone' && '🪨'}
                </span>
                <span className="font-bold text-white">×{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No items prompt */}
      {inventoryItems.length === 0 && (
        <div className="card p-4 border-dashed border-surface-600 text-center">
          <Hammer size={24} className="mx-auto mb-2 text-surface-500" />
          <p className="text-surface-400 text-sm">Complete activities to earn building items!</p>
          <p className="text-surface-500 text-xs mt-1">Do Nows → Flowers | Scenarios → Trees | Challenges → Towers</p>
        </div>
      )}

      {/* Resource Summary */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-surface-300 mb-3">Your Resources</h3>
        <div className="grid grid-cols-5 gap-3">
          <ResourceCard 
            icon={TreePine} 
            count={world?.trees || 0} 
            label="Trees" 
            color="text-green-400"
            bgColor="bg-green-500/20"
          />
          <ResourceCard 
            icon={Flower2} 
            count={world?.flowers || 0} 
            label="Flowers" 
            color="text-pink-400"
            bgColor="bg-pink-500/20"
          />
          <ResourceCard 
            icon={Building2} 
            count={world?.tower || 0} 
            label="Tower" 
            color="text-blue-400"
            bgColor="bg-blue-500/20"
          />
          <ResourceCard 
            icon={Link2} 
            count={world?.bridge || 0} 
            label="Bridge" 
            color="text-purple-400"
            bgColor="bg-purple-500/20"
          />
          <ResourceCard 
            icon={Gem} 
            count={world?.crystals || 0} 
            label="Crystals" 
            color="text-cyan-400"
            bgColor="bg-cyan-500/20"
          />
        </div>
      </div>
      
      {/* Phase Progress */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-surface-300 mb-3">Journey Progress</h3>
        <div className="space-y-3">
          <ProgressBar 
            label="Self-Leadership" 
            progress={world?.phase1_progress || 0} 
            color="bg-courage" 
          />
          <ProgressBar 
            label="Team Leadership" 
            progress={world?.phase2_progress || 0} 
            color="bg-care" 
          />
          <ProgressBar 
            label="Community Leadership" 
            progress={world?.phase3_progress || 0} 
            color="bg-community" 
          />
          <ProgressBar 
            label="Legacy Leadership" 
            progress={world?.phase4_progress || 0} 
            color="bg-creation" 
          />
        </div>
      </div>
      
      {/* Secrets Discovered */}
      {discoveredSecrets.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-surface-300 mb-3">
            🔮 Secrets Discovered ({discoveredSecrets.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {discoveredSecrets.map((secret, i) => (
              <span 
                key={i}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
              >
                {secret}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Resource Card Component
function ResourceCard({ 
  icon: Icon, 
  count, 
  label, 
  color,
  bgColor
}: { 
  icon: React.ElementType
  count: number
  label: string
  color: string
  bgColor: string
}) {
  return (
    <div className="text-center p-3 bg-surface-800/50 rounded-xl">
      <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${bgColor} flex items-center justify-center`}>
        <Icon className={color} size={20} />
      </div>
      <div className="text-xl font-bold text-white">{count}</div>
      <div className="text-xs text-surface-500">{label}</div>
    </div>
  )
}

// Progress Bar Component
function ProgressBar({ label, progress, color }: { label: string; progress: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-surface-400">{label}</span>
        <span className="text-surface-300 font-medium">{progress}%</span>
      </div>
      <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}
