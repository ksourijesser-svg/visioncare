'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, RefreshCw, CheckCircle, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})

type LoginData = z.infer<typeof loginSchema>
type Mode = 'login' | 'forgot-email' | 'forgot-code'

// ── 6-digit OTP input ──────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(i: number, v: string) {
    if (!/^\d*$/.test(v)) return
    const chars = value.padEnd(6, '').split('')
    chars[i] = v.slice(-1)
    onChange(chars.join(''))
    if (v && i < 5) inputRefs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted.padEnd(6, '').slice(0, 6))
      inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all"
          style={{
            height: '52px',
            background: 'rgba(0,25,55,0.6)',
            borderColor: value[i] ? '#00C8FF' : 'rgba(0,150,210,0.3)',
            color: '#C8E8FF',
            boxShadow: value[i] ? '0 0 10px rgba(0,200,255,0.3)' : 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,200,255,0.7)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.15)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = value[i] ? '#00C8FF' : 'rgba(0,150,210,0.3)'; e.currentTarget.style.boxShadow = value[i] ? '0 0 10px rgba(0,200,255,0.3)' : 'none' }}
        />
      ))}
    </div>
  )
}

// ── Shared neon card wrapper ───────────────────────────────────────────────────
function NeonCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: '20px',
      padding: '2px',
      background: 'linear-gradient(135deg, rgba(0,200,255,0.55), rgba(0,100,200,0.18), rgba(0,200,255,0.45))',
      boxShadow: '0 0 18px rgba(0,200,255,0.5), 0 0 50px rgba(0,150,220,0.3), 0 0 100px rgba(0,100,200,0.18)',
    }}>
      <div className="rounded-[18px] p-8" style={{ background: 'rgba(3, 16, 34, 0.88)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Shared submit button ───────────────────────────────────────────────────────
function SubmitBtn({ disabled, loading, children }: { disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, #007BB8 0%, #00AADD 50%, #0095CC 100%)',
        color: '#fff',
        border: '1px solid rgba(0,200,255,0.5)',
        boxShadow: '0 4px 20px rgba(0,150,220,0.4)',
        letterSpacing: '0.05em',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.boxShadow = '0 0 14px rgba(0,200,255,0.9), 0 0 35px rgba(0,150,220,0.6)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,150,220,0.4)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

// ── Input style helpers ────────────────────────────────────────────────────────
const inputStyle = {
  background: 'rgba(0,25,55,0.7)',
  border: '1px solid rgba(0,150,210,0.35)',
  color: '#C8E8FF',
  borderRadius: '10px',
}
const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.border = '1px solid rgba(0,200,255,0.65)'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.13), 0 0 12px rgba(0,180,255,0.15)'
}
const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.border = '1px solid rgba(0,150,210,0.35)'
  e.currentTarget.style.boxShadow = 'none'
}
const labelStyle: React.CSSProperties = { color: 'rgba(150,210,255,0.85)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em' }

// ── Login form ─────────────────────────────────────────────────────────────────
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginData) {
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
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: '#D0EEFF' }}>Connexion</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(120,190,230,0.7)' }}>Entrez vos identifiants pour accéder à votre espace</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" style={labelStyle}>EMAIL</Label>
          <Input id="email" type="email" placeholder="medecin@cabinet.fr" {...register('email')} className="h-11 text-sm" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
          {errors.email && <p className="text-xs" style={{ color: '#FF7B7B' }}>{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" style={labelStyle}>MOT DE PASSE</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...register('password')} className="h-11 text-sm pr-10" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(100,170,210,0.7)' }} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs" style={{ color: '#FF7B7B' }}>{errors.password.message}</p>}
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <SubmitBtn loading={isSubmitting}>Se connecter</SubmitBtn>

        <p className="text-center text-sm">
          <button type="button" onClick={onForgot} style={{ color: 'rgba(0,200,255,0.8)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00D4FF'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0,200,255,0.8)'}
          >
            Mot de passe oublié ?
          </button>
        </p>
      </form>
    </>
  )
}

// ── Forgot step 1: enter email ─────────────────────────────────────────────────
function ForgotEmailStep({
  onCodeSent,
  onBack,
}: {
  onCodeSent: (email: string) => void
  onBack: () => void
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await authApi.sendCode(email, 'reset')
      onCodeSent(email)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-2 text-sm mb-5 transition-colors" style={{ color: 'rgba(120,190,230,0.6)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#C8E8FF'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(120,190,230,0.6)'}
      >
        <ArrowLeft size={14} /> Retour à la connexion
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,100,180,0.3)', border: '1px solid rgba(0,200,255,0.3)' }}>
          <Mail size={20} style={{ color: '#00D4FF' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#D0EEFF' }}>Mot de passe oublié</h2>
          <p className="text-xs" style={{ color: 'rgba(120,190,230,0.65)' }}>Entrez votre email pour recevoir un code</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="reset-email" style={labelStyle}>EMAIL</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="votre@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 text-sm"
            style={inputStyle}
            onFocus={focusInput}
            onBlur={blurInput}
            required
          />
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <SubmitBtn loading={loading}>Envoyer le code</SubmitBtn>
      </form>
    </>
  )
}

// ── Forgot step 2: code + new password ────────────────────────────────────────
function ForgotResetStep({
  email,
  onSuccess,
  onBack,
}: {
  email: string
  onSuccess: () => void
  onBack: () => void
}) {
  const [code, setCode] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length < 6) { setError('Entrez les 6 chiffres du code'); return }
    if (newPw.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (newPw !== confirmPw) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword(email, code, newPw)
      setDone(true)
      setTimeout(onSuccess, 2000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    setCode('')
    try {
      await authApi.sendCode(email, 'reset')
    } catch {
      setError('Erreur lors du renvoi. Réessayez.')
    } finally {
      setResending(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle size={52} className="mx-auto mb-4" style={{ color: '#00D4FF' }} />
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#D0EEFF' }}>Mot de passe réinitialisé !</h2>
        <p className="text-sm" style={{ color: 'rgba(120,190,230,0.65)' }}>Redirection vers la connexion…</p>
      </div>
    )
  }

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-2 text-sm mb-5 transition-colors" style={{ color: 'rgba(120,190,230,0.6)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#C8E8FF'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(120,190,230,0.6)'}
      >
        <ArrowLeft size={14} /> Changer d&apos;email
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,100,180,0.3)', border: '1px solid rgba(0,200,255,0.3)' }}>
          <Lock size={18} style={{ color: '#00D4FF' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#D0EEFF' }}>Nouveau mot de passe</h2>
          <p className="text-xs" style={{ color: 'rgba(120,190,230,0.65)' }}>
            Code envoyé à <span style={{ color: '#00C8FF' }}>{email}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label style={labelStyle}>CODE DE VÉRIFICATION</Label>
          <OtpInput value={code} onChange={setCode} />
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-xs flex items-center gap-1.5 mx-auto transition-colors"
              style={{ color: 'rgba(0,200,255,0.65)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#00D4FF'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0,200,255,0.65)'}
            >
              {resending ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Renvoyer le code
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label style={labelStyle}>NOUVEAU MOT DE PASSE</Label>
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              placeholder="Minimum 8 caractères"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="h-11 text-sm pr-10"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(100,170,210,0.7)' }} onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label style={labelStyle}>CONFIRMER LE MOT DE PASSE</Label>
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="h-11 text-sm pr-10"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(100,170,210,0.7)' }} onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <SubmitBtn loading={loading} disabled={code.length < 6 || newPw.length < 8}>
          Réinitialiser le mot de passe
        </SubmitBtn>
      </form>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [resetEmail, setResetEmail] = useState('')

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

      {/* Hex grid layer 2 */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex2" x="40" y="46" width="80" height="92" patternUnits="userSpaceOnUse">
            <polygon points="40,4 76,24 76,68 40,88 4,68 4,24" fill="none" stroke="#00D4FF" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex2)" />
      </svg>

      {/* ECG top-left */}
      <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: '42vw', maxWidth: '520px' }} viewBox="0 0 520 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-tl"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <polyline points="0,70 60,70 80,70 95,10 105,120 115,55 130,70 200,70 220,70 235,12 245,122 255,52 270,70 360,70 375,70 390,8 400,124 410,50 425,70 520,70" fill="none" stroke="rgba(0,200,255,0.25)" strokeWidth="7" />
        <polyline filter="url(#glow-tl)" points="0,70 60,70 80,70 95,10 105,120 115,55 130,70 200,70 220,70 235,12 245,122 255,52 270,70 360,70 375,70 390,8 400,124 410,50 425,70 520,70" fill="none" stroke="#00C8FF" strokeWidth="2.2" />
      </svg>

      {/* ECG bottom-right */}
      <svg className="absolute bottom-0 right-0 pointer-events-none" style={{ width: '42vw', maxWidth: '520px' }} viewBox="0 0 520 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-br"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <polyline points="0,70 60,70 80,70 95,10 105,120 115,55 130,70 200,70 220,70 235,12 245,122 255,52 270,70 360,70 375,70 390,8 400,124 410,50 425,70 520,70" fill="none" stroke="rgba(0,200,255,0.25)" strokeWidth="7" />
        <polyline filter="url(#glow-br)" points="0,70 60,70 80,70 95,10 105,120 115,55 130,70 200,70 220,70 235,12 245,122 255,52 270,70 360,70 375,70 390,8 400,124 410,50 425,70 520,70" fill="none" stroke="#00C8FF" strokeWidth="2.2" />
      </svg>

      {/* Ambient glow orbs */}
      <div className="absolute top-[-10%] right-[8%] w-[380px] h-[380px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,150,220,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-8%] left-[6%] w-[340px] h-[340px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,180,255,0.10) 0%, transparent 70%)' }} />

      {/* Star dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[[12,8],[25,18],[38,5],[55,14],[70,9],[82,22],[92,6],[8,35],[18,52],[30,44],[48,38],[62,55],[75,40],[88,48],[5,70],[20,78],[35,65],[50,82],[65,72],[80,68],[95,80],[15,92],[42,88],[58,94],[73,85],[87,90]].map(([x,y],i) => (
          <div key={i} className="absolute rounded-full" style={{ left:`${x}%`, top:`${y}%`, width: i%3===0?'2px':'1.5px', height: i%3===0?'2px':'1.5px', background:'rgba(150,220,255,0.55)', boxShadow:'0 0 4px rgba(0,200,255,0.7)' }} />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md relative z-10">
        <NeonCard>
          {mode === 'login' && <LoginForm onForgot={() => setMode('forgot-email')} />}
          {mode === 'forgot-email' && (
            <ForgotEmailStep
              onCodeSent={(email) => { setResetEmail(email); setMode('forgot-code') }}
              onBack={() => setMode('login')}
            />
          )}
          {mode === 'forgot-code' && (
            <ForgotResetStep
              email={resetEmail}
              onSuccess={() => setMode('login')}
              onBack={() => setMode('forgot-email')}
            />
          )}
        </NeonCard>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(80,140,180,0.5)' }}>
          © 2025 VisionCare — Plateforme sécurisée
        </p>
      </div>
    </div>
  )
}
