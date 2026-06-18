'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Phone, Mail, MapPin, Calendar, ClipboardList, Pencil } from 'lucide-react'
import { Patient } from '@/store/patientsStore'
import { useAppointmentsStore } from '@/store/appointmentsStore'
import { differenceInYears, format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  patient: Patient | null
  open: boolean
  onClose: () => void
  onEdit: () => void
}

export function PatientDetail({ patient, open, onClose, onEdit }: Props) {
  const { appointments } = useAppointmentsStore()

  if (!patient) return null

  const initials = `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase()

  const age =
    patient.date_naissance
      ? differenceInYears(new Date(), new Date(patient.date_naissance))
      : null

  const patientAppointments = appointments
    .filter((a) => a.patient_id === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const completedWithRecord = patientAppointments.filter(
    (a) => a.statut === 'complete' && (a.diagnostic || a.traitement || a.notes)
  )

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#DCEEF3] to-[#F5F9FA] px-6 py-5">
          <SheetHeader className="mb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-[#70B1C4] text-white text-lg font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-[#2D3748] text-lg leading-tight">
                    {patient.prenom} {patient.nom}
                  </SheetTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {age !== null ? `${age} ans` : 'Âge inconnu'} · Patient #{patient.id}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="border-white bg-white/80 text-[#70B1C4] hover:bg-white shrink-0"
              >
                <Pencil size={13} className="mr-1" /> Modifier
              </Button>
            </div>
          </SheetHeader>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Informations */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Informations
            </h3>
            <div className="space-y-2">
              {patient.date_naissance ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F9FA] border border-[#DCEEF3] flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-[#70B1C4]" />
                  </div>
                  <span className="text-sm text-gray-700">
                    Né(e) le {format(new Date(patient.date_naissance), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F9FA] border border-[#DCEEF3] flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-gray-300" />
                  </div>
                  <span className="text-sm text-gray-400 italic">Date de naissance non renseignée</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F5F9FA] border border-[#DCEEF3] flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-[#70B1C4]" />
                </div>
                <span className="text-sm text-gray-700">{patient.telephone}</span>
              </div>

              {patient.email ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F9FA] border border-[#DCEEF3] flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-[#70B1C4]" />
                  </div>
                  <span className="text-sm text-gray-700">{patient.email}</span>
                </div>
              ) : null}

              {patient.adresse ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F9FA] border border-[#DCEEF3] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={14} className="text-[#70B1C4]" />
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{patient.adresse}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Notes médicales */}
          {patient.notes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Notes médicales
              </h3>
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed">
                {patient.notes}
              </div>
            </div>
          )}

          {/* Historique consultations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Historique des consultations
              </h3>
              <Badge className="bg-[#DCEEF3] text-[#70B1C4] font-normal text-xs">
                {patientAppointments.length} RDV
              </Badge>
            </div>

            {completedWithRecord.length > 0 ? (
              <div className="space-y-3">
                {completedWithRecord.map((c) => (
                  <div key={c.id} className="border border-[#DCEEF3] rounded-lg p-3.5 bg-white">
                    <div className="flex items-center gap-2 mb-2.5">
                      <ClipboardList size={13} className="text-[#70B1C4] shrink-0" />
                      <span className="text-xs font-semibold text-[#2D3748]">
                        {format(new Date(c.date), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span className="text-xs text-gray-400">· {c.motif}</span>
                    </div>
                    {c.diagnostic && (
                      <div className="mb-1.5">
                        <span className="text-xs font-medium text-gray-500">Diagnostic : </span>
                        <span className="text-xs text-gray-700">{c.diagnostic}</span>
                      </div>
                    )}
                    {c.traitement && (
                      <div className="mb-1.5">
                        <span className="text-xs font-medium text-gray-500">Traitement : </span>
                        <span className="text-xs text-gray-700">{c.traitement}</span>
                      </div>
                    )}
                    {c.notes && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Notes : </span>
                        <span className="text-xs text-gray-700">{c.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 border border-dashed border-[#DCEEF3] rounded-lg">
                <ClipboardList size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Aucun compte-rendu enregistré</p>
                <p className="text-xs mt-0.5 text-gray-300">
                  Utilisez le bouton <span className="font-medium">Dossier</span> dans Rendez-vous
                </p>
              </div>
            )}
          </div>

        </div>
      </SheetContent>
    </Sheet>
  )
}
