import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientsApi } from '@/lib/api'
import type { Patient } from '@/store/patientsStore'

function transform(p: Record<string, unknown>): Patient {
  return {
    id: p.id as number,
    nom: (p.nom as string) || '',
    prenom: (p.prenom as string) || '',
    date_naissance: (p.date_naissance as string) || '',
    telephone: (p.telephone as string) || '',
    email: (p.email as string) || '',
    adresse: (p.adresse as string) || '',
    notes: (p.notes as string) || '',
    antecedents_generaux: (p.antecedents_generaux as string) || '',
    antecedents_ophtalmologiques: (p.antecedents_ophtalmologiques as string) || '',
    prise_en_charge: (p.prise_en_charge as string) || '',
    nb_consultations: 0,
    derniere_visite: '',
    created_at: (p.created_at as string) || '',
  }
}

export function usePatients(search?: string) {
  return useQuery({
    queryKey: ['patients', search ?? ''],
    queryFn: async () => {
      const res = await patientsApi.list(search ? { search } : undefined)
      return (res.data as Record<string, unknown>[]).map(transform)
    },
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Patient, 'id' | 'nb_consultations' | 'derniere_visite' | 'created_at'>) =>
      patientsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Patient> }) =>
      patientsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useDeletePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => patientsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}
