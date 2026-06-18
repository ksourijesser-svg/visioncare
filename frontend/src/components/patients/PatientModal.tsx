'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { Patient, usePatientsStore } from '@/store/patientsStore'

const schema = z.object({
  prenom: z.string().min(1, 'Requis'),
  nom: z.string().min(1, 'Requis'),
  date_naissance: z.string().min(1, 'Requis'),
  telephone: z.string().min(1, 'Requis'),
  email: z.string().email('Email invalide').or(z.literal('')),
  adresse: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  patient?: Patient | null
}

export function PatientModal({ open, onClose, patient }: Props) {
  const { addPatient, updatePatient } = usePatientsStore()
  const isEdit = !!patient

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset(patient ? {
        prenom: patient.prenom,
        nom: patient.nom,
        date_naissance: patient.date_naissance,
        telephone: patient.telephone,
        email: patient.email,
        adresse: patient.adresse,
        notes: patient.notes,
      } : { prenom: '', nom: '', date_naissance: '', telephone: '', email: '', adresse: '', notes: '' })
    }
  }, [open, patient, reset])

  function onSubmit(data: FormData) {
    if (isEdit && patient) {
      updatePatient(patient.id, data)
    } else {
      addPatient(data as Omit<Patient, 'id' | 'nb_consultations' | 'derniere_visite' | 'created_at'>)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#2D3748]">
            {isEdit ? 'Modifier le patient' : 'Nouveau patient'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Prénom *</Label>
              <Input {...register('prenom')} className="border-[#DCEEF3]" placeholder="Sophie" />
              {errors.prenom && <p className="text-red-500 text-xs">{errors.prenom.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Nom *</Label>
              <Input {...register('nom')} className="border-[#DCEEF3]" placeholder="Martin" />
              {errors.nom && <p className="text-red-500 text-xs">{errors.nom.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date de naissance *</Label>
              <Input {...register('date_naissance')} type="date" className="border-[#DCEEF3]" />
              {errors.date_naissance && <p className="text-red-500 text-xs">{errors.date_naissance.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Téléphone *</Label>
              <Input {...register('telephone')} className="border-[#DCEEF3]" placeholder="06 12 34 56 78" />
              {errors.telephone && <p className="text-red-500 text-xs">{errors.telephone.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Email</Label>
            <Input {...register('email')} type="email" className="border-[#DCEEF3]" placeholder="patient@email.fr" />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Adresse</Label>
            <Input {...register('adresse')} className="border-[#DCEEF3]" placeholder="12 rue de la Paix, Paris" />
          </div>

          <div className="space-y-1">
            <Label>Notes médicales</Label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full rounded-md border border-[#DCEEF3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none"
              placeholder="Myopie forte, allergies, antécédents..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3]">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white">
              {isSubmitting && <Loader2 size={14} className="animate-spin mr-2" />}
              {isEdit ? 'Enregistrer' : 'Ajouter le patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
