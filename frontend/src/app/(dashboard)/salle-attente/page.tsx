'use client'

import { useEffect, useState } from 'react'
import { Clock, Loader2, UserPlus, Stethoscope, CheckCircle2, ChevronRight, ChevronLeft, Hourglass, CalendarClock, Users, X, Banknote } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { useSalleAttente, useUpdateSalleStatut, type SalleRdv, type SalleStatut } from '@/hooks/useSalleAttente'

type ColKey = 'avenir' | 'attente' | 'en_consultation' | 'termine'

const COLUMNS: { key: ColKey; title: string; icon: typeof Clock; accent: string; headBg: string; ring: string }[] = [
  { key: 'avenir',          title: 'À venir',         icon: CalendarClock, accent: 'text-slate-500 dark:text-[#7AAABB]', headBg: 'bg-slate-100 dark:bg-[#0E2438]', ring: 'border-slate-200 dark:border-[#1C3F62]/40' },
  { key: 'attente',         title: 'En attente',      icon: Hourglass,     accent: 'text-amber-600 dark:text-amber-400', headBg: 'bg-amber-50 dark:bg-amber-900/20', ring: 'border-amber-200 dark:border-amber-700/30' },
  { key: 'en_consultation', title: 'En consultation', icon: Stethoscope,   accent: 'text-[#3d8fa8] dark:text-[#70B1C4]', headBg: 'bg-[#E4F0F4] dark:bg-[#13344b]', ring: 'border-[#bcdde6] dark:border-[#1C3F62]/60' },
  { key: 'termine',         title: 'Terminé',         icon: CheckCircle2,  accent: 'text-emerald-600 dark:text-emerald-400', headBg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'border-emerald-200 dark:border-emerald-700/30' },
]

function colOf(r: SalleRdv): ColKey {
  if (r.salle_statut === 'attente') return 'attente'
  if (r.salle_statut === 'en_consultation') return 'en_consultation'
  if (r.salle_statut === 'termine') return 'termine'
  return 'avenir'
}

function waitMinutes(iso: string | null, now: number): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (isNaN(t)) return null
  return Math.max(0, Math.floor((now - t) / 60000))
}

export default function SalleAttentePage() {
  const { data: rdvs = [], isLoading } = useSalleAttente()
  const update = useUpdateSalleStatut()
  const [now, setNow] = useState(() => Date.now())

  // Modal "prix de consultation" — ouvert lorsqu'on termine une consultation
  const [pricingFor, setPricingFor] = useState<SalleRdv | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [priceError, setPriceError] = useState('')

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const grouped: Record<ColKey, SalleRdv[]> = { avenir: [], attente: [], en_consultation: [], termine: [] }
  for (const r of rdvs) grouped[colOf(r)].push(r)

  function move(r: SalleRdv, to: SalleStatut) {
    // Avant de marquer "Terminé", demander le prix de la consultation
    if (to === 'termine') {
      setPricingFor(r)
      setPriceInput(r.prix_consultation != null ? String(r.prix_consultation) : '')
      setPriceError('')
      return
    }
    update.mutate({ id: r.id, salle_statut: to })
  }

  function confirmTermine() {
    if (!pricingFor) return
    const value = parseFloat(priceInput.replace(',', '.'))
    if (priceInput.trim() === '' || isNaN(value) || value < 0) {
      setPriceError('Veuillez saisir un prix valide')
      return
    }
    update.mutate(
      { id: pricingFor.id, salle_statut: 'termine', prix_consultation: value },
      { onSuccess: () => setPricingFor(null) },
    )
  }

  // Forward / backward transitions per column
  const NEXT: Record<ColKey, SalleStatut> = { avenir: 'attente', attente: 'en_consultation', en_consultation: 'termine', termine: null }
  const PREV: Record<ColKey, SalleStatut> = { avenir: null, attente: null, en_consultation: 'attente', termine: 'en_consultation' }
  const NEXT_LABEL: Record<ColKey, string> = { avenir: 'Arrivé', attente: 'Appeler', en_consultation: 'Terminer', termine: '' }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Salle d'attente" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* Summary strip */}
        <div className="bg-white dark:bg-[#102844] rounded-2xl glow px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E4F0F4] dark:bg-[#13344b] flex items-center justify-center">
              <Users size={17} className="text-[#3d8fa8] dark:text-[#70B1C4]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#1A2B3C] dark:text-[#EDF8FF] leading-none">{rdvs.length}</p>
              <p className="text-xs text-gray-400 dark:text-[#7AAABB]">patients aujourd&apos;hui</p>
            </div>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.key} className="flex items-center gap-2">
              <c.icon size={15} className={c.accent} />
              <span className="text-sm font-semibold text-[#1A2B3C] dark:text-[#EDF8FF]">{grouped[c.key].length}</span>
              <span className="text-xs text-gray-400 dark:text-[#7AAABB]">{c.title}</span>
            </div>
          ))}
          <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 dark:text-[#7AAABB]">
            <Loader2 size={11} className={update.isPending ? 'animate-spin' : 'hidden'} /> Actualisation auto · 30s
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400 dark:text-[#7AAABB]">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-40" />
            <p className="text-sm">Chargement de la salle d&apos;attente...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const items = grouped[col.key]
              const Icon = col.icon
              return (
                <div key={col.key} className={`rounded-2xl border ${col.ring} bg-white/60 dark:bg-[#0C1F36]/60 backdrop-blur-sm overflow-hidden flex flex-col`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${col.headBg}`}>
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={col.accent} />
                      <span className={`text-sm font-bold ${col.accent}`}>{col.title}</span>
                    </div>
                    <span className={`text-xs font-bold ${col.accent} bg-white/70 dark:bg-white/10 rounded-full w-6 h-6 flex items-center justify-center`}>{items.length}</span>
                  </div>

                  <div className="p-3 space-y-2.5 flex-1 min-h-[120px]">
                    {items.length === 0 ? (
                      <p className="text-center text-xs text-gray-300 dark:text-[#456b80] py-8">Aucun patient</p>
                    ) : (
                      items.map((r) => {
                        const wait = waitMinutes(r.heure_arrivee, now)
                        return (
                          <div key={r.id} className="rounded-xl bg-white dark:bg-[#102844] border border-gray-100 dark:border-[#1C3F62]/40 shadow-sm p-3 space-y-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#E4EEF4] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                                <span className="text-[11px] font-bold text-[#3d8fa8] dark:text-[#70B1C4]">{r.patient_prenom[0]}{r.patient_nom[0]}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#1A2B3C] dark:text-[#EDF8FF] truncate leading-tight">{r.patient_prenom} {r.patient_nom}</p>
                                <p className="text-xs text-gray-400 dark:text-[#7AAABB] truncate">{r.motif || 'Consultation'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              <span className="inline-flex items-center gap-1 text-gray-500 dark:text-[#B4D0E0]">
                                <Clock size={11} className="text-gray-400 dark:text-[#7AAABB]" /> {r.heure}
                              </span>
                              {col.key === 'attente' && wait !== null && (
                                <span className={`inline-flex items-center gap-1 font-medium ${wait >= 20 ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                  <Hourglass size={11} /> {wait} min d&apos;attente
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 pt-1">
                              {PREV[col.key] !== undefined && col.key !== 'avenir' && col.key !== 'attente' && (
                                <button onClick={() => move(r, PREV[col.key])} title="Reculer"
                                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1C3F62]/50 transition-colors">
                                  <ChevronLeft size={14} />
                                </button>
                              )}
                              {NEXT[col.key] !== null && (
                                <button onClick={() => move(r, NEXT[col.key])}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-[#70B1C4] hover:bg-[#5a9db8] text-white transition-colors btn-neon">
                                  {col.key === 'avenir' && <UserPlus size={13} />}
                                  {col.key === 'attente' && <Stethoscope size={13} />}
                                  {col.key === 'en_consultation' && <CheckCircle2 size={13} />}
                                  {NEXT_LABEL[col.key]}
                                  {col.key !== 'en_consultation' && <ChevronRight size={13} />}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
