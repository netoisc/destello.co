/// <reference types="@react-three/fiber" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshStandardMaterial: any
      ambientLight: any
      pointLight: any
      directionalLight: any
      spotLight: any
      group: any
      primitive: any
      mesh: any
      sphereGeometry: any
      points: any
      pointMaterial: any
    }
  }
}

export {}
