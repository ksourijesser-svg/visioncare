'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search, CheckCircle2, X, User, Receipt, Plus, Trash2 } from 'lucide-react'
import type { Patient } from '@/store/patientsStore'
import { usePatients } from '@/hooks/usePatients'
import { useCreateFacture, useUpdateFacture, type Facture, type LigneFacture } from '@/hooks/useFactures'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  facture?: Facture | null
}

const inputCls = 'border border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F] focus-visible:ring-[#70B1C4]'
const labelCls = 'text-xs text-gray-500 dark:text-[#7AAABB]'

const emptyLine: LigneFacture = { designation: '', quantite: 1, prix_unitaire: 0 }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function FactureModal({ open, onClose, facture }: Props) {
  const { data: patients = [] } = usePatients()
  const createFacture = useCreateFacture()
  const updateFacture = useUpdateFacture()
  const isEdit = !!facture

  const [patientId, setPatientId] = useState<number>(0)
  const [linkedPatient, setLinkedPatient] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const [dateEmission, setDateEmission] = useState(todayISO())
  const [dateEcheance, setDateEcheance] = useState('')
  const [lignes, setLignes] = useState<LigneFacture[]>([{ ...emptyLine }])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (facture) {
      setPatientId(facture.patient_id)
      const existing = patients.find((p) => p.id === facture.patient_id)
      setLinkedPatient(existing ?? null)
      setSearchQuery(`${facture.patient_prenom} ${facture.patient_nom}`)
      setDateEmission(facture.date_emission || todayISO())
      setDateEcheance(facture.date_echeance || '')
      setLignes(facture.lignes.length ? facture.lignes.map((l) => ({ ...l })) : [{ ...emptyLine }])
      setNotes(facture.notes || '')
    } else {
      setPatientId(0)
      setLinkedPatient(null)
      setSearchQuery('')
      setDateEmission(todayISO())
      setDateEcheance('')
      setLignes([{ ...emptyLine }])
      setNotes('')
    }
    setShowDropdown(false)
  }, [open, facture, patients])

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

  function updateLine(i: number, patch: Partial<LigneFacture>) {
    setLignes((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function addLine() { setLignes((prev) => [...prev, { ...emptyLine }]) }
  function removeLine(i: number) { setLignes((prev) => prev.filter((_, idx) => idx !== i)) }

  const total = lignes.reduce((sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0), 0)

  function onSubmit() {
    if (!patientId) { toast.error('Sélectionnez un patient'); return }
    const cleanLignes = lignes
      .filter((l) => l.designation.trim())
      .map((l) => ({ designation: l.designation.trim(), quantite: Number(l.quantite) || 0, prix_unitaire: Number(l.prix_unitaire) || 0 }))
    if (cleanLignes.length === 0) { toast.error('Ajoutez au moins une ligne'); return }

    const payload = {
      patient_id: patientId,
      date_emission: dateEmission,
      date_echeance: dateEcheance || null,
      lignes: cleanLignes,
      notes: notes || undefined,
    }

    if (isEdit && facture) {
      updateFacture.mutate({ id: facture.id, data: payload }, {
        onSuccess: onClose,
        onError: () => toast.error('Erreur lors de la mise à jour'),
      })
    } else {
      createFacture.mutate(payload, {
        onSuccess: () => { toast.success('Facture créée'); onClose() },
        onError: () => toast.error('Erreur lors de la création'),
      })
    }
  }

  const pending = createFacture.isPending || updateFacture.isPending

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col dark:bg-[#0D2038] dark:border-[#1C3F62]/50 dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.50),_0_0_18px_rgba(61,143,168,0.45),_0_0_55px_rgba(61,143,168,0.28),_0_20px_50px_rgba(0,0,0,0.65)]">
        <DialogHeader className="pb-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3d8fa8] to-[#70B1C4] flex items-center justify-center shrink-0 shadow-md shadow-[#70B1C4]/30">
              <Receipt size={14} className="text-white" />
            </div>
            <DialogTitle className="text-[#2D3748] dark:text-[#EDF8FF]">
              {isEdit ? `Modifier ${facture?.numero}` : 'Nouvelle facture'}
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
                    <p className="text-xs text-green-600 dark:text-green-400">{linkedPatient.telephone}</p>
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

          {/* ── Dates ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={labelCls}>Date d&apos;émission</Label>
              <Input type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Échéance</Label>
              <Input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* ── Lignes ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={13} className="text-[#70B1C4]" />
                <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Prestations</span>
              </div>
              <button type="button" onClick={addLine} className="inline-flex items-center gap-1 text-xs font-semibold text-[#3d8fa8] dark:text-[#70B1C4] hover:underline">
                <Plus size={13} /> Ajouter
              </button>
            </div>

            <div className="hidden sm:grid grid-cols-[1fr_64px_96px_88px_28px] gap-2 px-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-wider">Désignation</span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-wider">Qté</span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-wider">Prix €</span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-wider text-right">Total</span>
              <span />
            </div>

            {lignes.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_64px_96px_88px_28px] gap-2 items-center">
                <Input value={l.designation} onChange={(e) => updateLine(i, { designation: e.target.value })} placeholder="Consultation..." className={`${inputCls} h-9`} />
                <Input type="number" min={0} step="0.5" value={l.quantite} onChange={(e) => updateLine(i, { quantite: parseFloat(e.target.value) || 0 })} className={`${inputCls} h-9 px-2`} />
                <Input type="number" min={0} step="0.01" value={l.prix_unitaire} onChange={(e) => updateLine(i, { prix_unitaire: parseFloat(e.target.value) || 0 })} className={`${inputCls} h-9 px-2`} />
                <span className="text-sm font-semibold text-[#1A2B3C] dark:text-[#EDF8FF] text-right tabular-nums">
                  {((Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0)).toFixed(2)}
                </span>
                <button type="button" onClick={() => removeLine(i)} disabled={lignes.length === 1}
                  className="p-1 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#DCEEF3] dark:border-[#1C3F62]/40">
              <span className="text-sm text-gray-500 dark:text-[#7AAABB]">Total</span>
              <span className="text-xl font-bold text-[#3d8fa8] dark:text-[#70B1C4] tabular-nums">{total.toFixed(2)} €</span>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-4 space-y-1">
            <Label className={labelCls}>Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full rounded-md border border-[#DCEEF3] dark:border-[#1C3F62]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none bg-white dark:bg-[#06101E] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F]"
              placeholder="Mentions, conditions de paiement..." />
          </div>
        </div>

        <DialogFooter className="gap-2 shrink-0 pt-3 border-t border-gray-100 dark:border-[#1C3F62]/30">
          <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:text-[#EDF8FF] dark:hover:bg-[#1C3F62]/30">Annuler</Button>
          <Button type="button" onClick={onSubmit} disabled={pending} className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white btn-neon">
            {pending && <Loader2 size={14} className="animate-spin mr-2" />}
            {isEdit ? 'Enregistrer' : 'Créer la facture'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
