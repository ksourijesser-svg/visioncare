'use client'

import { useState } from 'react'
import { Plus, Search, Download, Eye, Pencil, Trash2, User } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format, differenceInYears } from 'date-fns'
import { fr } from 'date-fns/locale'

const mockPatients = [
  { id: 1, nom: 'Martin', prenom: 'Sophie', date_naissance: '1985-03-12', telephone: '06 12 34 56 78', email: 'sophie.martin@email.fr', derniere_visite: '2026-06-10', nb_consultations: 8 },
  { id: 2, nom: 'Dubois', prenom: 'Pierre', date_naissance: '1972-07-22', telephone: '06 98 76 54 32', email: 'pierre.dubois@email.fr', derniere_visite: '2026-06-05', nb_consultations: 15 },
  { id: 3, nom: 'Bernard', prenom: 'Marie', date_naissance: '1990-11-08', telephone: '07 11 22 33 44', email: 'marie.bernard@email.fr', derniere_visite: '2026-05-28', nb_consultations: 3 },
  { id: 4, nom: 'Petit', prenom: 'Jean', date_naissance: '1965-01-30', telephone: '06 55 66 77 88', email: 'jean.petit@email.fr', derniere_visite: '2026-06-01', nb_consultations: 22 },
  { id: 5, nom: 'Moreau', prenom: 'Claire', date_naissance: '1998-05-17', telephone: '07 44 55 66 77', email: 'claire.moreau@email.fr', derniere_visite: '2026-06-15', nb_consultations: 2 },
  { id: 6, nom: 'Durand', prenom: 'Paul', date_naissance: '1955-09-03', telephone: '06 33 22 11 00', email: 'paul.durand@email.fr', derniere_visite: '2026-04-20', nb_consultations: 31 },
]

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const filtered = mockPatients.filter(
    (p) =>
      `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      p.telephone.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col flex-1">
      <Header title="Patients" />
      <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, téléphone ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#DCEEF3]"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="border-[#DCEEF3] text-[#70B1C4]">
              <Download size={16} className="mr-2" />
              Exporter Excel
            </Button>
            <Button className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white">
              <Plus size={16} className="mr-2" />
              Nouveau patient
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((patient) => {
            const age = differenceInYears(new Date(), new Date(patient.date_naissance))
            const initials = `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase()
            return (
              <Card
                key={patient.id}
                className={`border-[#DCEEF3] cursor-pointer transition-all hover:shadow-md ${selected === patient.id ? 'ring-2 ring-[#70B1C4]' : ''}`}
                onClick={() => setSelected(patient.id === selected ? null : patient.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarFallback className="bg-[#DCEEF3] text-[#70B1C4] font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#2D3748] truncate">
                        {patient.prenom} {patient.nom}
                      </p>
                      <p className="text-xs text-gray-400">{age} ans · {patient.telephone}</p>
                      <p className="text-xs text-gray-400 truncate">{patient.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-[#F5F9FA] pt-3">
                    <span>
                      Dernière visite : {format(new Date(patient.derniere_visite), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <span className="font-medium text-[#70B1C4]">
                      {patient.nb_consultations} consultations
                    </span>
                  </div>
                  {selected === patient.id && (
                    <div className="mt-3 flex gap-2 border-t border-[#F5F9FA] pt-3">
                      <Button size="sm" variant="outline" className="flex-1 border-[#DCEEF3] text-[#70B1C4] text-xs h-8">
                        <Eye size={12} className="mr-1" /> Voir dossier
                      </Button>
                      <Button size="sm" variant="outline" className="border-[#DCEEF3] text-gray-500 text-xs h-8 px-2">
                        <Pencil size={12} />
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-400 text-xs h-8 px-2">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <User size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucun patient trouvé</p>
          </div>
        )}

        <p className="text-sm text-gray-400">{filtered.length} patients affichés</p>
      </div>
    </div>
  )
}
