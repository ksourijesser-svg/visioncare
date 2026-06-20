'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, CheckCircle2, X } from 'lucide-react'
import type { Appointment } from '@/store/appointmentsStore'
import type { Patient } from '@/store/patientsStore'
import { usePatients } from '@/hooks/usePatients'
import { useCreateAppointment, useUpdateAppointment } from '@/hooks/useAppointments'
import { patientsApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

const schema = z.object({
  patient_prenom: z.string().min(1, 'Requis'),
  patient_nom: z.string().min(1, 'Requis'),
  patient_telephone: z.string(),
  date: z.string().min(1, 'Requis'),
  heure: z.string().min(1, 'Requis'),
  duree: z.string(),
  motif: z.string().min(1, 'Requis'),
  statut: z.enum(['programme', 'confirme', 'complete', 'annule']),
  notes: z.string(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
}

export function AppointmentModal({ open, onClose, appointment }: Props) {
  const { data: patients = [] } = usePatients()
  const createAppointment = useCreateAppointment()
  const updateAppointment = useUpdateAppointment()
  const queryClient = useQueryClient()
  const isEdit = !!appointment

  const [patientId, setPatientId] = useState<number>(0)
  const [linkedPatient, setLinkedPatient] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { statut: 'programme', duree: '30', patient_telephone: '', notes: '' },
  })

  useEffect(() => {
    if (open) {
      if (appointment) {
        reset({
          patient_prenom: appointment.patient_prenom,
          patient_nom: appointment.patient_nom,
          patient_telephone: appointment.patient_telephone,
          date: appointment.date,
          heure: appointment.heure,
          duree: String(appointment.duree),
          motif: appointment.motif,
          statut: appointment.statut,
          notes: appointment.notes,
        })
        setPatientId(appointment.patient_id)
        const existing = patients.find((p) => p.id === appointment.patient_id)
        setLinkedPatient(existing ?? null)
        setSearchQuery(existing ? `${existing.prenom} ${existing.nom}` : '')
      } else {
        reset({ patient_prenom: '', patient_nom: '', patient_telephone: '', date: '', heure: '', duree: '30', motif: '', statut: 'programme', notes: '' })
        setPatientId(0)
        setLinkedPatient(null)
        setSearchQuery('')
      }
      setShowDropdown(false)
    }
  }, [open, appointment, patients, reset])

  const suggestions = searchQuery.length >= 2 && !linkedPatient
    ? patients.filter((p) => {
        const q = searchQuery.toLowerCase()
        return (
          `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
          p.nom.toLowerCase().includes(q) ||
          p.prenom.toLowerCase().includes(q) ||
          p.telephone.includes(q)
        )
      }).slice(0, 6)
    : []

  function handleSelectPatient(p: Patient) {
    setValue('patient_prenom', p.prenom)
    setValue('patient_nom', p.nom)
    setValue('patient_telephone', p.telephone)
    setPatientId(p.id)
    setLinkedPatient(p)
    setSearchQuery(`${p.prenom} ${p.nom}`)
    setShowDropdown(false)
  }

  function handleClearPatient() {
    setLinkedPatient(null)
    setPatientId(0)
    setSearchQuery('')
    setValue('patient_prenom', '')
    setValue('patient_nom', '')
    setValue('patient_telephone', '')
  }

  async function onSubmit(data: FormData) {
    let pid = patientId

    // If no existing patient selected, create one automatically
    if (!pid) {
      try {
        const res = await patientsApi.create({
          nom: toTitleCase(data.patient_nom),
          prenom: toTitleCase(data.patient_prenom),
          telephone: data.patient_telephone || null,
          email: null,
          adresse: null,
          date_naissance: null,
          notes: null,
        })
        pid = (res.data as { id: number }).id
        queryClient.invalidateQueries({ queryKey: ['patients'] })
      } catch {
        toast.error('Impossible de créer le patient')
        return
      }
    }

    const rdvData = {
      patient_id: pid,
      patient_nom: toTitleCase(data.patient_nom),
      patient_prenom: toTitleCase(data.patient_prenom),
      patient_telephone: data.patient_telephone || '',
      date: data.date,
      heure: data.heure,
      duree: Number(data.duree),
      motif: data.motif,
      statut: data.statut,
      notes: data.notes || '',
    }

    if (isEdit && appointment) {
      updateAppointment.mutate({ id: appointment.id, data: rdvData }, {
        onSuccess: onClose,
        onError: () => toast.error('Erreur lors de la mise à jour'),
      })
    } else {
      createAppointment.mutate(rdvData, {
        onSuccess: onClose,
        onError: () => toast.error('Erreur lors de la création du rendez-vous'),
      })
    }
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

          {/* Patient search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2D3748]">Patient</Label>

            {linkedPatient ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {linkedPatient.prenom} {linkedPatient.nom}
                    </p>
                    <p className="text-xs text-green-600">{linkedPatient.telephone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="text-green-400 hover:text-green-600 p-1 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Rechercher un patient existant..."
                    className="pl-9 border-[#DCEEF3]"
                  />
                </div>
                {/* Suggestions rendered inline — avoids dialog stacking-context clipping */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="mt-1 bg-white border border-[#DCEEF3] rounded-lg shadow-sm overflow-hidden">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => handleSelectPatient(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F5F9FA] flex items-center justify-between border-b border-[#F5F9FA] last:border-0 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#E4EEF4] flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-[#70B1C4]">
                              {p.prenom[0]}{p.nom[0]}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-[#2D3748]">
                            {p.prenom} {p.nom}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{p.telephone}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery.length >= 2 && suggestions.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400 px-1">Aucun patient trouvé — saisissez manuellement ci-dessous.</p>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[#DCEEF3]" />
              <span className="text-xs text-gray-400">ou saisir manuellement</span>
              <div className="flex-1 h-px bg-[#DCEEF3]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Prénom *</Label>
                <Input
                  {...register('patient_prenom')}
                  className="border-[#DCEEF3]"
                  placeholder="Prénom"
                />
                {errors.patient_prenom && <p className="text-red-500 text-xs">{errors.patient_prenom.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Nom *</Label>
                <Input
                  {...register('patient_nom')}
                  className="border-[#DCEEF3]"
                  placeholder="Nom"
                />
                {errors.patient_nom && <p className="text-red-500 text-xs">{errors.patient_nom.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Téléphone</Label>
              <Input
                {...register('patient_telephone')}
                className="border-[#DCEEF3]"
                placeholder="Numéro de téléphone"
              />
            </div>
          </div>

          {/* Date / Heure */}
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

          {/* Durée / Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Durée (minutes)</Label>
              <Select value={watch('duree') ?? '30'} onValueChange={(v) => { if (v) setValue('duree', v) }}>
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
              <Select value={watch('statut') ?? 'programme'} onValueChange={(v) => { if (v) setValue('statut', v as FormData['statut']) }}>
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

          {/* Motif */}
          <div className="space-y-1">
            <Label>Motif *</Label>
            <Input
              {...register('motif')}
              className="border-[#DCEEF3]"
              placeholder="Bilan visuel, contrôle glaucome..."
            />
            {errors.motif && <p className="text-red-500 text-xs">{errors.motif.message}</p>}
          </div>

          {/* Notes */}
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
            <Button type="submit" disabled={createAppointment.isPending || updateAppointment.isPending} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white">
              {(createAppointment.isPending || updateAppointment.isPending) && <Loader2 size={14} className="animate-spin mr-2" />}
              {isEdit ? 'Enregistrer' : 'Créer le RDV'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
