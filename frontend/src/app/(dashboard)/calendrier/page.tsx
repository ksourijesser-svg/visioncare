'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday,
} from 'date-fns'
import { fr } from 'date-fns/locale'

type ViewMode = 'mois' | 'semaine' | 'jour'

const statusColors: Record<string, string> = {
  programme: 'bg-blue-100 text-blue-700',
  confirme: 'bg-green-100 text-green-700',
  complete: 'bg-gray-100 text-gray-700',
  annule: 'bg-red-100 text-red-700 line-through',
}

const mockEvents: Record<string, { id: number; patient: string; heure: string; statut: string }[]> = {
  '2026-06-18': [
    { id: 1, patient: 'Sophie Martin', heure: '09:00', statut: 'confirme' },
    { id: 2, patient: 'Pierre Dubois', heure: '09:30', statut: 'programme' },
    { id: 3, patient: 'Marie Bernard', heure: '10:00', statut: 'confirme' },
  ],
  '2026-06-19': [
    { id: 4, patient: 'Jean Petit', heure: '10:30', statut: 'programme' },
    { id: 5, patient: 'Claire Moreau', heure: '11:00', statut: 'complete' },
  ],
  '2026-06-23': [
    { id: 6, patient: 'Paul Durand', heure: '14:00', statut: 'confirme' },
  ],
  '2026-06-25': [
    { id: 7, patient: 'Alice Leroy', heure: '09:00', statut: 'programme' },
    { id: 8, patient: 'Marc Simon', heure: '15:00', statut: 'annule' },
  ],
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewMode>('mois')

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let d = calStart
  while (d <= calEnd) {
    days.push(d)
    d = addDays(d, 1)
  }

  function prev() { setCurrentDate(subMonths(currentDate, 1)) }
  function next() { setCurrentDate(addMonths(currentDate, 1)) }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Calendrier" />
      <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={prev} className="p-2 rounded-lg hover:bg-[#DCEEF3] text-[#2D3748]">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold text-[#2D3748] capitalize min-w-40 text-center">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button onClick={next} className="p-2 rounded-lg hover:bg-[#DCEEF3] text-[#2D3748]">
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-sm text-[#70B1C4] hover:underline ml-1"
            >
              Aujourd&apos;hui
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#F5F9FA] rounded-lg p-1 gap-1">
              {(['jour', 'semaine', 'mois'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-md text-sm font-medium capitalize transition-colors ${view === v ? 'bg-white text-[#70B1C4] shadow-sm' : 'text-gray-500 hover:text-[#2D3748]'}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white">
              <Plus size={16} className="mr-2" />
              Nouveau RDV
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCEEF3] overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#DCEEF3]">
            {DAYS.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const key = format(day, 'yyyy-MM-dd')
              const events = mockEvents[key] || []
              const inMonth = isSameMonth(day, currentDate)
              const today = isToday(day)

              return (
                <div
                  key={idx}
                  className={`min-h-24 p-2 border-b border-r border-[#F5F9FA] cursor-pointer hover:bg-[#F5F9FA] transition-colors ${!inMonth ? 'opacity-40' : ''}`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${today ? 'bg-[#70B1C4] text-white' : 'text-[#2D3748]'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate ${statusColors[ev.statut]}`}
                      >
                        {ev.heure} {ev.patient.split(' ')[0]}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <p className="text-xs text-gray-400 pl-1">+{events.length - 3} autres</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-100 inline-block" /> Programmé</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-100 inline-block" /> Confirmé</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 inline-block" /> Complété</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 inline-block" /> Annulé</span>
        </div>
      </div>
    </div>
  )
}
