'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Wallet } from 'lucide-react'
import { useRecordPayment, type Facture, type PaymentMethod } from '@/hooks/useFactures'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  facture: Facture | null
}

const inputCls = 'border border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:bg-[#091628] dark:text-[#EDF8FF] focus-visible:ring-[#70B1C4]'
const labelCls = 'text-xs text-gray-500 dark:text-[#7AAABB]'

export function PaymentModal({ open, onClose, facture }: Props) {
  const recordPayment = useRecordPayment()
  const reste = facture ? Math.max(facture.montant_total - facture.montant_paye, 0) : 0

  const [montant, setMontant] = useState('')
  const [methode, setMethode] = useState<PaymentMethod>('carte')

  // Render-phase init when the dialog opens for a facture (no effect → satisfies
  // react-hooks/set-state-in-effect).
  const [initId, setInitId] = useState<number | null>(null)
  if (open && facture && facture.id !== initId) {
    setInitId(facture.id)
    setMontant(reste.toFixed(2))
    setMethode('carte')
  }
  if (!open && initId !== null) setInitId(null)

  function submit() {
    if (!facture) return
    const m = parseFloat(montant)
    if (!m || m <= 0) { toast.error('Montant invalide'); return }
    recordPayment.mutate(
      { id: facture.id, montant: m, methode_paiement: methode },
      { onSuccess: () => { toast.success('Paiement enregistré'); onClose() }, onError: () => toast.error('Erreur lors du paiement') }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm dark:bg-[#0D2038] dark:border-[#1C3F62]/50 dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.50),_0_0_18px_rgba(61,143,168,0.45),_0_20px_50px_rgba(0,0,0,0.65)]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
              <Wallet size={14} className="text-white" />
            </div>
            <DialogTitle className="text-[#2D3748] dark:text-[#EDF8FF]">Enregistrer un paiement</DialogTitle>
          </div>
        </DialogHeader>

        {facture && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#F7FAFB] dark:bg-[#091628] border border-[#DCEEF3] dark:border-[#1C3F62]/40 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-[#7AAABB]">Facture</span><span className="font-semibold text-[#1A2B3C] dark:text-[#EDF8FF]">{facture.numero}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-[#7AAABB]">Total</span><span className="font-semibold text-[#1A2B3C] dark:text-[#EDF8FF]">{facture.montant_total.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-[#7AAABB]">Déjà payé</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{facture.montant_paye.toFixed(2)} €</span></div>
              <div className="flex justify-between border-t border-[#DCEEF3] dark:border-[#1C3F62]/40 pt-1 mt-1"><span className="text-gray-500 dark:text-[#7AAABB]">Reste à payer</span><span className="font-bold text-[#3d8fa8] dark:text-[#70B1C4]">{reste.toFixed(2)} €</span></div>
            </div>

            <div className="space-y-1">
              <Label className={labelCls}>Montant (€)</Label>
              <Input type="number" min={0} step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Méthode</Label>
              <Select value={methode} onValueChange={(v) => { if (v) setMethode(v as PaymentMethod) }}>
                <SelectTrigger className={`${inputCls} h-9`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                  <SelectItem value="espece">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="border-[#DCEEF3] dark:border-[#1C3F62]/60 dark:text-[#EDF8FF] dark:hover:bg-[#1C3F62]/30">Annuler</Button>
          <Button type="button" onClick={submit} disabled={recordPayment.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {recordPayment.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
