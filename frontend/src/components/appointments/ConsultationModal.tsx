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
import { Stethoscope, Scissors, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { Appointment } from '@/store/appointmentsStore'
import { useUpdateAppointment } from '@/hooks/useAppointments'
import { useCreateOperation, type Oeil, type Anesthesie, type OperationStatus } from '@/hooks/useOperations'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const schema = z.object({
  diagnostic: z.string(),
  traitement: z.string(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  appointment: Appointment | null
}

const inputCls = 'border border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F] focus-visible:ring-[#70B1C4]'
const labelCls = 'text-xs text-gray-500 dark:text-[#7AAABB]'

const INTERVENTIONS = [
  'Chirurgie de la cataracte',
  'Chirurgie réfractive (LASIK)',
  'Chirurgie réfractive (PKR)',
  'Injection intravitréenne',
  'Vitrectomie',
  'Chirurgie du glaucome',
  'Greffe de cornée',
  'Chirurgie des paupières',
  'Décollement de rétine',
  'Autre',
]

function todayISO() { return new Date().toISOString().slice(0, 10) }

export function ConsultationModal({ open, onClose, appointment }: Props) {
  const updateAppointment = useUpdateAppointment()
  const createOp = useCreateOperation()

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { diagnostic: '', traitement: '' },
  })

  // ── Opération (optionnelle) ──
  const [needsOp, setNeedsOp] = useState(false)
  const [opDate, setOpDate] = useState(todayISO())
  const [opHeure, setOpHeure] = useState('09:00')
  const [opDuree, setOpDuree] = useState(60)
  const [opType, setOpType] = useState(INTERVENTIONS[0])
  const [opOeil, setOpOeil] = useState<Oeil>('droit')
  const [opAnesth, setOpAnesth] = useState<Anesthesie>('topique')
  const [opSalle, setOpSalle] = useState('')
  const [opStatut, setOpStatut] = useState<OperationStatus>('planifiee')
  const [opNotes, setOpNotes] = useState('')

  useEffect(() => {
    if (open && appointment) {
      reset({
        diagnostic: appointment.diagnostic || '',
        traitement: appointment.traitement || '',
      })
      setNeedsOp(false)
      setOpDate(todayISO()); setOpHeure('09:00'); setOpDuree(60)
      setOpType(INTERVENTIONS[0]); setOpOeil('droit'); setOpAnesth('topique')
      setOpSalle(''); setOpStatut('planifiee'); setOpNotes('')
    }
  }, [open, appointment?.id])

  async function onSubmit(data: FormData) {
    if (!appointment) return

    // Register the operation on the Opérations page if the patient needs one.
    if (needsOp) {
      if (!appointment.patient_id) {
        toast.error('Patient introuvable pour planifier l\'opération')
      } else if (!opType.trim()) {
        toast.error('Indiquez le type d\'intervention')
        return
      } else {
        try {
          await createOp.mutateAsync({
            patient_id: appointment.patient_id,
            date_operation: `${opDate}T${opHeure}:00`,
            duree: Number(opDuree) || 60,
            type_intervention: opType.trim(),
            oeil: opOeil,
            anesthesie: opAnesth,
            salle: opSalle.trim() || null,
            statut: opStatut,
            notes: opNotes.trim() || null,
          })
        } catch {
          toast.error('Erreur lors de la planification de l\'opération')
          return
        }
      }
    }

    updateAppointment.mutate(
      { id: appointment.id, data: { diagnostic: data.diagnostic, traitement: data.traitement } },
      {
        onSuccess: () => { toast.success(needsOp ? 'Dossier enregistré · opération planifiée' : 'Dossier enregistré'); onClose() },
        onError: () => toast.error('Erreur lors de l\'enregistrement'),
      }
    )
  }

  if (!appointment) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col dark:bg-[#0D2038] dark:border-[#1C3F62]/50 dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.50),_0_0_18px_rgba(61,143,168,0.45),_0_0_55px_rgba(61,143,168,0.28),_0_0_110px_rgba(61,143,168,0.15),_0_20px_50px_rgba(0,0,0,0.65),_inset_0_1px_0_rgba(255,255,255,0.06)]">
        <DialogHeader className="shrink-0">
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden pt-1">

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-modal">
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

          {/* ── Opération section ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#DCEEF3] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                <Scissors size={12} className="text-[#70B1C4]" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Opération</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[#2D3748] dark:text-[#EDF8FF]">Le patient nécessite une opération ?</span>
              <div className="flex rounded-lg border border-[#DCEEF3] dark:border-[#1C3F62]/60 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setNeedsOp(false)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${!needsOp ? 'bg-[#70B1C4] text-white' : 'text-gray-500 dark:text-[#7AAABB] hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/40'}`}
                >
                  Non
                </button>
                <button
                  type="button"
                  onClick={() => setNeedsOp(true)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${needsOp ? 'bg-[#70B1C4] text-white' : 'text-gray-500 dark:text-[#7AAABB] hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/40'}`}
                >
                  Oui
                </button>
              </div>
            </div>

            {needsOp && (
              <div className="space-y-3 pt-1 border-t border-[#DCEEF3] dark:border-[#1C3F62]/40">
                <p className="text-[11px] text-gray-400 dark:text-[#7AAABB] pt-2">
                  L&apos;opération sera enregistrée dans la page <span className="font-semibold text-[#3d8fa8] dark:text-[#70B1C4]">Opérations</span>.
                </p>

                <div className="space-y-1">
                  <Label className={labelCls}>Type d&apos;intervention</Label>
                  <Select value={opType} onValueChange={(v) => { if (v) setOpType(v) }}>
                    <SelectTrigger className={`${inputCls} h-9`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INTERVENTIONS.map((it) => <SelectItem key={it} value={it}>{it}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={`${labelCls} flex items-center gap-1`}><Eye size={11} /> Œil</Label>
                    <Select value={opOeil} onValueChange={(v) => { if (v) setOpOeil(v as Oeil) }}>
                      <SelectTrigger className={`${inputCls} h-9`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="droit">Œil droit</SelectItem>
                        <SelectItem value="gauche">Œil gauche</SelectItem>
                        <SelectItem value="deux">Les deux yeux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className={labelCls}>Anesthésie</Label>
                    <Select value={opAnesth} onValueChange={(v) => { if (v) setOpAnesth(v as Anesthesie) }}>
                      <SelectTrigger className={`${inputCls} h-9`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="topique">Topique</SelectItem>
                        <SelectItem value="locale">Locale</SelectItem>
                        <SelectItem value="generale">Générale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelCls}>Date</Label>
                    <Input type="date" value={opDate} onChange={(e) => setOpDate(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelCls}>Heure</Label>
                    <Input type="time" value={opHeure} onChange={(e) => setOpHeure(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelCls}>Durée (min)</Label>
                    <Input type="number" min={5} step={5} value={opDuree} onChange={(e) => setOpDuree(parseInt(e.target.value) || 0)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelCls}>Salle / Bloc</Label>
                    <Input value={opSalle} onChange={(e) => setOpSalle(e.target.value)} placeholder="Bloc 1" className={inputCls} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className={labelCls}>Statut</Label>
                  <Select value={opStatut} onValueChange={(v) => { if (v) setOpStatut(v as OperationStatus) }}>
                    <SelectTrigger className={`${inputCls} h-9`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planifiee">Planifiée</SelectItem>
                      <SelectItem value="confirmee">Confirmée</SelectItem>
                      <SelectItem value="terminee">Terminée</SelectItem>
                      <SelectItem value="annulee">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className={labelCls}>Notes opératoires</Label>
                  <textarea
                    value={opNotes}
                    onChange={(e) => setOpNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-[#DCEEF3] dark:border-[#1C3F62]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none bg-white dark:bg-[#06101E] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F]"
                    placeholder="Précautions, matériel, antécédents pertinents..."
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          <DialogFooter className="gap-2 shrink-0 pt-3 border-t border-gray-100 dark:border-[#1C3F62]/30">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:text-[#EDF8FF] dark:hover:bg-[#1C3F62]/30">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || updateAppointment.isPending || createOp.isPending} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white btn-neon">
              {needsOp ? 'Enregistrer & planifier' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
