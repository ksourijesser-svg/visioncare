'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Global scroll state ──────────────────────────────────────────────────────
const S = { p: 0 }

function ease(t: number) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t }
function remap(v: number, a: number, b: number, c: number, d: number) {
  return c + ease(Math.max(0, Math.min(1, (v-a)/(b-a)))) * (d-c)
}

// ─── Scene background (warm dark studio) ─────────────────────────────────────
function SceneBg() {
  const { scene } = useThree()
  useMemo(() => { scene.background = new THREE.Color('#080808') }, [scene])
  return null
}

// ─── Subtle background glow (simulates studio vignette) ──────────────────────
function StudioGlow() {
  return (
    <mesh position={[0, 0, -6]}>
      <planeGeometry args={[28, 18]} />
      <meshBasicMaterial color="#1a1008" transparent opacity={0.9} />
    </mesh>
  )
}

// ─── Sclera texture: cream/pink with blood vessels ────────────────────────────
function useScleraTexture() {
  return useMemo(() => {
    const sz = 1024
    const c = document.createElement('canvas')
    c.width = sz; c.height = sz
    const ctx = c.getContext('2d')!
    const cx = sz/2, cy = sz/2

    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz*0.65)
    bg.addColorStop(0,   '#fdf0e8')
    bg.addColorStop(0.45,'#f5e2d0')
    bg.addColorStop(1,   '#eacfb8')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, sz, sz)

    const vessel = (x: number, y: number, a: number, l: number, d: number, w: number) => {
      if (d<=0||l<7) return
      const ex=x+Math.cos(a)*l, ey=y+Math.sin(a)*l
      ctx.strokeStyle=`rgba(160,48,48,${0.28+d*0.055})`; ctx.lineWidth=w
      ctx.beginPath(); ctx.moveTo(x,y)
      ctx.quadraticCurveTo(x+Math.cos(a+0.38)*l*0.52, y+Math.sin(a+0.38)*l*0.52, ex, ey)
      ctx.stroke()
      vessel(ex,ey,a-0.34,l*0.73,d-1,w*0.73)
      vessel(ex,ey,a+0.41,l*0.65,d-1,w*0.73)
    }
    for (let i=0;i<9;i++) {
      const a=(i/9)*Math.PI*2
      const sr=sz*0.43+Math.random()*sz*0.06
      vessel(cx+Math.cos(a)*sr, cy+Math.sin(a)*sr, a+Math.PI+(Math.random()-.5)*0.75, 85, 5, 2.6)
    }
    return new THREE.CanvasTexture(c)
  }, [])
}

// ─── Iris texture: amber/gold (BrightSide reference) ─────────────────────────
function useIrisTexture() {
  return useMemo(() => {
    const sz = 512
    const c = document.createElement('canvas')
    c.width = sz; c.height = sz
    const ctx = c.getContext('2d')!
    const cx=sz/2, cy=sz/2, r=sz/2

    // deep amber base
    const bg = ctx.createRadialGradient(cx,cy,0,cx,cy,r)
    bg.addColorStop(0,   '#3a1a02')
    bg.addColorStop(0.18,'#7a3808')
    bg.addColorStop(0.45,'#c87020')
    bg.addColorStop(0.7, '#a05818')
    bg.addColorStop(0.9, '#6a3010')
    bg.addColorStop(1,   '#1a0802')
    ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill()

    // fire-like radial burst
    for (let i=0;i<280;i++) {
      const a=(i/280)*Math.PI*2
      const innerR=r*0.22, outerR=r*0.88+(Math.random()-0.5)*r*0.08
      const g=ctx.createLinearGradient(cx+Math.cos(a)*innerR,cy+Math.sin(a)*innerR,cx+Math.cos(a)*outerR,cy+Math.sin(a)*outerR)
      g.addColorStop(0,  'rgba(255,200,80,0.55)')
      g.addColorStop(0.3,'rgba(220,130,30,0.4)')
      g.addColorStop(0.7,'rgba(160,70,10,0.25)')
      g.addColorStop(1,  'rgba(60,20,0,0.08)')
      ctx.strokeStyle=g; ctx.lineWidth=0.7+(Math.random()*0.6)
      ctx.beginPath()
      ctx.moveTo(cx+Math.cos(a)*innerR, cy+Math.sin(a)*innerR)
      ctx.lineTo(cx+Math.cos(a)*outerR, cy+Math.sin(a)*outerR)
      ctx.stroke()
    }

    // inner golden ring
    const gld=ctx.createRadialGradient(cx,cy,r*0.18,cx,cy,r*0.38)
    gld.addColorStop(0,'rgba(255,210,80,0.85)')
    gld.addColorStop(1,'transparent')
    ctx.fillStyle=gld; ctx.beginPath(); ctx.arc(cx,cy,r*0.38,0,Math.PI*2); ctx.fill()

    // specular shimmer at 11 o'clock
    const spec=ctx.createRadialGradient(cx-r*0.18,cy-r*0.18,0,cx-r*0.18,cy-r*0.18,r*0.28)
    spec.addColorStop(0,'rgba(255,245,200,0.18)')
    spec.addColorStop(1,'transparent')
    ctx.fillStyle=spec; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill()

    // limbal ring
    const rim=ctx.createRadialGradient(cx,cy,r*0.82,cx,cy,r)
    rim.addColorStop(0,'transparent')
    rim.addColorStop(1,'rgba(4,2,0,0.97)')
    ctx.fillStyle=rim; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill()

    return new THREE.CanvasTexture(c)
  }, [])
}

// ─── Sclera ───────────────────────────────────────────────────────────────────
function Sclera({ tex }: { tex: THREE.Texture }) {
  return (
    <mesh>
      <sphereGeometry args={[1.0, 64, 64]} />
      <meshStandardMaterial map={tex} roughness={0.22} metalness={0.04} />
    </mesh>
  )
}

// ─── Iris + pupil ─────────────────────────────────────────────────────────────
function IrisPupil({ tex }: { tex: THREE.Texture }) {
  const pupilRef = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    // Pupil dilates as zoom deepens
    if (pupilRef.current) {
      pupilRef.current.scale.setScalar(remap(S.p, 0.4, 0.9, 1, 1.55))
    }
  })

  return (
    <group position={[0, 0, 1.008]}>
      <mesh>
        <circleGeometry args={[0.47, 128]} />
        <meshStandardMaterial
          map={tex}
          roughness={0.06}
          metalness={0.22}
          emissive="#3a1800"
          emissiveIntensity={0.45}
        />
      </mesh>
      <mesh ref={pupilRef} position={[0, 0, 0.001]}>
        <circleGeometry args={[0.155, 64]} />
        <meshStandardMaterial color="#030201" roughness={0.95} />
      </mesh>
      {/* Specular highlight */}
      <mesh position={[-0.09, 0.11, 0.003]}>
        <circleGeometry args={[0.038, 32]} />
        <meshStandardMaterial color="#fffdf0" transparent opacity={0.55} roughness={0} />
      </mesh>
    </group>
  )
}

// ─── Cornea (thin glass dome) ─────────────────────────────────────────────────
function Cornea() {
  return (
    <mesh position={[0, 0, 1.0]}>
      <sphereGeometry args={[0.5, 64, 32, 0, Math.PI*2, 0, Math.PI*0.42]} />
      <meshStandardMaterial
        color="#e8f4ff"
        transparent
        opacity={0.12}
        roughness={0}
        metalness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── Eyelids — flat semicircle discs that slide apart to reveal the iris ──────
function Eyelids() {
  const upperRef = useRef<THREE.Group>(null!)
  const lowerRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    const t = remap(S.p, 0.0, 0.38, 0, 1)
    if (upperRef.current) {
      upperRef.current.position.y = t * 0.64
      upperRef.current.rotation.x = -t * 0.28
    }
    if (lowerRef.current) {
      lowerRef.current.position.y = -t * 0.46
      lowerRef.current.rotation.x = t * 0.18
    }
  })

  const mat = (
    <meshStandardMaterial
      color="#d8c8b8"
      roughness={0.68}
      metalness={0.03}
      side={THREE.DoubleSide}
    />
  )

  return (
    <>
      {/* Upper lid: top semicircle, slides up */}
      <group ref={upperRef} position={[0, 0, 1.045]}>
        <mesh>
          <circleGeometry args={[0.52, 96, 0, Math.PI]} />
          {mat}
        </mesh>
        {/* Eyelash edge line */}
        <mesh position={[0, 0, 0.002]}>
          <ringGeometry args={[0.50, 0.52, 96, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#1a0f08" />
        </mesh>
      </group>

      {/* Lower lid: bottom semicircle, slides down */}
      <group ref={lowerRef} position={[0, 0, 1.045]}>
        <mesh>
          <circleGeometry args={[0.52, 96, Math.PI, Math.PI]} />
          {mat}
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <ringGeometry args={[0.50, 0.52, 96, 1, Math.PI, Math.PI]} />
          <meshBasicMaterial color="#1a0f08" />
        </mesh>
      </group>
    </>
  )
}

// ─── Camera zoom controller ───────────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree()

  useFrame(() => {
    // Zoom in only — never enters the eye
    const kf: [number, number][] = [
      [0,    7.0],
      [0.2,  5.5],
      [0.45, 3.6],
      [0.7,  2.2],
      [0.88, 1.6],
      [1.0,  1.45],
    ]

    let targetZ = 7.0
    for (let i=0; i<kf.length-1; i++) {
      const [s0,z0]=kf[i], [s1,z1]=kf[i+1]
      if (S.p>=s0 && S.p<=s1) {
        const t=ease((S.p-s0)/(s1-s0))
        targetZ=z0+(z1-z0)*t
        break
      }
    }

    camera.position.z += (targetZ - camera.position.z) * 0.05
    camera.position.x += (0 - camera.position.x) * 0.05
    camera.position.y += (0 - camera.position.y) * 0.05
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ─── Full eye assembly ────────────────────────────────────────────────────────
function Eye() {
  const scleraTex = useScleraTexture()
  const irisTex   = useIrisTexture()
  const lidTex    = useScleraTexture() // eyelids match sclera skin
  const floatRef  = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (!floatRef.current) return
    const idle = Math.max(0, 1 - S.p * 4)
    floatRef.current.position.y = Math.sin(Date.now()*0.0006)*0.025*idle
  })

  return (
    <group ref={floatRef}>
      <Sclera tex={scleraTex} />
      <IrisPupil tex={irisTex} />
      <Cornea />
      <UpperEyelid tex={lidTex} />
      <LowerEyelid tex={lidTex} />
    </group>
  )
}

// ─── Root export ─────────────────────────────────────────────────────────────
export default function EyeScene() {
  const [p, setP] = useState(0)

  useEffect(() => {
    const fn = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      S.p = Math.max(0, Math.min(1, window.scrollY / max))
      setP(S.p)
    }
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 7.0], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <SceneBg />
        <StudioGlow />

        {/* Warm key light from top-right */}
        <directionalLight position={[3, 4, 5]} intensity={3.8} color="#fff5e8" />
        {/* Cool rim from back-left */}
        <pointLight position={[-4, 2, -3]} intensity={2.2} color="#3060c0" />
        {/* Warm fill from below */}
        <pointLight position={[1, -3, 4]} intensity={1.2} color="#c07030" />
        {/* Ambient */}
        <ambientLight intensity={0.3} />

        <CameraRig />
        <Eye />
      </Canvas>

      {/* Scroll cue */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        opacity: p < 0.03 ? 1 : 0, transition: 'opacity 0.5s',
        textAlign: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Défiler</span>
        <div style={{ width: 1, height: 28, background: 'linear-gradient(#c07030, transparent)', margin: '6px auto 0', animation: 'blink 2s infinite' }} />
        <style>{`@keyframes blink{0%,100%{opacity:.2}50%{opacity:.9}}`}</style>
      </div>
    </div>
  )
}
