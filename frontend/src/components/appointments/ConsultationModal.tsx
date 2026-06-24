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

const inputCls = 'border border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F] focus-visible:ring-[#70B1C4] h-9'
const labelCls = 'text-xs text-gray-500 dark:text-[#7AAABB]'

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
      <DialogContent className="max-w-lg dark:bg-[#0D2038] dark:border-[#1C3F62]/60 dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.18),0_24px_80px_rgba(0,0,0,0.75),inset_0_0_60px_rgba(61,143,168,0.04)]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3d8fa8] to-[#70B1C4] flex items-center justify-center shrink-0 shadow-md shadow-[#70B1C4]/30">
              <Stethoscope size={14} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-[#2D3748] dark:text-[#EDF8FF] text-base leading-tight">
                Dossier — {appointment.patient_prenom} {appointment.patient_nom}
              </DialogTitle>
              <p className="text-xs text-gray-400 dark:text-[#7AAABB] mt-0.5">
                {appointment.motif} · {format(new Date(appointment.date), 'dd MMM yyyy', { locale: fr })} à {appointment.heure}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">

          {/* ── Informations patient section ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#DCEEF3] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                <User size={12} className="text-[#70B1C4]" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Informations patient</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className={labelCls}>Date de naissance</Label>
                <Input {...register('date_naissance')} type="date" className={inputCls} />
              </div>
              <div className="space-y-1">
                <Label className={labelCls}>Adresse</Label>
                <Input {...register('adresse')} className={inputCls} placeholder="Rue, code postal, ville..." />
              </div>
              <div className="space-y-1">
                <Label className={labelCls}>
                  Email <span className="text-gray-300 dark:text-[#3A5C70] font-normal">(optionnel)</span>
                </Label>
                <Input {...register('email')} type="email" className={inputCls} placeholder="email@exemple.fr" />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          {/* ── Compte-rendu section ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#DCEEF3] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                <Stethoscope size={12} className="text-[#70B1C4]" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Compte-rendu de consultation</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className={labelCls}>Diagnostic</Label>
                <textarea
                  {...register('diagnostic')}
                  rows={2}
                  className="w-full rounded-md border border-[#DCEEF3] dark:border-[#1C3F62]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none bg-white dark:bg-[#06101E] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F]"
                  placeholder="Ex: Myopie stable -3.5D..."
                />
              </div>
              <div className="space-y-1">
                <Label className={labelCls}>Traitement prescrit</Label>
                <textarea
                  {...register('traitement')}
                  rows={2}
                  className="w-full rounded-md border border-[#DCEEF3] dark:border-[#1C3F62]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none bg-white dark:bg-[#06101E] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F]"
                  placeholder="Ex: Renouvellement lentilles, prochain contrôle 1 an..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:text-[#EDF8FF] dark:hover:bg-[#1C3F62]/30">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || updateAppointment.isPending} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white btn-neon">
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
