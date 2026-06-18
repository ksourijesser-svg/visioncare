'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Appointment, useAppointmentsStore } from '@/store/appointmentsStore'

const schema = z.object({
  patient_prenom: z.string().min(1, 'Requis'),
  patient_nom: z.string().min(1, 'Requis'),
  patient_telephone: z.string().optional().default(''),
  date: z.string().min(1, 'Requis'),
  heure: z.string().min(1, 'Requis'),
  duree: z.string().default('30'),
  motif: z.string().min(1, 'Requis'),
  statut: z.enum(['programme', 'confirme', 'complete', 'annule']),
  notes: z.string().optional().default(''),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
}

export function AppointmentModal({ open, onClose, appointment }: Props) {
  const { addAppointment, updateAppointment } = useAppointmentsStore()
  const isEdit = !!appointment

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { statut: 'programme', duree: '30' },
  })

  useEffect(() => {
    if (open) {
      reset(appointment ? {
        patient_prenom: appointment.patient_prenom,
        patient_nom: appointment.patient_nom,
        patient_telephone: appointment.patient_telephone,
        date: appointment.date,
        heure: appointment.heure,
        duree: String(appointment.duree),
        motif: appointment.motif,
        statut: appointment.statut,
        notes: appointment.notes,
      } : {
        patient_prenom: '', patient_nom: '', patient_telephone: '',
        date: '', heure: '', duree: '30', motif: '', statut: 'programme', notes: '',
      })
    }
  }, [open, appointment, reset])

  function onSubmit(data: FormData) {
    const rdvData = {
      patient_id: appointment?.patient_id ?? 0,
      patient_nom: data.patient_nom,
      patient_prenom: data.patient_prenom,
      patient_telephone: data.patient_telephone || '',
      date: data.date,
      heure: data.heure,
      duree: Number(data.duree),
      motif: data.motif,
      statut: data.statut,
      notes: data.notes || '',
    }
    if (isEdit && appointment) {
      updateAppointment(appointment.id, rdvData)
    } else {
      addAppointment(rdvData)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#2D3748]">
            {isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Prénom patient *</Label>
              <Input
                {...register('patient_prenom')}
                className="border-[#DCEEF3]"
                placeholder="Entrez le prénom"
              />
              {errors.patient_prenom && <p className="text-red-500 text-xs">{errors.patient_prenom.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Nom patient *</Label>
              <Input
                {...register('patient_nom')}
                className="border-[#DCEEF3]"
                placeholder="Entrez le nom"
              />
              {errors.patient_nom && <p className="text-red-500 text-xs">{errors.patient_nom.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Téléphone patient</Label>
            <Input
              {...register('patient_telephone')}
              className="border-[#DCEEF3]"
              placeholder="Entrez le téléphone"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input {...register('date')} type="date" className="border-[#DCEEF3]" />
              {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Heure *</Label>
              <Input {...register('heure')} type="time" className="border-[#DCEEF3]" />
              {errors.heure && <p className="text-red-500 text-xs">{errors.heure.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Durée (minutes)</Label>
              <Select value={watch('duree')} onValueChange={(v) => setValue('duree', v)}>
                <SelectTrigger className="border-[#DCEEF3]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select value={watch('statut')} onValueChange={(v) => setValue('statut', v as FormData['statut'])}>
                <SelectTrigger className="border-[#DCEEF3]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programme">Programmé</SelectItem>
                  <SelectItem value="confirme">Confirmé</SelectItem>
                  <SelectItem value="complete">Complété</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Motif *</Label>
            <Input
              {...register('motif')}
              className="border-[#DCEEF3]"
              placeholder="Bilan visuel, contrôle glaucome..."
            />
            {errors.motif && <p className="text-red-500 text-xs">{errors.motif.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full rounded-md border border-[#DCEEF3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none"
              placeholder="Instructions particulières..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3]">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white">
              {isSubmitting && <Loader2 size={14} className="animate-spin mr-2" />}
              {isEdit ? 'Enregistrer' : 'Créer le RDV'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
