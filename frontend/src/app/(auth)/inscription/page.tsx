'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'

const SPECIALISATIONS = [
  'Ophtalmologie', 'Cardiologie', 'Dermatologie', 'Médecine générale',
  'Pédiatrie', 'Gynécologie', 'Orthopédie', 'Neurologie', 'Psychiatrie', 'Stomatologie',
]

const TYPES_CABINET = [
  'Cabinet solo', 'Cabinet de groupe', 'Clinique privée', 'Hôpital', 'Centre médical',
]

const schema = z.object({
  nom_complet: z.string().min(2, 'Nom requis'),
  telephone: z.string().min(6, 'Téléphone requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirm_password: z.string(),
  cabinet: z.string().min(2, 'Nom du cabinet requis'),
  specialisation: z.string().min(1, 'Spécialisation requise'),
  type_cabinet: z.string().min(1, 'Type de cabinet requis'),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function InscriptionPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nom_complet: '', telephone: '', email: '', password: '', confirm_password: '', cabinet: '', specialisation: '', type_cabinet: '' },
  })

  async function onSubmit(data: FormData) {
    setError('')
    const parts = data.nom_complet.trim().split(' ')
    const prenom = parts[0]
    const nom = parts.slice(1).join(' ') || prenom

    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        nom,
        prenom,
        role: 'medecin',
        telephone: data.telephone,
        cabinet: data.cabinet,
        specialisation: data.specialisation,
        type_cabinet: data.type_cabinet,
      })
      // Auto-login after registration
      const loginRes = await authApi.login(data.email, data.password)
      setToken(loginRes.data.access_token)
      const me = await authApi.me()
      setUser(me.data)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Une erreur est survenue. Veuillez réessayer.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2d3d] via-[#1a4a5e] to-[#2d7a94] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#70B1C4] flex items-center justify-center shadow-lg shadow-[#70B1C4]/30">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">VisionCare</span>
          </Link>
          <p className="text-white/60 mt-2 text-sm">Créez votre compte médecin en 2 minutes</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Section 1 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#E4EEF4] flex items-center justify-center text-sm">👤</div>
                <h2 className="font-bold text-[#1A2B3C]">Informations personnelles</h2>
              </div>
              <div className="space-y-4">
                <Field label="Nom complet du médecin *" error={errors.nom_complet?.message}>
                  <Input {...register('nom_complet')} placeholder="Dr. Nom Prénom" className="border-gray-200 focus-visible:ring-[#70B1C4]" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Téléphone professionnel *" error={errors.telephone?.message}>
                    <Input {...register('telephone')} placeholder="+212 6 00 00 00 00" className="border-gray-200 focus-visible:ring-[#70B1C4]" />
                  </Field>
                  <Field label="Email professionnel *" error={errors.email?.message}>
                    <Input {...register('email')} type="email" placeholder="exemple@cabinet.com" className="border-gray-200 focus-visible:ring-[#70B1C4]" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Mot de passe *" error={errors.password?.message}>
                    <div className="relative">
                      <Input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Minimum 8 caractères" className="border-gray-200 focus-visible:ring-[#70B1C4] pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirmer le mot de passe *" error={errors.confirm_password?.message}>
                    <div className="relative">
                      <Input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className="border-gray-200 focus-visible:ring-[#70B1C4] pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Section 2 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#E4EEF4] flex items-center justify-center text-sm">🏥</div>
                <h2 className="font-bold text-[#1A2B3C]">Informations du Cabinet</h2>
              </div>
              <div className="space-y-4">
                <Field label="Nom du cabinet médical *" error={errors.cabinet?.message}>
                  <Input {...register('cabinet')} placeholder="Cabinet du Dr. X" className="border-gray-200 focus-visible:ring-[#70B1C4]" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Spécialisation médicale *" error={errors.specialisation?.message}>
                    <select
                      {...register('specialisation')}
                      className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] bg-white text-gray-700"
                    >
                      <option value="">Sélectionnez votre spécialité</option>
                      {SPECIALISATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Type de cabinet *" error={errors.type_cabinet?.message}>
                    <select
                      {...register('type_cabinet')}
                      className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] bg-white text-gray-700"
                    >
                      <option value="">Choisissez une option</option>
                      {TYPES_CABINET.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#70B1C4] hover:bg-[#5a9db8] text-white font-semibold h-12 rounded-xl shadow-md shadow-[#70B1C4]/30 text-base"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
              Créer mon compte et accéder au tableau de bord
            </Button>

            <p className="text-center text-sm text-gray-500">
              Déjà inscrit ?{' '}
              <Link href="/login" className="text-[#70B1C4] font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          En créant un compte, vous acceptez nos conditions d'utilisation · Données conformes RGPD
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-gray-600 font-medium">{label}</Label>
      {children}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}
