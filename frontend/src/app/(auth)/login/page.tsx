'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError('')
    try {
      const res = await authApi.login(data.email, data.password)
      setToken(res.data.access_token)
      const me = await authApi.me()
      setUser(me.data)
      router.push('/dashboard')
    } catch {
      setError('Email ou mot de passe incorrect')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #020B18 0%, #041629 40%, #051E36 70%, #020B18 100%)' }}>

      {/* Hex grid SVG background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex" x="0" y="0" width="80" height="92" patternUnits="userSpaceOnUse">
            <polygon
              points="40,4 76,24 76,68 40,88 4,68 4,24"
              fill="none"
              stroke="#00D4FF"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" />
      </svg>

      {/* Bright hex highlights */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.22]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex2" x="40" y="46" width="80" height="92" patternUnits="userSpaceOnUse">
            <polygon
              points="40,4 76,24 76,68 40,88 4,68 4,24"
              fill="none"
              stroke="#00D4FF"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex2)" />
      </svg>

      {/* ECG / heartbeat line — bottom left */}
      <svg
        className="absolute bottom-0 left-0 w-[70vw] opacity-70 pointer-events-none"
        viewBox="0 0 900 180"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow-ecg-bl">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <polyline
          filter="url(#glow-ecg-bl)"
          points="0,120 80,120 100,120 115,20 125,150 135,90 150,120 240,120 260,120 275,30 285,155 295,85 310,120 420,120 435,120 450,25 460,150 470,88 485,120 600,120 615,120 630,28 640,152 650,86 665,120 800,120 820,120 835,22 845,153 855,87 870,120 900,120"
          fill="none"
          stroke="#00C8FF"
          strokeWidth="2.2"
        />
        <polyline
          points="0,120 80,120 100,120 115,20 125,150 135,90 150,120 240,120 260,120 275,30 285,155 295,85 310,120 420,120 435,120 450,25 460,150 470,88 485,120 600,120 615,120 630,28 640,152 650,86 665,120 800,120 820,120 835,22 845,153 855,87 870,120 900,120"
          fill="none"
          stroke="rgba(0,200,255,0.3)"
          strokeWidth="6"
        />
      </svg>

      {/* ECG / heartbeat line — top right */}
      <svg
        className="absolute top-0 right-0 w-[60vw] opacity-60 pointer-events-none"
        viewBox="0 0 900 180"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow-ecg-tr">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <polyline
          filter="url(#glow-ecg-tr)"
          points="0,60 90,60 110,60 125,160 135,10 145,70 160,60 280,60 300,60 315,155 325,8 335,68 350,60 480,60 500,60 515,158 525,10 535,65 550,60 680,60 700,60 715,155 725,8 735,65 750,60 900,60"
          fill="none"
          stroke="#00C8FF"
          strokeWidth="2"
        />
        <polyline
          points="0,60 90,60 110,60 125,160 135,10 145,70 160,60 280,60 300,60 315,155 325,8 335,68 350,60 480,60 500,60 515,158 525,10 535,65 550,60 680,60 700,60 715,155 725,8 735,65 750,60 900,60"
          fill="none"
          stroke="rgba(0,200,255,0.28)"
          strokeWidth="6"
        />
      </svg>

      {/* Ambient glow orbs */}
      <div className="absolute top-[-10%] right-[10%] w-[420px] h-[420px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,150,220,0.14) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-8%] left-[5%] w-[380px] h-[380px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,180,255,0.11) 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,100,180,0.08) 0%, transparent 70%)' }} />

      {/* Stars / particle dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          [12, 8], [25, 18], [38, 5], [55, 14], [70, 9], [82, 22], [92, 6],
          [8, 35], [18, 52], [30, 44], [48, 38], [62, 55], [75, 40], [88, 48],
          [5, 70], [20, 78], [35, 65], [50, 82], [65, 72], [80, 68], [95, 80],
          [15, 92], [42, 88], [58, 94], [73, 85], [87, 90],
        ].map(([x, y], i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: i % 3 === 0 ? '2px' : '1.5px',
              height: i % 3 === 0 ? '2px' : '1.5px',
              background: 'rgba(150,220,255,0.6)',
              boxShadow: '0 0 4px rgba(0,200,255,0.8)',
            }}
          />
        ))}
      </div>

      {/* Login card */}
      <div className="w-full max-w-md relative z-10">

        {/* Logo + brand */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0,150,210,0.3), rgba(0,80,160,0.4))',
              border: '1px solid rgba(0,200,255,0.4)',
              boxShadow: '0 0 20px rgba(0,180,255,0.3), 0 0 60px rgba(0,100,200,0.15)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9">
              <path
                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                fill="#00D4FF"
              />
              <circle cx="12" cy="12" r="2" fill="rgba(0,212,255,0.6)" />
            </svg>
          </div>
          <h1
            className="text-3xl font-bold tracking-wide"
            style={{
              color: '#E8F4FF',
              textShadow: '0 0 20px rgba(0,180,255,0.5)',
            }}
          >
            VisionCare
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'rgba(150,210,255,0.7)' }}>
            Plateforme de gestion ophtalmologique
          </p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(4, 20, 42, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,180,255,0.2)',
            boxShadow: '0 8px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,180,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Card header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold" style={{ color: '#D0EEFF' }}>
              Connexion
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(120,190,230,0.7)' }}>
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: 'rgba(150,210,255,0.85)', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.03em' }}>
                EMAIL
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="medecin@cabinet.fr"
                {...register('email')}
                className="h-11 text-sm"
                style={{
                  background: 'rgba(0,30,60,0.6)',
                  border: '1px solid rgba(0,150,210,0.3)',
                  color: '#C8E8FF',
                  borderRadius: '10px',
                  outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(0,200,255,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.12)' }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(0,150,210,0.3)'; e.currentTarget.style.boxShadow = 'none' }}
              />
              {errors.email && <p className="text-xs" style={{ color: '#FF7B7B' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: 'rgba(150,210,255,0.85)', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.03em' }}>
                MOT DE PASSE
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="h-11 text-sm pr-10"
                  style={{
                    background: 'rgba(0,30,60,0.6)',
                    border: '1px solid rgba(0,150,210,0.3)',
                    color: '#C8E8FF',
                    borderRadius: '10px',
                  }}
                  onFocus={e => { e.currentTarget.style.border = '1px solid rgba(0,200,255,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.12)' }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid rgba(0,150,210,0.3)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(100,170,210,0.7)' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs" style={{ color: '#FF7B7B' }}>{errors.password.message}</p>}
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  background: 'rgba(220,38,38,0.12)',
                  border: '1px solid rgba(220,38,38,0.3)',
                  color: '#FCA5A5',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-2"
              style={{
                background: 'linear-gradient(135deg, #0080C8 0%, #00AADD 50%, #0095CC 100%)',
                color: '#fff',
                border: '1px solid rgba(0,200,255,0.4)',
                boxShadow: '0 4px 20px rgba(0,150,220,0.35), 0 0 0 1px rgba(0,180,255,0.15)',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0,200,255,0.9), 0 0 30px rgba(0,150,220,0.55), 0 4px 20px rgba(0,0,0,0.3)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,150,220,0.35), 0 0 0 1px rgba(0,180,255,0.15)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Se connecter
            </button>

            <p className="text-center text-sm" style={{ color: 'rgba(120,190,230,0.6)' }}>
              <a href="#" className="transition-colors" style={{ color: 'rgba(0,200,255,0.8)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00D4FF'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,200,255,0.8)'}
              >
                Mot de passe oublié ?
              </a>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'rgba(80,140,180,0.5)' }}>
          © 2025 VisionCare — Plateforme sécurisée
        </p>
      </div>
    </div>
  )
}
