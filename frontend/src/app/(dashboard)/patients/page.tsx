'use client'

import { useState } from 'react'
import { Search, Download, Eye, User, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PatientDetail } from '@/components/patients/PatientDetail'
import { usePatients } from '@/hooks/usePatients'
import { useAppointments } from '@/hooks/useAppointments'
import type { Patient } from '@/store/patientsStore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as XLSX from 'xlsx'

export default function PatientsPage() {
  const { data: patients = [], isLoading } = usePatients()
  const { data: appointments = [] } = useAppointments()
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null)

  // Compute per-patient stats from appointments
  const statsMap = new Map<number, { nb: number; derniere: string }>()
  appointments.filter((a) => a.statut === 'complete').forEach((a) => {
    const existing = statsMap.get(a.patient_id)
    if (!existing) {
      statsMap.set(a.patient_id, { nb: 1, derniere: a.date })
    } else {
      existing.nb += 1
      if (a.date > existing.derniere) existing.derniere = a.date
    }
  })

  const enriched = patients.map((p) => ({
    ...p,
    nb_consultations: statsMap.get(p.id)?.nb ?? 0,
    derniere_visite: statsMap.get(p.id)?.derniere ?? '',
  }))

  const filtered = enriched.filter(
    (p) =>
      `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      p.telephone.includes(search)
  )

  function handleView(p: typeof enriched[number]) {
    setViewingPatient(p)
    setDetailOpen(true)
  }

  function handleExport() {
    const data = filtered.map((p) => ({
      Prénom: p.prenom,
      Nom: p.nom,
      Téléphone: p.telephone,
      Email: p.email || '',
      Adresse: p.adresse || '',
      'Nb consultations': p.nb_consultations,
      'Dernière visite': p.derniere_visite,
      Notes: p.notes || '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Patients')
    XLSX.writeFile(wb, 'patients_visioncare.xlsx')
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Patients" />
      <div className="p-6 space-y-5">

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-0"
            />
          </div>
          <Button variant="outline" onClick={handleExport} className="border-0 text-[#70B1C4] shrink-0">
            <Download size={16} className="mr-2" />
            Exporter Excel
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400">
            <Loader2 size={40} className="mx-auto mb-4 opacity-30 animate-spin" />
            <p className="font-medium">Chargement des patients...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <User size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Aucun patient pour le moment</p>
            <p className="text-sm mt-1">Ajoutez des patients en créant un rendez-vous.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((patient) => {
              const initials = `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase()
              return (
                <Card key={patient.id} className="border-0 hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-11 h-11">
                        <AvatarFallback className="bg-[#DCEEF3] text-[#70B1C4] font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2D3748] truncate">{patient.prenom} {patient.nom}</p>
                        <p className="text-xs text-gray-400">{patient.telephone}</p>
                        {patient.email && <p className="text-xs text-gray-400 truncate">{patient.email}</p>}
                      </div>
                    </div>

                    {patient.derniere_visite ? (
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-3">
                        <span>
                          Dernière visite : {format(new Date(patient.derniere_visite), 'dd MMM yyyy', { locale: fr })}
                        </span>
                        <span className="font-medium text-[#70B1C4]">{patient.nb_consultations} consult.</span>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-gray-400 border-t border-gray-50 pt-3">Aucune consultation</div>
                    )}

                    <div className="mt-3 border-t border-gray-50 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(patient)}
                        className="w-full border-0 text-[#70B1C4] text-xs h-8"
                      >
                        <Eye size={12} className="mr-1" /> Voir dossier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {filtered.length > 0 && !isLoading && (
          <p className="text-sm text-gray-400">{filtered.length} patient{filtered.length > 1 ? 's' : ''}</p>
        )}
      </div>

      <PatientDetail
        patient={viewingPatient}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => {}}
      />
    </div>
  )
}
