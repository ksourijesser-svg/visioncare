'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Eye, Pencil, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppointmentModal } from '@/components/appointments/AppointmentModal'
import { useAppointmentsStore, Appointment, AppointmentStatus } from '@/store/appointmentsStore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const statusColors: Record<AppointmentStatus, string> = {
  programme: 'bg-blue-100 text-blue-700',
  confirme: 'bg-green-100 text-green-700',
  complete: 'bg-gray-100 text-gray-700',
  annule: 'bg-red-100 text-red-700',
}

const statusLabels: Record<AppointmentStatus, string> = {
  programme: 'Programmé',
  confirme: 'Confirmé',
  complete: 'Complété',
  annule: 'Annulé',
}

export default function RendezVousPage() {
  const { appointments, deleteAppointment, updateStatus } = useAppointmentsStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'tous'>('tous')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRdv, setEditingRdv] = useState<Appointment | null>(null)

  const filtered = appointments.filter((rdv) => {
    const matchSearch =
      `${rdv.patient_prenom} ${rdv.patient_nom}`.toLowerCase().includes(search.toLowerCase()) ||
      rdv.motif.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'tous' || rdv.statut === statusFilter
    return matchSearch && matchStatus
  })

  function handleAdd() {
    setEditingRdv(null)
    setModalOpen(true)
  }

  function handleEdit(rdv: Appointment) {
    setEditingRdv(rdv)
    setModalOpen(true)
  }

  function handleDelete(id: number) {
    if (confirm('Supprimer ce rendez-vous ?')) {
      deleteAppointment(id)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Rendez-vous" />
      <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher un patient ou motif..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#DCEEF3]"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AppointmentStatus | 'tous')}>
              <SelectTrigger className="w-44 border-[#DCEEF3]">
                <Filter size={14} className="mr-1 text-gray-400" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="programme">Programmé</SelectItem>
                <SelectItem value="confirme">Confirmé</SelectItem>
                <SelectItem value="complete">Complété</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white shrink-0">
            <Plus size={16} className="mr-2" />
            Nouveau RDV
          </Button>
        </div>

        <Card className="border-[#DCEEF3]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DCEEF3] bg-[#F5F9FA]">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date & Heure</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Motif</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Durée</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rdv) => (
                    <tr key={rdv.id} className="border-b border-[#F5F9FA] hover:bg-[#F5F9FA] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#2D3748]">{rdv.patient_prenom} {rdv.patient_nom}</p>
                        <p className="text-xs text-gray-400">{rdv.patient_telephone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(rdv.date), 'dd MMM yyyy', { locale: fr })} à {rdv.heure}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{rdv.motif}</td>
                      <td className="px-4 py-3 text-gray-600">{rdv.duree} min</td>
                      <td className="px-4 py-3">
                        <Select
                          value={rdv.statut}
                          onValueChange={(v) => updateStatus(rdv.id, v as AppointmentStatus)}
                        >
                          <SelectTrigger className={`w-32 h-7 text-xs border-0 px-2 ${statusColors[rdv.statut]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="programme">Programmé</SelectItem>
                            <SelectItem value="confirme">Confirmé</SelectItem>
                            <SelectItem value="complete">Complété</SelectItem>
                            <SelectItem value="annule">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(rdv)} className="p-1.5 rounded hover:bg-[#DCEEF3] text-[#70B1C4]">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(rdv.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">Aucun rendez-vous trouvé</div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-400">{filtered.length} rendez-vous affichés</p>
      </div>

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        appointment={editingRdv}
      />
    </div>
  )
}
