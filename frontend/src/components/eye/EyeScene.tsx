'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useScroll, ScrollControls, Scroll, MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

// ─── Geometry helpers ────────────────────────────────────────────────────────

function Cornea() {
  return (
    <mesh position={[0, 0, 1.02]}>
      <sphereGeometry args={[1.08, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
      <MeshTransmissionMaterial
        backside
        samples={4}
        thickness={0.15}
        roughness={0.02}
        transmission={0.98}
        ior={1.376}
        chromaticAberration={0.04}
        color="#c8e8f0"
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}

function Sclera() {
  return (
    <mesh>
      <sphereGeometry args={[1.0, 64, 64]} />
      <meshStandardMaterial color="#f5f0eb" roughness={0.6} metalness={0} />
    </mesh>
  )
}

function Iris({ scroll }: { scroll: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Mesh>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    // pupil dilates based on scroll velocity
    const s = scroll.current
    const pupilScale = 0.18 + s * 0.12
    if (innerRef.current) innerRef.current.scale.setScalar(pupilScale / 0.18)
  })

  const irisTexture = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const cx = size / 2, cy = size / 2

    // base colour
    ctx.fillStyle = '#2d6a8a'
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // radial fibres
    for (let i = 0; i < 180; i++) {
      const angle = (i / 180) * Math.PI * 2
      const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * size / 2, cy + Math.sin(angle) * size / 2)
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.3, 'rgba(112,177,196,0.3)')
      grad.addColorStop(1, 'rgba(20,60,90,0.5)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * 30, cy + Math.sin(angle) * 30)
      ctx.lineTo(cx + Math.cos(angle) * size / 2, cy + Math.sin(angle) * size / 2)
      ctx.stroke()
    }

    // limbal ring
    const ring = ctx.createRadialGradient(cx, cy, size * 0.4, cx, cy, size / 2)
    ring.addColorStop(0, 'transparent')
    ring.addColorStop(1, 'rgba(10,30,50,0.8)')
    ctx.fillStyle = ring
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
    ctx.fill()

    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <group position={[0, 0, 0.96]}>
      {/* iris disc */}
      <mesh ref={ref}>
        <circleGeometry args={[0.48, 128]} />
        <meshStandardMaterial map={irisTexture} roughness={0.3} metalness={0.1} />
      </mesh>
      {/* pupil */}
      <mesh ref={innerRef} position={[0, 0, 0.001]}>
        <circleGeometry args={[0.18, 64]} />
        <meshStandardMaterial color="#050a0e" roughness={1} />
      </mesh>
    </group>
  )
}

function Lens() {
  return (
    <mesh position={[0, 0, 0.5]}>
      <sphereGeometry args={[0.38, 32, 32]} />
      <meshStandardMaterial
        color="#d4eef8"
        transparent
        opacity={0.35}
        roughness={0.0}
        metalness={0.05}
      />
    </mesh>
  )
}

function Vitreous() {
  return (
    <mesh>
      <sphereGeometry args={[0.92, 32, 32]} />
      <meshStandardMaterial
        color="#e8f4fa"
        transparent
        opacity={0.08}
        roughness={0}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

function Retina() {
  // procedural retina texture with blood vessels
  const texture = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const cx = size / 2, cy = size / 2

    ctx.fillStyle = '#8b1a1a'
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // radial gradient to simulate fovea
    const fovea = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.15)
    fovea.addColorStop(0, 'rgba(255,200,100,0.6)')
    fovea.addColorStop(1, 'transparent')
    ctx.fillStyle = fovea
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2)
    ctx.fill()

    // blood vessels
    ctx.strokeStyle = 'rgba(200,80,80,0.9)'
    ctx.lineWidth = 1.5
    const drawVessel = (x: number, y: number, angle: number, length: number, depth: number) => {
      if (depth <= 0 || length < 8) return
      const ex = x + Math.cos(angle) * length
      const ey = y + Math.sin(angle) * length
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(
        x + Math.cos(angle + 0.3) * length * 0.5,
        y + Math.sin(angle + 0.3) * length * 0.5,
        ex, ey
      )
      ctx.stroke()
      ctx.lineWidth *= 0.75
      drawVessel(ex, ey, angle - 0.4, length * 0.65, depth - 1)
      drawVessel(ex, ey, angle + 0.5, length * 0.55, depth - 1)
    }

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.lineWidth = 2.5
      ctx.strokeStyle = `rgba(220,${60 + i * 10},60,0.85)`
      drawVessel(cx, cy, a, 80, 4)
    }

    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <mesh>
      <sphereGeometry args={[0.89, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.BackSide}
        roughness={0.8}
        emissive="#300505"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

// ─── Light rays (refraction metaphor) ────────────────────────────────────────

function LightRays({ visible }: { visible: boolean }) {
  const rays = useMemo(() => Array.from({ length: 7 }, (_, i) => i), [])
  return (
    <group visible={visible}>
      {rays.map((i) => {
        const angle = (i / 7) * Math.PI * 2
        const r = 0.3
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r * 0.3, Math.sin(angle) * r * 0.3, 0.6]}
            rotation={[Math.PI / 2, 0, angle]}
          >
            <cylinderGeometry args={[0.003, 0.003, 1.2, 8]} />
            <meshStandardMaterial
              color="#a8e0ff"
              emissive="#70B1C4"
              emissiveIntensity={2}
              transparent
              opacity={0.5}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── Main animated eye ───────────────────────────────────────────────────────

function Eye() {
  const { scroll } = useScroll()
  const groupRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  const scrollRef = useRef(0)

  useFrame((_state, delta) => {
    const s = scroll.offset   // 0 → 1

    // smooth scroll ref for pupil
    scrollRef.current += (s - scrollRef.current) * 0.08

    // ── camera journey ──────────────────────────────────────────────────────
    // s=0 : outside, looking at full eye  [z=4.5]
    // s=0.2: push in, cornea transparent  [z=2.2]
    // s=0.4: iris level                   [z=1.2]
    // s=0.6: through lens                 [z=0.3]
    // s=0.85: retina                      [z=-1.2]
    // s=1.0: pull back out                [z=3.5]

    let targetZ: number
    let targetY = 0

    if (s < 0.2) {
      targetZ = 4.5 - s * 5 * (4.5 - 2.2) / 1
      targetZ = 4.5 + (2.2 - 4.5) * (s / 0.2)
    } else if (s < 0.4) {
      const t = (s - 0.2) / 0.2
      targetZ = 2.2 + (1.2 - 2.2) * t
    } else if (s < 0.6) {
      const t = (s - 0.4) / 0.2
      targetZ = 1.2 + (0.3 - 1.2) * t
    } else if (s < 0.85) {
      const t = (s - 0.6) / 0.25
      targetZ = 0.3 + (-1.2 - 0.3) * t
      targetY = t * 0.2
    } else {
      const t = (s - 0.85) / 0.15
      targetZ = -1.2 + (3.5 - (-1.2)) * t
      targetY = (1 - t) * 0.2
    }

    camera.position.z += (targetZ - camera.position.z) * 0.06
    camera.position.y += (targetY - camera.position.y) * 0.06
    camera.lookAt(0, 0, 0)

    // slow idle rotation when near start
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15 * Math.max(0, 1 - s * 6)
    }
  })

  const s = typeof window !== 'undefined' ? 0 : 0

  return (
    <group ref={groupRef}>
      <Retina />
      <Vitreous />
      <Lens />
      <Iris scroll={scrollRef} />
      <Sclera />
      <Cornea />
      <LightRays visible={false} />
    </group>
  )
}

// ─── Section text overlay (HTML in Scroll) ───────────────────────────────────

function SectionLabels() {
  const sections = [
    {
      offset: '0vh',
      title: 'Bienvenue dans VisionCare',
      sub: 'Une plateforme médicale pensée pour les ophtalmologistes.',
    },
    {
      offset: '100vh',
      title: 'Cornée — Précision diagnostique',
      sub: 'Chaque couche analysée avec une précision au micromètre.',
    },
    {
      offset: '200vh',
      title: 'Iris — Intelligence adaptative',
      sub: "Votre cabinet s'adapte à votre flux de patients en temps réel.",
    },
    {
      offset: '300vh',
      title: 'Cristallin — Clarté absolue',
      sub: 'Des données médicales limpides, toujours accessibles.',
    },
    {
      offset: '400vh',
      title: 'Rétine — Au cœur de votre activité',
      sub: 'Tableaux de bord, historiques et analyses profonds.',
    },
  ]

  return (
    <Scroll html>
      {sections.map((sec, i) => (
        <div
          key={i}
          style={{ top: sec.offset }}
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
          style2={{ height: '100vh', top: sec.offset }}
        >
          <div
            className="text-center px-8"
            style={{ marginTop: i === 0 ? '38vh' : '40vh' }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-3">
              {sec.title}
            </h2>
            <p className="text-white/70 text-lg max-w-md mx-auto drop-shadow">
              {sec.sub}
            </p>
          </div>
        </div>
      ))}
    </Scroll>
  )
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function EyeScene() {
  return (
    <div className="w-full" style={{ height: '500vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%' }}>
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: 'linear-gradient(135deg, #0f2d3d 0%, #1a4a5e 50%, #0a1f2e 100%)' }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[3, 3, 5]} intensity={2} color="#ffffff" />
          <pointLight position={[-2, -2, 3]} intensity={0.8} color="#70B1C4" />
          <pointLight position={[0, 0, -3]} intensity={1.2} color="#ff6030" />
          <Environment preset="studio" />

          <ScrollControls pages={5} damping={0.3}>
            <Eye />
            <SectionLabels />
          </ScrollControls>
        </Canvas>
      </div>
    </div>
  )
}
