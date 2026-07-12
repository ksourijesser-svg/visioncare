'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Pill, Glasses, Plus, Trash2, Printer, CircleDot } from 'lucide-react'
import type { Patient } from '@/store/patientsStore'
import { useProfileStore } from '@/store/profileStore'
import {
  useCreateOrdonnance,
  type OrdonnanceType, type Medicament, type Verres, type OeilVerre,
  type Lentilles, type OeilLentille,
} from '@/hooks/useOrdonnances'
import { exportOrdonnancePdf } from '@/lib/ordonnancePdf'
import { differenceInYears } from 'date-fns'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  patient: Patient | null
}

const inputCls = 'border border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F] focus-visible:ring-[#70B1C4]'
const labelCls = 'text-xs text-gray-500 dark:text-[#7AAABB]'

const emptyMed = (): Medicament => ({ medicament: '', posologie: '', duree: '', instructions: '' })
const emptyEye = (): OeilVerre => ({ sphere: '', cylindre: '', axe: '', addition: '' })
const emptyVerres = (): Verres => ({ type_correction: 'loin', ecart_pupillaire: '', od: emptyEye(), og: emptyEye() })
const emptyLensEye = (): OeilLentille => ({ puissance: '', rayon: '', diametre: '' })
const emptyLentilles = (): Lentilles => ({ type_lentille: 'souple', rythme_port: 'mensuel', produit_entretien: '', od: emptyLensEye(), og: emptyLensEye() })

function todayISO() { return new Date().toISOString().slice(0, 10) }

export function OrdonnanceModal({ open, onClose, patient }: Props) {
  const createOrd = useCreateOrdonnance()
  const { profile } = useProfileStore()

  const [type, setType] = useState<OrdonnanceType>('medicale')
  const [date, setDate] = useState(todayISO())
  const [meds, setMeds] = useState<Medicament[]>([emptyMed()])
  const [verres, setVerres] = useState<Verres>(emptyVerres())
  const [lentilles, setLentilles] = useState<Lentilles>(emptyLentilles())
  const [notes, setNotes] = useState('')

  // Render-phase reset when the dialog opens.
  const [initKey, setInitKey] = useState('')
  const currentKey = open && patient ? `${patient.id}` : ''
  if (currentKey && currentKey !== initKey) {
    setInitKey(currentKey)
    setType('medicale')
    setDate(todayISO())
    setMeds([emptyMed()])
    setVerres(emptyVerres())
    setLentilles(emptyLentilles())
    setNotes('')
  }
  if (!currentKey && initKey) setInitKey('')

  function updateMed(i: number, patch: Partial<Medicament>) {
    setMeds((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
  }
  function addMed() { setMeds((prev) => [...prev, emptyMed()]) }
  function removeMed(i: number) { setMeds((prev) => prev.filter((_, idx) => idx !== i)) }

  function updateEye(eye: 'od' | 'og', patch: Partial<OeilVerre>) {
    setVerres((prev) => ({ ...prev, [eye]: { ...prev[eye], ...patch } }))
  }

  function buildPayload() {
    if (!patient) return null
    if (type === 'medicale') {
      const clean = meds.filter((m) => m.medicament.trim())
      if (clean.length === 0) { toast.error('Ajoutez au moins un médicament'); return null }
      return { patient_id: patient.id, type, date_ordonnance: date, medicaments: clean, verres: null, notes: notes || null }
    }
    return { patient_id: patient.id, type, date_ordonnance: date, medicaments: [], verres, notes: notes || null }
  }

  function doPrint() {
    if (!patient) return
    const age = patient.date_naissance ? differenceInYears(new Date(), new Date(patient.date_naissance)) : null
    exportOrdonnancePdf({
      type,
      date_ordonnance: date,
      medicaments: type === 'medicale' ? meds.filter((m) => m.medicament.trim()) : [],
      verres: type === 'lunettes' ? verres : null,
      notes,
      patient: { prenom: patient.prenom, nom: patient.nom, age, date_naissance: patient.date_naissance || undefined },
      doctor: {
        prenom: profile.prenom, nom: profile.nom, specialite: profile.specialite, rpps: profile.rpps,
        cabinet_nom: profile.cabinet_nom, cabinet_adresse: profile.cabinet_adresse,
        cabinet_telephone: profile.cabinet_telephone, cabinet_email: profile.cabinet_email,
      },
    })
  }

  function onSave(thenPrint: boolean) {
    const payload = buildPayload()
    if (!payload) return
    createOrd.mutate(payload, {
      onSuccess: () => {
        toast.success('Ordonnance enregistrée')
        if (thenPrint) doPrint()
        onClose()
      },
      onError: () => toast.error("Erreur lors de l'enregistrement"),
    })
  }

  const TYPE_TABS: { key: OrdonnanceType; label: string; icon: typeof Pill }[] = [
    { key: 'medicale', label: 'Médicale', icon: Pill },
    { key: 'lunettes', label: 'Lunettes', icon: Glasses },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col dark:bg-[#0D2038] dark:border-[#1C3F62]/50 dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.50),_0_0_18px_rgba(61,143,168,0.45),_0_0_55px_rgba(61,143,168,0.28),_0_20px_50px_rgba(0,0,0,0.65)]">
        <DialogHeader className="pb-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3d8fa8] to-[#70B1C4] flex items-center justify-center shrink-0 shadow-md shadow-[#70B1C4]/30">
              <Pill size={14} className="text-white" />
            </div>
            <DialogTitle className="text-[#2D3748] dark:text-[#EDF8FF]">
              Nouvelle ordonnance{patient ? ` — ${patient.prenom} ${patient.nom}` : ''}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-modal">
          {/* ── Type toggle ── */}
          <div className="flex items-center gap-2 bg-[#F0F5F8] dark:bg-[#091628] rounded-xl p-1">
            {TYPE_TABS.map((t) => {
              const Icon = t.icon
              const active = type === t.key
              return (
                <button key={t.key} type="button" onClick={() => setType(t.key)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    active ? 'bg-[#70B1C4] text-white shadow-md shadow-[#70B1C4]/30' : 'text-gray-500 dark:text-[#7AAABB] hover:bg-white/60 dark:hover:bg-[#1C3F62]/40'
                  }`}>
                  <Icon size={15} /> {t.label}
                </button>
              )
            })}
          </div>

          {/* ── Date ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4">
            <div className="space-y-1 max-w-[200px]">
              <Label className={labelCls}>Date de l&apos;ordonnance</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* ── Médicale ── */}
          {type === 'medicale' && (
            <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill size={13} className="text-[#70B1C4]" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Médicaments</span>
                </div>
                <button type="button" onClick={addMed} className="inline-flex items-center gap-1 text-xs font-semibold text-[#3d8fa8] dark:text-[#70B1C4] hover:underline">
                  <Plus size={13} /> Ajouter
                </button>
              </div>

              {meds.map((m, i) => (
                <div key={i} className="rounded-lg border border-[#DCEEF3] dark:border-[#1C3F62]/50 bg-white dark:bg-[#06101E] p-3 space-y-2 relative">
                  <button type="button" onClick={() => removeMed(i)} disabled={meds.length === 1}
                    className="absolute top-2 right-2 p-1 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed">
                    <Trash2 size={13} />
                  </button>
                  <div className="space-y-1">
                    <Label className={labelCls}>Médicament</Label>
                    <Input value={m.medicament} onChange={(e) => updateMed(i, { medicament: e.target.value })} placeholder="ex. Collyre Azarga 5 mL" className={`${inputCls} h-9 pr-8`} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className={labelCls}>Posologie</Label>
                      <Input value={m.posologie} onChange={(e) => updateMed(i, { posologie: e.target.value })} placeholder="1 goutte matin et soir" className={`${inputCls} h-9`} />
                    </div>
                    <div className="space-y-1">
                      <Label className={labelCls}>Durée</Label>
                      <Input value={m.duree} onChange={(e) => updateMed(i, { duree: e.target.value })} placeholder="1 mois" className={`${inputCls} h-9`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className={labelCls}>Instructions (optionnel)</Label>
                    <Input value={m.instructions} onChange={(e) => updateMed(i, { instructions: e.target.value })} placeholder="À renouveler si besoin..." className={`${inputCls} h-9`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Lunettes ── */}
          {type === 'lunettes' && (
            <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Glasses size={13} className="text-[#70B1C4]" />
                <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Correction optique</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className={labelCls}>Type de correction</Label>
                  <Select value={verres.type_correction} onValueChange={(v) => { if (v) setVerres((p) => ({ ...p, type_correction: v })) }}>
                    <SelectTrigger className={`${inputCls} h-9`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loin">Vision de loin</SelectItem>
                      <SelectItem value="pres">Vision de près</SelectItem>
                      <SelectItem value="progressif">Verres progressifs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className={labelCls}>Écart pupillaire (mm)</Label>
                  <Input value={verres.ecart_pupillaire} onChange={(e) => setVerres((p) => ({ ...p, ecart_pupillaire: e.target.value }))} placeholder="62" className={`${inputCls} h-9`} />
                </div>
              </div>

              {/* OD/OG table */}
              <div className="overflow-hidden rounded-lg border border-[#DCEEF3] dark:border-[#1C3F62]/50">
                <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] bg-[#E4F0F4] dark:bg-[#13344b] text-[10px] font-bold text-[#1e5f7a] dark:text-[#70B1C4] uppercase tracking-wider">
                  <span className="px-2 py-2" />
                  <span className="px-2 py-2 text-center">Sphère</span>
                  <span className="px-2 py-2 text-center">Cylindre</span>
                  <span className="px-2 py-2 text-center">Axe</span>
                  <span className="px-2 py-2 text-center">Addition</span>
                </div>
                {(['od', 'og'] as const).map((eye) => (
                  <div key={eye} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] items-center border-t border-[#DCEEF3] dark:border-[#1C3F62]/40">
                    <span className="px-2 py-1.5 text-xs font-bold text-[#1A2B3C] dark:text-[#EDF8FF] bg-[#F4F8FA] dark:bg-[#0A1A2E] h-full flex items-center">{eye.toUpperCase()}</span>
                    <Input value={verres[eye].sphere} onChange={(e) => updateEye(eye, { sphere: e.target.value })} placeholder="-1.50" className={`${inputCls} h-9 rounded-none border-0 text-center`} />
                    <Input value={verres[eye].cylindre} onChange={(e) => updateEye(eye, { cylindre: e.target.value })} placeholder="-0.75" className={`${inputCls} h-9 rounded-none border-0 text-center`} />
                    <Input value={verres[eye].axe} onChange={(e) => updateEye(eye, { axe: e.target.value })} placeholder="90" className={`${inputCls} h-9 rounded-none border-0 text-center`} />
                    <Input value={verres[eye].addition} onChange={(e) => updateEye(eye, { addition: e.target.value })} placeholder="+2.00" className={`${inputCls} h-9 rounded-none border-0 text-center`} />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-[#7AAABB]">OD = œil droit · OG = œil gauche. Laissez vide si non applicable.</p>
            </div>
          )}

          {/* ── Notes ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-1">
            <Label className={labelCls}>Remarques</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full rounded-md border border-[#DCEEF3] dark:border-[#1C3F62]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none bg-white dark:bg-[#06101E] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F]"
              placeholder="Contrôle dans 3 mois, port permanent..." />
          </div>
        </div>

        <DialogFooter className="gap-2 shrink-0 pt-3 border-t border-gray-100 dark:border-[#1C3F62]/30">
          <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:text-[#EDF8FF] dark:hover:bg-[#1C3F62]/30">Annuler</Button>
          <Button type="button" variant="outline" onClick={() => onSave(false)} disabled={createOrd.isPending}
            className="border-[#70B1C4] text-[#3d8fa8] dark:text-[#70B1C4] hover:bg-[#E4F0F4] dark:hover:bg-[#1C3F62]/30">
            {createOrd.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            Enregistrer
          </Button>
          <Button type="button" onClick={() => onSave(true)} disabled={createOrd.isPending} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white btn-neon">
            <Printer size={14} className="mr-2" /> Enregistrer &amp; imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
