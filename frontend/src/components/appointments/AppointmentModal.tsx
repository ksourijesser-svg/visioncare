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
import { Loader2, Search, CheckCircle2, X, User, Calendar, ClipboardList } from 'lucide-react'
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

const inputCls = 'border border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F] focus-visible:ring-[#70B1C4]'
const labelCls = 'text-xs text-gray-500 dark:text-[#7AAABB]'

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col dark:bg-[#0D2038] dark:border-[#1C3F62]/50 dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.50),_0_0_18px_rgba(61,143,168,0.45),_0_0_55px_rgba(61,143,168,0.28),_0_0_110px_rgba(61,143,168,0.15),_0_20px_50px_rgba(0,0,0,0.65),_inset_0_1px_0_rgba(255,255,255,0.06)]">
        <DialogHeader className="pb-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3d8fa8] to-[#70B1C4] flex items-center justify-center shrink-0 shadow-md shadow-[#70B1C4]/30">
              <Calendar size={14} className="text-white" />
            </div>
            <DialogTitle className="text-[#2D3748] dark:text-[#EDF8FF]">
              {isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* ── Patient section ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User size={13} className="text-[#70B1C4]" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Patient</span>
            </div>

            {linkedPatient ? (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      {linkedPatient.prenom} {linkedPatient.nom}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">{linkedPatient.telephone}</p>
                  </div>
                </div>
                <button type="button" onClick={handleClearPatient} className="text-green-400 hover:text-green-600 p-1 rounded">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7AAABB] pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true) }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Rechercher un patient existant..."
                    className={`pl-9 ${inputCls}`}
                  />
                </div>
                {/* Inline dropdown — avoids dialog stacking-context clipping */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="mt-1 bg-white dark:bg-[#102844] border border-[#DCEEF3] dark:border-[#1C3F62]/60 rounded-lg shadow-sm dark:shadow-black/40 overflow-hidden">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => handleSelectPatient(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F5F9FA] dark:hover:bg-[#1C3F62]/50 flex items-center justify-between border-b border-[#F5F9FA] dark:border-[#1C3F62]/30 last:border-0 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#E4EEF4] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-[#70B1C4]">{p.prenom[0]}{p.nom[0]}</span>
                          </div>
                          <span className="text-sm font-medium text-[#2D3748] dark:text-[#EDF8FF]">{p.prenom} {p.nom}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-[#7AAABB]">{p.telephone}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery.length >= 2 && suggestions.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-[#7AAABB] px-1">Aucun patient trouvé — saisissez manuellement ci-dessous.</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#DCEEF3] dark:bg-[#1C3F62]/40" />
              <span className="text-xs text-gray-400 dark:text-[#7AAABB]">ou saisir manuellement</span>
              <div className="flex-1 h-px bg-[#DCEEF3] dark:bg-[#1C3F62]/40" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={labelCls}>Prénom *</Label>
                <Input {...register('patient_prenom')} className={inputCls} placeholder="Prénom" />
                {errors.patient_prenom && <p className="text-red-500 text-xs">{errors.patient_prenom.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className={labelCls}>Nom *</Label>
                <Input {...register('patient_nom')} className={inputCls} placeholder="Nom" />
                {errors.patient_nom && <p className="text-red-500 text-xs">{errors.patient_nom.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label className={labelCls}>Téléphone</Label>
              <Input {...register('patient_telephone')} className={inputCls} placeholder="Numéro de téléphone" />
            </div>
          </div>

          {/* ── Date / Heure / Durée / Statut ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-[#70B1C4]" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Date & heure</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={labelCls}>Date *</Label>
                <Input {...register('date')} type="date" className={inputCls} />
                {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className={labelCls}>Heure *</Label>
                <Input {...register('heure')} type="time" className={inputCls} />
                {errors.heure && <p className="text-red-500 text-xs">{errors.heure.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={labelCls}>Durée (minutes)</Label>
                <Select value={watch('duree') ?? '30'} onValueChange={(v) => { if (v) setValue('duree', v) }}>
                  <SelectTrigger className={`${inputCls} h-9`}>
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
                <Label className={labelCls}>Statut</Label>
                <Select value={watch('statut') ?? 'programme'} onValueChange={(v) => { if (v) setValue('statut', v as FormData['statut']) }}>
                  <SelectTrigger className={`${inputCls} h-9`}>
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
          </div>

          {/* ── Motif & Notes ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={13} className="text-[#70B1C4]" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Motif & notes</span>
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Motif *</Label>
              <Input {...register('motif')} className={inputCls} placeholder="Bilan visuel, contrôle glaucome..." />
              {errors.motif && <p className="text-red-500 text-xs">{errors.motif.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Notes</Label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full rounded-md border border-[#DCEEF3] dark:border-[#1C3F62]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none bg-white dark:bg-[#06101E] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F]"
                placeholder="Instructions particulières..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:text-[#EDF8FF] dark:hover:bg-[#1C3F62]/30">
              Annuler
            </Button>
            <Button type="submit" disabled={createAppointment.isPending || updateAppointment.isPending} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white btn-neon">
              {(createAppointment.isPending || updateAppointment.isPending) && <Loader2 size={14} className="animate-spin mr-2" />}
              {isEdit ? 'Enregistrer' : 'Créer le RDV'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
