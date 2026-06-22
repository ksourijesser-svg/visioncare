'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Global scroll state (mutated by listener, read in useFrame) ──────────────
const S = { p: 0 }

// ─── Easing ───────────────────────────────────────────────────────────────────
function ease(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }
function remap(v: number, a: number, b: number, c: number, d: number) {
  return c + ease(Math.max(0, Math.min(1, (v - a) / (b - a)))) * (d - c)
}

// ─── Scene background ─────────────────────────────────────────────────────────
function SceneBg() {
  const { scene } = useThree()
  useMemo(() => { scene.background = new THREE.Color('#05090f') }, [scene])
  return null
}

// ─── Star field ───────────────────────────────────────────────────────────────
function Stars() {
  const geo = useMemo(() => {
    const n = 2200, pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 14 + Math.random() * 22
      const θ = Math.random() * Math.PI * 2
      const φ = Math.acos(2 * Math.random() - 1)
      pos[i * 3]     = r * Math.sin(φ) * Math.cos(θ)
      pos[i * 3 + 1] = r * Math.sin(φ) * Math.sin(θ)
      pos[i * 3 + 2] = r * Math.cos(φ)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.055} color="#ccdcf8" transparent opacity={0.75} sizeAttenuation />
    </points>
  )
}

// ─── Sclera texture (cream + blood vessels) ───────────────────────────────────
function useScleraTexture() {
  return useMemo(() => {
    const sz = 1024
    const c = document.createElement('canvas')
    c.width = sz; c.height = sz
    const ctx = c.getContext('2d')!
    const cx = sz / 2, cy = sz / 2

    // base cream/pink
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz * 0.65)
    bg.addColorStop(0,   '#fceee6')
    bg.addColorStop(0.5, '#f5e2d2')
    bg.addColorStop(1,   '#eecfba')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, sz, sz)

    // blood vessels from edges inward
    const vessel = (x: number, y: number, a: number, len: number, d: number, w: number) => {
      if (d <= 0 || len < 7) return
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len
      ctx.strokeStyle = `rgba(155,45,45,${0.3 + d * 0.06})`
      ctx.lineWidth = w
      ctx.beginPath(); ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + Math.cos(a+0.4)*len*0.55, y + Math.sin(a+0.4)*len*0.55, ex, ey)
      ctx.stroke()
      vessel(ex, ey, a-0.35, len*0.72, d-1, w*0.72)
      vessel(ex, ey, a+0.42, len*0.64, d-1, w*0.72)
    }
    for (let i = 0; i < 9; i++) {
      const a  = (i / 9) * Math.PI * 2
      const sr = sz * 0.44 + Math.random() * sz * 0.05
      vessel(cx + Math.cos(a) * sr, cy + Math.sin(a) * sr, a + Math.PI + (Math.random()-0.5)*0.7, 90, 5, 2.8)
    }
    return new THREE.CanvasTexture(c)
  }, [])
}

// ─── Iris texture (blue-gray + amber inner ring) ──────────────────────────────
function useIrisTexture() {
  return useMemo(() => {
    const sz = 512
    const c = document.createElement('canvas')
    c.width = sz; c.height = sz
    const ctx = c.getContext('2d')!
    const cx = sz / 2, cy = sz / 2, r = sz / 2

    // blue-gray base
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    bg.addColorStop(0,    '#505a6a')
    bg.addColorStop(0.2,  '#7090a8')
    bg.addColorStop(0.55, '#5878a0')
    bg.addColorStop(0.85, '#3a5880')
    bg.addColorStop(1,    '#1c2a40')
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill()

    // amber inner ring
    const amberR = r * 0.38
    const amber = ctx.createRadialGradient(cx, cy, amberR*0.25, cx, cy, amberR)
    amber.addColorStop(0,   'rgba(150,80,15,0.95)')
    amber.addColorStop(0.5, 'rgba(110,65,12,0.8)')
    amber.addColorStop(1,   'rgba(60,30,8,0)')
    ctx.fillStyle = amber; ctx.beginPath(); ctx.arc(cx, cy, amberR, 0, Math.PI*2); ctx.fill()

    // radial fibres
    for (let i = 0; i < 260; i++) {
      const a = (i / 260) * Math.PI * 2
      const s = r * 0.3, e = r * 0.91
      const g = ctx.createLinearGradient(cx+Math.cos(a)*s, cy+Math.sin(a)*s, cx+Math.cos(a)*e, cy+Math.sin(a)*e)
      g.addColorStop(0, 'rgba(240,200,150,0.22)')
      g.addColorStop(0.5,'rgba(170,210,235,0.28)')
      g.addColorStop(1,  'rgba(30,55,90,0.08)')
      ctx.strokeStyle = g; ctx.lineWidth = 0.55
      ctx.beginPath()
      ctx.moveTo(cx+Math.cos(a)*s, cy+Math.sin(a)*s)
      ctx.lineTo(cx+Math.cos(a)*e, cy+Math.sin(a)*e)
      ctx.stroke()
    }

    // specular shimmer
    const spec = ctx.createRadialGradient(cx-r*0.15, cy-r*0.15, 0, cx-r*0.15, cy-r*0.15, r*0.3)
    spec.addColorStop(0, 'rgba(255,255,255,0.12)')
    spec.addColorStop(1, 'transparent')
    ctx.fillStyle = spec; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill()

    // limbal ring
    const rim = ctx.createRadialGradient(cx, cy, r*0.8, cx, cy, r)
    rim.addColorStop(0, 'transparent')
    rim.addColorStop(1, 'rgba(4,8,18,0.97)')
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill()

    return new THREE.CanvasTexture(c)
  }, [])
}

// ─── Retina texture ───────────────────────────────────────────────────────────
function useRetinaTexture() {
  return useMemo(() => {
    const sz = 1024
    const c = document.createElement('canvas')
    c.width = sz; c.height = sz
    const ctx = c.getContext('2d')!
    const cx = sz/2, cy = sz/2

    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz/2)
    bg.addColorStop(0,   '#8b3010')
    bg.addColorStop(0.5, '#6a2008')
    bg.addColorStop(1,   '#3a1005')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, sz, sz)

    // fovea
    const fov = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz*0.1)
    fov.addColorStop(0, 'rgba(255,180,70,0.85)')
    fov.addColorStop(1, 'transparent')
    ctx.fillStyle = fov; ctx.beginPath(); ctx.arc(cx, cy, sz*0.1, 0, Math.PI*2); ctx.fill()

    const v = (x: number, y: number, a: number, l: number, d: number, w: number) => {
      if (d<=0||l<5) return
      const ex=x+Math.cos(a)*l, ey=y+Math.sin(a)*l
      ctx.strokeStyle=`rgba(200,55,55,${0.45+d*0.07})`; ctx.lineWidth=w
      ctx.beginPath(); ctx.moveTo(x,y)
      ctx.quadraticCurveTo(x+Math.cos(a+0.3)*l*0.5, y+Math.sin(a+0.3)*l*0.5, ex, ey)
      ctx.stroke()
      v(ex,ey,a-0.38,l*0.7,d-1,w*0.7); v(ex,ey,a+0.45,l*0.62,d-1,w*0.7)
    }
    for (let i=0;i<8;i++) v(cx, cy, (i/8)*Math.PI*2, 100, 5, 3)

    return new THREE.CanvasTexture(c)
  }, [])
}

// ─── 4 Sclera wedges ─────────────────────────────────────────────────────────

const WEDGE_EXPLODE = [
  new THREE.Vector3( 1, -0.4,  1),
  new THREE.Vector3(-1, -0.4,  1),
  new THREE.Vector3(-1, -0.4, -1),
  new THREE.Vector3( 1, -0.4, -1),
]

function ScleraWedge({ idx, tex }: { idx: number; tex: THREE.Texture }) {
  const ref = useRef<THREE.Mesh>(null!)
  const dir = useMemo(() => WEDGE_EXPLODE[idx].clone().normalize(), [idx])
  const phiStart = (idx / 4) * Math.PI * 2

  useFrame(() => {
    const t = remap(S.p, 0.2, 0.52, 0, 1)
    ref.current.position.set(dir.x * t * 1.5, dir.y * t, dir.z * t * 1.5)
    ref.current.rotation.x = dir.z  * t * 0.45
    ref.current.rotation.z = dir.x  * t * -0.35
  })

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[1.0, 48, 48, phiStart, Math.PI / 2, 0, Math.PI]} />
      <meshStandardMaterial map={tex} roughness={0.28} metalness={0.06} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ─── Cornea dome ──────────────────────────────────────────────────────────────

function Cornea() {
  const ref = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)

  useFrame(() => {
    const t = remap(S.p, 0.12, 0.38, 0, 1)
    ref.current.position.y = 0.88 + t * 2.2
    ref.current.position.z = 0.28 + t * 0.6
    ref.current.rotation.x = t * -0.7
    if (mat.current) mat.current.opacity = 0.5 - t * 0.25
  })

  return (
    <mesh ref={ref} position={[0, 0.88, 0.28]}>
      <sphereGeometry args={[0.52, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.44]} />
      <meshStandardMaterial
        ref={mat}
        color="#d5eeff"
        transparent
        opacity={0.5}
        roughness={0.0}
        metalness={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── Iris + pupil ─────────────────────────────────────────────────────────────

function IrisPupil({ tex }: { tex: THREE.Texture }) {
  const pupilRef = useRef<THREE.Mesh>(null!)
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    const dilate = remap(S.p, 0.38, 0.68, 1, 2.6)
    if (pupilRef.current) pupilRef.current.scale.setScalar(dilate)
    if (groupRef.current) {
      groupRef.current.visible = S.p < 0.78
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 1.01]}>
      <mesh>
        <circleGeometry args={[0.47, 128]} />
        <meshStandardMaterial
          map={tex}
          roughness={0.08}
          metalness={0.18}
          emissive="#091420"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh ref={pupilRef} position={[0, 0, 0.001]}>
        <circleGeometry args={[0.155, 64]} />
        <meshStandardMaterial color="#020406" roughness={1} />
      </mesh>
      {/* specular highlight */}
      <mesh position={[-0.08, 0.1, 0.002]}>
        <circleGeometry args={[0.04, 32]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0} />
      </mesh>
    </group>
  )
}

// ─── Crystalline lens ─────────────────────────────────────────────────────────

function CrystallineLens() {
  const mat = useRef<THREE.MeshStandardMaterial>(null!)

  useFrame(() => {
    if (mat.current) mat.current.opacity = remap(S.p, 0.48, 0.68, 0, 0.65)
  })

  return (
    <mesh position={[0, 0, 0.52]}>
      <sphereGeometry args={[0.26, 32, 32]} />
      <meshStandardMaterial
        ref={mat}
        color="#b8daf5"
        transparent
        opacity={0}
        roughness={0.0}
        metalness={0.1}
      />
    </mesh>
  )
}

// ─── Retina sphere (visible from inside) ─────────────────────────────────────

function Retina({ tex }: { tex: THREE.Texture }) {
  return (
    <mesh>
      <sphereGeometry args={[0.9, 64, 64]} />
      <meshStandardMaterial
        map={tex}
        side={THREE.BackSide}
        roughness={0.88}
        emissive={new THREE.Color('#380a05')}
        emissiveIntensity={0.45}
      />
    </mesh>
  )
}

// ─── Camera controller ────────────────────────────────────────────────────────

function CameraRig() {
  const { camera } = useThree()

  useFrame(() => {
    const kf: [number, number, number][] = [
      [0,    4.6, 0   ],
      [0.12, 3.8, 0   ],
      [0.3,  2.8, 0   ],
      [0.48, 1.3, 0   ],
      [0.62, 0.55, 0  ],
      [0.75, -0.1, 0.06],
      [0.88, -0.9, 0.1 ],
      [1.0,  4.0,  0  ],
    ]

    let tZ = 4.6, tY = 0
    for (let i = 0; i < kf.length - 1; i++) {
      const [s0, z0, y0] = kf[i], [s1, z1, y1] = kf[i + 1]
      if (S.p >= s0 && S.p <= s1) {
        const t = ease((S.p - s0) / (s1 - s0))
        tZ = z0 + (z1 - z0) * t
        tY = y0 + (y1 - y0) * t
        break
      }
    }

    camera.position.z += (tZ - camera.position.z) * 0.055
    camera.position.y += (tY - camera.position.y) * 0.055
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ─── Full eye assembly ────────────────────────────────────────────────────────

function Eye() {
  const scleraTex  = useScleraTexture()
  const irisTex    = useIrisTexture()
  const retinaTex  = useRetinaTexture()
  const floatRef   = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (!floatRef.current) return
    const idle = Math.max(0, 1 - S.p * 8)
    floatRef.current.position.y = Math.sin(Date.now() * 0.0007) * 0.035 * idle
  })

  return (
    <group ref={floatRef}>
      <Retina tex={retinaTex} />
      <CrystallineLens />
      {[0, 1, 2, 3].map(i => <ScleraWedge key={i} idx={i} tex={scleraTex} />)}
      <IrisPupil tex={irisTex} />
      <Cornea />
    </group>
  )
}

// ─── Annotation labels ────────────────────────────────────────────────────────

const ANNOTATIONS = [
  { range: [0.12, 0.32] as [number,number], name: 'Cornée',     sub: 'Protège et focalise la lumière',      x: '61%', y: '14%' },
  { range: [0.32, 0.52] as [number,number], name: 'Iris',       sub: "Contrôle l'entrée de lumière",        x: '64%', y: '44%' },
  { range: [0.52, 0.72] as [number,number], name: 'Cristallin', sub: 'Focalise l\'image sur la rétine',     x: '60%', y: '40%' },
  { range: [0.72, 0.92] as [number,number], name: 'Rétine',     sub: 'Convertit la lumière en signaux nerveux', x: '58%', y: '36%' },
]

// ─── Root export ─────────────────────────────────────────────────────────────

export default function EyeScene() {
  const [p, setP] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      const prog = Math.max(0, Math.min(1, window.scrollY / max))
      S.p = prog
      setP(prog)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const active = ANNOTATIONS.findIndex(a => p >= a.range[0] && p < a.range[1])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      {/* Three.js canvas */}
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 44 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <SceneBg />
        <Stars />

        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 4, 6]} intensity={3.5} color="#ffffff" />
        <pointLight position={[-3, 2, 4]} intensity={2} color="#5080c0" />
        <pointLight position={[0, -2, -3]} intensity={1.5} color="#c04010" />
        <pointLight position={[3, -1, 2]} intensity={1} color="#ffffff" />

        <CameraRig />
        <Eye />
      </Canvas>

      {/* Anatomical annotations */}
      {ANNOTATIONS.map((a, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: a.x, top: a.y,
            opacity:   active === i ? 1 : 0,
            transform: active === i ? 'translateY(0px)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#70B1C4', boxShadow: '0 0 8px #70B1C4' }} />
            <div style={{ width: 44, height: 1, background: 'rgba(255,255,255,0.35)' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>
                {a.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
                {a.sub}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Scroll hint — only at top */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        opacity: p < 0.04 ? 1 : 0, transition: 'opacity 0.4s',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Défiler</span>
        <div style={{ width: 1, height: 32, background: 'linear-gradient(#70B1C4, transparent)', margin: '8px auto 0', animation: 'blink 1.8s infinite' }} />
        <style>{`@keyframes blink{0%,100%{opacity:.25}50%{opacity:1}}`}</style>
      </div>
    </div>
  )
}
