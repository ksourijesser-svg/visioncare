'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, Search, ArrowLeft, X, Calendar, Clock } from 'lucide-react'
import { publicApi } from '@/lib/api'

interface Doctor {
  id: number
  nom: string
  prenom: string
  cabinet: string | null
  specialisation: string | null
}

interface BusySlot {
  date_heure: string
  duree: number
}

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-gray-700 font-medium block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}

export default function PriseRdvPage() {
  const [doctorQuery, setDoctorQuery] = useState('')
  const [doctorResults, setDoctorResults] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)

  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [date, setDate] = useState('')
  const [heure, setHeure] = useState('')
  const [motif, setMotif] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [showCalendar, setShowCalendar] = useState(false)
  const [busySlots, setBusySlots] = useState<BusySlot[]>([])
  const [loadingCalendar, setLoadingCalendar] = useState(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleDoctorInput(value: string) {
    setDoctorQuery(value)
    setSelectedDoctor(null)
    if (value.length < 2) {
      setDoctorResults([])
      setShowDropdown(false)
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await publicApi.searchDoctors(value)
        setDoctorResults(res.data)
        setShowDropdown(true)
      } catch {
        setDoctorResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  function selectDoctor(doctor: Doctor) {
    setSelectedDoctor(doctor)
    setDoctorQuery(`Dr. ${doctor.prenom} ${doctor.nom}`)
    setShowDropdown(false)
    setDoctorResults([])
  }

  function clearDoctor() {
    setSelectedDoctor(null)
    setDoctorQuery('')
    setDoctorResults([])
    setShowDropdown(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!selectedDoctor) errs.doctor = 'Veuillez sélectionner un médecin'
    if (!nom.trim()) errs.nom = 'Nom requis'
    if (!prenom.trim()) errs.prenom = 'Prénom requis'
    if (!telephone.trim()) errs.telephone = 'Téléphone requis'
    if (!date) errs.date = 'Date requise'
    if (!heure) errs.heure = 'Heure requise'
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setFieldErrors({})
    setError('')
    setConflict(false)
    setSubmitting(true)
    try {
      await publicApi.createRdv({
        medecin_id: selectedDoctor!.id,
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        adresse: adresse.trim() || null,
        date_heure: `${date}T${heure}:00`,
        motif: motif.trim() || null,
      })
      setSuccess(true)
    } catch (err) {
      const res = (err as { response?: { status?: number; data?: { detail?: string } } }).response
      if (res?.status === 409) {
        setConflict(true)
        setError(res.data?.detail || 'Temps occupé, voir le calendrier du médecin')
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function openCalendar() {
    if (!selectedDoctor) return
    setShowCalendar(true)
    setLoadingCalendar(true)
    try {
      const res = await publicApi.doctorBusy(selectedDoctor.id)
      setBusySlots(res.data)
    } catch {
      setBusySlots([])
    } finally {
      setLoadingCalendar(false)
    }
  }

  const fmtTime = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const groupedSlots = busySlots.reduce((acc, s) => {
    const start = new Date(s.date_heure)
    const end = new Date(start.getTime() + s.duree * 60000)
    const dayKey = start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    ;(acc[dayKey] ||= []).push({ start, end })
    return acc
  }, {} as Record<string, { start: Date; end: Date }[]>)

  const inputClass = (err?: string) =>
    `w-full h-10 rounded-lg border ${err ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[#3d8fa8]'} px-3 text-sm focus:outline-none focus:ring-2 transition-colors bg-white text-[#1A2B3C]`

  if (success) {
    return (
      <div className="min-h-screen bg-[#060F1E] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(112,177,196,0.10) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(61,143,168,0.18) 0%, transparent 65%)' }} />
        <div className="relative bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A2B3C] mb-2">Rendez-vous confirmé !</h2>
          <p className="text-gray-500 mb-2 text-sm leading-relaxed">
            Votre demande de rendez-vous a bien été enregistrée.
          </p>
          {selectedDoctor && (
            <div className="bg-[#F0F6FA] rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-1">Médecin</p>
              <p className="font-semibold text-[#1A2B3C]">Dr. {selectedDoctor.prenom} {selectedDoctor.nom}</p>
              {selectedDoctor.cabinet && <p className="text-sm text-gray-500">{selectedDoctor.cabinet}</p>}
              <div className="mt-2 border-t border-gray-200 pt-2">
                <p className="text-xs text-gray-500">Date &amp; Heure</p>
                <p className="font-medium text-[#1A2B3C] text-sm">
                  {new Date(`${date}T${heure}:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {heure}
                </p>
              </div>
            </div>
          )}
          <Link href="/" className="inline-block w-full bg-[#3d8fa8] hover:bg-[#2d7a94] text-white font-semibold py-3 rounded-xl transition-colors text-sm">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060F1E] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(112,177,196,0.10) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute top-[-180px] right-[-80px] w-[700px] h-[700px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(61,143,168,0.18) 0%, transparent 65%)' }} />
      <div className="absolute bottom-[-120px] left-[-60px] w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(112,177,196,0.12) 0%, transparent 65%)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#3d8fa8] flex items-center justify-center shadow-md shadow-[#3d8fa8]/40">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">VisionCare</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
          <ArrowLeft size={15} />
          Retour à l&apos;accueil
        </Link>
      </nav>

      {/* Form container */}
      <div className="relative z-10 flex items-start justify-center px-4 pb-12 pt-6">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 text-white/80 text-sm font-semibold rounded-full px-4 py-1.5 mb-4 backdrop-blur-sm">
              <span className="w-2 h-2 bg-[#70B1C4] rounded-full" />
              Accès direct sans inscription
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Prendre un rendez-vous</h1>
            <p className="text-white/55 text-sm">Remplissez le formulaire, votre médecin recevra la demande immédiatement.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Doctor search */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#C5D8E6] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#3d8fa8" strokeWidth={2} className="w-3.5 h-3.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <h2 className="font-bold text-[#1A2B3C] text-sm">Rechercher votre médecin</h2>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <div className={`flex items-center gap-2 h-10 rounded-lg border ${fieldErrors.doctor ? 'border-red-300' : 'border-gray-200'} px-3 bg-white focus-within:ring-2 focus-within:ring-[#3d8fa8] transition-all`}>
                    {searching ? <Loader2 size={15} className="text-gray-400 animate-spin shrink-0" /> : <Search size={15} className="text-gray-400 shrink-0" />}
                    <input
                      type="text"
                      placeholder="Nom du médecin ou du cabinet..."
                      value={doctorQuery}
                      onChange={(e) => handleDoctorInput(e.target.value)}
                      onFocus={() => doctorResults.length > 0 && setShowDropdown(true)}
                      className="flex-1 text-sm outline-none bg-transparent text-[#1A2B3C] placeholder:text-gray-400"
                    />
                    {selectedDoctor && (
                      <button type="button" onClick={clearDoctor} className="text-gray-400 hover:text-gray-600 shrink-0">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {showDropdown && doctorResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      {doctorResults.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => selectDoctor(d)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F0F6FA] transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#3d8fa8]/15 flex items-center justify-center text-[#3d8fa8] text-xs font-bold shrink-0">
                            {d.prenom[0]}{d.nom[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1A2B3C]">Dr. {d.prenom} {d.nom}</p>
                            <p className="text-xs text-gray-500 truncate">{d.cabinet ?? ''}{d.specialisation ? ` · ${d.specialisation}` : ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && doctorResults.length === 0 && !searching && doctorQuery.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 px-4 py-3 text-sm text-gray-500">
                      Aucun médecin trouvé pour « {doctorQuery} »
                    </div>
                  )}
                </div>

                {selectedDoctor && (
                  <div className="mt-2 bg-[#F0F6FA] border border-[#3d8fa8]/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#3d8fa8]/20 flex items-center justify-center text-[#3d8fa8] text-xs font-bold shrink-0">
                      {selectedDoctor.prenom[0]}{selectedDoctor.nom[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A2B3C]">Dr. {selectedDoctor.prenom} {selectedDoctor.nom}</p>
                      {selectedDoctor.cabinet && <p className="text-xs text-gray-500">{selectedDoctor.cabinet}{selectedDoctor.specialisation ? ` · ${selectedDoctor.specialisation}` : ''}</p>}
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-500 ml-auto shrink-0" />
                  </div>
                )}
                {fieldErrors.doctor && <p className="text-red-500 text-xs mt-1">{fieldErrors.doctor}</p>}
              </div>

              <div className="border-t border-gray-100" />

              {/* Patient info */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#C5D8E6] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#3d8fa8" strokeWidth={2} className="w-3.5 h-3.5">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                  </div>
                  <h2 className="font-bold text-[#1A2B3C] text-sm">Vos informations</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nom" error={fieldErrors.nom} required>
                      <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Dupont" className={inputClass(fieldErrors.nom)} />
                    </Field>
                    <Field label="Prénom" error={fieldErrors.prenom} required>
                      <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Jean" className={inputClass(fieldErrors.prenom)} />
                    </Field>
                  </div>
                  <Field label="Téléphone" error={fieldErrors.telephone} required>
                    <input value={telephone} onChange={e => setTelephone(e.target.value)} className={inputClass(fieldErrors.telephone)} />
                  </Field>
                  <Field label="Adresse (optionnel)">
                    <input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Votre adresse" className={inputClass()} />
                  </Field>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Date + time */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#C5D8E6] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#3d8fa8" strokeWidth={2} className="w-3.5 h-3.5">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <h2 className="font-bold text-[#1A2B3C] text-sm">Date &amp; Heure du rendez-vous</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date" error={fieldErrors.date} required>
                    <input
                      type="date"
                      value={date}
                      onChange={e => { setDate(e.target.value); setConflict(false); setError('') }}
                      min={new Date().toISOString().split('T')[0]}
                      className={inputClass(fieldErrors.date)}
                    />
                  </Field>
                  <Field label="Heure" error={fieldErrors.heure} required>
                    <input
                      type="time"
                      value={heure}
                      onChange={e => { setHeure(e.target.value); setConflict(false); setError('') }}
                      min="08:00"
                      max="19:00"
                      className={inputClass(fieldErrors.heure)}
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Motif (optionnel)">
                    <input value={motif} onChange={e => setMotif(e.target.value)} placeholder="Ex: Contrôle annuel, douleur, consultation..." className={inputClass()} />
                  </Field>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                  <p>{error}</p>
                  {conflict && (
                    <button
                      type="button"
                      onClick={openCalendar}
                      className="mt-2 inline-flex items-center gap-1.5 bg-[#3d8fa8] hover:bg-[#2d7a94] text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition-colors"
                    >
                      <Calendar size={13} />
                      Voir calendrier
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#3d8fa8] hover:bg-[#2d7a94] disabled:opacity-60 text-white font-semibold h-12 rounded-xl shadow-lg shadow-[#3d8fa8]/30 transition-all text-base"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? 'Envoi en cours...' : 'Confirmer le rendez-vous'}
              </button>

              <p className="text-center text-xs text-gray-400">
                Vous êtes médecin ?{' '}
                <Link href="/login" className="text-[#3d8fa8] font-medium hover:underline">
                  Connectez-vous
                </Link>{' '}
                ou{' '}
                <Link href="/inscription" className="text-[#3d8fa8] font-medium hover:underline">
                  créez votre compte
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
