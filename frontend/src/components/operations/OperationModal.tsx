'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, CheckCircle2, X, User, Scissors, Eye } from 'lucide-react'
import type { Patient } from '@/store/patientsStore'
import { usePatients } from '@/hooks/usePatients'
import {
  useCreateOperation, useUpdateOperation,
  type Operation, type OperationStatus, type Oeil, type Anesthesie,
} from '@/hooks/useOperations'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  operation?: Operation | null
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

export function OperationModal({ open, onClose, operation }: Props) {
  const { data: patients = [] } = usePatients()
  const createOp = useCreateOperation()
  const updateOp = useUpdateOperation()
  const isEdit = !!operation

  const [patientId, setPatientId] = useState<number>(0)
  const [linkedPatient, setLinkedPatient] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const [date, setDate] = useState(todayISO())
  const [heure, setHeure] = useState('09:00')
  const [duree, setDuree] = useState(60)
  const [type, setType] = useState(INTERVENTIONS[0])
  const [oeil, setOeil] = useState<Oeil>('droit')
  const [anesthesie, setAnesthesie] = useState<Anesthesie>('topique')
  const [salle, setSalle] = useState('')
  const [statut, setStatut] = useState<OperationStatus>('planifiee')
  const [notes, setNotes] = useState('')

  // Render-phase init (React's "adjust state during render" — avoids effects).
  const [initKey, setInitKey] = useState('')
  const currentKey = open ? (operation ? `edit-${operation.id}` : 'new') : ''
  if (currentKey && currentKey !== initKey) {
    setInitKey(currentKey)
    if (operation) {
      const d = new Date(operation.date_operation)
      setPatientId(operation.patient_id)
      setLinkedPatient({ id: operation.patient_id, prenom: operation.patient_prenom, nom: operation.patient_nom, telephone: operation.patient_telephone } as Patient)
      setSearchQuery(`${operation.patient_prenom} ${operation.patient_nom}`)
      setDate(isNaN(d.getTime()) ? todayISO() : d.toISOString().slice(0, 10))
      setHeure(isNaN(d.getTime()) ? '09:00' : d.toTimeString().slice(0, 5))
      setDuree(operation.duree || 60)
      setType(operation.type_intervention || INTERVENTIONS[0])
      setOeil(operation.oeil || 'droit')
      setAnesthesie(operation.anesthesie || 'topique')
      setSalle(operation.salle || '')
      setStatut(operation.statut)
      setNotes(operation.notes || '')
    } else {
      setPatientId(0)
      setLinkedPatient(null)
      setSearchQuery('')
      setDate(todayISO())
      setHeure('09:00')
      setDuree(60)
      setType(INTERVENTIONS[0])
      setOeil('droit')
      setAnesthesie('topique')
      setSalle('')
      setStatut('planifiee')
      setNotes('')
    }
    setShowDropdown(false)
  }

  const suggestions = searchQuery.length >= 2 && !linkedPatient
    ? patients.filter((p) => {
        const q = searchQuery.toLowerCase()
        return `${p.prenom} ${p.nom}`.toLowerCase().includes(q) || p.telephone.includes(q)
      }).slice(0, 6)
    : []

  function selectPatient(p: Patient) {
    setPatientId(p.id)
    setLinkedPatient(p)
    setSearchQuery(`${p.prenom} ${p.nom}`)
    setShowDropdown(false)
  }

  function clearPatient() {
    setLinkedPatient(null)
    setPatientId(0)
    setSearchQuery('')
  }

  function onSubmit() {
    if (!patientId) { toast.error('Sélectionnez un patient'); return }
    if (!type.trim()) { toast.error("Indiquez le type d'intervention"); return }

    const payload = {
      patient_id: patientId,
      date_operation: `${date}T${heure}:00`,
      duree: Number(duree) || 60,
      type_intervention: type.trim(),
      oeil,
      anesthesie,
      salle: salle.trim() || null,
      statut,
      notes: notes.trim() || null,
    }

    if (isEdit && operation) {
      updateOp.mutate({ id: operation.id, data: payload }, {
        onSuccess: () => { toast.success('Opération mise à jour'); onClose() },
        onError: () => toast.error('Erreur lors de la mise à jour'),
      })
    } else {
      createOp.mutate(payload, {
        onSuccess: () => { toast.success('Opération planifiée'); onClose() },
        onError: () => toast.error('Erreur lors de la planification'),
      })
    }
  }

  const pending = createOp.isPending || updateOp.isPending

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col dark:bg-[#0D2038] dark:border-[#1C3F62]/50 dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.50),_0_0_18px_rgba(61,143,168,0.45),_0_0_55px_rgba(61,143,168,0.28),_0_20px_50px_rgba(0,0,0,0.65)]">
        <DialogHeader className="pb-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3d8fa8] to-[#70B1C4] flex items-center justify-center shrink-0 shadow-md shadow-[#70B1C4]/30">
              <Scissors size={14} className="text-white" />
            </div>
            <DialogTitle className="text-[#2D3748] dark:text-[#EDF8FF]">
              {isEdit ? "Modifier l'opération" : 'Planifier une opération'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-modal">
          {/* ── Patient ── */}
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
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{linkedPatient.prenom} {linkedPatient.nom}</p>
                    {linkedPatient.telephone && <p className="text-xs text-green-600 dark:text-green-400">{linkedPatient.telephone}</p>}
                  </div>
                </div>
                <button type="button" onClick={clearPatient} className="text-green-400 hover:text-green-600 p-1 rounded"><X size={14} /></button>
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
                    placeholder="Rechercher un patient..."
                    className={`pl-9 ${inputCls}`}
                  />
                </div>
                {showDropdown && suggestions.length > 0 && (
                  <div className="mt-1 bg-white dark:bg-[#102844] border border-[#DCEEF3] dark:border-[#1C3F62]/60 rounded-lg overflow-hidden">
                    {suggestions.map((p) => (
                      <button key={p.id} type="button" onMouseDown={() => selectPatient(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F5F9FA] dark:hover:bg-[#1C3F62]/50 flex items-center justify-between border-b border-[#F5F9FA] dark:border-[#1C3F62]/30 last:border-0 transition-colors">
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
                  <p className="mt-1 text-xs text-gray-400 dark:text-[#7AAABB] px-1">Aucun patient trouvé.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Intervention ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Scissors size={13} className="text-[#70B1C4]" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Intervention</span>
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Type d&apos;intervention</Label>
              <Select value={type} onValueChange={(v) => { if (v) setType(v) }}>
                <SelectTrigger className={`${inputCls} h-9`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVENTIONS.map((it) => <SelectItem key={it} value={it}>{it}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={`${labelCls} flex items-center gap-1`}><Eye size={11} /> Œil</Label>
                <Select value={oeil} onValueChange={(v) => { if (v) setOeil(v as Oeil) }}>
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
                <Select value={anesthesie} onValueChange={(v) => { if (v) setAnesthesie(v as Anesthesie) }}>
                  <SelectTrigger className={`${inputCls} h-9`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topique">Topique</SelectItem>
                    <SelectItem value="locale">Locale</SelectItem>
                    <SelectItem value="generale">Générale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Planning ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={labelCls}>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Heure</Label>
              <Input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Durée (min)</Label>
              <Input type="number" min={5} step={5} value={duree} onChange={(e) => setDuree(parseInt(e.target.value) || 0)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Salle / Bloc</Label>
              <Input value={salle} onChange={(e) => setSalle(e.target.value)} placeholder="Bloc 1" className={inputCls} />
            </div>
          </div>

          {/* ── Statut + notes ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
            <div className="space-y-1">
              <Label className={labelCls}>Statut</Label>
              <Select value={statut} onValueChange={(v) => { if (v) setStatut(v as OperationStatus) }}>
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
              <Label className={labelCls}>Notes</Label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-md border border-[#DCEEF3] dark:border-[#1C3F62]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none bg-white dark:bg-[#06101E] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F]"
                placeholder="Précautions, matériel, antécédents pertinents..." />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 shrink-0 pt-3 border-t border-gray-100 dark:border-[#1C3F62]/30">
          <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:text-[#EDF8FF] dark:hover:bg-[#1C3F62]/30">Annuler</Button>
          <Button type="button" onClick={onSubmit} disabled={pending} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white btn-neon">
            {pending && <Loader2 size={14} className="animate-spin mr-2" />}
            {isEdit ? 'Enregistrer' : 'Planifier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
