import { useQuery } from '@tanstack/react-query'
import { rapportsApi } from '@/lib/api'

export type Periode = 'mois' | 'trimestre' | 'annee'

export interface RapportData {
  periode: Periode
  kpis: {
    revenue_total: number
    revenue_encaisse: number
    revenue_impaye: number
    rdv_total: number
    rdv_completes: number
    nouveaux_patients: number
    taux_presence: number
    taux_annulation: number
  }
  revenue_par_mois: { mois: string; key: string; facture: number; encaisse: number }[]
  rdv_par_mois: { mois: string; key: string; rdv: number }[]
  patients_par_mois: { mois: string; key: string; patients: number }[]
  rdv_par_statut: { statut: string; label: string; count: number }[]
  top_motifs: { motif: string; count: number }[]
}

export function useRapports(periode: Periode) {
  return useQuery({
    queryKey: ['rapports', periode],
    queryFn: async () => {
      const res = await rapportsApi.get(periode)
      return res.data as RapportData
    },
  })
}
