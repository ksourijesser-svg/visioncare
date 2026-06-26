import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operationsApi } from '@/lib/api'

export type OperationStatus = 'planifiee' | 'confirmee' | 'terminee' | 'annulee'
export type Oeil = 'droit' | 'gauche' | 'deux'
export type Anesthesie = 'topique' | 'locale' | 'generale'

export interface Operation {
  id: number
  patient_id: number
  patient_nom: string
  patient_prenom: string
  patient_telephone: string
  date_operation: string // ISO datetime
  duree: number
  type_intervention: string
  oeil: Oeil | null
  anesthesie: Anesthesie | null
  salle: string | null
  statut: OperationStatus
  notes: string
}

function transform(o: Record<string, unknown>): Operation {
  const patient = (o.patient as Record<string, unknown>) || {}
  return {
    id: o.id as number,
    patient_id: o.patient_id as number,
    patient_nom: (patient.nom as string) || '',
    patient_prenom: (patient.prenom as string) || '',
    patient_telephone: (patient.telephone as string) || '',
    date_operation: (o.date_operation as string) || '',
    duree: Number(o.duree) || 60,
    type_intervention: (o.type_intervention as string) || '',
    oeil: (o.oeil as Oeil) || null,
    anesthesie: (o.anesthesie as Anesthesie) || null,
    salle: (o.salle as string) || null,
    statut: (o.statut as OperationStatus) || 'planifiee',
    notes: (o.notes as string) || '',
  }
}

export interface OperationInput {
  patient_id: number
  date_operation: string
  duree: number
  type_intervention: string
  oeil?: Oeil | null
  anesthesie?: Anesthesie | null
  salle?: string | null
  statut?: OperationStatus
  notes?: string | null
}

export function useOperations(params?: { statut?: string; patient_id?: number }) {
  return useQuery({
    queryKey: ['operations', params ?? {}],
    queryFn: async () => {
      const res = await operationsApi.list(params)
      return (res.data as Record<string, unknown>[]).map(transform)
    },
  })
}

export function useCreateOperation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: OperationInput) => operationsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations'] }),
  })
}

export function useUpdateOperation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OperationInput> }) =>
      operationsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations'] }),
  })
}

export function useDeleteOperation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => operationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations'] }),
  })
}
