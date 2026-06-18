'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Phone, Mail, MapPin, Calendar, ClipboardList, Pencil } from 'lucide-react'
import { Patient } from '@/store/patientsStore'
import { differenceInYears, format } from 'date-fns'
import { fr } from 'date-fns/locale'

const mockConsultations = [
  { date: '2026-06-10', motif: 'Bilan visuel annuel', diagnostic: 'Myopie stable -3.5D', traitement: 'Renouvellement lentilles' },
  { date: '2026-01-15', motif: 'Contrôle', diagnostic: 'Pas d\'évolution', traitement: 'Surveillance annuelle' },
  { date: '2025-06-20', motif: 'Première consultation', diagnostic: 'Myopie -3.0D', traitement: 'Prescription lunettes' },
]

interface Props {
  patient: Patient | null
  open: boolean
  onClose: () => void
  onEdit: () => void
}

export function PatientDetail({ patient, open, onClose, onEdit }: Props) {
  if (!patient) return null

  const age = differenceInYears(new Date(), new Date(patient.date_naissance))
  const initials = `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase()

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-[#DCEEF3]">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-[#DCEEF3] text-[#70B1C4] text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-[#2D3748] text-xl">
                {patient.prenom} {patient.nom}
              </SheetTitle>
              <p className="text-sm text-gray-500">{age} ans · Patient #{patient.id}</p>
            </div>
            <Button size="sm" variant="outline" onClick={onEdit} className="border-[#DCEEF3] text-[#70B1C4]">
              <Pencil size={14} className="mr-1" /> Modifier
            </Button>
          </div>
        </SheetHeader>

        <div className="py-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#2D3748] mb-3 uppercase tracking-wide">Informations</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#F5F9FA] flex items-center justify-center">
                  <Calendar size={14} className="text-[#70B1C4]" />
                </div>
                <span className="text-gray-600">
                  Né(e) le {format(new Date(patient.date_naissance), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#F5F9FA] flex items-center justify-center">
                  <Phone size={14} className="text-[#70B1C4]" />
                </div>
                <span className="text-gray-600">{patient.telephone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F9FA] flex items-center justify-center">
                    <Mail size={14} className="text-[#70B1C4]" />
                  </div>
                  <span className="text-gray-600">{patient.email}</span>
                </div>
              )}
              {patient.adresse && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F9FA] flex items-center justify-center">
                    <MapPin size={14} className="text-[#70B1C4]" />
                  </div>
                  <span className="text-gray-600">{patient.adresse}</span>
                </div>
              )}
            </div>
          </div>

          {patient.notes && (
            <div>
              <h3 className="text-sm font-semibold text-[#2D3748] mb-2 uppercase tracking-wide">Notes médicales</h3>
              <div className="bg-[#F5F9FA] rounded-lg p-3 text-sm text-gray-600 border border-[#DCEEF3]">
                {patient.notes}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#2D3748] uppercase tracking-wide">Historique des consultations</h3>
              <Badge className="bg-[#DCEEF3] text-[#70B1C4] font-normal">
                {patient.nb_consultations} consultations
              </Badge>
            </div>
            <div className="space-y-3">
              {mockConsultations.map((c, i) => (
                <div key={i} className="border border-[#DCEEF3] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList size={14} className="text-[#70B1C4]" />
                    <span className="text-xs font-medium text-[#2D3748]">
                      {format(new Date(c.date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <span className="text-xs text-gray-400">· {c.motif}</span>
                  </div>
                  <p className="text-xs text-gray-600"><span className="font-medium">Diagnostic:</span> {c.diagnostic}</p>
                  <p className="text-xs text-gray-600"><span className="font-medium">Traitement:</span> {c.traitement}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
