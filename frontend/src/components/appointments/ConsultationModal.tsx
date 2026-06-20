'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import type { Appointment } from '@/store/appointmentsStore'
import { usePatients, useUpdatePatient } from '@/hooks/usePatients'
import { useUpdateAppointment } from '@/hooks/useAppointments'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const schema = z.object({
  date_naissance: z.string(),
  adresse: z.string(),
  email: z.union([z.string().email('Email invalide'), z.literal('')]),
  diagnostic: z.string(),
  traitement: z.string(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  appointment: Appointment | null
}

export function ConsultationModal({ open, onClose, appointment }: Props) {
  const { data: patients = [] } = usePatients()
  const updatePatient = useUpdatePatient()
  const updateAppointment = useUpdateAppointment()

  const patient = patients.find((p) => p.id === appointment?.patient_id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date_naissance: '', adresse: '', email: '', diagnostic: '', traitement: '' },
  })

  useEffect(() => {
    if (open && appointment) {
      reset({
        date_naissance: patient?.date_naissance || '',
        adresse: patient?.adresse || '',
        email: patient?.email || '',
        diagnostic: appointment.diagnostic || '',
        traitement: appointment.traitement || '',
      })
    }
  }, [open, appointment?.id, patient?.id])

  async function onSubmit(data: FormData) {
    if (!appointment) return

    // Update patient details if changed
    if (appointment.patient_id) {
      await updatePatient.mutateAsync({
        id: appointment.patient_id,
        data: {
          date_naissance: data.date_naissance || undefined,
          adresse: data.adresse || undefined,
          email: data.email || undefined,
        },
      }).catch(() => {})
    }

    // Save diagnostic + traitement on the appointment
    updateAppointment.mutate(
      { id: appointment.id, data: { diagnostic: data.diagnostic, traitement: data.traitement } },
      {
        onSuccess: () => { toast.success('Dossier enregistré'); onClose() },
        onError: () => toast.error('Erreur lors de l\'enregistrement'),
      }
    )
  }

  if (!appointment) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#2D3748] text-lg">
            Dossier — {appointment.patient_prenom} {appointment.patient_nom}
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-0.5">
            {appointment.motif} · {format(new Date(appointment.date), 'dd MMM yyyy', { locale: fr })} à {appointment.heure}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#DCEEF3] flex items-center justify-center shrink-0">
                <User size={12} className="text-[#70B1C4]" />
              </div>
              <span className="text-sm font-semibold text-[#2D3748]">Informations patient</span>
            </div>
            <div className="space-y-3 pl-8">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Date de naissance</Label>
                <Input {...register('date_naissance')} type="date" className="border-[#DCEEF3] h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Adresse</Label>
                <Input {...register('adresse')} className="border-[#DCEEF3] h-9" placeholder="Rue, code postal, ville..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">
                  Email <span className="text-gray-400 font-normal">(optionnel)</span>
                </Label>
                <Input {...register('email')} type="email" className="border-[#DCEEF3] h-9" placeholder="email@exemple.fr" />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-[#F5F9FA] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#DCEEF3] flex items-center justify-center shrink-0">
                <Stethoscope size={12} className="text-[#70B1C4]" />
              </div>
              <span className="text-sm font-semibold text-[#2D3748]">Compte-rendu de consultation</span>
            </div>
            <div className="space-y-3 pl-8">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Diagnostic</Label>
                <textarea
                  {...register('diagnostic')}
                  rows={2}
                  className="w-full rounded-md border border-[#DCEEF3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none"
                  placeholder="Ex: Myopie stable -3.5D..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Traitement prescrit</Label>
                <textarea
                  {...register('traitement')}
                  rows={2}
                  className="w-full rounded-md border border-[#DCEEF3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none"
                  placeholder="Ex: Renouvellement lentilles, prochain contrôle 1 an..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3]">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || updateAppointment.isPending} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white">
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
