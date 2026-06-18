'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Eye, Pencil, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Status = 'tous' | 'programme' | 'confirme' | 'complete' | 'annule'

const statusColors: Record<string, string> = {
  programme: 'bg-blue-100 text-blue-700',
  confirme: 'bg-green-100 text-green-700',
  complete: 'bg-gray-100 text-gray-700',
  annule: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  programme: 'Programmé',
  confirme: 'Confirmé',
  complete: 'Complété',
  annule: 'Annulé',
}

const mockRdv = [
  { id: 1, patient: 'Sophie Martin', date: '2026-06-18', heure: '09:00', motif: 'Bilan visuel', statut: 'confirme', telephone: '06 12 34 56 78' },
  { id: 2, patient: 'Pierre Dubois', date: '2026-06-18', heure: '09:30', motif: 'Contrôle glaucome', statut: 'programme', telephone: '06 98 76 54 32' },
  { id: 3, patient: 'Marie Bernard', date: '2026-06-18', heure: '10:00', motif: 'Prescription lunettes', statut: 'confirme', telephone: '07 11 22 33 44' },
  { id: 4, patient: 'Jean Petit', date: '2026-06-19', heure: '10:30', motif: 'Urgence oculaire', statut: 'programme', telephone: '06 55 66 77 88' },
  { id: 5, patient: 'Claire Moreau', date: '2026-06-19', heure: '11:00', motif: 'Suivi post-op', statut: 'complete', telephone: '07 44 55 66 77' },
  { id: 6, patient: 'Paul Durand', date: '2026-06-20', heure: '14:00', motif: 'Consultation initiale', statut: 'annule', telephone: '06 33 22 11 00' },
]

export default function RendezVousPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status>('tous')

  const filtered = mockRdv.filter((rdv) => {
    const matchSearch = rdv.patient.toLowerCase().includes(search.toLowerCase()) ||
      rdv.motif.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'tous' || rdv.statut === statusFilter
    return matchSearch && matchStatus
  })

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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status)}>
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
          <Button className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white shrink-0">
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
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Téléphone</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rdv) => (
                    <tr key={rdv.id} className="border-b border-[#F5F9FA] hover:bg-[#F5F9FA] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#2D3748]">{rdv.patient}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(rdv.date), 'dd MMM yyyy', { locale: fr })} à {rdv.heure}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{rdv.motif}</td>
                      <td className="px-4 py-3 text-gray-600">{rdv.telephone}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs px-2 py-0.5 rounded-full font-normal ${statusColors[rdv.statut]}`}>
                          {statusLabels[rdv.statut]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded hover:bg-[#DCEEF3] text-[#70B1C4]"><Eye size={14} /></button>
                          <button className="p-1.5 rounded hover:bg-[#DCEEF3] text-gray-500"><Pencil size={14} /></button>
                          <button className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
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
    </div>
  )
}
