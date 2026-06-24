'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Phone, Mail, MapPin, Calendar, ClipboardList,
  Pencil, X, Save, Hash, Activity, FileText,
} from 'lucide-react'
import { Patient } from '@/store/patientsStore'
import { useUpdatePatient } from '@/hooks/usePatients'
import { useAppointments } from '@/hooks/useAppointments'
import { differenceInYears, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

const schema = z.object({
  prenom:          z.string().min(1, 'Requis'),
  nom:             z.string().min(1, 'Requis'),
  date_naissance:  z.string(),
  telephone:       z.string().min(1, 'Requis'),
  email:           z.union([z.string().email('Email invalide'), z.literal('')]),
  adresse:         z.string(),
  notes:           z.string(),
})
type FormData = z.infer<typeof schema>

interface Props {
  patient: Patient | null
  open: boolean
  onClose: () => void
  onEdit: () => void
}

export function PatientDetail({ patient, open, onClose }: Props) {
  const { data: appointments = [] } = useAppointments(patient ? { patient_id: patient.id } : undefined)
  const updatePatientMutation       = useUpdatePatient()
  const [isEditing, setIsEditing]   = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { adresse: '', notes: '', email: '' },
  })

  useEffect(() => {
    if (patient) {
      reset({
        prenom:         patient.prenom,
        nom:            patient.nom,
        date_naissance: patient.date_naissance || '',
        telephone:      patient.telephone,
        email:          patient.email || '',
        adresse:        patient.adresse || '',
        notes:          patient.notes || '',
      })
    }
    setIsEditing(false)
  }, [patient, reset, open])

  if (!patient) return null

  const initials = `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase()
  const age = patient.date_naissance
    ? differenceInYears(new Date(), new Date(patient.date_naissance))
    : null

  const patientAppointments = appointments
    .filter((a) => a.patient_id === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const consultationHistory = patientAppointments.filter(
    (a) => a.statut === 'complete' && (a.diagnostic || a.traitement || a.notes)
  )

  function onSubmit(data: FormData) {
    updatePatientMutation.mutate(
      { id: patient!.id, data },
      {
        onSuccess: () => {
          reset(data)
          setIsEditing(false)
          toast.success('Dossier patient mis à jour')
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
      }
    )
  }

  function handleCancelEdit() {
    const p = patient!
    reset({
      prenom:         p.prenom,
      nom:            p.nom,
      date_naissance: p.date_naissance || '',
      telephone:      p.telephone,
      email:          p.email || '',
      adresse:        p.adresse || '',
      notes:          p.notes || '',
    })
    setIsEditing(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh] gap-0 dark:bg-[#06101E] dark:border-[#1C3F62]/50 dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.20),_0_24px_80px_rgba(0,0,0,0.80)]">

        {/* ── Gradient header ── */}
        <div className="relative bg-gradient-to-br from-[#1e6c87] via-[#3d8fa8] to-[#70B1C4] pt-6 pb-10 px-6 shrink-0">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-10 -bottom-6 w-28 h-28 rounded-full bg-white/[0.07] pointer-events-none" />

          {/* Close + Edit buttons */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Dossier patient</span>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors btn-neon"
                >
                  <Pencil size={12} /> Modifier
                </button>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X size={12} /> Annuler
                </button>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center relative z-10">
            <Avatar className="w-20 h-20 border-4 border-white/40 shadow-xl shadow-black/30">
              <AvatarFallback className="bg-white/25 text-white text-2xl font-bold backdrop-blur-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isEditing ? (
              <>
                <h2 className="mt-3 text-xl font-bold text-white drop-shadow-sm">
                  {patient.prenom} {patient.nom}
                </h2>
                <p className="text-white/75 text-sm mt-0.5">
                  {age !== null ? `${age} ans` : 'Âge inconnu'} · Patient #{patient.id}
                </p>
              </>
            ) : (
              <p className="mt-3 text-white/80 text-sm font-medium">Mode édition</p>
            )}
          </div>

          {/* Stat chips */}
          {!isEditing && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap relative z-10">
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                <Activity size={11} className="text-white/90" />
                <span className="text-white text-xs font-semibold">{patientAppointments.length} RDV</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                <ClipboardList size={11} className="text-white/90" />
                <span className="text-white text-xs font-semibold">{consultationHistory.length} compte-rendu{consultationHistory.length > 1 ? 's' : ''}</span>
              </div>
              {patient.derniere_visite && (
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                  <Calendar size={11} className="text-white/90" />
                  <span className="text-white text-xs font-semibold">
                    {format(new Date(patient.derniere_visite), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-[#F0F5F8] dark:bg-[#06101E]">

          {/* Informations section */}
          <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <Hash size={13} className="text-[#70B1C4]" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Informations</span>
            </div>

            <div className="px-4 pb-4 space-y-3">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-[#7AAABB]">Prénom *</Label>
                    <Input {...register('prenom')} className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF]" />
                    {errors.prenom && <p className="text-red-500 text-xs">{errors.prenom.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-[#7AAABB]">Nom *</Label>
                    <Input {...register('nom')} className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF]" />
                    {errors.nom && <p className="text-red-500 text-xs">{errors.nom.message}</p>}
                  </div>
                </div>
              ) : null}

              <InfoRow
                icon={<Calendar size={14} className="text-[#70B1C4]" />}
                isEditing={isEditing}
                editContent={
                  <Input {...register('date_naissance')} type="date" className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] flex-1" />
                }
                displayContent={
                  patient.date_naissance
                    ? <span className="text-sm text-[#1A2B3C] dark:text-[#EDF8FF] font-medium">Né(e) le {format(new Date(patient.date_naissance), 'dd MMMM yyyy', { locale: fr })}</span>
                    : <span className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Non renseignée</span>
                }
              />

              <InfoRow
                icon={<Phone size={14} className="text-[#70B1C4]" />}
                isEditing={isEditing}
                editContent={
                  <>
                    <Input {...register('telephone')} className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] flex-1" placeholder="06 00 00 00 00" />
                    {errors.telephone && <p className="text-red-500 text-xs mt-0.5">{errors.telephone.message}</p>}
                  </>
                }
                displayContent={<span className="text-sm text-[#1A2B3C] dark:text-[#EDF8FF] font-medium">{patient.telephone}</span>}
              />

              <InfoRow
                icon={<Mail size={14} className="text-[#70B1C4]" />}
                isEditing={isEditing}
                editContent={
                  <>
                    <Input {...register('email')} type="email" className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] flex-1" placeholder="email@example.fr" />
                    {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
                  </>
                }
                displayContent={
                  patient.email
                    ? <span className="text-sm text-[#1A2B3C] dark:text-[#EDF8FF] font-medium">{patient.email}</span>
                    : <span className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Non renseigné</span>
                }
              />

              <InfoRow
                icon={<MapPin size={14} className="text-[#70B1C4]" />}
                isEditing={isEditing}
                editContent={
                  <Input {...register('adresse')} className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] flex-1" placeholder="12 rue de la Santé, Paris" />
                }
                displayContent={
                  patient.adresse
                    ? <span className="text-sm text-[#1A2B3C] dark:text-[#EDF8FF] font-medium">{patient.adresse}</span>
                    : <span className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Non renseignée</span>
                }
              />
            </div>
          </div>

          {/* Notes médicales */}
          <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <FileText size={13} className="text-amber-500" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Notes médicales</span>
            </div>
            <div className="px-4 pb-4">
              {isEditing ? (
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#1C3F62]/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none bg-[#F7FAFB] dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]"
                  placeholder="Myopie forte, allergies, antécédents..."
                />
              ) : patient.notes ? (
                <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-700/30 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-[#E8D5A0] leading-relaxed">
                  {patient.notes}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Aucune note médicale</p>
              )}
            </div>
          </div>

          {/* Save button (edit mode) */}
          {isEditing && (
            <Button
              type="submit"
              disabled={!isDirty}
              className="w-full bg-[#70B1C4] hover:bg-[#5a9db8] text-white shadow-md shadow-[#70B1C4]/30 disabled:opacity-50 btn-neon"
            >
              <Save size={14} className="mr-2" /> Enregistrer les modifications
            </Button>
          )}

          {/* Consultation history */}
          {!isEditing && (
            <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList size={13} className="text-[#70B1C4]" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Historique des consultations</span>
                </div>
                <span className="text-[10px] font-semibold bg-[#E4EEF4] dark:bg-[#1C3F62] text-[#70B1C4] px-2 py-0.5 rounded-full">
                  {patientAppointments.length} RDV
                </span>
              </div>

              <div className="px-4 pb-4 space-y-3">
                {consultationHistory.length === 0 ? (
                  <div className="text-center py-5 text-gray-400 dark:text-[#7AAABB] border border-dashed border-gray-200 dark:border-[#1C3F62]/50 rounded-xl">
                    <ClipboardList size={26} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucun compte-rendu enregistré</p>
                    <p className="text-xs mt-0.5 text-gray-300 dark:text-[#7AAABB]/60">Utilisez le bouton <span className="font-medium">Dossier</span> dans Rendez-vous</p>
                  </div>
                ) : (
                  consultationHistory.map((c) => (
                    <div key={c.id} className="border border-gray-100 dark:border-[#1C3F62]/40 rounded-xl p-3.5 bg-[#F7FAFB] dark:bg-[#091628] hover:bg-white dark:hover:bg-[#0D2038] transition-colors">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#E4EEF4] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                          <ClipboardList size={11} className="text-[#70B1C4]" />
                        </div>
                        <span className="text-xs font-bold text-[#1A2B3C] dark:text-[#EDF8FF]">
                          {format(new Date(c.date), 'dd MMM yyyy', { locale: fr })}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-[#7AAABB]">· {c.motif}</span>
                      </div>
                      <div className="space-y-1.5 pl-8">
                        {c.diagnostic && (
                          <div className="flex gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-[#7AAABB] w-20 shrink-0">Diagnostic</span>
                            <span className="text-xs text-gray-700 dark:text-[#B4D0E0]">{c.diagnostic}</span>
                          </div>
                        )}
                        {c.traitement && (
                          <div className="flex gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-[#7AAABB] w-20 shrink-0">Traitement</span>
                            <span className="text-xs text-gray-700 dark:text-[#B4D0E0]">{c.traitement}</span>
                          </div>
                        )}
                        {c.notes && (
                          <div className="flex gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-[#7AAABB] w-20 shrink-0">Notes</span>
                            <span className="text-xs text-gray-700 dark:text-[#B4D0E0]">{c.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Helper: one info row that flips between display and edit ── */
function InfoRow({
  icon, isEditing, editContent, displayContent,
}: {
  icon: React.ReactNode
  isEditing: boolean
  editContent: React.ReactNode
  displayContent: React.ReactNode
}) {
  if (isEditing) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1.5">
          {icon}
        </Label>
        {editContent}
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 py-1">
      <div className="w-8 h-8 rounded-xl bg-[#E4EEF4] dark:bg-[#1C3F62]/70 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex items-center h-8">
        {displayContent}
      </div>
    </div>
  )
}
