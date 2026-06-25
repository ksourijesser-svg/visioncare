import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { facturesApi } from '@/lib/api'

export type FactureStatus = 'impayee' | 'partielle' | 'payee' | 'annulee'
export type PaymentMethod = 'espece' | 'carte' | 'cheque' | 'virement'

export interface LigneFacture {
  designation: string
  quantite: number
  prix_unitaire: number
}

export interface Facture {
  id: number
  numero: string
  patient_id: number
  patient_nom: string
  patient_prenom: string
  date_emission: string
  date_echeance: string | null
  lignes: LigneFacture[]
  montant_total: number
  montant_paye: number
  statut: FactureStatus
  methode_paiement: PaymentMethod | null
  date_paiement: string | null
  notes: string
}

function transform(f: Record<string, unknown>): Facture {
  const patient = (f.patient as Record<string, unknown>) || {}
  return {
    id: f.id as number,
    numero: (f.numero as string) || '',
    patient_id: f.patient_id as number,
    patient_nom: (patient.nom as string) || '',
    patient_prenom: (patient.prenom as string) || '',
    date_emission: (f.date_emission as string) || '',
    date_echeance: (f.date_echeance as string) || null,
    lignes: ((f.lignes as LigneFacture[]) || []).map((l) => ({
      designation: l.designation || '',
      quantite: Number(l.quantite) || 0,
      prix_unitaire: Number(l.prix_unitaire) || 0,
    })),
    montant_total: Number(f.montant_total) || 0,
    montant_paye: Number(f.montant_paye) || 0,
    statut: (f.statut as FactureStatus) || 'impayee',
    methode_paiement: (f.methode_paiement as PaymentMethod) || null,
    date_paiement: (f.date_paiement as string) || null,
    notes: (f.notes as string) || '',
  }
}

export function useFactures(params?: { statut?: string; patient_id?: number }) {
  return useQuery({
    queryKey: ['factures', params ?? {}],
    queryFn: async () => {
      const res = await facturesApi.list(params)
      return (res.data as Record<string, unknown>[]).map(transform)
    },
  })
}

export interface FactureInput {
  patient_id: number
  date_emission?: string
  date_echeance?: string | null
  lignes: LigneFacture[]
  notes?: string
}

export function useCreateFacture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FactureInput) => facturesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['factures'] }),
  })
}

export function useUpdateFacture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FactureInput> & { statut?: FactureStatus } }) =>
      facturesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['factures'] }),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, montant, methode_paiement, date_paiement }: { id: number; montant: number; methode_paiement: PaymentMethod; date_paiement?: string }) =>
      facturesApi.pay(id, { montant, methode_paiement, date_paiement }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['factures'] }),
  })
}

export function useDeleteFacture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => facturesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['factures'] }),
  })
}
