import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salleAttenteApi } from '@/lib/api'

export type SalleStatut = 'attente' | 'en_consultation' | 'termine' | null

export interface SalleRdv {
  id: number
  patient_id: number
  patient_nom: string
  patient_prenom: string
  patient_telephone: string
  heure: string
  motif: string
  duree: number
  statut: string
  salle_statut: SalleStatut
  heure_arrivee: string | null
  prix_consultation: number | null
}

export function useSalleAttente() {
  return useQuery({
    queryKey: ['salle-attente'],
    queryFn: async () => {
      const res = await salleAttenteApi.list()
      return res.data as SalleRdv[]
    },
    refetchInterval: 30_000, // live board — refresh every 30s
  })
}

export function useUpdateSalleStatut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, salle_statut, prix_consultation }: { id: number; salle_statut: SalleStatut; prix_consultation?: number | null }) =>
      salleAttenteApi.updateStatut(id, salle_statut, prix_consultation),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salle-attente'] })
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}
