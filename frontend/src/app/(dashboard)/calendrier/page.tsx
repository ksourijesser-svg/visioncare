'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { AppointmentModal } from '@/components/appointments/AppointmentModal'
import type { AppointmentStatus, Appointment } from '@/store/appointmentsStore'
import { useAppointments } from '@/hooks/useAppointments'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addWeeks, subWeeks, addMonths, subMonths,
  isSameMonth, isToday,
} from 'date-fns'
import { fr } from 'date-fns/locale'

type ViewMode = 'mois' | 'semaine' | 'jour'

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  programme: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  confirme:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  complete:  'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
  annule:    'bg-red-100 text-red-500 line-through dark:bg-red-900/20 dark:text-red-400',
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 08:00 → 19:00

export default function CalendrierPage() {
  const { data: appointments = [] } = useAppointments()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView]  = useState<ViewMode>('mois')
  const [modalOpen, setModalOpen] = useState(false)

  /* ── Navigation ── */
  function goPrev() {
    if (view === 'mois')    setCurrentDate((d) => subMonths(d, 1))
    else if (view === 'semaine') setCurrentDate((d) => subWeeks(d, 1))
    else                    setCurrentDate((d) => addDays(d, -1))
  }
  function goNext() {
    if (view === 'mois')    setCurrentDate((d) => addMonths(d, 1))
    else if (view === 'semaine') setCurrentDate((d) => addWeeks(d, 1))
    else                    setCurrentDate((d) => addDays(d, 1))
  }

  /* ── Title ── */
  function getTitle() {
    if (view === 'mois') return format(currentDate, 'MMMM yyyy', { locale: fr })
    if (view === 'semaine') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
      const we = endOfWeek(currentDate,   { weekStartsOn: 1 })
      return `${format(ws, 'd')} – ${format(we, 'd MMM yyyy', { locale: fr })}`
    }
    return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })
  }

  /* ── Month data ── */
  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 })
  const monthDays: Date[] = []
  let d = calStart
  while (d <= calEnd) { monthDays.push(d); d = addDays(d, 1) }

  const eventsByDay: Record<string, Appointment[]> = {}
  appointments.forEach((a) => {
    if (!eventsByDay[a.date]) eventsByDay[a.date] = []
    eventsByDay[a.date].push(a)
  })

  /* ── Week data ── */
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function getApptForDayHour(date: Date, hour: number) {
    const key = format(date, 'yyyy-MM-dd')
    return (eventsByDay[key] || []).filter((a) => parseInt(a.heure.split(':')[0]) === hour)
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Calendrier" />
      <div className="p-4 sm:p-6 flex flex-col gap-4 flex-1">

        {/* ── Toolbar card ── */}
        <div className="bg-white dark:bg-[#102844] rounded-2xl glow px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors duration-300">
          {/* Left: navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 text-[#1A2B3C] dark:text-[#EDF8FF] transition-colors btn-neon"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-[#1A2B3C] dark:text-[#EDF8FF] capitalize min-w-32 sm:min-w-52 text-center px-1">
              {getTitle()}
            </h2>
            <button
              onClick={goNext}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 text-[#1A2B3C] dark:text-[#EDF8FF] transition-colors btn-neon"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 text-xs font-medium text-[#70B1C4] border border-[#70B1C4]/30 rounded-lg px-3 py-1.5 hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 transition-colors btn-neon"
            >
              Aujourd&apos;hui
            </button>
          </div>

          {/* Right: view switcher + button */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#E4EEF4] dark:bg-[#06101E] rounded-xl p-1 gap-0.5">
              {(['jour', 'semaine', 'mois'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    view === v
                      ? 'bg-[#70B1C4] text-white shadow-md shadow-[#70B1C4]/30'
                      : 'text-gray-500 dark:text-[#7AAABB] hover:text-[#1A2B3C] dark:hover:text-[#E2EDF5]'
                  }`}
                >
                  {v === 'jour' ? 'Jour' : v === 'semaine' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white shadow-md shadow-[#70B1C4]/30 btn-neon"
            >
              <Plus size={16} className="mr-1.5" /> Nouveau RDV
            </Button>
          </div>
        </div>

        {/* ══════════════ MONTH VIEW ══════════════ */}
        {view === 'mois' && (
          <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden transition-colors duration-300">
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-[#1C3F62]/40">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-[#7AAABB] uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, idx) => {
                const key    = format(day, 'yyyy-MM-dd')
                const events = eventsByDay[key] || []
                const inMonth = isSameMonth(day, currentDate)
                const today   = isToday(day)
                return (
                  <div
                    key={idx}
                    className={`min-h-24 p-2 border-b border-r border-gray-50 dark:border-[#1C3F62]/20 ${!inMonth ? 'opacity-40' : ''}`}
                  >
                    <div
                      onClick={() => { setCurrentDate(day); setView('jour') }}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 cursor-pointer transition-colors
                        ${today ? 'bg-[#70B1C4] text-white' : 'text-[#2D3748] dark:text-[#B4D0E0] hover:bg-[#DCEEF3] dark:hover:bg-[#1C3F62]/60'}`}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((ev) => (
                        <div key={ev.id} className={`text-xs px-1.5 py-0.5 rounded truncate ${STATUS_COLORS[ev.statut]}`}>
                          {ev.heure} {ev.patient_prenom}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <p
                          onClick={() => { setCurrentDate(day); setView('jour') }}
                          className="text-xs text-gray-400 dark:text-[#7AAABB] pl-1 cursor-pointer hover:text-[#70B1C4]"
                        >
                          +{events.length - 3} autres
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════ WEEK VIEW ══════════════ */}
        {view === 'semaine' && (
          <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-x-auto overflow-y-hidden flex flex-col flex-1 transition-colors duration-300">
            <div className="min-w-[640px] flex flex-col flex-1">
            <div className="grid border-b border-gray-100 dark:border-[#1C3F62]/40" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
              <div />
              {weekDays.map((day, i) => {
                const today = isToday(day)
                return (
                  <div
                    key={i}
                    className="py-2 text-center border-l border-gray-50 dark:border-[#1C3F62]/20 cursor-pointer hover:bg-[#F5F9FA] dark:hover:bg-[#1C3F62]/30 transition-colors"
                    onClick={() => { setCurrentDate(day); setView('jour') }}
                  >
                    <p className="text-xs text-gray-400 dark:text-[#7AAABB] uppercase">
                      {format(day, 'EEE', { locale: fr })}
                    </p>
                    <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold mt-0.5
                      ${today ? 'bg-[#70B1C4] text-white' : 'text-[#2D3748] dark:text-[#B4D0E0]'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="overflow-y-auto flex-1">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid border-b border-gray-50 dark:border-[#1C3F62]/20"
                  style={{ gridTemplateColumns: '56px repeat(7, 1fr)', minHeight: '64px' }}
                >
                  <div className="px-2 pt-1.5 text-xs text-gray-400 dark:text-[#7AAABB] text-right shrink-0">
                    {hour}:00
                  </div>
                  {weekDays.map((day, i) => {
                    const appts = getApptForDayHour(day, hour)
                    return (
                      <div
                        key={i}
                        className={`border-l border-gray-50 dark:border-[#1C3F62]/20 p-1 ${isToday(day) ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                      >
                        {appts.map((a) => (
                          <div key={a.id} className={`text-xs rounded px-1.5 py-1 mb-0.5 truncate ${STATUS_COLORS[a.statut]}`}>
                            <span className="font-medium">{a.heure}</span>{' '}
                            {a.patient_prenom} {a.patient_nom[0]}.
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            </div>
          </div>
        )}

        {/* ══════════════ DAY VIEW ══════════════ */}
        {view === 'jour' && (
          <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden flex flex-col flex-1 transition-colors duration-300">
            <div className="border-b border-gray-100 dark:border-[#1C3F62]/40 px-6 py-3 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shrink-0
                ${isToday(currentDate) ? 'bg-[#70B1C4] text-white' : 'bg-[#F5F9FA] dark:bg-[#1A3A5C]/50 text-[#2D3748] dark:text-[#EDF8FF]'}`}>
                {format(currentDate, 'd')}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2D3748] dark:text-[#EDF8FF] capitalize">
                  {format(currentDate, 'EEEE', { locale: fr })}
                </p>
                <p className="text-xs text-gray-400 dark:text-[#7AAABB] capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-[#DCEEF3] dark:bg-[#1A3A5C] text-[#70B1C4] dark:text-[#70B1C4] px-2.5 py-1 rounded-full font-medium">
                  {(eventsByDay[format(currentDate, 'yyyy-MM-dd')] || []).length} rendez-vous
                </span>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {HOURS.map((hour) => {
                const appts = getApptForDayHour(currentDate, hour)
                return (
                  <div key={hour} className="flex border-b border-gray-50 dark:border-[#1C3F62]/20" style={{ minHeight: '68px' }}>
                    <div className="w-16 px-3 pt-2 text-xs text-gray-400 dark:text-[#7AAABB] text-right shrink-0 border-r border-gray-50 dark:border-[#1C3F62]/20">
                      {hour}:00
                    </div>
                    <div className="flex-1 p-2 space-y-1.5">
                      {appts.map((a) => (
                        <div key={a.id} className={`rounded-lg px-3 py-2 ${STATUS_COLORS[a.statut]}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              {a.patient_prenom} {a.patient_nom}
                            </span>
                            <span className="text-xs opacity-70 ml-3 shrink-0">
                              {a.heure} · {a.duree} min
                            </span>
                          </div>
                          <p className="text-xs opacity-75 mt-0.5">{a.motif}</p>
                          {a.notes && <p className="text-xs opacity-60 mt-0.5 italic">{a.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Legend card */}
        <div className="bg-white dark:bg-[#102844] rounded-2xl glow px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 self-start transition-colors duration-300">
          <span className="text-[11px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Légende</span>
          {[
            { label: 'Programmé', color: 'bg-blue-400' },
            { label: 'Confirmé',  color: 'bg-green-400' },
            { label: 'Complété',  color: 'bg-gray-300' },
            { label: 'Annulé',    color: 'bg-red-400' },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-2 text-xs text-gray-600 dark:text-[#B4D0E0] font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <AppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} appointment={null} />
    </div>
  )
}
