'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Module-level mutable ref — bridges the window scroll listener → useFrame
const progress = { value: 0 }

// ─── Background ───────────────────────────────────────────────────────────────

function SceneBackground() {
  const { scene } = useThree()
  useMemo(() => { scene.background = new THREE.Color('#0d1f2e') }, [scene])
  return null
}

// ─── Cornea ───────────────────────────────────────────────────────────────────

function Cornea() {
  return (
    <mesh position={[0, 0, 0.06]}>
      <sphereGeometry args={[1.08, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
      <meshStandardMaterial color="#c8ecf8" transparent opacity={0.2} roughness={0.02} metalness={0.1} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ─── Sclera ───────────────────────────────────────────────────────────────────

function Sclera() {
  return (
    <mesh>
      <sphereGeometry args={[1.0, 64, 64]} />
      <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.05} />
    </mesh>
  )
}

// ─── Iris ─────────────────────────────────────────────────────────────────────

function Iris() {
  const pupilRef = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    if (!pupilRef.current) return
    pupilRef.current.scale.setScalar(1 + progress.value * 1.0)
  })

  const irisMap = useMemo(() => {
    const sz = 512
    const c = document.createElement('canvas')
    c.width = sz; c.height = sz
    const ctx = c.getContext('2d')!
    const cx = sz / 2, cy = sz / 2, r = sz / 2

    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    bg.addColorStop(0, '#5ab4d4')
    bg.addColorStop(0.5, '#2a7a9c')
    bg.addColorStop(1, '#0d2a3a')
    ctx.fillStyle = bg
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()

    for (let i = 0; i < 200; i++) {
      const a = (i / 200) * Math.PI * 2
      const g = ctx.createLinearGradient(
        cx + Math.cos(a) * 32, cy + Math.sin(a) * 32,
        cx + Math.cos(a) * r, cy + Math.sin(a) * r,
      )
      g.addColorStop(0, 'rgba(112,177,196,0.4)')
      g.addColorStop(1, 'rgba(0,20,40,0.1)')
      ctx.strokeStyle = g; ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32)
      ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92)
      ctx.stroke()
    }

    const rim = ctx.createRadialGradient(cx, cy, r * 0.78, cx, cy, r)
    rim.addColorStop(0, 'transparent')
    rim.addColorStop(1, 'rgba(5,15,25,0.9)')
    ctx.fillStyle = rim
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()

    return new THREE.CanvasTexture(c)
  }, [])

  return (
    <group position={[0, 0, 0.97]}>
      <mesh>
        <circleGeometry args={[0.47, 128]} />
        <meshStandardMaterial map={irisMap} roughness={0.25} metalness={0.08} />
      </mesh>
      <mesh ref={pupilRef} position={[0, 0, 0.001]}>
        <circleGeometry args={[0.18, 64]} />
        <meshStandardMaterial color="#040608" roughness={1} />
      </mesh>
    </group>
  )
}

// ─── Lens ─────────────────────────────────────────────────────────────────────

function Lens() {
  return (
    <mesh position={[0, 0, 0.45]}>
      <sphereGeometry args={[0.36, 32, 32]} />
      <meshStandardMaterial color="#cce8f5" transparent opacity={0.25} roughness={0} metalness={0.05} />
    </mesh>
  )
}

// ─── Retina ───────────────────────────────────────────────────────────────────

function Retina() {
  const map = useMemo(() => {
    const sz = 512
    const c = document.createElement('canvas')
    c.width = sz; c.height = sz
    const ctx = c.getContext('2d')!
    const cx = sz / 2, cy = sz / 2

    ctx.fillStyle = '#6b1010'
    ctx.beginPath(); ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2); ctx.fill()

    const fov = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz * 0.12)
    fov.addColorStop(0, 'rgba(255,180,80,0.7)')
    fov.addColorStop(1, 'transparent')
    ctx.fillStyle = fov
    ctx.beginPath(); ctx.arc(cx, cy, sz * 0.12, 0, Math.PI * 2); ctx.fill()

    const vessel = (x: number, y: number, a: number, len: number, d: number, w: number) => {
      if (d <= 0 || len < 6) return
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len
      ctx.strokeStyle = `rgba(210,60,60,${0.5 + d * 0.08})`; ctx.lineWidth = w
      ctx.beginPath(); ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + Math.cos(a + 0.25) * len * 0.55, y + Math.sin(a + 0.25) * len * 0.55, ex, ey)
      ctx.stroke()
      vessel(ex, ey, a - 0.38, len * 0.68, d - 1, w * 0.7)
      vessel(ex, ey, a + 0.45, len * 0.6, d - 1, w * 0.7)
    }
    for (let i = 0; i < 7; i++) vessel(cx, cy, (i / 7) * Math.PI * 2, 90, 5, 2.8)

    return new THREE.CanvasTexture(c)
  }, [])

  return (
    <mesh>
      <sphereGeometry args={[0.88, 64, 64]} />
      <meshStandardMaterial map={map} side={THREE.BackSide} roughness={0.85} emissive={new THREE.Color('#3a0808')} emissiveIntensity={0.4} />
    </mesh>
  )
}

// ─── Eye + camera controller ──────────────────────────────────────────────────

function Eye() {
  const groupRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()

  useFrame((_s, delta) => {
    const raw = progress.value

    const kf: [number, number, number][] = [
      [0,    4.5,  0],
      [0.2,  2.2,  0],
      [0.4,  1.1,  0],
      [0.6,  0.2,  0],
      [0.85, -1.3, 0.15],
      [1.0,  3.5,  0],
    ]

    let targetZ = 4.5, targetY = 0
    for (let i = 0; i < kf.length - 1; i++) {
      const [s0, z0, y0] = kf[i], [s1, z1, y1] = kf[i + 1]
      if (raw >= s0 && raw <= s1) {
        const t = (raw - s0) / (s1 - s0)
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        targetZ = z0 + (z1 - z0) * ease
        targetY = y0 + (y1 - y0) * ease
        break
      }
    }

    camera.position.z += (targetZ - camera.position.z) * 0.055
    camera.position.y += (targetY - camera.position.y) * 0.055
    camera.lookAt(0, 0, 0)

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * Math.max(0, 1 - raw * 8) * 0.18
    }
  })

  return (
    <group ref={groupRef}>
      <Retina />
      <Lens />
      <Iris />
      <Sclera />
      <Cornea />
    </group>
  )
}

// ─── Section text labels ──────────────────────────────────────────────────────

const SECTIONS = [
  { title: 'VisionCare', sub: 'La plateforme médicale la plus avancée pour votre cabinet.' },
  { title: 'Cornée — Précision', sub: 'Chaque donnée patient analysée avec une précision clinique absolue.' },
  { title: 'Iris — Intelligence', sub: 'Votre flux de patients géré en temps réel, sans effort.' },
  { title: 'Cristallin — Clarté', sub: 'Des dossiers médicaux limpides, accessibles en un clic.' },
  { title: 'Rétine — Profondeur', sub: 'Analyses, tableaux de bord et historiques complets.' },
]

// ─── Root export ──────────────────────────────────────────────────────────────

export default function EyeScene() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const scrolled = window.scrollY - el.offsetTop
      const totalH = el.offsetHeight - window.innerHeight
      const p = Math.max(0, Math.min(1, scrolled / totalH))
      progress.value = p
      setActiveSection(Math.min(SECTIONS.length - 1, Math.floor(p * SECTIONS.length)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={sectionRef} style={{ height: '500vh', position: 'relative' }}>
      {/* Sticky canvas viewport */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%' }}>
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 44 }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%' }}
        >
          <SceneBackground />
          <ambientLight intensity={1.2} />
          <directionalLight position={[0, 0, 6]} intensity={4} color="#ffffff" />
          <pointLight position={[4, 3, 5]} intensity={3} color="#ffffff" />
          <pointLight position={[-3, 2, 4]} intensity={2} color="#b8d8e8" />
          <pointLight position={[0, 0, -3]} intensity={1.5} color="#ff6030" />
          <Eye />
        </Canvas>

        {/* Section labels overlaid on canvas, right-aligned */}
        <div
          style={{
            position: 'absolute',
            top: 0, right: 0,
            width: '42%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '6vw',
            pointerEvents: 'none',
          }}
        >
          {SECTIONS.map((sec, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                textAlign: 'right',
                maxWidth: 380,
                right: '6vw',
                opacity: activeSection === i ? 1 : 0,
                transform: activeSection === i ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.55s ease, transform 0.55s ease',
              }}
            >
              <h2 style={{ fontSize: 'clamp(1.3rem,2.8vw,2.1rem)', fontWeight: 700, color: '#fff', textShadow: '0 2px 24px rgba(0,0,0,0.85)', marginBottom: '0.55rem', lineHeight: 1.25 }}>
                {sec.title}
              </h2>
              <p style={{ fontSize: 'clamp(0.82rem,1.35vw,1rem)', color: 'rgba(255,255,255,0.62)', textShadow: '0 1px 12px rgba(0,0,0,0.7)', lineHeight: 1.65 }}>
                {sec.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Scroll indicator — fades after first scroll */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: activeSection === 0 ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Défiler
          </div>
          <div style={{
            width: 1,
            height: 36,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
            margin: '0 auto',
            animation: 'pulse-line 1.8s ease-in-out infinite',
          }} />
          <style>{`@keyframes pulse-line { 0%,100%{opacity:.3} 50%{opacity:.9} }`}</style>
        </div>
      </div>
    </div>
  )
}
