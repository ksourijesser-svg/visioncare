'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, Search, ArrowLeft, X, Calendar, Clock, MapPin, Star, ExternalLink, Building2 } from 'lucide-react'
import { publicApi } from '@/lib/api'
import { NeonCard, NeonSubmit, neonInputStyle, neonInputErrorStyle, focusNeon, blurNeon, neonLabelStyle, neonFieldClass } from '@/components/ui/neon'

interface Doctor {
  id: number
  nom: string
  prenom: string
  cabinet: string | null
  specialisation: string | null
  adresse: string | null
  bio: string | null
  google_maps_url: string | null
  photo: string | null
}

function DoctorAvatar({ doctor, size = 36 }: { doctor: Doctor; size?: number }) {
  if (doctor.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={doctor.photo}
        alt={`Dr. ${doctor.prenom} ${doctor.nom}`}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, border: '1px solid rgba(0,200,255,0.3)' }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.32, background: 'rgba(0,150,220,0.18)', color: '#00D4FF' }}
    >
      {doctor.prenom[0]}{doctor.nom[0]}
    </div>
  )
}

interface BusySlot {
  date_heure: string
  duree: number
}

interface Review {
  author_name: string | null
  rating: number | null
  text: string | null
  relative_time: string | null
  profile_photo_url: string | null
}

interface PlaceInfo {
  embed_q: string | null
  maps_url: string | null
  rating: number | null
  total: number | null
  reviews: Review[]
}

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="block" style={neonLabelStyle}>
        {label}{required && <span className="ml-0.5" style={{ color: '#FF7B7B' }}>*</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: '#FF7B7B' }}>{error}</p>}
    </div>
  )
}

export default function PriseRdvPage() {
  const [doctorQuery, setDoctorQuery] = useState('')
  const [doctorResults, setDoctorResults] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null)
  const [loadingPlace, setLoadingPlace] = useState(false)

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
    loadPlace(doctor)
  }

  async function loadPlace(doctor: Doctor) {
    setPlaceInfo(null)
    if (!doctor.google_maps_url && !doctor.adresse) return
    setLoadingPlace(true)
    try {
      const res = await publicApi.doctorPlace(doctor.id)
      setPlaceInfo(res.data)
    } catch {
      setPlaceInfo(null)
    } finally {
      setLoadingPlace(false)
    }
  }

  function clearDoctor() {
    setSelectedDoctor(null)
    setDoctorQuery('')
    setDoctorResults([])
    setShowDropdown(false)
    setPlaceInfo(null)
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

  const inputProps = (err?: string) => ({
    className: neonFieldClass,
    style: err ? neonInputErrorStyle : neonInputStyle,
    onFocus: focusNeon,
    onBlur: blurNeon,
  })

  if (success) {
    return (
      <div className="min-h-screen bg-[#060F1E] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(112,177,196,0.10) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(61,143,168,0.18) 0%, transparent 65%)' }} />
        <div className="relative z-10 w-full max-w-md">
          <NeonCard className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)' }}>
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#D0EEFF' }}>Rendez-vous confirmé !</h2>
            <p className="mb-2 text-sm leading-relaxed" style={{ color: 'rgba(120,190,230,0.7)' }}>
              Votre demande de rendez-vous a bien été enregistrée.
            </p>
            {selectedDoctor && (
              <div className="rounded-xl p-4 mb-6 text-left" style={{ background: 'rgba(0,150,220,0.08)', border: '1px solid rgba(0,200,255,0.18)' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(120,190,230,0.6)' }}>Médecin</p>
                <p className="font-semibold" style={{ color: '#D0EEFF' }}>Dr. {selectedDoctor.prenom} {selectedDoctor.nom}</p>
                {selectedDoctor.cabinet && <p className="text-sm" style={{ color: 'rgba(120,190,230,0.7)' }}>{selectedDoctor.cabinet}</p>}
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(0,180,255,0.15)' }}>
                  <p className="text-xs" style={{ color: 'rgba(120,190,230,0.6)' }}>Date &amp; Heure</p>
                  <p className="font-medium text-sm" style={{ color: '#D0EEFF' }}>
                    {new Date(`${date}T${heure}:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {heure}
                  </p>
                </div>
              </div>
            )}
            <Link
              href="/"
              className="inline-block w-full text-white font-semibold py-3 rounded-xl transition-all text-sm"
              style={{ background: 'linear-gradient(135deg, #007BB8 0%, #00AADD 50%, #0095CC 100%)', border: '1px solid rgba(0,200,255,0.5)', boxShadow: '0 4px 20px rgba(0,150,220,0.4)' }}
            >
              Retour à l&apos;accueil
            </Link>
          </NeonCard>
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
          <span className="text-lg font-bold text-white">Ophtech</span>
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

          <NeonCard>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Doctor search */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,100,180,0.3)', border: '1px solid rgba(0,200,255,0.3)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth={2} className="w-3.5 h-3.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <h2 className="font-bold text-sm" style={{ color: '#D0EEFF' }}>Rechercher votre médecin</h2>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <div className="flex items-center gap-2 h-11 px-3 transition-all" style={fieldErrors.doctor ? neonInputErrorStyle : neonInputStyle}>
                    {searching ? <Loader2 size={15} className="animate-spin shrink-0" style={{ color: 'rgba(120,190,230,0.7)' }} /> : <Search size={15} className="shrink-0" style={{ color: 'rgba(120,190,230,0.7)' }} />}
                    <input
                      type="text"
                      placeholder="Nom du médecin ou du cabinet..."
                      value={doctorQuery}
                      onChange={(e) => handleDoctorInput(e.target.value)}
                      onFocus={() => doctorResults.length > 0 && setShowDropdown(true)}
                      className="flex-1 text-sm outline-none bg-transparent placeholder:text-[#4E7E9C]"
                      style={{ color: '#C8E8FF' }}
                    />
                    {selectedDoctor && (
                      <button type="button" onClick={clearDoctor} className="shrink-0" style={{ color: 'rgba(120,190,230,0.7)' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {showDropdown && doctorResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-20 overflow-hidden" style={{ background: '#06182B', border: '1px solid rgba(0,150,210,0.35)' }}>
                      {doctorResults.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => selectDoctor(d)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <DoctorAvatar doctor={d} size={36} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: '#D0EEFF' }}>Dr. {d.prenom} {d.nom}</p>
                            <p className="text-xs truncate" style={{ color: 'rgba(120,190,230,0.6)' }}>{d.cabinet ?? ''}{d.specialisation ? ` · ${d.specialisation}` : ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && doctorResults.length === 0 && !searching && doctorQuery.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-20 px-4 py-3 text-sm" style={{ background: '#06182B', border: '1px solid rgba(0,150,210,0.35)', color: 'rgba(120,190,230,0.7)' }}>
                      Aucun médecin trouvé pour « {doctorQuery} »
                    </div>
                  )}
                </div>

                {selectedDoctor && (
                  <div className="mt-2 rounded-xl overflow-hidden" style={{ background: 'rgba(0,150,220,0.10)', border: '1px solid rgba(0,200,255,0.25)' }}>
                    {/* Hero header — portrait blended into the blue design */}
                    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,95,165,0.40) 0%, rgba(0,45,95,0.12) 60%, rgba(0,30,70,0.05) 100%)' }}>
                      {selectedDoctor.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedDoctor.photo}
                          alt={`Dr. ${selectedDoctor.prenom} ${selectedDoctor.nom}`}
                          className="absolute top-0 right-0 h-full w-[50%] object-contain object-right-top pointer-events-none select-none"
                          style={{
                            // Single radial mask (no compositing → reliable everywhere): the
                            // face area stays opaque while every edge dissolves into the blue card.
                            WebkitMaskImage:
                              'radial-gradient(ellipse 92% 100% at 82% 34%, #000 38%, rgba(0,0,0,0.45) 68%, transparent 100%)',
                            maskImage:
                              'radial-gradient(ellipse 92% 100% at 82% 34%, #000 38%, rgba(0,0,0,0.45) 68%, transparent 100%)',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                          } as React.CSSProperties}
                        />
                      ) : (
                        <div className="absolute top-1/2 right-4 -translate-y-1/2">
                          <DoctorAvatar doctor={selectedDoctor} size={64} />
                        </div>
                      )}

                      <div className="relative px-4 py-4" style={{ maxWidth: '60%', minHeight: '170px' }}>
                        {selectedDoctor.specialisation && (
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2" style={{ background: 'rgba(0,200,255,0.16)', color: '#8FE3FF', border: '1px solid rgba(0,200,255,0.25)' }}>
                            {selectedDoctor.specialisation}
                          </span>
                        )}
                        <p className="text-lg font-bold leading-tight" style={{ color: '#EAF7FF' }}>Dr. {selectedDoctor.prenom} {selectedDoctor.nom}</p>
                        {selectedDoctor.cabinet && (
                          <p className="text-xs flex items-center gap-1.5 mt-2" style={{ color: 'rgba(160,210,245,0.8)' }}>
                            <Building2 size={12} className="shrink-0" /> {selectedDoctor.cabinet}
                          </p>
                        )}
                        {selectedDoctor.adresse && (
                          <p className="text-xs flex items-start gap-1.5 mt-1" style={{ color: 'rgba(120,190,230,0.65)' }}>
                            <MapPin size={12} className="shrink-0 mt-0.5" /> <span>{selectedDoctor.adresse}</span>
                          </p>
                        )}
                      </div>

                      <span className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full" style={{ background: 'rgba(3,16,34,0.55)', backdropFilter: 'blur(4px)' }}>
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      </span>
                    </div>

                    {/* Doctor bio / presentation */}
                    {selectedDoctor.bio && (
                      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(0,180,255,0.15)' }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(0,200,255,0.75)' }}>À propos</p>
                        <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'rgba(185,218,242,0.82)' }}>{selectedDoctor.bio}</p>
                      </div>
                    )}

                    {loadingPlace && (
                      <div className="flex items-center justify-center py-6" style={{ borderTop: '1px solid rgba(0,180,255,0.15)' }}>
                        <Loader2 size={18} className="animate-spin" style={{ color: '#00D4FF' }} />
                      </div>
                    )}

                    {/* Map — rendered from the doctor's Google Maps link (fallback: address) */}
                    {placeInfo?.embed_q && (
                      <div className="relative" style={{ borderTop: '1px solid rgba(0,180,255,0.15)' }}>
                        <iframe
                          title="Localisation du cabinet"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(placeInfo.embed_q)}&z=16&output=embed`}
                          className="w-full h-44 block"
                          style={{ border: 0, filter: 'grayscale(0.2) contrast(1.05)' }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <a
                          href={placeInfo.maps_url || `https://maps.google.com/maps?q=${encodeURIComponent(placeInfo.embed_q)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium backdrop-blur-sm"
                          style={{ background: 'rgba(3,16,34,0.85)', border: '1px solid rgba(0,200,255,0.3)', color: '#00D4FF' }}
                        >
                          <MapPin size={11} /> Itinéraire
                        </a>
                      </div>
                    )}

                    {/* Avis Google — inline reviews (when a Places API key is configured) */}
                    {selectedDoctor.google_maps_url && (
                      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(0,180,255,0.15)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Star size={15} className="shrink-0" style={{ color: '#FFC53D', fill: '#FFC53D' }} />
                          <span className="text-sm font-semibold" style={{ color: '#D0EEFF' }}>Avis Google</span>
                          {placeInfo?.rating != null && (
                            <span className="text-xs font-semibold ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,197,61,0.14)', color: '#FFD66B' }}>
                              {placeInfo.rating.toFixed(1)} ★{placeInfo.total != null ? ` · ${placeInfo.total} avis` : ''}
                            </span>
                          )}
                        </div>

                        {placeInfo && placeInfo.reviews.length > 0 ? (
                          <div className="space-y-2.5">
                            {placeInfo.reviews.slice(0, 2).map((r, i) => (
                              <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(0,30,60,0.5)', border: '1px solid rgba(0,150,210,0.18)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold truncate" style={{ color: '#D0EEFF' }}>{r.author_name || 'Patient'}</span>
                                  {r.rating != null && (
                                    <span className="text-xs shrink-0" style={{ color: '#FFD66B' }}>
                                      {'★'.repeat(Math.round(r.rating))}<span style={{ color: 'rgba(120,190,230,0.3)' }}>{'★'.repeat(5 - Math.round(r.rating))}</span>
                                    </span>
                                  )}
                                  {r.relative_time && <span className="text-[11px] ml-auto shrink-0" style={{ color: 'rgba(120,190,230,0.5)' }}>{r.relative_time}</span>}
                                </div>
                                {r.text && <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'rgba(180,215,240,0.8)' }}>{r.text}</p>}
                              </div>
                            ))}
                          </div>
                        ) : !loadingPlace ? (
                          <p className="text-xs mb-3" style={{ color: 'rgba(120,190,230,0.7)' }}>
                            Consultez les avis vérifiés des patients sur la fiche Google de votre médecin.
                          </p>
                        ) : null}

                        <a
                          href={selectedDoctor.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all"
                          style={{ background: 'linear-gradient(135deg, #007BB8, #00AADD)', color: '#fff', border: '1px solid rgba(0,200,255,0.4)' }}
                        >
                          <Star size={14} style={{ fill: '#fff' }} />
                          {placeInfo && placeInfo.reviews.length > 0 ? 'Voir tous les avis sur Google' : 'Voir les avis sur Google'}
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {fieldErrors.doctor && <p className="text-xs mt-1" style={{ color: '#FF7B7B' }}>{fieldErrors.doctor}</p>}
              </div>

              <div style={{ borderTop: '1px solid rgba(0,180,255,0.12)' }} />

              {/* Patient info */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,100,180,0.3)', border: '1px solid rgba(0,200,255,0.3)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth={2} className="w-3.5 h-3.5">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                  </div>
                  <h2 className="font-bold text-sm" style={{ color: '#D0EEFF' }}>Vos informations</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nom" error={fieldErrors.nom} required>
                      <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Dupont" {...inputProps(fieldErrors.nom)} />
                    </Field>
                    <Field label="Prénom" error={fieldErrors.prenom} required>
                      <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Jean" {...inputProps(fieldErrors.prenom)} />
                    </Field>
                  </div>
                  <Field label="Téléphone" error={fieldErrors.telephone} required>
                    <input value={telephone} onChange={e => setTelephone(e.target.value)} {...inputProps(fieldErrors.telephone)} />
                  </Field>
                  <Field label="Adresse (optionnel)">
                    <input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Votre adresse" {...inputProps()} />
                  </Field>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(0,180,255,0.12)' }} />

              {/* Date + time */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,100,180,0.3)', border: '1px solid rgba(0,200,255,0.3)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth={2} className="w-3.5 h-3.5">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <h2 className="font-bold text-sm" style={{ color: '#D0EEFF' }}>Date &amp; Heure du rendez-vous</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date" error={fieldErrors.date} required>
                    <input
                      type="date"
                      value={date}
                      onChange={e => { setDate(e.target.value); setConflict(false); setError('') }}
                      min={new Date().toISOString().split('T')[0]}
                      {...inputProps(fieldErrors.date)}
                    />
                  </Field>
                  <Field label="Heure" error={fieldErrors.heure} required>
                    <input
                      type="time"
                      value={heure}
                      onChange={e => { setHeure(e.target.value); setConflict(false); setError('') }}
                      min="08:00"
                      max="19:00"
                      {...inputProps(fieldErrors.heure)}
                    />
                  </Field>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={openCalendar}
                    disabled={!selectedDoctor}
                    className="inline-flex items-center gap-1.5 font-semibold text-sm transition-colors disabled:cursor-not-allowed"
                    style={{ color: selectedDoctor ? 'rgba(0,200,255,0.85)' : 'rgba(120,190,230,0.4)' }}
                  >
                    <Calendar size={15} />
                    Voir calendrier
                  </button>
                  {!selectedDoctor && (
                    <p className="text-xs mt-1" style={{ color: 'rgba(120,190,230,0.5)' }}>Sélectionnez d&apos;abord un médecin pour voir ses disponibilités.</p>
                  )}
                </div>
                <div className="mt-4">
                  <Field label="Motif (optionnel)">
                    <input value={motif} onChange={e => setMotif(e.target.value)} placeholder="Ex: Contrôle annuel, douleur, consultation..." {...inputProps()} />
                  </Field>
                </div>
              </div>

              {error && (
                <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
                  <p>{error}</p>
                  {conflict && (
                    <button
                      type="button"
                      onClick={openCalendar}
                      className="mt-2 inline-flex items-center gap-1.5 text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition-all"
                      style={{ background: 'linear-gradient(135deg, #007BB8, #00AADD)', border: '1px solid rgba(0,200,255,0.4)' }}
                    >
                      <Calendar size={13} />
                      Voir calendrier
                    </button>
                  )}
                </div>
              )}

              <NeonSubmit loading={submitting}>
                {submitting ? 'Envoi en cours...' : 'Confirmer le rendez-vous'}
              </NeonSubmit>

              <p className="text-center text-xs" style={{ color: 'rgba(120,190,230,0.6)' }}>
                Vous êtes médecin ?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: 'rgba(0,200,255,0.85)' }}>
                  Connectez-vous
                </Link>{' '}
                ou{' '}
                <Link href="/inscription" className="font-medium hover:underline" style={{ color: 'rgba(0,200,255,0.85)' }}>
                  créez votre compte
                </Link>
              </p>
            </form>
          </NeonCard>
        </div>
      </div>

      {/* Doctor calendar — read-only occupied slots */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCalendar(false)}
        >
          <div
            className="rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            style={{ background: 'rgba(3, 16, 34, 0.96)', border: '1px solid rgba(0,150,210,0.35)', backdropFilter: 'blur(22px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,180,255,0.12)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <Calendar size={18} className="shrink-0" style={{ color: '#00D4FF' }} />
                <h3 className="font-bold text-sm truncate" style={{ color: '#D0EEFF' }}>
                  Calendrier{selectedDoctor ? ` · Dr. ${selectedDoctor.prenom} ${selectedDoctor.nom}` : ''}
                </h3>
              </div>
              <button type="button" onClick={() => setShowCalendar(false)} className="shrink-0" style={{ color: 'rgba(120,190,230,0.7)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <p className="text-xs mb-4" style={{ color: 'rgba(120,190,230,0.7)' }}>
                Créneaux déjà occupés. Choisissez un horaire libre pour votre rendez-vous.
              </p>
              {loadingCalendar ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={22} className="animate-spin" style={{ color: '#00D4FF' }} />
                </div>
              ) : busySlots.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: 'rgba(120,190,230,0.7)' }}>
                  Aucun créneau occupé à venir. Toutes les heures sont disponibles.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedSlots).map(([day, slots]) => (
                    <div key={day}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#00D4FF' }}>{day}</p>
                      <div className="flex flex-wrap gap-2">
                        {slots.map((s, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                            style={{ background: 'rgba(248,113,113,0.12)', color: '#FCA5A5', border: '1px solid rgba(248,113,113,0.3)' }}
                          >
                            <Clock size={12} /> {fmtTime(s.start)} – {fmtTime(s.end)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
