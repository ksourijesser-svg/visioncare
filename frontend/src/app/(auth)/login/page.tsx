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

      {/* Hex grid layer 1 */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.13]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex" x="0" y="0" width="80" height="92" patternUnits="userSpaceOnUse">
            <polygon points="40,4 76,24 76,68 40,88 4,68 4,24" fill="none" stroke="#00D4FF" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" />
      </svg>

      {/* Hex grid layer 2 (offset) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex2" x="40" y="46" width="80" height="92" patternUnits="userSpaceOnUse">
            <polygon points="40,4 76,24 76,68 40,88 4,68 4,24" fill="none" stroke="#00D4FF" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex2)" />
      </svg>

      {/* ECG — top-left corner */}
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: '42vw', maxWidth: '520px' }}
        viewBox="0 0 520 140"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow-tl">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* soft wide halo */}
        <polyline
          points="0,70 60,70 80,70 95,10 105,120 115,55 130,70 200,70 220,70 235,12 245,122 255,52 270,70 360,70 375,70 390,8 400,124 410,50 425,70 520,70"
          fill="none" stroke="rgba(0,200,255,0.25)" strokeWidth="7"
        />
        {/* sharp neon line */}
        <polyline
          filter="url(#glow-tl)"
          points="0,70 60,70 80,70 95,10 105,120 115,55 130,70 200,70 220,70 235,12 245,122 255,52 270,70 360,70 375,70 390,8 400,124 410,50 425,70 520,70"
          fill="none" stroke="#00C8FF" strokeWidth="2.2"
        />
      </svg>

      {/* ECG — bottom-right corner */}
      <svg
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{ width: '42vw', maxWidth: '520px' }}
        viewBox="0 0 520 140"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow-br">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <polyline
          points="0,70 60,70 80,70 95,10 105,120 115,55 130,70 200,70 220,70 235,12 245,122 255,52 270,70 360,70 375,70 390,8 400,124 410,50 425,70 520,70"
          fill="none" stroke="rgba(0,200,255,0.25)" strokeWidth="7"
        />
        <polyline
          filter="url(#glow-br)"
          points="0,70 60,70 80,70 95,10 105,120 115,55 130,70 200,70 220,70 235,12 245,122 255,52 270,70 360,70 375,70 390,8 400,124 410,50 425,70 520,70"
          fill="none" stroke="#00C8FF" strokeWidth="2.2"
        />
      </svg>

      {/* Ambient glow orbs */}
      <div className="absolute top-[-10%] right-[8%] w-[380px] h-[380px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,150,220,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-8%] left-[6%] w-[340px] h-[340px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,180,255,0.10) 0%, transparent 70%)' }} />

      {/* Star dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          [12, 8], [25, 18], [38, 5], [55, 14], [70, 9], [82, 22], [92, 6],
          [8, 35], [18, 52], [30, 44], [48, 38], [62, 55], [75, 40], [88, 48],
          [5, 70], [20, 78], [35, 65], [50, 82], [65, 72], [80, 68], [95, 80],
          [15, 92], [42, 88], [58, 94], [73, 85], [87, 90],
        ].map(([x, y], i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: `${x}%`, top: `${y}%`,
            width: i % 3 === 0 ? '2px' : '1.5px',
            height: i % 3 === 0 ? '2px' : '1.5px',
            background: 'rgba(150,220,255,0.55)',
            boxShadow: '0 0 4px rgba(0,200,255,0.7)',
          }} />
        ))}
      </div>

      {/* Login card */}
      <div className="w-full max-w-md relative z-10">

        {/* Neon outer glow wrapper */}
        <div style={{
          borderRadius: '20px',
          padding: '2px',
          background: 'linear-gradient(135deg, rgba(0,200,255,0.55), rgba(0,100,200,0.2), rgba(0,200,255,0.45))',
          boxShadow: '0 0 18px rgba(0,200,255,0.5), 0 0 50px rgba(0,150,220,0.3), 0 0 100px rgba(0,100,200,0.18)',
        }}>
          <div
            className="rounded-[18px] p-8"
            style={{
              background: 'rgba(3, 16, 34, 0.88)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
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
                <Label htmlFor="email" style={{ color: 'rgba(150,210,255,0.85)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em' }}>
                  EMAIL
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="medecin@cabinet.fr"
                  {...register('email')}
                  className="h-11 text-sm"
                  style={{
                    background: 'rgba(0,25,55,0.7)',
                    border: '1px solid rgba(0,150,210,0.35)',
                    color: '#C8E8FF',
                    borderRadius: '10px',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = '1px solid rgba(0,200,255,0.65)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.13), 0 0 12px rgba(0,180,255,0.15)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = '1px solid rgba(0,150,210,0.35)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                {errors.email && <p className="text-xs" style={{ color: '#FF7B7B' }}>{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" style={{ color: 'rgba(150,210,255,0.85)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em' }}>
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
                      background: 'rgba(0,25,55,0.7)',
                      border: '1px solid rgba(0,150,210,0.35)',
                      color: '#C8E8FF',
                      borderRadius: '10px',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.border = '1px solid rgba(0,200,255,0.65)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.13), 0 0 12px rgba(0,180,255,0.15)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.border = '1px solid rgba(0,150,210,0.35)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
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
                <div className="rounded-lg px-3 py-2 text-sm" style={{
                  background: 'rgba(220,38,38,0.12)',
                  border: '1px solid rgba(220,38,38,0.3)',
                  color: '#FCA5A5',
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-2"
                style={{
                  background: 'linear-gradient(135deg, #007BB8 0%, #00AADD 50%, #0095CC 100%)',
                  color: '#fff',
                  border: '1px solid rgba(0,200,255,0.5)',
                  boxShadow: '0 4px 20px rgba(0,150,220,0.4), 0 0 0 1px rgba(0,180,255,0.15)',
                  letterSpacing: '0.05em',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 0 14px rgba(0,200,255,0.95), 0 0 35px rgba(0,150,220,0.6), 0 4px 20px rgba(0,0,0,0.3)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,150,220,0.4), 0 0 0 1px rgba(0,180,255,0.15)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Se connecter
              </button>

              <p className="text-center text-sm" style={{ color: 'rgba(120,190,230,0.6)' }}>
                <a
                  href="#"
                  style={{ color: 'rgba(0,200,255,0.8)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00D4FF'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,200,255,0.8)'}
                >
                  Mot de passe oublié ?
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
