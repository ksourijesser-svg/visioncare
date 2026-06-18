'use client'

import { useState } from 'react'
import { Search, Download, Eye, User } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PatientDetail } from '@/components/patients/PatientDetail'
import { useAppointmentsStore } from '@/store/appointmentsStore'
import { usePatientsStore, Patient } from '@/store/patientsStore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as XLSX from 'xlsx'

interface DerivedPatient {
  key: string
  patient_id: number
  prenom: string
  nom: string
  telephone: string
  nb_consultations: number
  derniere_visite: string
  storeData: Patient | undefined
}

export default function PatientsPage() {
  const { appointments } = useAppointmentsStore()
  const { patients: storePatients } = usePatientsStore()
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null)

  // Derive unique patients only from completed appointments
  const completedMap = new Map<string, DerivedPatient>()
  appointments
    .filter((a) => a.statut === 'complete')
    .forEach((a) => {
      const key = `${a.patient_prenom}-${a.patient_nom}`
      if (completedMap.has(key)) {
        const existing = completedMap.get(key)!
        existing.nb_consultations += 1
        if (a.date > existing.derniere_visite) existing.derniere_visite = a.date
      } else {
        completedMap.set(key, {
          key,
          patient_id: a.patient_id,
          prenom: a.patient_prenom,
          nom: a.patient_nom,
          telephone: a.patient_telephone,
          nb_consultations: 1,
          derniere_visite: a.date,
          storeData: storePatients.find((p) => p.id === a.patient_id),
        })
      }
    })

  const derivedPatients = Array.from(completedMap.values())

  const filtered = derivedPatients.filter(
    (p) =>
      `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      p.telephone.includes(search)
  )

  function handleView(p: DerivedPatient) {
    const patient = p.storeData ?? {
      id: p.patient_id,
      nom: p.nom,
      prenom: p.prenom,
      telephone: p.telephone,
      email: '',
      adresse: '',
      date_naissance: '',
      notes: '',
      nb_consultations: p.nb_consultations,
      derniere_visite: p.derniere_visite,
      created_at: '',
    }
    setViewingPatient(patient)
    setDetailOpen(true)
  }

  function handleExport() {
    const data = filtered.map((p) => ({
      Prénom: p.prenom,
      Nom: p.nom,
      Téléphone: p.telephone,
      'Nb consultations complètes': p.nb_consultations,
      'Dernière visite': p.derniere_visite,
      Email: p.storeData?.email || '',
      Adresse: p.storeData?.adresse || '',
      Notes: p.storeData?.notes || '',
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

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <User size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Aucun patient pour le moment</p>
            <p className="text-sm mt-1">
              Les patients apparaissent ici dès qu&apos;un rendez-vous est marqué <strong>Complété</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((patient) => {
              const initials = `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase()
              const storeData = patient.storeData
              return (
                <Card key={patient.key} className="border-0 hover:shadow-md transition-all">
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
                        {storeData?.email && <p className="text-xs text-gray-400 truncate">{storeData.email}</p>}
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs font-normal shrink-0">Complété</Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-3">
                      <span>
                        Dernière visite : {format(new Date(patient.derniere_visite), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span className="font-medium text-[#70B1C4]">{patient.nb_consultations} consult.</span>
                    </div>

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

        {filtered.length > 0 && (
          <p className="text-sm text-gray-400">{filtered.length} patient{filtered.length > 1 ? 's' : ''} avec consultation complétée</p>
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
