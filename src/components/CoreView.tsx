'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Text3D, Center, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

interface CoreViewProps {
  batteryLevel: number
  currentState: 'dim' | 'stable' | 'radiant'
  userName?: string
  onConnect?: () => void
}

// Battery orb that pulses based on energy level
function BatteryOrb({ batteryLevel, state }: { batteryLevel: number, state: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  
  const color = useMemo(() => {
    if (state === 'radiant') return '#a855f7' // Purple
    if (state === 'stable') return '#22c55e' // Green
    return '#6b7280' // Gray
  }, [state])
  
  const intensity = batteryLevel / 100

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
      meshRef.current.scale.setScalar(1 + intensity * 0.3 * pulse)
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.5 + intensity * 0.5)
    }
  })

  return (
    <group>
      {/* Core orb */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={intensity * 2}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </Float>
      
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={intensity * 0.2}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Energy particles */}
      {state !== 'dim' && (
        <EnergyParticles color={color} intensity={intensity} />
      )}
    </group>
  )
}

// Floating energy particles
function EnergyParticles({ color, intensity }: { color: string, intensity: number }) {
  const particlesRef = useRef<THREE.Points>(null)
  const count = Math.floor(50 * intensity)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 1.5 + Math.random() * 2
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [count])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.002
      particlesRef.current.rotation.x += 0.001
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

// Rain effect for dim state
function Rain() {
  const rainRef = useRef<THREE.Points>(null)
  const count = 1000
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = Math.random() * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
      vel[i] = 0.1 + Math.random() * 0.1
    }
    return [pos, vel]
  }, [])

  useFrame(() => {
    if (rainRef.current) {
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= velocities[i]
        if (positions[i * 3 + 1] < -2) {
          positions[i * 3 + 1] = 10
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={rainRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#4b5563"
        transparent
        opacity={0.5}
      />
    </points>
  )
}

// Room/Sanctuary environment
function Sanctuary({ state }: { state: string }) {
  const lightColor = state === 'radiant' ? '#fbbf24' : state === 'stable' ? '#22c55e' : '#374151'
  const lightIntensity = state === 'radiant' ? 2 : state === 'stable' ? 1 : 0.3

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      
      {/* Ambient lighting based on state */}
      <ambientLight intensity={state === 'dim' ? 0.1 : 0.3} />
      <pointLight position={[0, 3, 0]} color={lightColor} intensity={lightIntensity} />
      
      {/* Stars for radiant state */}
      {state === 'radiant' && <Stars radius={50} depth={50} count={1000} factor={4} />}
      
      {/* Rain for dim state */}
      {state === 'dim' && <Rain />}
    </group>
  )
}

export default function CoreView({ batteryLevel, currentState, userName, onConnect }: CoreViewProps) {
  const canConnect = batteryLevel >= 50

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <Sanctuary state={currentState} />
        <BatteryOrb batteryLevel={batteryLevel} state={currentState} />
        
        <EffectComposer>
          <Bloom 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            intensity={currentState === 'radiant' ? 1.5 : 0.5} 
          />
          <Noise opacity={currentState === 'dim' ? 0.1 : 0.02} />
          <Vignette eskil={false} offset={0.1} darkness={currentState === 'dim' ? 1.2 : 0.5} />
        </EffectComposer>
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Core</h2>
          <p className={`text-sm ${
            currentState === 'radiant' ? 'text-purple-400' :
            currentState === 'stable' ? 'text-green-400' : 'text-gray-500'
          }`}>
            {currentState === 'radiant' ? '⚡ Radiant' : 
             currentState === 'stable' ? '🌱 Stable' : '🌧️ Dim'}
          </p>
        </div>
        
        {/* Battery indicator */}
        <div className="bg-surface-900/80 rounded-xl p-3 backdrop-blur-sm">
          <div className="text-xs text-surface-400 mb-1">BATTERY</div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-3 bg-surface-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  batteryLevel > 80 ? 'bg-purple-500' :
                  batteryLevel > 50 ? 'bg-green-500' : 'bg-gray-500'
                }`}
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
            <span className="text-lg font-bold text-white">{batteryLevel}%</span>
          </div>
        </div>
      </div>
      
      {/* Connect button (Oxygen Mask Rule) */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <button
          onClick={onConnect}
          disabled={!canConnect}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            canConnect 
              ? 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white shadow-lg shadow-primary-500/25 animate-pulse'
              : 'bg-surface-700 text-surface-500 cursor-not-allowed'
          }`}
        >
          {canConnect ? '🔗 Connect to Nexus' : '🔒 Charge to 50% to Connect'}
        </button>
      </div>
      
      {/* State message */}
      <div className="absolute bottom-24 left-0 right-0 text-center">
        <p className="text-surface-400 text-sm">
          {currentState === 'dim' && "Low energy isn't failure. It's information."}
          {currentState === 'stable' && "You're building momentum. Keep going."}
          {currentState === 'radiant' && "You have power to spare. Time to overflow."}
        </p>
      </div>
    </div>
  )
}
