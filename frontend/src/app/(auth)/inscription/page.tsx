'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Stethoscope, ClipboardList, ArrowLeft, Mail, RefreshCw, CheckCircle, Camera, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NeonCard, NeonSubmit, neonInputStyle, focusNeon, blurNeon, neonLabelStyle } from '@/components/ui/neon'
import { authApi } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'
import { fileToResizedDataUrl } from '@/lib/image'

const neonOption: React.CSSProperties = { background: '#072037', color: '#C8E8FF' }

// Set to true once a sending domain is verified in Resend (see core/email.py).
// While false, signup skips the email OTP step and registers the account directly.
const EMAIL_VERIFICATION_ENABLED = false

const SPECIALISATIONS = [
  'Ophtalmologie', 'Cardiologie', 'Dermatologie', 'Médecine générale',
  'Pédiatrie', 'Gynécologie', 'Orthopédie', 'Neurologie', 'Psychiatrie', 'Stomatologie',
]

const TYPES_CABINET = [
  'Cabinet solo', 'Cabinet de groupe', 'Clinique privée', 'Hôpital', 'Centre médical',
]

const medecinSchema = z.object({
  nom_complet: z.string().min(2, 'Nom requis'),
  telephone: z.string().min(6, 'Téléphone requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirm_password: z.string(),
  cabinet: z.string().min(2, 'Nom du cabinet requis'),
  specialisation: z.string().min(1, 'Spécialisation requise'),
  type_cabinet: z.string().min(1, 'Type de cabinet requis'),
  adresse: z.string(),
  bio: z.string(),
  google_maps_url: z.union([z.string().url('Lien invalide'), z.literal('')]),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

const secretaireSchema = z.object({
  nom_complet: z.string().min(2, 'Nom requis'),
  telephone: z.string().min(6, 'Téléphone requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

type MedecinData = z.infer<typeof medecinSchema>
type SecretaireData = z.infer<typeof secretaireSchema>
type Role = 'medecin' | 'secretaire'

type PendingRegistration = {
  email: string
  registerFn: () => Promise<void>
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label style={neonLabelStyle}>{label}</Label>
      {children}
      {error && <p className="text-xs" style={{ color: '#FF7B7B' }}>{error}</p>}
    </div>
  )
}

// ── 6-digit OTP input ──────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(i: number, v: string) {
    if (!/^\d*$/.test(v)) return
    const chars = value.padEnd(6, '').split('')
    chars[i] = v.slice(-1)
    const next = chars.join('')
    onChange(next)
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
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
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
          className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none"
          style={{
            background: 'rgba(0,25,55,0.55)',
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

// ── Email verification step ────────────────────────────────────────────────────
function VerificationStep({
  email,
  onVerified,
  onBack,
}: {
  email: string
  onVerified: () => Promise<void>
  onBack: () => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleVerify() {
    if (code.length < 6) { setError('Entrez les 6 chiffres du code'); return }
    setLoading(true)
    setError('')
    try {
      await authApi.verifyCode(email, code, 'signup')
      setSuccess(true)
      await onVerified()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Code incorrect')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    setCode('')
    try {
      await authApi.sendCode(email, 'signup')
    } catch {
      setError('Erreur lors du renvoi. Réessayez.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-5 transition-colors">
          <ArrowLeft size={14} /> Retour au formulaire
        </button>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,100,180,0.35), rgba(0,60,120,0.45))',
            border: '1px solid rgba(0,200,255,0.35)',
            boxShadow: '0 0 24px rgba(0,180,255,0.25)',
          }}
        >
          <Mail size={28} style={{ color: '#00D4FF' }} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Vérification email</h1>
        <p className="text-white/50 text-sm">
          Un code à 6 chiffres a été envoyé à<br />
          <span className="text-[#00C8FF] font-semibold">{email}</span>
        </p>
      </div>

      <div
        style={{
          borderRadius: '20px',
          padding: '2px',
          background: 'linear-gradient(135deg, rgba(0,200,255,0.45), rgba(0,100,200,0.18), rgba(0,200,255,0.38))',
          boxShadow: '0 0 18px rgba(0,200,255,0.4), 0 0 50px rgba(0,150,220,0.22)',
        }}
      >
        <div className="rounded-[18px] p-8" style={{ background: 'rgba(3,16,34,0.92)', backdropFilter: 'blur(20px)' }}>
          {success ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#00D4FF' }} />
              <p className="text-white font-semibold">Email vérifié !</p>
              <p className="text-white/50 text-sm mt-1">Création du compte en cours…</p>
            </div>
          ) : (
            <>
              <p className="text-center text-sm mb-6" style={{ color: 'rgba(150,210,255,0.7)' }}>
                Entrez le code reçu par email
              </p>

              <OtpInput value={code} onChange={setCode} />

              {error && (
                <div className="mt-4 rounded-lg px-3 py-2 text-sm text-center" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading || code.length < 6}
                className="mt-6 w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: code.length === 6 ? 'linear-gradient(135deg, #007BB8, #00AADD, #0095CC)' : 'rgba(0,100,160,0.3)',
                  color: code.length === 6 ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(0,200,255,0.35)',
                  cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={(e) => { if (code.length === 6) { e.currentTarget.style.boxShadow = '0 0 14px rgba(0,200,255,0.9), 0 0 30px rgba(0,150,220,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Vérifier et créer mon compte
              </button>

              <div className="mt-4 text-center">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm flex items-center gap-1.5 mx-auto transition-colors"
                  style={{ color: 'rgba(0,200,255,0.7)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#00D4FF'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0,200,255,0.7)'}
                >
                  {resending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Renvoyer le code
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Role selection step ────────────────────────────────────────────────────────
function RoleStep({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#3d8fa8] flex items-center justify-center shadow-lg shadow-[#3d8fa8]/30">
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">Ophtech</span>
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">Créer un compte</h1>
        <p className="text-white/55 text-sm">Sélectionnez votre rôle pour commencer</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('medecin')}
          className="group bg-white/6 hover:bg-white/10 border border-white/12 hover:border-[#3d8fa8]/60 rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-[#3d8fa8]/20 group-hover:bg-[#3d8fa8] flex items-center justify-center mb-4 transition-colors">
            <Stethoscope size={22} className="text-[#70B1C4] group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-white text-base mb-1">Médecin</h3>
          <p className="text-white/50 text-xs leading-relaxed">Gérez votre cabinet, vos patients et vos rendez-vous.</p>
          <div className="mt-4 text-[#70B1C4] text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Créer mon compte →
          </div>
        </button>

        <button
          onClick={() => onSelect('secretaire')}
          className="group bg-white/6 hover:bg-white/10 border border-white/12 hover:border-[#3d8fa8]/60 rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-[#3d8fa8]/20 group-hover:bg-[#3d8fa8] flex items-center justify-center mb-4 transition-colors">
            <ClipboardList size={22} className="text-[#70B1C4] group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-white text-base mb-1">Secrétaire</h3>
          <p className="text-white/50 text-xs leading-relaxed">Planifiez et assistez la gestion des rendez-vous.</p>
          <div className="mt-4 text-[#70B1C4] text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Créer mon compte →
          </div>
        </button>
      </div>

      <p className="text-center text-white/40 text-sm mt-6">
        Déjà inscrit ?{' '}
        <Link href="/login" className="text-[#70B1C4] font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}

// ── Médecin form ───────────────────────────────────────────────────────────────
function MedecinForm({ onBack, onPendingVerification }: { onBack: () => void; onPendingVerification: (p: PendingRegistration) => void }) {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<MedecinData>({
    resolver: zodResolver(medecinSchema),
    defaultValues: { nom_complet: '', telephone: '', email: '', password: '', confirm_password: '', cabinet: '', specialisation: '', type_cabinet: '', adresse: '', bio: '', google_maps_url: '' },
  })

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Veuillez choisir une image'); return }
    setUploadingPhoto(true)
    try {
      setPhoto(await fileToResizedDataUrl(file))
    } catch {
      setError("Impossible de charger l'image")
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function onSubmit(data: MedecinData) {
    setError('')
    try {
      const parts = data.nom_complet.trim().split(' ')
      const prenom = parts[0]
      const nom = parts.slice(1).join(' ') || prenom

      const registerFn = async () => {
        await authApi.register({ email: data.email, password: data.password, nom, prenom, role: 'medecin', telephone: data.telephone, cabinet: data.cabinet, specialisation: data.specialisation, type_cabinet: data.type_cabinet, adresse: data.adresse, bio: data.bio, google_maps_url: data.google_maps_url, photo: photo || null })
        const loginRes = await authApi.login(data.email, data.password)
        setToken(loginRes.data.access_token)
        const me = await authApi.me()
        setUser(me.data)
        router.push('/dashboard')
      }

      if (!EMAIL_VERIFICATION_ENABLED) {
        await registerFn()
        return
      }

      await authApi.sendCode(data.email, 'signup')
      onPendingVerification({ email: data.email, registerFn })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Une erreur est survenue. Veuillez réessayer.')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
            <ArrowLeft size={14} /> Retour à l&apos;accueil
          </Link>
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
            <RefreshCw size={13} /> Changer de rôle
          </button>
        </div>
        <div className="inline-flex items-center gap-2 bg-[#3d8fa8]/20 border border-[#3d8fa8]/30 text-[#70B1C4] text-sm font-semibold rounded-full px-4 py-1.5 mb-3">
          <Stethoscope size={14} /> Compte Médecin
        </div>
        <h1 className="text-xl font-bold text-white">Créez votre compte médecin</h1>
      </div>

      <NeonCard>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(0,100,180,0.3)', border: '1px solid rgba(0,200,255,0.3)' }}>👤</div>
              <h2 className="font-bold" style={{ color: '#D0EEFF' }}>Informations personnelles</h2>
            </div>
            <div className="space-y-4">
              {/* Photo de profil — affichée aux patients sur la page de prise de rendez-vous */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(0,25,55,0.7)', border: '1px solid rgba(0,150,210,0.35)' }}
                >
                  {photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={photo} alt="Aperçu" className="w-full h-full object-cover" />
                    : <Camera size={22} style={{ color: 'rgba(100,170,210,0.6)' }} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
                      style={{ background: 'rgba(0,100,180,0.3)', border: '1px solid rgba(0,200,255,0.3)', color: '#D0EEFF' }}
                    >
                      {uploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                      {photo ? 'Changer la photo' : 'Ajouter une photo'}
                    </button>
                    {photo && (
                      <button type="button" onClick={() => setPhoto('')} className="inline-flex items-center gap-1 text-xs transition-colors" style={{ color: 'rgba(120,190,230,0.7)' }}>
                        <Trash2 size={12} /> Retirer
                      </button>
                    )}
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: 'rgba(120,190,230,0.55)' }}>Visible par vos patients lors de la prise de rendez-vous.</p>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </div>
              </div>
              <Field label="Nom complet du médecin *" error={errors.nom_complet?.message}>
                <Input {...register('nom_complet')} placeholder="Dr. Nom Prénom" className="h-11 text-sm placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Téléphone professionnel *" error={errors.telephone?.message}>
                  <Input {...register('telephone')} className="h-11 text-sm placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
                </Field>
                <Field label="Email professionnel *" error={errors.email?.message}>
                  <Input {...register('email')} type="email" placeholder="exemple@cabinet.com" className="h-11 text-sm placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Mot de passe *" error={errors.password?.message}>
                  <div className="relative">
                    <Input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Minimum 8 caractères" className="h-11 text-sm pr-10 placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(100,170,210,0.7)' }} onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirmer le mot de passe *" error={errors.confirm_password?.message}>
                  <div className="relative">
                    <Input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className="h-11 text-sm pr-10 placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(100,170,210,0.7)' }} onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>
              </div>
              <Field label="Biographie / Présentation (optionnel)" error={errors.bio?.message}>
                <textarea
                  {...register('bio')}
                  rows={4}
                  placeholder="Présentez-vous à vos patients : parcours, expertise, approche de soin..."
                  className="w-full text-sm px-3 py-2 rounded-[10px] focus:outline-none transition-all placeholder:text-[#4E7E9C] resize-y"
                  style={neonInputStyle}
                  onFocus={focusNeon}
                  onBlur={blurNeon}
                />
              </Field>
          </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(0,180,255,0.12)' }} />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(0,100,180,0.3)', border: '1px solid rgba(0,200,255,0.3)' }}>🏥</div>
              <h2 className="font-bold" style={{ color: '#D0EEFF' }}>Informations du Cabinet</h2>
            </div>
            <div className="space-y-4">
              <Field label="Nom du cabinet médical *" error={errors.cabinet?.message}>
                <Input {...register('cabinet')} placeholder="Cabinet du Dr. X" className="h-11 text-sm placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
              </Field>
              <Field label="Adresse du cabinet" error={errors.adresse?.message}>
                <Input {...register('adresse')} placeholder="12 rue de la Santé, 75014 Paris" className="h-11 text-sm placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
              </Field>
              <Field label="Lien Google Maps — avis (optionnel)" error={errors.google_maps_url?.message}>
                <Input {...register('google_maps_url')} placeholder="https://maps.app.goo.gl/..." className="h-11 text-sm placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
                <p className="text-xs mt-1" style={{ color: 'rgba(120,190,230,0.55)' }}>Vos patients pourront consulter vos avis Google lors de la prise de rendez-vous.</p>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Spécialisation médicale *" error={errors.specialisation?.message}>
                  <select {...register('specialisation')} className="w-full h-11 px-3 text-sm focus:outline-none" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon}>
                    <option value="" style={neonOption}>Sélectionnez votre spécialité</option>
                    {SPECIALISATIONS.map((s) => <option key={s} value={s} style={neonOption}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Type de cabinet *" error={errors.type_cabinet?.message}>
                  <select {...register('type_cabinet')} className="w-full h-11 px-3 text-sm focus:outline-none" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon}>
                    <option value="" style={neonOption}>Choisissez une option</option>
                    {TYPES_CABINET.map((t) => <option key={t} value={t} style={neonOption}>{t}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>{error}</div>
          )}

          <NeonSubmit loading={isSubmitting}>
            {isSubmitting
              ? (EMAIL_VERIFICATION_ENABLED ? 'Envoi du code…' : 'Création du compte…')
              : (EMAIL_VERIFICATION_ENABLED ? 'Continuer — vérifier mon email' : 'Créer mon compte')}
          </NeonSubmit>

          <p className="text-center text-sm" style={{ color: 'rgba(120,190,230,0.7)' }}>
            Déjà inscrit ?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: 'rgba(0,200,255,0.85)' }}>Se connecter</Link>
          </p>
        </form>
      </NeonCard>
    </div>
  )
}

// ── Secrétaire form ────────────────────────────────────────────────────────────
function SecretaireForm({ onBack, onPendingVerification }: { onBack: () => void; onPendingVerification: (p: PendingRegistration) => void }) {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SecretaireData>({
    resolver: zodResolver(secretaireSchema),
    defaultValues: { nom_complet: '', telephone: '', email: '', password: '', confirm_password: '' },
  })

  async function onSubmit(data: SecretaireData) {
    setError('')
    try {
      const parts = data.nom_complet.trim().split(' ')
      const prenom = parts[0]
      const nom = parts.slice(1).join(' ') || prenom

      const registerFn = async () => {
        await authApi.register({ email: data.email, password: data.password, nom, prenom, role: 'secretaire', telephone: data.telephone })
        const loginRes = await authApi.login(data.email, data.password)
        setToken(loginRes.data.access_token)
        const me = await authApi.me()
        setUser(me.data)
        router.push('/dashboard')
      }

      if (!EMAIL_VERIFICATION_ENABLED) {
        await registerFn()
        return
      }

      await authApi.sendCode(data.email, 'signup')
      onPendingVerification({ email: data.email, registerFn })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Une erreur est survenue. Veuillez réessayer.')
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
            <ArrowLeft size={14} /> Retour à l&apos;accueil
          </Link>
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
            <RefreshCw size={13} /> Changer de rôle
          </button>
        </div>
        <div className="inline-flex items-center gap-2 bg-[#3d8fa8]/20 border border-[#3d8fa8]/30 text-[#70B1C4] text-sm font-semibold rounded-full px-4 py-1.5 mb-3">
          <ClipboardList size={14} /> Compte Secrétaire
        </div>
        <h1 className="text-xl font-bold text-white">Créez votre compte secrétaire</h1>
      </div>

      <NeonCard>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(0,100,180,0.3)', border: '1px solid rgba(0,200,255,0.3)' }}>👤</div>
            <h2 className="font-bold" style={{ color: '#D0EEFF' }}>Informations personnelles</h2>
          </div>

          <Field label="Nom complet *" error={errors.nom_complet?.message}>
            <Input {...register('nom_complet')} placeholder="Prénom Nom" className="h-11 text-sm placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Téléphone *" error={errors.telephone?.message}>
              <Input {...register('telephone')} className="h-11 text-sm placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
            </Field>
            <Field label="Email *" error={errors.email?.message}>
              <Input {...register('email')} type="email" placeholder="exemple@email.com" className="h-11 text-sm placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mot de passe *" error={errors.password?.message}>
              <div className="relative">
                <Input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Minimum 8 caractères" className="h-11 text-sm pr-10 placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(100,170,210,0.7)' }} onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            <Field label="Confirmer le mot de passe *" error={errors.confirm_password?.message}>
              <div className="relative">
                <Input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className="h-11 text-sm pr-10 placeholder:text-[#4E7E9C]" style={neonInputStyle} onFocus={focusNeon} onBlur={blurNeon} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(100,170,210,0.7)' }} onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>{error}</div>
          )}

          <NeonSubmit loading={isSubmitting}>
            {isSubmitting
              ? (EMAIL_VERIFICATION_ENABLED ? 'Envoi du code…' : 'Création du compte…')
              : (EMAIL_VERIFICATION_ENABLED ? 'Continuer — vérifier mon email' : 'Créer mon compte')}
          </NeonSubmit>

          <p className="text-center text-sm" style={{ color: 'rgba(120,190,230,0.7)' }}>
            Déjà inscrit ?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: 'rgba(0,200,255,0.85)' }}>Se connecter</Link>
          </p>
        </form>
      </NeonCard>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function InscriptionPage() {
  const [role, setRole] = useState<Role | null>(null)
  const [pending, setPending] = useState<PendingRegistration | null>(null)

  return (
    <div className="min-h-screen bg-[#060F1E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(112,177,196,0.10) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(61,143,168,0.20) 0%, transparent 65%)' }} />
      <div className="absolute bottom-[-150px] left-[-80px] w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(112,177,196,0.14) 0%, transparent 65%)' }} />

      <div className="relative z-10 w-full flex items-center justify-center py-8">
        {!pending && role === null && <RoleStep onSelect={setRole} />}
        {!pending && role === 'medecin' && <MedecinForm onBack={() => setRole(null)} onPendingVerification={setPending} />}
        {!pending && role === 'secretaire' && <SecretaireForm onBack={() => setRole(null)} onPendingVerification={setPending} />}
        {pending && (
          <VerificationStep
            email={pending.email}
            onVerified={pending.registerFn}
            onBack={() => setPending(null)}
          />
        )}
      </div>

      <p className="absolute bottom-4 left-0 right-0 text-center text-white/25 text-xs">
        En créant un compte, vous acceptez nos conditions d&apos;utilisation · Données conformes RGPD
      </p>
    </div>
  )
}
