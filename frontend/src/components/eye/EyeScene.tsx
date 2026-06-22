'use client'

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Shared scroll state ─────────────────────────────────────────────────────
const S = { p: 0 }
function ease(t: number) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t }
function remap(v: number, a: number, b: number, c: number, d: number) {
  return c + ease(Math.max(0, Math.min(1, (v-a)/(b-a)))) * (d-c)
}

// ─── Dark studio background ─────────────────────────────────────────────────
function SceneBg() {
  const { scene } = useThree()
  useMemo(() => { scene.background = new THREE.Color('#09090a') }, [scene])
  return null
}

// ─── Sclera texture ──────────────────────────────────────────────────────────
function useScleraTexture() {
  return useMemo(() => {
    const sz = 512; const cv = document.createElement('canvas')
    cv.width = sz; cv.height = sz; const ctx = cv.getContext('2d')!
    const cx = sz/2, cy = sz/2
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz*0.65)
    bg.addColorStop(0, '#fdf0e8'); bg.addColorStop(0.45, '#f5e2d0'); bg.addColorStop(1, '#eacfb8')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, sz, sz)
    const vsl = (x: number, y: number, a: number, l: number, d: number, w: number) => {
      if (d<=0||l<5) return
      const ex=x+Math.cos(a)*l, ey=y+Math.sin(a)*l
      ctx.strokeStyle=`rgba(150,45,45,${0.26+d*0.05})`; ctx.lineWidth=w
      ctx.beginPath(); ctx.moveTo(x,y)
      ctx.quadraticCurveTo(x+Math.cos(a+0.4)*l*0.5,y+Math.sin(a+0.4)*l*0.5,ex,ey); ctx.stroke()
      vsl(ex,ey,a-0.35,l*0.72,d-1,w*0.72); vsl(ex,ey,a+0.42,l*0.64,d-1,w*0.72)
    }
    for (let i=0;i<7;i++) {
      const a=(i/7)*Math.PI*2
      vsl(cx+Math.cos(a)*(sz*0.42+Math.random()*sz*0.06), cy+Math.sin(a)*(sz*0.42+Math.random()*sz*0.06),
          a+Math.PI+(Math.random()-.5)*0.7, 58, 4, 2.1)
    }
    return new THREE.CanvasTexture(cv)
  }, [])
}

// ─── Iris texture (amber / gold fire) ────────────────────────────────────────
function useIrisTexture() {
  return useMemo(() => {
    const sz=512; const cv=document.createElement('canvas')
    cv.width=sz; cv.height=sz; const ctx=cv.getContext('2d')!
    const cx=sz/2,cy=sz/2,r=sz/2
    const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,r)
    bg.addColorStop(0,'#3a1a02'); bg.addColorStop(0.18,'#7a3808')
    bg.addColorStop(0.45,'#c87020'); bg.addColorStop(0.7,'#a05818')
    bg.addColorStop(0.9,'#6a3010'); bg.addColorStop(1,'#1a0802')
    ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill()
    for (let i=0;i<260;i++) {
      const a=(i/260)*Math.PI*2; const iR=r*0.22,oR=r*0.88+(Math.random()-0.5)*r*0.08
      const g=ctx.createLinearGradient(cx+Math.cos(a)*iR,cy+Math.sin(a)*iR,cx+Math.cos(a)*oR,cy+Math.sin(a)*oR)
      g.addColorStop(0,'rgba(255,200,80,0.55)'); g.addColorStop(0.3,'rgba(220,130,30,0.4)')
      g.addColorStop(0.7,'rgba(160,70,10,0.25)'); g.addColorStop(1,'rgba(60,20,0,0.08)')
      ctx.strokeStyle=g; ctx.lineWidth=0.7+(Math.random()*0.6)
      ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*iR,cy+Math.sin(a)*iR)
      ctx.lineTo(cx+Math.cos(a)*oR,cy+Math.sin(a)*oR); ctx.stroke()
    }
    const gld=ctx.createRadialGradient(cx,cy,r*0.18,cx,cy,r*0.38)
    gld.addColorStop(0,'rgba(255,210,80,0.82)'); gld.addColorStop(1,'transparent')
    ctx.fillStyle=gld; ctx.beginPath(); ctx.arc(cx,cy,r*0.38,0,Math.PI*2); ctx.fill()
    const rim=ctx.createRadialGradient(cx,cy,r*0.82,cx,cy,r)
    rim.addColorStop(0,'transparent'); rim.addColorStop(1,'rgba(4,2,0,0.97)')
    ctx.fillStyle=rim; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill()
    return new THREE.CanvasTexture(cv)
  }, [])
}

// ─── Head — gray clay mannequin sphere ───────────────────────────────────────
function Head() {
  return (
    <mesh scale={[1, 1.16, 0.95]}>
      <sphereGeometry args={[3.5, 96, 96]} />
      <meshStandardMaterial
        color="#7e8a7a"
        roughness={0.76}
        metalness={0.0}
        emissive="#151a14"
        emissiveIntensity={0.06}
      />
    </mesh>
  )
}

// ─── Neck ─────────────────────────────────────────────────────────────────────
function Neck() {
  return (
    <mesh position={[0, -4.8, 0]}>
      <cylinderGeometry args={[0.92, 1.08, 3.8, 32]} />
      <meshStandardMaterial color="#7a867a" roughness={0.78} metalness={0.0} />
    </mesh>
  )
}

// ─── Nose ─────────────────────────────────────────────────────────────────────
function Nose() {
  return (
    <mesh position={[0, -0.42, 3.58]} scale={[0.36, 0.52, 0.44]}>
      <sphereGeometry args={[0.9, 32, 32]} />
      <meshStandardMaterial color="#7e8a7a" roughness={0.78} metalness={0.0} />
    </mesh>
  )
}

// ─── Eye socket shadow ────────────────────────────────────────────────────────
function EyeSocket({ x }: { x: number }) {
  return (
    <group position={[x, 0.62, 3.22]} rotation={[0, -x * 0.24, 0]}>
      <mesh scale={[1, 0.74, 1]}>
        <circleGeometry args={[0.6, 64]} />
        <meshBasicMaterial color="#181c17" transparent opacity={0.84} />
      </mesh>
    </group>
  )
}

// ─── Eyeball (sclera + iris + pupil + cornea) ─────────────────────────────────
function EyeBall({ sclera, iris }: { sclera: THREE.Texture, iris: THREE.Texture }) {
  const pupilRef = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    if (pupilRef.current) pupilRef.current.scale.setScalar(remap(S.p, 0.4, 0.9, 1.0, 1.52))
  })
  return (
    <>
      <mesh>
        <sphereGeometry args={[1.0, 48, 48]} />
        <meshStandardMaterial map={sclera} roughness={0.22} metalness={0.04} />
      </mesh>
      <group position={[0, 0, 1.006]}>
        <mesh>
          <circleGeometry args={[0.47, 96]} />
          <meshStandardMaterial map={iris} roughness={0.06} metalness={0.22} emissive="#3a1800" emissiveIntensity={0.45} />
        </mesh>
        <mesh ref={pupilRef} position={[0, 0, 0.001]}>
          <circleGeometry args={[0.155, 48]} />
          <meshStandardMaterial color="#030201" roughness={0.95} />
        </mesh>
        <mesh position={[-0.09, 0.12, 0.003]}>
          <circleGeometry args={[0.034, 24]} />
          <meshStandardMaterial color="#fffdf0" transparent opacity={0.55} roughness={0} />
        </mesh>
      </group>
      <mesh position={[0, 0, 1.0]}>
        <sphereGeometry args={[0.5, 48, 24, 0, Math.PI*2, 0, Math.PI*0.42]} />
        <meshStandardMaterial color="#ddf0ff" transparent opacity={0.1} roughness={0} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

// ─── Eyelids — flat semicircle flaps, same gray as the head ──────────────────
function EyeLids() {
  const uRef = useRef<THREE.Group>(null!)
  const lRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    const t = remap(S.p, 0.0, 0.38, 0, 1)
    if (uRef.current) { uRef.current.position.y = t * 0.63; uRef.current.rotation.x = -t * 0.28 }
    if (lRef.current) { lRef.current.position.y = -t * 0.45; lRef.current.rotation.x = t * 0.18 }
  })

  const flesh = <meshStandardMaterial color="#858f83" roughness={0.74} side={THREE.DoubleSide} />
  const edge  = <meshBasicMaterial color="#101210" />

  return (
    <>
      <group ref={uRef} position={[0, 0, 1.046]}>
        <mesh><circleGeometry args={[0.53, 96, 0, Math.PI]} />{flesh}</mesh>
        <mesh position={[0, 0, 0.002]}><ringGeometry args={[0.51, 0.535, 64, 1, 0, Math.PI]} />{edge}</mesh>
      </group>
      <group ref={lRef} position={[0, 0, 1.046]}>
        <mesh><circleGeometry args={[0.53, 96, Math.PI, Math.PI]} />{flesh}</mesh>
        <mesh position={[0, 0, 0.002]}><ringGeometry args={[0.51, 0.535, 64, 1, Math.PI, Math.PI]} />{edge}</mesh>
      </group>
    </>
  )
}

// ─── Complete eye at a socket position ───────────────────────────────────────
function SceneEye({ pos, sclera, iris }: { pos: [number,number,number], sclera: THREE.Texture, iris: THREE.Texture }) {
  return (
    <group position={pos} scale={0.44}>
      <EyeBall sclera={sclera} iris={iris} />
      <EyeLids />
    </group>
  )
}

// ─── Camera: wide head shot → zoom to right eye ───────────────────────────────
function CameraRig() {
  const { camera } = useThree()
  const lookAtCurrent = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    const p = S.p

    // Z: 17 → 1.85
    const tZ = p < 0.5
      ? 17 + ease(p / 0.5) * (5.0 - 17)
      : 5.0 + ease((p - 0.5) / 0.5) * (1.85 - 5.0)

    // X: centered → right eye (x≈0.88)
    const tX = remap(p, 0.52, 0.82, 0, 0.88)

    // Y: 0 → eye height 0.62
    const tY = remap(p, 0, 0.55, 0, 0.62)

    camera.position.x += (tX - camera.position.x) * 0.055
    camera.position.y += (tY - camera.position.y) * 0.055
    camera.position.z += (tZ - camera.position.z) * 0.055

    // Smooth lookAt: head center → right eye
    const lx = remap(p, 0.52, 0.85, 0, 0.88)
    const ly = remap(p, 0, 0.55, 0, 0.62)
    const lz = remap(p, 0.52, 0.85, 0, 2.8)
    lookAtCurrent.current.lerp(new THREE.Vector3(lx, ly, lz), 0.055)
    camera.lookAt(lookAtCurrent.current)
  })

  return null
}

// ─── Scene (holds shared textures) ──────────────────────────────────────────
function Scene() {
  const scleraTex = useScleraTexture()
  const irisTex   = useIrisTexture()

  return (
    <>
      <SceneBg />
      <Head />
      <Neck />
      <Nose />
      <EyeSocket x={0.88} />
      <EyeSocket x={-0.88} />
      <SceneEye pos={[0.88,  0.62, 3.08]} sclera={scleraTex} iris={irisTex} />
      <SceneEye pos={[-0.88, 0.62, 3.08]} sclera={scleraTex} iris={irisTex} />
      <CameraRig />
    </>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function EyeScene() {
  useEffect(() => {
    const fn = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      S.p = Math.max(0, Math.min(1, window.scrollY / max))
    }
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 17], fov: 38 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* BrightSide studio lighting: warm key top-right + blue rim back-left */}
        <ambientLight intensity={0.22} />
        <directionalLight position={[6, 10, 8]}  intensity={5.0} color="#fff8ee" />
        <pointLight      position={[-8, 4,  -6]} intensity={4.5} color="#1f4fa0" />
        <pointLight      position={[-4, 2,   7]} intensity={1.6} color="#8898b2" />

        <Scene />
      </Canvas>
    </div>
  )
}
