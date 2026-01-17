'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float, Line } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'

interface Student {
  id: string
  name: string
  battery_level: number
  current_state: 'dim' | 'stable' | 'radiant'
  overflow_generated: number
}

interface NexusViewProps {
  students: Student[]
  classIntegrity: number
  blightNodes: number
  weatherState: 'storm' | 'fog' | 'clear' | 'aurora'
  currentUserId: string
  onRepair?: () => void
  canRepair?: boolean
}

// Central spire that represents class health
function CentralSpire({ integrity, blight }: { integrity: number, blight: number }) {
  const spireRef = useRef<THREE.Group>(null)
  const crystalRefs = useRef<THREE.Mesh[]>([])
  
  const spireColor = useMemo(() => {
    if (integrity > 80) return '#a855f7' // Purple - Aurora
    if (integrity > 50) return '#22c55e' // Green - Clear
    if (integrity > 25) return '#eab308' // Yellow - Fog
    return '#ef4444' // Red - Storm
  }, [integrity])

  useFrame((state) => {
    if (spireRef.current) {
      spireRef.current.rotation.y += 0.002
    }
    crystalRefs.current.forEach((crystal, i) => {
      if (crystal) {
        crystal.position.y = Math.sin(state.clock.elapsedTime + i) * 0.1 + (i * 0.5)
      }
    })
  })

  return (
    <group ref={spireRef}>
      {/* Main spire */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.1, 0.5, 4, 8]} />
        <meshStandardMaterial 
          color={spireColor}
          emissive={spireColor}
          emissiveIntensity={integrity / 100}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Floating crystals around spire */}
      {[0, 1, 2, 3].map((i) => (
        <Float key={i} speed={2} floatIntensity={0.5}>
          <mesh 
            ref={(el) => { if (el) crystalRefs.current[i] = el }}
            position={[
              Math.cos((i / 4) * Math.PI * 2) * 1,
              i * 0.5 + 1,
              Math.sin((i / 4) * Math.PI * 2) * 1
            ]}
          >
            <octahedronGeometry args={[0.15]} />
            <meshStandardMaterial 
              color={spireColor}
              emissive={spireColor}
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
        </Float>
      ))}
      
      {/* Blight nodes (corruption) */}
      {Array.from({ length: blight }).map((_, i) => (
        <BlightNode key={i} index={i} />
      ))}
    </group>
  )
}

// Corruption/blight visual
function BlightNode({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const angle = (index / 5) * Math.PI * 2
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(0.3 + Math.sin(state.clock.elapsedTime * 3 + index) * 0.1)
      ref.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2
    }
  })

  return (
    <mesh 
      ref={ref}
      position={[Math.cos(angle) * 1.5, 1 + index * 0.3, Math.sin(angle) * 1.5]}
    >
      <dodecahedronGeometry args={[0.2]} />
      <meshStandardMaterial 
        color="#1f1f1f"
        emissive="#4a0000"
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
        wireframe
      />
    </mesh>
  )
}

// Student node in the constellation
function StudentNode({ student, index, total, isCurrentUser }: { 
  student: Student, 
  index: number, 
  total: number,
  isCurrentUser: boolean 
}) {
  const ref = useRef<THREE.Mesh>(null)
  const angle = (index / total) * Math.PI * 2
  const radius = 4 + (student.overflow_generated / 50)
  
  const color = useMemo(() => {
    if (student.current_state === 'radiant') return '#a855f7'
    if (student.current_state === 'stable') return '#22c55e'
    return '#6b7280'
  }, [student.current_state])

  useFrame((state) => {
    if (ref.current) {
      const pulse = student.current_state === 'radiant' 
        ? Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1 
        : 1
      ref.current.scale.setScalar(0.2 + (student.battery_level / 200) * pulse)
    }
  })

  const position: [number, number, number] = [
    Math.cos(angle) * radius,
    Math.sin(index * 0.5) * 0.5,
    Math.sin(angle) * radius
  ]

  return (
    <group>
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={student.battery_level / 100}
        />
      </mesh>
      
      {/* Connection beam to center if radiant */}
      {student.current_state === 'radiant' && (
        <Line
          points={[position, [0, 1, 0]]}
          color={color}
          lineWidth={1}
          transparent
          opacity={0.3}
        />
      )}
      
      {/* Highlight current user */}
      {isCurrentUser && (
        <mesh position={position}>
          <ringGeometry args={[0.4, 0.5, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

// Weather effects
function WeatherEffects({ weather }: { weather: string }) {
  if (weather === 'aurora') {
    return <Stars radius={100} depth={50} count={2000} factor={6} saturation={1} />
  }
  if (weather === 'storm') {
    return (
      <group>
        {/* Lightning flashes */}
        <ambientLight intensity={0.1} />
      </group>
    )
  }
  if (weather === 'fog') {
    return <fog attach="fog" args={['#1a1a2e', 5, 20]} />
  }
  return <Stars radius={100} depth={50} count={1000} factor={4} />
}

export default function NexusView({ 
  students, 
  classIntegrity, 
  blightNodes, 
  weatherState,
  currentUserId,
  onRepair,
  canRepair 
}: NexusViewProps) {
  return (
    <div className="relative w-full h-full min-h-[500px]">
      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <ambientLight intensity={weatherState === 'storm' ? 0.1 : 0.3} />
        <pointLight position={[0, 5, 0]} intensity={1} color="#a855f7" />
        
        <WeatherEffects weather={weatherState} />
        <CentralSpire integrity={classIntegrity} blight={blightNodes} />
        
        {students.map((student, i) => (
          <StudentNode 
            key={student.id}
            student={student}
            index={i}
            total={students.length}
            isCurrentUser={student.id === currentUserId}
          />
        ))}
        
        {/* Floor grid */}
        <gridHelper args={[20, 20, '#2a2a4a', '#1a1a2e']} position={[0, -1, 0]} />
        
        <EffectComposer>
          <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={1} />
          {weatherState === 'storm' && (
            <ChromaticAberration offset={[0.002, 0.002]} />
          )}
        </EffectComposer>
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">The Nexus</h2>
          <p className={`text-sm ${
            weatherState === 'aurora' ? 'text-purple-400' :
            weatherState === 'clear' ? 'text-green-400' :
            weatherState === 'fog' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {weatherState === 'aurora' && '✨ Aurora - Maximum Unity'}
            {weatherState === 'clear' && '☀️ Clear - Strong Connection'}
            {weatherState === 'fog' && '🌫️ Fog - Weakening Signal'}
            {weatherState === 'storm' && '⛈️ Storm - System Unstable'}
          </p>
        </div>
        
        {/* Class integrity */}
        <div className="bg-surface-900/80 rounded-xl p-3 backdrop-blur-sm">
          <div className="text-xs text-surface-400 mb-1">CLASS INTEGRITY</div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-3 bg-surface-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  classIntegrity > 80 ? 'bg-purple-500' :
                  classIntegrity > 50 ? 'bg-green-500' :
                  classIntegrity > 25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${classIntegrity}%` }}
              />
            </div>
            <span className="text-lg font-bold text-white">{classIntegrity}%</span>
          </div>
          {blightNodes > 0 && (
            <div className="text-xs text-red-400 mt-1">
              ⚠️ {blightNodes} Blight Node{blightNodes > 1 ? 's' : ''} Active
            </div>
          )}
        </div>
      </div>
      
      {/* Connected students count */}
      <div className="absolute bottom-24 left-4 bg-surface-900/80 rounded-xl p-3 backdrop-blur-sm">
        <div className="text-xs text-surface-400">CONNECTED</div>
        <div className="text-2xl font-bold text-white">
          {students.filter(s => s.current_state !== 'dim').length}/{students.length}
        </div>
      </div>
      
      {/* Repair button */}
      {canRepair && blightNodes > 0 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <button
            onClick={onRepair}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg text-white shadow-lg shadow-purple-500/25"
          >
            🔧 Repair Nexus (Uses Overflow)
          </button>
        </div>
      )}
    </div>
  )
}
