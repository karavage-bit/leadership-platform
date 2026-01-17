import { MeshBasicMaterialProps, MeshStandardMaterialProps, MeshPhysicalMaterialProps, MeshPhongMaterialProps, MeshLambertMaterialProps } from '@react-three/fiber'

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshBasicMaterial: MeshBasicMaterialProps & {
      color?: string | number | THREE.Color
      transparent?: boolean
      opacity?: number
    }
    meshStandardMaterial: MeshStandardMaterialProps & {
      color?: string | number | THREE.Color
      transparent?: boolean
      opacity?: number
      roughness?: number
      metalness?: number
      emissive?: string | number | THREE.Color
      emissiveIntensity?: number
    }
  }
}
