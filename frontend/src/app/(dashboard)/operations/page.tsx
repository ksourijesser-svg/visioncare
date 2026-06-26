'use client'

import { useState } from 'react'
import {
  Plus, Search, Filter, Pencil, Trash2, Scissors, Loader2,
  CalendarClock, CheckCircle2, CalendarRange, MapPin, Eye, Syringe,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/dashboard/StatCard'
import { OperationModal } from '@/components/operations/OperationModal'
import { useOperations, useDeleteOperation, type Operation, type OperationStatus } from '@/hooks/useOperations'
import { format, isSameDay, isToday, isTomorrow, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_CONFIG: Record<OperationStatus, { label: string; text: string; bg: string; border: string; dot: string }> = {
  planifiee: { label: 'Planifiée', text: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/25',   border: 'border-blue-400',  dot: 'bg-blue-400' },
  confirmee: { label: 'Confirmée', text: 'text-[#3d8fa8] dark:text-[#70B1C4]', bg: 'bg-[#E4F0F4] dark:bg-[#13344b]',    border: 'border-[#70B1C4]', dot: 'bg-[#70B1C4]' },
  terminee:  { label: 'Terminée',  text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/25', border: 'border-emerald-400', dot: 'bg-emerald-400' },
  annulee:   { label: 'Annulée',   text: 'text-gray-500 dark:text-gray-400',   bg: 'bg-gray-100 dark:bg-gray-700/30',   border: 'border-gray-300 dark:border-gray-600', dot: 'bg-gray-400' },
}

const OEIL_LABEL: Record<string, string> = { droit: 'Œil droit', gauche: 'Œil gauche', deux: 'Les deux yeux' }
const ANESTH_LABEL: Record<string, string> = { topique: 'Anesthésie topique', locale: 'Anesthésie locale', generale: 'Anesthésie générale' }

function dayLabel(d: Date): string {
  if (isToday(d)) return "Aujourd'hui"
  if (isTomorrow(d)) return 'Demain'
  return format(d, 'EEEE d MMMM yyyy', { locale: fr })
}

export default function OperationsPage() {
  const { data: operations = [], isLoading } = useOperations()
  const deleteOp = useDeleteOperation()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OperationStatus | 'tous'>('tous')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Operation | null>(null)

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const filtered = operations.filter((o) => {
    const matchSearch =
      `${o.patient_prenom} ${o.patient_nom}`.toLowerCase().includes(search.toLowerCase()) ||
      o.type_intervention.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'tous' || o.statut === statusFilter
    return matchSearch && matchStatus
  })

  // KPIs (based on all operations, not the filtered view)
  const nbPlanifiees = operations.filter((o) => o.statut === 'planifiee').length
  const nbConfirmees = operations.filter((o) => o.statut === 'confirmee').length
  const nbTerminees = operations.filter((o) => o.statut === 'terminee').length
  const nbWeek = operations.filter((o) => {
    const d = new Date(o.date_operation)
    return o.statut !== 'annulee' && d >= weekStart && d <= weekEnd
  }).length

  // Group filtered operations by day
  const groups: { day: Date; items: Operation[] }[] = []
  for (const o of filtered) {
    const d = new Date(o.date_operation)
    const last = groups[groups.length - 1]
    if (last && isSameDay(last.day, d)) last.items.push(o)
    else groups.push({ day: d, items: [o] })
  }

  function handleEdit(o: Operation) { setEditing(o); setModalOpen(true) }
  function handleDelete(id: number) { if (confirm('Supprimer cette opération ?')) deleteOp.mutate(id) }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Opérations" />
      <div className="p-6 space-y-5">

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Planifiées" value={nbPlanifiees} icon={CalendarClock} color="#2563eb" bgColor="#bfdbfe" />
          <StatCard title="Confirmées" value={nbConfirmees} icon={CheckCircle2} glowClass="glow" />
          <StatCard title="Cette semaine" value={nbWeek} icon={CalendarRange} color="#4f46e5" bgColor="#c7d2fe" glowClass="glow-violet" />
          <StatCard title="Terminées" value={nbTerminees} icon={Scissors} color="#059669" bgColor="#a7f3d0" glowClass="glow-green" />
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white dark:bg-[#102844] rounded-2xl glow px-4 py-3 flex flex-col sm:flex-row gap-3 items-center transition-colors duration-300">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7AAABB] pointer-events-none" />
            <Input
              placeholder="Rechercher par patient ou type d'intervention..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border border-gray-200 dark:border-[#1C3F62]/60 rounded-xl bg-[#F7FAFB] dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F] focus-visible:ring-[#70B1C4] h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v as OperationStatus | 'tous') }}>
            <SelectTrigger className="w-48 border border-gray-200 dark:border-[#1C3F62]/60 rounded-xl bg-[#F7FAFB] dark:bg-[#091628] dark:text-[#EDF8FF] h-10 shrink-0">
              <Filter size={13} className="mr-1.5 text-gray-400 dark:text-[#7AAABB] shrink-0" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="planifiee">Planifiée</SelectItem>
              <SelectItem value="confirmee">Confirmée</SelectItem>
              <SelectItem value="terminee">Terminée</SelectItem>
              <SelectItem value="annulee">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white shadow-md shadow-[#70B1C4]/30 shrink-0 h-10 btn-neon">
            <Plus size={16} className="mr-1.5" /> Planifier une opération
          </Button>
        </div>

        {/* ── Agenda ── */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400 dark:text-[#7AAABB]">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-40" />
            <p className="text-sm">Chargement des opérations...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white dark:bg-[#102844] rounded-2xl glow text-center py-16 text-gray-400 dark:text-[#7AAABB]">
            <Scissors size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Aucune opération planifiée</p>
            <p className="text-xs mt-1">Cliquez sur « Planifier une opération » pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.day.toISOString()}>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarClock size={15} className="text-[#3d8fa8] dark:text-[#70B1C4]" />
                  <h3 className="text-sm font-bold text-[#1A2B3C] dark:text-[#EDF8FF] capitalize">{dayLabel(g.day)}</h3>
                  <span className="text-xs text-gray-400 dark:text-[#7AAABB]">· {g.items.length} opération{g.items.length > 1 ? 's' : ''}</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-[#1C3F62]/40 ml-1" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {g.items.map((o) => {
                    const s = STATUS_CONFIG[o.statut]
                    const d = new Date(o.date_operation)
                    return (
                      <div key={o.id} className={`bg-white dark:bg-[#102844] rounded-2xl glow border-l-4 ${s.border} p-4 hover:glow-md transition-all duration-200`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex flex-col items-center justify-center w-14 shrink-0 rounded-xl bg-[#E4F0F4] dark:bg-[#13344b] py-2">
                              <span className="text-base font-bold text-[#1A2B3C] dark:text-[#EDF8FF] leading-none">{format(d, 'HH:mm')}</span>
                              <span className="text-[10px] text-gray-400 dark:text-[#7AAABB] mt-1">{o.duree} min</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-[#E4EEF4] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-bold text-[#70B1C4]">{o.patient_prenom[0]}{o.patient_nom[0]}</span>
                                </div>
                                <p className="text-sm font-bold text-[#1A2B3C] dark:text-[#EDF8FF] truncate">{o.patient_prenom} {o.patient_nom}</p>
                              </div>
                              <p className="text-sm text-[#3d8fa8] dark:text-[#70B1C4] font-semibold truncate">{o.type_intervention}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500 dark:text-[#7AAABB]">
                                {o.oeil && <span className="inline-flex items-center gap-1"><Eye size={11} /> {OEIL_LABEL[o.oeil] || o.oeil}</span>}
                                {o.anesthesie && <span className="inline-flex items-center gap-1"><Syringe size={11} /> {ANESTH_LABEL[o.anesthesie] || o.anesthesie}</span>}
                                {o.salle && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {o.salle}</span>}
                              </div>
                              {o.notes && <p className="text-xs text-gray-500 dark:text-[#B4D0E0] mt-2 line-clamp-2">{o.notes}</p>}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium w-fit ${s.bg} ${s.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
                              {s.label}
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => handleEdit(o)} title="Modifier" className="p-1.5 rounded-lg hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 text-[#70B1C4] transition-colors btn-neon">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDelete(o.id)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OperationModal open={modalOpen} onClose={() => setModalOpen(false)} operation={editing} />
    </div>
  )
}
