'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, ClipboardList, Calendar, Clock, User, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppointmentModal } from '@/components/appointments/AppointmentModal'
import { ConsultationModal } from '@/components/appointments/ConsultationModal'
import { useAppointments, useDeleteAppointment, useUpdateAppointmentStatus } from '@/hooks/useAppointments'
import type { Appointment, AppointmentStatus } from '@/store/appointmentsStore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; text: string; bg: string; border: string; dot: string }> = {
  programme: { label: 'Programmé', text: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-900/30',  border: 'border-blue-400',                            dot: 'bg-blue-400' },
  confirme:  { label: 'Confirmé',  text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-400',                           dot: 'bg-green-400' },
  complete:  { label: 'Complété',  text: 'text-gray-500 dark:text-gray-400',  bg: 'bg-gray-100 dark:bg-gray-700/30',  border: 'border-gray-300 dark:border-gray-600',       dot: 'bg-gray-400' },
  annule:    { label: 'Annulé',    text: 'text-red-500 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-400',                             dot: 'bg-red-400' },
}

export default function RendezVousPage() {
  const { data: appointments = [], isLoading } = useAppointments()
  const deleteAppointment = useDeleteAppointment()
  const updateStatus = useUpdateAppointmentStatus()

  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<AppointmentStatus | 'tous'>('tous')
  const [modalOpen, setModalOpen]         = useState(false)
  const [editingRdv, setEditingRdv]       = useState<Appointment | null>(null)
  const [consultationOpen, setConsultationOpen] = useState(false)
  const [consultationRdv, setConsultationRdv]   = useState<Appointment | null>(null)

  const filtered = appointments.filter((rdv) => {
    const matchSearch =
      `${rdv.patient_prenom} ${rdv.patient_nom}`.toLowerCase().includes(search.toLowerCase()) ||
      rdv.motif.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'tous' || rdv.statut === statusFilter
    return matchSearch && matchStatus
  })

  function handleEdit(rdv: Appointment) { setEditingRdv(rdv); setModalOpen(true) }
  function handleDossier(rdv: Appointment) { setConsultationRdv(rdv); setConsultationOpen(true) }
  function handleDelete(id: number) {
    if (confirm('Supprimer ce rendez-vous ?')) deleteAppointment.mutate(id)
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Rendez-vous" />
      <div className="p-4 sm:p-6 space-y-4">

        {/* ── Toolbar card ── */}
        <div className="bg-white dark:bg-[#102844] rounded-2xl glow px-4 py-3 flex flex-col sm:flex-row gap-3 items-center transition-colors duration-300">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7AAABB] pointer-events-none" />
            <Input
              placeholder="Rechercher un patient ou motif..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border border-gray-200 dark:border-[#1C3F62]/60 rounded-xl bg-[#F7FAFB] dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F] focus-visible:ring-[#70B1C4] h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AppointmentStatus | 'tous')}>
            <SelectTrigger className="w-full sm:w-48 border border-gray-200 dark:border-[#1C3F62]/60 rounded-xl bg-[#F7FAFB] dark:bg-[#091628] dark:text-[#EDF8FF] h-10 shrink-0">
              <Filter size={13} className="mr-1.5 text-gray-400 dark:text-[#7AAABB] shrink-0" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="programme">Programmé</SelectItem>
              <SelectItem value="confirme">Confirmé</SelectItem>
              <SelectItem value="complete">Complété</SelectItem>
              <SelectItem value="annule">Annulé</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => { setEditingRdv(null); setModalOpen(true) }}
            className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white shadow-md shadow-[#70B1C4]/30 shrink-0 h-10 btn-neon w-full sm:w-auto"
          >
            <Plus size={16} className="mr-1.5" /> Nouveau RDV
          </Button>
        </div>

        {/* ── Unified table card ── */}
        <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">

          {/* Loading / empty states */}
          {isLoading ? (
            <div className="text-center py-14 text-gray-400 dark:text-[#7AAABB]">
              <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-40" />
              <p className="text-sm">Chargement des rendez-vous...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 text-gray-400 dark:text-[#7AAABB]">
              <User size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucun rendez-vous trouvé</p>
            </div>
          ) : (
            <>
              {/* Column headers — part of the same card */}
              <div className="hidden sm:grid grid-cols-[1fr_160px_1fr_80px_148px_96px] px-5 gap-4 py-3 border-b border-gray-100 dark:border-[#1C3F62]/40">
                {['Patient', 'Date & Heure', 'Motif', 'Durée', 'Statut', 'Actions'].map((h) => (
                  <p key={h} className="text-[11px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">{h}</p>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50 dark:divide-[#1C3F62]/30">
                {filtered.map((rdv) => {
                  const s = STATUS_CONFIG[rdv.statut]
                  return (
                    <div key={rdv.id} className={`border-l-4 ${s.border} hover:bg-[#F7FAFB] dark:hover:bg-[#1A3655]/40 transition-colors duration-150`}>
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_1fr_80px_148px_96px] items-center gap-x-4 gap-y-1 px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                            <span className={`text-xs font-bold ${s.text}`}>
                              {rdv.patient_prenom[0]}{rdv.patient_nom[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#1A2B3C] dark:text-[#EDF8FF] text-sm leading-tight">
                              {rdv.patient_prenom} {rdv.patient_nom}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-[#7AAABB]">{rdv.patient_telephone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-[#B4D0E0] text-sm">
                          <Calendar size={12} className="text-gray-400 dark:text-[#7AAABB] shrink-0" />
                          <span>
                            {format(new Date(rdv.date), 'dd MMM', { locale: fr })}
                            <span className="text-gray-400 dark:text-[#7AAABB] mx-1">·</span>
                            {rdv.heure}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-[#B4D0E0] truncate">{rdv.motif}</p>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-[#B4D0E0] text-sm">
                          <Clock size={12} className="text-gray-400 dark:text-[#7AAABB] shrink-0" />
                          <span>{rdv.duree} min</span>
                        </div>
                        <Select
                          value={rdv.statut}
                          onValueChange={(v) => { if (v) updateStatus.mutate({ id: rdv.id, statut: v as AppointmentStatus }) }}
                        >
                          <SelectTrigger className={`h-7 text-xs border-0 rounded-lg px-2 font-medium w-full ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mr-1.5 shrink-0`} />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="programme">Programmé</SelectItem>
                            <SelectItem value="confirme">Confirmé</SelectItem>
                            <SelectItem value="complete">Complété</SelectItem>
                            <SelectItem value="annule">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => handleDossier(rdv)} title="Dossier médical" className="p-1.5 rounded-lg hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 text-[#70B1C4] transition-colors btn-neon">
                            <ClipboardList size={14} />
                          </button>
                          <button onClick={() => handleEdit(rdv)} className="p-1.5 rounded-lg hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 text-[#70B1C4] transition-colors btn-neon">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(rdv.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors btn-neon-red">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {filtered.length > 0 && !isLoading && (
          <p className="text-xs text-gray-400 dark:text-[#7AAABB] pl-1">
            {filtered.length} rendez-vous affiché{filtered.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <AppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} appointment={editingRdv} />
      <ConsultationModal open={consultationOpen} onClose={() => setConsultationOpen(false)} appointment={consultationRdv} />
    </div>
  )
}
