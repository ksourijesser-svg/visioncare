import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordonnancesApi } from '@/lib/api'

export type OrdonnanceType = 'medicale' | 'lunettes' | 'lentilles'

export interface Medicament {
  medicament: string
  posologie: string
  duree: string
  instructions: string
}

export interface OeilVerre {
  sphere: string
  cylindre: string
  axe: string
  addition: string
}

export interface Verres {
  type_correction: string // loin | pres | progressif
  ecart_pupillaire: string
  od: OeilVerre
  og: OeilVerre
}

export interface OeilLentille {
  puissance: string
  rayon: string      // rayon de courbure (mm)
  diametre: string   // diamètre (mm)
}

export interface Lentilles {
  type_lentille: string  // souple | rigide
  rythme_port: string    // journalier | hebdomadaire | mensuel | trimestriel | annuel
  produit_entretien: string
  od: OeilLentille
  og: OeilLentille
}

export interface Ordonnance {
  id: number
  patient_id: number
  patient_nom: string
  patient_prenom: string
  type: OrdonnanceType
  date_ordonnance: string
  medicaments: Medicament[]
  verres: Verres | null
  lentilles: Lentilles | null
  notes: string
}

const emptyEye = (): OeilVerre => ({ sphere: '', cylindre: '', axe: '', addition: '' })
const emptyLensEye = (): OeilLentille => ({ puissance: '', rayon: '', diametre: '' })

function transform(o: Record<string, unknown>): Ordonnance {
  const patient = (o.patient as Record<string, unknown>) || {}
  const v = (o.verres as Partial<Verres>) || null
  const l = (o.lentilles as Partial<Lentilles>) || null
  return {
    id: o.id as number,
    patient_id: o.patient_id as number,
    patient_nom: (patient.nom as string) || '',
    patient_prenom: (patient.prenom as string) || '',
    type: (o.type as OrdonnanceType) || 'medicale',
    date_ordonnance: (o.date_ordonnance as string) || '',
    medicaments: ((o.medicaments as Medicament[]) || []).map((m) => ({
      medicament: m.medicament || '',
      posologie: m.posologie || '',
      duree: m.duree || '',
      instructions: m.instructions || '',
    })),
    verres: v
      ? {
          type_correction: v.type_correction || '',
          ecart_pupillaire: v.ecart_pupillaire || '',
          od: { ...emptyEye(), ...(v.od || {}) },
          og: { ...emptyEye(), ...(v.og || {}) },
        }
      : null,
    lentilles: l && (l.type_lentille || l.rythme_port || l.produit_entretien || l.od || l.og)
      ? {
          type_lentille: l.type_lentille || '',
          rythme_port: l.rythme_port || '',
          produit_entretien: l.produit_entretien || '',
          od: { ...emptyLensEye(), ...(l.od || {}) },
          og: { ...emptyLensEye(), ...(l.og || {}) },
        }
      : null,
    notes: (o.notes as string) || '',
  }
}

export function useOrdonnances(patientId: number | null) {
  return useQuery({
    queryKey: ['ordonnances', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const res = await ordonnancesApi.list({ patient_id: patientId as number })
      return (res.data as Record<string, unknown>[]).map(transform)
    },
  })
}

export interface OrdonnanceInput {
  patient_id: number
  type: OrdonnanceType
  date_ordonnance?: string
  medicaments?: Medicament[]
  verres?: Verres | null
  lentilles?: Lentilles | null
  notes?: string | null
}

export function useCreateOrdonnance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: OrdonnanceInput) => ordonnancesApi.create(data),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['ordonnances', v.patient_id] }),
  })
}

export function useDeleteOrdonnance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: number; patientId: number }) => ordonnancesApi.delete(id),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['ordonnances', v.patientId] }),
  })
}
