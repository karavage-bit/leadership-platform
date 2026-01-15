'use client'

import { useRef, useMemo, useState, useEffect, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sky, Cloud, Text, Float, Sparkles, Stars, Html, KeyboardControls, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

// ============================================
// TYPES
// ============================================

interface WorldData {
  trees: number
  flowers: number
  stones: number
  crystals: number
  tower: number
  bridge: number
  garden: number
  lighthouse: number
  help_given: number
  help_received: number
  phase1_progress: number
  phase2_progress: number
  phase3_progress: number
  phase4_progress: number
}

interface PlacedItem {
  id: string
  type: string
  variant: number
  x: number
  y: number
  z: number
  rotation: number
  memory?: string
  earnedFrom?: string
}

interface Visitor {
  id: string
  name: string
  x: number
  z: number
}

interface Controls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  interact: boolean
  placement: boolean
  brainstorm: boolean
}

// ============================================
// KEYBOARD MAPPING
// ============================================

const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'interact', keys: ['KeyE'] },
  { name: 'placement', keys: ['KeyP'] },
  { name: 'brainstorm', keys: ['KeyB'] },
]

// ============================================
// UTILITY FUNCTIONS
// ============================================

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

// ============================================
// SOUND SYSTEM
// ============================================

class SoundSystem {
  private ctx: AudioContext | null = null
  private gain: GainNode | null = null
  private muted = false

  init() {
    if (this.ctx || typeof window === 'undefined') return
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.gain = this.ctx.createGain()
      this.gain.connect(this.ctx.destination)
      this.gain.gain.value = 0.25
    } catch (e) { console.log('No audio') }
  }

  play(freq: number, dur: number, type: OscillatorType = 'sine') {
    if (!this.ctx || !this.gain || this.muted) return
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
    g.gain.setValueAtTime(0.2, this.ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur)
    osc.connect(g)
    g.connect(this.gain)
    osc.start()
    osc.stop(this.ctx.currentTime + dur)
  }

  step() { this.play(200 + Math.random() * 100, 0.08, 'sine') }
  pop() { this.play(880, 0.1, 'sine') }
  place() { this.play(523, 0.15, 'sine'); setTimeout(() => this.play(659, 0.15, 'sine'), 100) }
  discover() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.play(f, 0.2), i * 80)) }

  toggle() {
    this.muted = !this.muted
    if (this.gain) this.gain.gain.value = this.muted ? 0 : 0.25
    return this.muted
  }
  
  isMuted() { return this.muted }
}

const sound = new SoundSystem()

// ============================================
// COLORS & MATERIALS
// ============================================

const C = {
  grass: ['#4ade80', '#22c55e', '#16a34a'],
  dirt: ['#92400e', '#78350f', '#5c2d0e'],
  stone: ['#6b7280', '#4b5563', '#374151'],
  wood: ['#78350f', '#92400e', '#5c2d0e'],
  leaves: ['#166534', '#15803d', '#14532d', '#0f5132'],
  water: '#0369a1',
  flowers: ['#f472b6', '#fb923c', '#facc15', '#a78bfa', '#f87171', '#34d399', '#60a5fa', '#f9a8d4'],
  skin: ['#fcd5ce', '#f5cba7', '#d4a574', '#c19a6b', '#8d5524'],
  shirts: ['#dc2626', '#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#be185d'],
  pants: ['#1e40af', '#4c1d95', '#0f766e', '#991b1b', '#92400e', '#1e3a5f'],
  hair: ['#451a03', '#1c1917', '#78350f', '#fbbf24', '#7c2d12', '#1e293b'],
}

// ============================================
// TEXTURED BLOCK MATERIALS
// ============================================

function createBlockMaterial(baseColor: string, noise: number = 0.12): THREE.MeshLambertMaterial {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext('2d')!
  
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, 16, 16)
  
  // Add noise pixels
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      if (Math.random() < 0.3) {
        const brightness = Math.random() < 0.5 ? -noise : noise
        ctx.fillStyle = `rgba(${brightness > 0 ? 255 : 0},${brightness > 0 ? 255 : 0},${brightness > 0 ? 255 : 0},${Math.abs(brightness)})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  
  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, 15, 15)
  
  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  
  return new THREE.MeshLambertMaterial({ map: tex, color: baseColor })
}

// ============================================
// BLOCKS
// ============================================

const GrassBlock = ({ position }: { position: [number, number, number] }) => {
  const mat = useMemo(() => createBlockMaterial(C.grass[0], 0.15), [])
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

const DirtBlock = ({ position }: { position: [number, number, number] }) => {
  const mat = useMemo(() => createBlockMaterial(C.dirt[0], 0.2), [])
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

const StoneBlock = ({ position }: { position: [number, number, number] }) => {
  const mat = useMemo(() => createBlockMaterial(C.stone[0], 0.25), [])
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ============================================
// PLAYER CHARACTER (Controllable)
// ============================================

interface PlayerProps {
  position: THREE.Vector3
  name: string
  seed: number
  isLocalPlayer: boolean
  onPositionChange?: (pos: THREE.Vector3) => void
}

function Player({ position, name, seed, isLocalPlayer, onPositionChange }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const velocityRef = useRef(new THREE.Vector3())
  const [hovered, setHovered] = useState(false)
  
  // Get keyboard state
  const [, getKeys] = useKeyboardControls<keyof Controls>()
  
  // Colors based on seed
  const colors = useMemo(() => ({
    skin: C.skin[seed % C.skin.length],
    shirt: C.shirts[seed % C.shirts.length],
    pants: C.pants[(seed + 1) % C.pants.length],
    hair: C.hair[(seed + 2) % C.hair.length]
  }), [seed])
  
  // Movement physics
  const SPEED = 0.08
  const FRICTION = 0.85
  
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    if (isLocalPlayer) {
      const keys = getKeys()
      
      // Calculate movement direction
      const direction = new THREE.Vector3()
      if (keys.forward) direction.z -= 1
      if (keys.backward) direction.z += 1
      if (keys.left) direction.x -= 1
      if (keys.right) direction.x += 1
      
      if (direction.length() > 0) {
        direction.normalize()
        velocityRef.current.x += direction.x * SPEED
        velocityRef.current.z += direction.z * SPEED
        
        // Rotate to face movement direction
        const targetRotation = Math.atan2(direction.x, direction.z)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotation,
          0.15
        )
        
        // Footstep sound occasionally
        if (Math.random() < 0.05) sound.step()
      }
      
      // Apply friction
      velocityRef.current.multiplyScalar(FRICTION)
      
      // Apply velocity
      groupRef.current.position.add(velocityRef.current)
      
      // Constrain to island bounds
      const maxDist = 5
      const pos = groupRef.current.position
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
      if (dist > maxDist) {
        pos.x = (pos.x / dist) * maxDist
        pos.z = (pos.z / dist) * maxDist
      }
      
      // Report position change
      if (onPositionChange) {
        onPositionChange(groupRef.current.position.clone())
      }
    }
    
    // Idle animation (bobbing)
    if (groupRef.current) {
      groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 2) * 0.03
    }
  })
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Shadow & spotlight */}
      {isLocalPlayer && (
        <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.12} />
        </mesh>
      )}
      <mesh position={[0, -0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.1, 0.22, 0]} castShadow>
        <boxGeometry args={[0.18, 0.44, 0.18]} />
        <meshLambertMaterial color={colors.pants} />
      </mesh>
      <mesh position={[0.1, 0.22, 0]} castShadow>
        <boxGeometry args={[0.18, 0.44, 0.18]} />
        <meshLambertMaterial color={colors.pants} />
      </mesh>
      
      {/* Shoes */}
      <mesh position={[-0.1, 0.04, 0.02]} castShadow>
        <boxGeometry args={[0.2, 0.08, 0.24]} />
        <meshLambertMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.1, 0.04, 0.02]} castShadow>
        <boxGeometry args={[0.2, 0.08, 0.24]} />
        <meshLambertMaterial color="#1f2937" />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.36, 0.44, 0.22]} />
        <meshLambertMaterial color={colors.shirt} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.25, 0.62, 0]} castShadow>
        <boxGeometry args={[0.14, 0.4, 0.16]} />
        <meshLambertMaterial color={colors.shirt} />
      </mesh>
      <mesh position={[0.25, 0.62, 0]} castShadow>
        <boxGeometry args={[0.14, 0.4, 0.16]} />
        <meshLambertMaterial color={colors.shirt} />
      </mesh>
      
      {/* Hands */}
      <mesh position={[-0.25, 0.38, 0]} castShadow>
        <boxGeometry args={[0.11, 0.11, 0.13]} />
        <meshLambertMaterial color={colors.skin} />
      </mesh>
      <mesh position={[0.25, 0.38, 0]} castShadow>
        <boxGeometry args={[0.11, 0.11, 0.13]} />
        <meshLambertMaterial color={colors.skin} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.36, 0.36, 0.36]} />
        <meshLambertMaterial color={colors.skin} />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 1.17, -0.01]} castShadow>
        <boxGeometry args={[0.38, 0.14, 0.38]} />
        <meshLambertMaterial color={colors.hair} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.08, 1.02, 0.18]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.08, 1.02, 0.18]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>
      
      {/* Eye highlights */}
      <mesh position={[-0.06, 1.03, 0.182]}>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      <mesh position={[0.1, 1.03, 0.182]}>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      
      {/* Smile */}
      <mesh position={[0, 0.93, 0.18]}>
        <boxGeometry args={[0.1, 0.025, 0.01]} />
        <meshBasicMaterial color="#dc2626" />
      </mesh>
      
      {/* Name tag */}
      <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
        <div className={`
          px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all
          ${isLocalPlayer ? 'bg-yellow-400 text-black' : 'bg-black/70 text-white'}
          ${hovered ? 'scale-110' : 'scale-100'}
        `}>
          {isLocalPlayer ? '⭐ ' : ''}{name}
        </div>
      </Html>
      
      {/* Sparkles for local player */}
      {isLocalPlayer && <Sparkles count={6} scale={1} size={2} speed={0.3} color="#fef08a" />}
    </group>
  )
}

// ============================================
// CAMERA CONTROLLER (Follows Player)
// ============================================

function CameraController({ target, enabled }: { target: THREE.Vector3, enabled: boolean }) {
  const { camera } = useThree()
  const offsetRef = useRef(new THREE.Vector3(8, 6, 8))
  
  useFrame(() => {
    if (!enabled) return
    
    // Smoothly follow target
    const desiredPosition = target.clone().add(offsetRef.current)
    camera.position.lerp(desiredPosition, 0.05)
    
    // Look at target
    const lookTarget = target.clone()
    lookTarget.y += 1
    camera.lookAt(lookTarget)
  })
  
  return null
}

// ============================================
// PLACEABLE TREE
// ============================================

interface TreeProps {
  position: [number, number, number]
  seed: number
  memory?: string
  onInteract?: () => void
}

function PlaceableTree({ position, seed, memory, onInteract }: TreeProps) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  
  const style = seed % 3
  const leafColor = C.leaves[seed % C.leaves.length]
  const height = 2 + Math.floor(seededRandom(seed) * 2)
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + seed) * 0.015
    }
  })
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerOver={() => { setHovered(true); sound.pop() }}
      onPointerOut={() => setHovered(false)}
      onClick={() => onInteract?.()}
    >
      {/* Trunk */}
      {Array.from({ length: height }, (_, i) => (
        <mesh key={i} position={[0, i * 0.6 + 0.3, 0]} castShadow>
          <boxGeometry args={[0.3, 0.6, 0.3]} />
          <meshLambertMaterial color={C.wood[0]} />
        </mesh>
      ))}
      
      {/* Leaves - varies by style */}
      {style === 0 && (
        <>
          <mesh position={[0, height * 0.6 + 0.4, 0]} castShadow>
            <boxGeometry args={[1.3, 1, 1.3]} />
            <meshLambertMaterial color={leafColor} />
          </mesh>
          <mesh position={[0, height * 0.6 + 1.1, 0]} castShadow>
            <boxGeometry args={[0.9, 0.7, 0.9]} />
            <meshLambertMaterial color={leafColor} />
          </mesh>
        </>
      )}
      {style === 1 && (
        <>
          {[0, 0.45, 0.85, 1.2].map((y, i) => (
            <mesh key={i} position={[0, height * 0.6 + y, 0]} castShadow>
              <boxGeometry args={[1.5 - i * 0.35, 0.45, 1.5 - i * 0.35]} />
              <meshLambertMaterial color={leafColor} />
            </mesh>
          ))}
        </>
      )}
      {style === 2 && (
        <>
          <mesh position={[-0.3, height * 0.6 + 0.3, 0]} castShadow>
            <boxGeometry args={[0.9, 0.8, 0.9]} />
            <meshLambertMaterial color={leafColor} />
          </mesh>
          <mesh position={[0.3, height * 0.6 + 0.4, 0.2]} castShadow>
            <boxGeometry args={[0.9, 0.8, 0.9]} />
            <meshLambertMaterial color={leafColor} />
          </mesh>
          <mesh position={[0, height * 0.6 + 0.9, -0.1]} castShadow>
            <boxGeometry args={[1, 0.7, 0.9]} />
            <meshLambertMaterial color={leafColor} />
          </mesh>
        </>
      )}
      
      {/* Tooltip on hover */}
      {hovered && memory && (
        <Html position={[0, height + 2, 0]} center>
          <div className="bg-black/90 px-3 py-2 rounded-xl text-sm max-w-[200px] shadow-xl border border-green-500/30">
            <div className="font-bold text-green-400">🌲 Tree of Courage</div>
            <div className="text-xs text-gray-300 mt-1">{memory}</div>
            <div className="text-xs text-green-400/70 mt-1">Press E to remember</div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================
// PLACEABLE FLOWER
// ============================================

function PlaceableFlower({ position, seed, memory }: { position: [number, number, number], seed: number, memory?: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const color = C.flowers[seed % C.flowers.length]
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + seed * 0.5) * 0.1
    }
  })
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerOver={() => { setHovered(true); sound.pop() }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.04, 0.24, 0.04]} />
        <meshLambertMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.14, 0.1, 0.14]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshLambertMaterial color="#fbbf24" />
      </mesh>
      
      {hovered && memory && (
        <Html position={[0, 0.8, 0]} center>
          <div className="bg-black/90 px-2 py-1 rounded-lg text-xs max-w-[150px] shadow-xl border border-pink-500/30">
            <div className="font-bold text-pink-400">🌸 Flower of Care</div>
            <div className="text-[10px] text-gray-300 mt-0.5">{memory}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================
// TOWER
// ============================================

function PlaceableTower({ position, height = 2, memory }: { position: [number, number, number], height?: number, memory?: string }) {
  const [hovered, setHovered] = useState(false)
  const h = Math.max(2, Math.min(height + 2, 8))
  
  return (
    <group 
      position={position}
      onPointerOver={() => { setHovered(true); sound.pop() }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[1.8, 0.3, 1.8]} />
        <meshLambertMaterial color={C.stone[0]} />
      </mesh>
      
      {Array.from({ length: h }, (_, i) => (
        <mesh key={i} position={[0, 0.45 + i * 0.7, 0]} castShadow>
          <boxGeometry args={[1.4 - i * 0.06, 0.7, 1.4 - i * 0.06]} />
          <meshLambertMaterial color={i % 2 === 0 ? C.stone[1] : C.stone[0]} />
        </mesh>
      ))}
      
      {/* Windows */}
      {Array.from({ length: Math.min(h - 1, 3) }, (_, i) => (
        <mesh key={`w-${i}`} position={[0.72 - i * 0.03, 0.8 + i * 1.4, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.2]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      ))}
      
      {/* Roof */}
      <mesh position={[0, 0.45 + h * 0.7 + 0.4, 0]} castShadow>
        <coneGeometry args={[0.95, 1, 4]} />
        <meshLambertMaterial color="#b91c1c" />
      </mesh>
      
      {/* Flag */}
      <mesh position={[0, 0.45 + h * 0.7 + 1.3, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
        <meshLambertMaterial color={C.wood[0]} />
      </mesh>
      <mesh position={[0.18, 0.45 + h * 0.7 + 1.5, 0]}>
        <boxGeometry args={[0.35, 0.2, 0.02]} />
        <meshLambertMaterial color="#eab308" />
      </mesh>
      
      {hovered && (
        <Html position={[0, h + 2.5, 0]} center>
          <div className="bg-black/90 px-3 py-2 rounded-xl text-sm shadow-xl border border-yellow-500/30">
            <div className="font-bold text-yellow-400">🏛️ Tower of Creation</div>
            <div className="text-xs text-gray-300 mt-1">Level {height}</div>
            {memory && <div className="text-xs text-yellow-400/70 mt-1">{memory}</div>}
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================
// CRYSTAL
// ============================================

function PlaceableCrystal({ position, memory }: { position: [number, number, number], memory?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })
  
  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={position}
        onPointerOver={() => { setHovered(true); sound.pop() }}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <octahedronGeometry args={[0.4]} />
        <meshStandardMaterial color="#a855f7" emissive="#7c3aed" emissiveIntensity={hovered ? 1.2 : 0.6} roughness={0.15} metalness={0.8} />
      </mesh>
      <Sparkles count={10} scale={1.2} size={3} speed={0.5} color="#c084fc" position={position} />
      
      {hovered && (
        <Html position={[position[0], position[1] + 1, position[2]]} center>
          <div className="bg-black/90 px-3 py-2 rounded-xl text-sm shadow-xl border border-purple-500/30">
            <div className="font-bold text-purple-400">💎 Ripple Crystal</div>
            {memory && <div className="text-xs text-gray-300 mt-1">{memory}</div>}
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================
// SECRET: MEMORY STONE (Hidden at island edge)
// ============================================

function MemoryStone({ position, discovered, onDiscover }: { position: [number, number, number], discovered: boolean, onDiscover: () => void }) {
  const [hovered, setHovered] = useState(false)
  
  if (!discovered && !hovered) {
    // Hidden until close
    return (
      <mesh 
        position={position}
        onPointerOver={() => setHovered(true)}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshLambertMaterial color={C.stone[2]} transparent opacity={0.3} />
      </mesh>
    )
  }
  
  return (
    <group 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => { onDiscover(); sound.discover() }}
    >
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.8, 0.6]} />
        <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.5} />
      </mesh>
      <Sparkles count={8} scale={1} size={2} speed={0.3} color="#818cf8" />
      
      {hovered && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-black/90 px-3 py-2 rounded-xl text-sm shadow-xl border border-indigo-500/30">
            <div className="font-bold text-indigo-400">🗿 Memory Stone</div>
            <div className="text-xs text-gray-300 mt-1">
              {discovered ? "Your first gratitude message is inscribed here" : "Click to discover secret!"}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================
// SECRET: RIPPLE POOL
// ============================================

function RipplePool({ position, rippleCount, discovered }: { position: [number, number, number], rippleCount: number, discovered: boolean }) {
  const [hovered, setHovered] = useState(false)
  
  if (!discovered) return null
  
  return (
    <group 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.3} transparent opacity={0.8} />
      </mesh>
      <Sparkles count={15} scale={2} size={2} speed={0.2} color="#38bdf8" position={[0, 0.5, 0]} />
      
      {hovered && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/90 px-3 py-2 rounded-xl text-sm shadow-xl border border-cyan-500/30">
            <div className="font-bold text-cyan-400">🌊 Ripple Pool</div>
            <div className="text-xs text-gray-300 mt-1">
              You've started {rippleCount} ripples
            </div>
            <div className="text-xs text-cyan-400/70 mt-1">Look within to see your impact</div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================
// BRIDGE
// ============================================

function Bridge({ start, end }: { start: [number, number, number], end: [number, number, number] }) {
  const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[2] - start[2], 2))
  const angle = Math.atan2(end[2] - start[2], end[0] - start[0])
  const midX = (start[0] + end[0]) / 2
  const midZ = (start[2] + end[2]) / 2
  
  return (
    <group position={[midX, start[1], midZ]} rotation={[0, -angle, 0]}>
      <mesh position={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[length, 0.15, 0.25]} />
        <meshLambertMaterial color={C.dirt[0]} />
      </mesh>
      
      {Array.from({ length: Math.floor(length) }, (_, i) => (
        <mesh key={i} position={[i - length/2 + 0.5, 0.05, 0]} castShadow>
          <boxGeometry args={[0.85, 0.1, 1.2]} />
          <meshLambertMaterial color={C.wood[1]} />
        </mesh>
      ))}
      
      <mesh position={[0, 0.55, 0.5]}>
        <boxGeometry args={[length - 0.3, 0.04, 0.04]} />
        <meshLambertMaterial color={C.dirt[0]} />
      </mesh>
      <mesh position={[0, 0.55, -0.5]}>
        <boxGeometry args={[length - 0.3, 0.04, 0.04]} />
        <meshLambertMaterial color={C.dirt[0]} />
      </mesh>
      
      {Array.from({ length: Math.ceil(length / 1.5) }, (_, i) => (
        <group key={i}>
          <mesh position={[i * 1.5 - length/2 + 0.5, 0.35, 0.5]} castShadow>
            <boxGeometry args={[0.08, 0.6, 0.08]} />
            <meshLambertMaterial color={C.wood[0]} />
          </mesh>
          <mesh position={[i * 1.5 - length/2 + 0.5, 0.35, -0.5]} castShadow>
            <boxGeometry args={[0.08, 0.6, 0.08]} />
            <meshLambertMaterial color={C.wood[0]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ============================================
// MYSTERY ISLAND
// ============================================

function MysteryIsland({ position, unlocked }: { position: [number, number, number], unlocked: boolean }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <group position={position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {Array.from({ length: 9 }, (_, i) => {
        const x = (i % 3) - 1
        const z = Math.floor(i / 3) - 1
        return <GrassBlock key={`g-${i}`} position={[x, 0, z]} />
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const x = (i % 3) - 1
        const z = Math.floor(i / 3) - 1
        return <DirtBlock key={`d-${i}`} position={[x, -1, z]} />
      })}
      
      {unlocked ? (
        <>
          <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.7, 0.12, 8, 16]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={0.8} />
          </mesh>
          <Sparkles count={30} scale={2} size={4} speed={0.6} color="#c084fc" position={[0, 1.5, 0]} />
        </>
      ) : (
        <>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[0.8, 1.2, 0.8]} />
            <meshLambertMaterial color={C.stone[1]} />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <octahedronGeometry args={[0.35]} />
            <meshLambertMaterial color={C.stone[2]} />
          </mesh>
          <Float speed={2} floatIntensity={0.4}>
            <Text position={[0, 2.8, 0]} fontSize={0.6} color="#9ca3af" anchorX="center">?</Text>
          </Float>
        </>
      )}
      
      {hovered && (
        <Html position={[0, 3.5, 0]} center>
          <div className="bg-black/90 px-3 py-2 rounded-xl text-sm shadow-xl border border-gray-600/50">
            <div className="font-bold text-gray-400">{unlocked ? '🌀 Portal' : '🔒 Mystery Island'}</div>
            <div className="text-xs text-gray-300 mt-1">
              {unlocked ? 'Visit friends!' : 'Build bridges to unlock'}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================
// PROCEDURAL ISLAND
// ============================================

function ProceduralIsland({ seed, size = 8, items, onItemInteract }: { 
  seed: number
  size?: number
  items: PlacedItem[]
  onItemInteract?: (item: PlacedItem) => void
}) {
  const halfSize = size / 2
  
  const terrain = useMemo(() => {
    const blocks: { pos: [number, number, number], type: 'grass' | 'dirt' | 'stone' }[] = []
    for (let x = -halfSize; x < halfSize; x++) {
      for (let z = -halfSize; z < halfSize; z++) {
        const dist = Math.sqrt(x * x + z * z)
        const noise = seededRandom(seed + x * 1000 + z) * 1.2
        const height = Math.max(0, 1.8 - dist * 0.2 + noise)
        const edge = seededRandom(seed + x * 100 + z * 100) * 0.6
        
        if (dist < halfSize - 0.2 + edge) {
          blocks.push({ pos: [x, Math.floor(height), z], type: 'grass' })
          for (let y = Math.floor(height) - 1; y >= -2; y--) {
            blocks.push({ pos: [x, y, z], type: y > -1 ? 'dirt' : 'stone' })
          }
        }
      }
    }
    return blocks
  }, [halfSize, seed])
  
  return (
    <group>
      {terrain.map((b, i) => {
        if (b.type === 'grass') return <GrassBlock key={i} position={b.pos} />
        if (b.type === 'dirt') return <DirtBlock key={i} position={b.pos} />
        return <StoneBlock key={i} position={b.pos} />
      })}
      
      {/* Render placed items */}
      {items.map((item) => {
        switch (item.type) {
          case 'tree':
            return <PlaceableTree key={item.id} position={[item.x, item.y, item.z]} seed={item.variant} memory={item.memory} onInteract={() => onItemInteract?.(item)} />
          case 'flower':
            return <PlaceableFlower key={item.id} position={[item.x, item.y, item.z]} seed={item.variant} memory={item.memory} />
          case 'tower':
            return <PlaceableTower key={item.id} position={[item.x, item.y, item.z]} height={item.variant} memory={item.memory} />
          case 'crystal':
            return <PlaceableCrystal key={item.id} position={[item.x, item.y, item.z]} memory={item.memory} />
          default:
            return null
        }
      })}
    </group>
  )
}

// ============================================
// WATER
// ============================================

function Water() {
  const ref = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.7 + Math.sin(state.clock.elapsedTime) * 0.05
    }
  })
  
  return (
    <mesh ref={ref} position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color={C.water} transparent opacity={0.75} roughness={0.2} metalness={0.7} />
    </mesh>
  )
}

// ============================================
// MAIN SCENE
// ============================================

interface WorldSceneProps {
  world: WorldData
  userName: string
  seed: number
  placedItems: PlacedItem[]
  visitors: Visitor[]
  discoveredSecrets: string[]
  placementMode: boolean
  onItemPlace?: (x: number, z: number) => void
  onSecretDiscover?: (secret: string) => void
  onItemInteract?: (item: PlacedItem) => void
}

function WorldScene({ 
  world, userName, seed, placedItems, visitors, discoveredSecrets,
  placementMode, onItemPlace, onSecretDiscover, onItemInteract
}: WorldSceneProps) {
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 1, 0))
  const hasBridge = (world.bridge || 0) > 0
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 18, 10]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={45}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <hemisphereLight args={['#87ceeb', '#2d4a2d', 0.4]} />
      
      {/* Environment */}
      <Sky distance={450000} sunPosition={[60, 25, 60]} inclination={0.5} azimuth={0.25} />
      <Stars radius={70} depth={35} count={600} factor={3} saturation={0} fade speed={0.7} />
      <Cloud position={[-10, 12, -5]} speed={0.12} opacity={0.45} />
      <Cloud position={[8, 14, 5]} speed={0.08} opacity={0.35} />
      <fog attach="fog" args={['#1e3a5f', 22, 60]} />
      
      <Water />
      
      {/* Main Island */}
      <ProceduralIsland seed={seed} size={8} items={placedItems} onItemInteract={onItemInteract} />
      
      {/* Player */}
      <Player 
        position={playerPos} 
        name={userName} 
        seed={seed} 
        isLocalPlayer={true}
        onPositionChange={setPlayerPos}
      />
      
      {/* Visitors */}
      {visitors.map((v) => (
        <Player 
          key={v.id}
          position={new THREE.Vector3(v.x, 1, v.z)} 
          name={v.name} 
          seed={hashString(v.name)} 
          isLocalPlayer={false}
        />
      ))}
      
      {/* Secrets */}
      <MemoryStone 
        position={[-4, 0.5, -4]} 
        discovered={discoveredSecrets.includes('memory_stone')}
        onDiscover={() => onSecretDiscover?.('memory_stone')}
      />
      
      {discoveredSecrets.includes('ripple_pool') && (
        <RipplePool 
          position={[3, 0.1, -3]} 
          rippleCount={world.help_given || 0}
          discovered={true}
        />
      )}
      
      {/* Mystery Island */}
      <MysteryIsland position={[12, 0, 0]} unlocked={hasBridge} />
      
      {/* Bridge */}
      {hasBridge && <Bridge start={[4.5, 1, 0]} end={[9.5, 1, 0]} />}
      
      {/* World title */}
      <Float speed={0.8} floatIntensity={0.15}>
        <Text position={[0, 7, 0]} fontSize={0.7} color="#fff" anchorX="center" outlineWidth={0.04} outlineColor="#000">
          {userName}'s World
        </Text>
      </Float>
      
      {/* Camera controller */}
      <CameraController target={playerPos} enabled={!placementMode} />
      
      {/* Orbit controls for placement mode */}
      {placementMode && (
        <OrbitControls 
          enablePan={false}
          minDistance={8}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2.1}
        />
      )}
      
      {/* Placement mode ground click */}
      {placementMode && (
        <mesh 
          position={[0, 1, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            const point = e.point
            onItemPlace?.(point.x, point.z)
          }}
        >
          <circleGeometry args={[6, 32]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.2} />
        </mesh>
      )}
    </>
  )
}

// ============================================
// MAIN EXPORT
// ============================================

interface VoxelWorldProps {
  world: WorldData | null
  userName: string
  placedItems?: PlacedItem[]
  visitors?: Visitor[]
  discoveredSecrets?: string[]
  inventoryItems?: { type: string, count: number }[]
  onItemPlace?: (type: string, x: number, z: number) => void
  onSecretDiscover?: (secret: string) => void
  onOpenBrainstorm?: () => void
}

export default function VoxelWorld({ 
  world, userName, 
  placedItems = [], 
  visitors = [],
  discoveredSecrets = [],
  inventoryItems = [],
  onItemPlace,
  onSecretDiscover,
  onOpenBrainstorm
}: VoxelWorldProps) {
  const [mounted, setMounted] = useState(false)
  const [muted, setMuted] = useState(false)
  const [placementMode, setPlacementMode] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  
  const seed = useMemo(() => hashString(userName), [userName])
  
  useEffect(() => {
    setMounted(true)
    sound.init()
    
    // Hide controls hint after 5 seconds
    const timer = setTimeout(() => setShowControls(false), 5000)
    return () => clearTimeout(timer)
  }, [])
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        setPlacementMode(prev => !prev)
        sound.pop()
      }
      if (e.key === 'b' || e.key === 'B') {
        onOpenBrainstorm?.()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onOpenBrainstorm])
  
  if (!mounted) {
    return (
      <div className="w-full aspect-video bg-gradient-to-b from-sky-800 to-slate-950 rounded-2xl flex items-center justify-center border border-slate-700">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌍</div>
          <div className="text-white font-semibold">Building your world...</div>
          <div className="text-slate-400 text-sm mt-1">✨ Unique to you!</div>
        </div>
      </div>
    )
  }
  
  const defaultWorld: WorldData = {
    trees: 0, flowers: 0, stones: 0, crystals: 0, tower: 0, bridge: 0, garden: 0, lighthouse: 0,
    help_given: 0, help_received: 0, phase1_progress: 0, phase2_progress: 0, phase3_progress: 0, phase4_progress: 0
  }
  
  const w = world || defaultWorld
  const totalItems = placedItems.length
  const level = Math.floor(totalItems / 5) + 1
  
  return (
    <div className="w-full aspect-video bg-gradient-to-b from-sky-700 via-sky-900 to-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative group">
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows camera={{ position: [14, 10, 14], fov: 45 }} gl={{ antialias: true }} dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <WorldScene 
              world={w} 
              userName={userName} 
              seed={seed}
              placedItems={placedItems}
              visitors={visitors}
              discoveredSecrets={discoveredSecrets}
              placementMode={placementMode}
              onItemPlace={(x, z) => {
                if (selectedItem) {
                  onItemPlace?.(selectedItem, x, z)
                  sound.place()
                }
              }}
              onSecretDiscover={onSecretDiscover}
            />
          </Suspense>
        </Canvas>
      </KeyboardControls>
      
      {/* TOP HUD */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-auto">
          <div className="flex items-center gap-2 text-white text-xs">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-medium">Level {level}</span>
            {visitors.length > 0 && (
              <span className="text-purple-400">• {visitors.length} visiting</span>
            )}
          </div>
        </div>
        
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-auto">
          <div className="flex gap-3 text-white text-xs">
            <span>🌲 {w.trees}</span>
            <span>🌸 {w.flowers}</span>
            <span>🏛️ {w.tower}</span>
            <span>🌉 {w.bridge}</span>
          </div>
        </div>
      </div>
      
      {/* PLACEMENT MODE INVENTORY */}
      {placementMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-yellow-500/30">
          <div className="text-yellow-400 text-xs font-bold mb-2 text-center">🔨 PLACEMENT MODE</div>
          <div className="flex gap-2">
            {inventoryItems.map((item) => (
              <button
                key={item.type}
                onClick={() => setSelectedItem(item.type === selectedItem ? null : item.type)}
                className={`
                  px-3 py-2 rounded-lg text-sm transition-all
                  ${selectedItem === item.type 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                  }
                `}
              >
                {item.type === 'tree' && '🌲'}
                {item.type === 'flower' && '🌸'}
                {item.type === 'tower' && '🏛️'}
                {item.type === 'crystal' && '💎'}
                <span className="ml-1 font-bold">{item.count}</span>
              </button>
            ))}
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-center">
            Click anywhere on island to place • Press P to exit
          </div>
        </div>
      )}
      
      {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
        <div className={`
          bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/80 
          transition-opacity duration-500
          ${showControls || placementMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}>
          <div className="flex items-center gap-3">
            <span>WASD Move</span>
            <span>E Interact</span>
            <span className={placementMode ? 'text-yellow-400 font-bold' : ''}>P Place</span>
            <span>B Brainstorm</span>
          </div>
        </div>
        
        <button 
          onClick={() => setMuted(sound.toggle())}
          className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white hover:bg-black/90 transition-colors"
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
      
      {/* SECRETS DISCOVERED */}
      {discoveredSecrets.length > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-purple-900/80 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-purple-200">
          🔮 {discoveredSecrets.length} secret{discoveredSecrets.length > 1 ? 's' : ''} discovered
        </div>
      )}
    </div>
  )
}
