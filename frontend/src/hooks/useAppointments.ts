import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '@/lib/api'
import type { Appointment, AppointmentStatus } from '@/store/appointmentsStore'

function transform(a: Record<string, unknown>): Appointment {
  const dtStr = (a.date_heure as string) || ''
  const patient = (a.patient as Record<string, unknown>) || {}
  return {
    id: a.id as number,
    patient_id: a.patient_id as number,
    patient_nom: (patient.nom as string) || '',
    patient_prenom: (patient.prenom as string) || '',
    patient_telephone: (patient.telephone as string) || '',
    date: dtStr.split('T')[0] || '',
    heure: dtStr.split('T')[1]?.slice(0, 5) || '00:00',
    duree: (a.duree as number) || 30,
    motif: (a.motif as string) || '',
    statut: (a.statut as AppointmentStatus) || 'programme',
    notes: (a.notes as string) || '',
    diagnostic: (a.diagnostic as string) || undefined,
    traitement: (a.traitement as string) || undefined,
  }
}

export function useAppointments(params?: { patient_id?: number }) {
  return useQuery({
    queryKey: ['appointments', params ?? {}],
    queryFn: async () => {
      const res = await appointmentsApi.list(params)
      return (res.data as Record<string, unknown>[]).map(transform)
    },
  })
}

function toISO(date: string, heure: string) {
  // heure may be "09:00", "09:00:00", or "04:42 PM" — normalise to HH:MM:SS
  const d = new Date(`${date}T${heure}`)
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${date}T${hh}:${mm}:00`
  }
  return `${date}T${heure}:00`
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Appointment, 'id'>) => {
      const { date, heure, patient_nom, patient_prenom, patient_telephone, ...rest } = data
      return appointmentsApi.create({ ...rest, date_heure: toISO(date, heure) })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useUpdateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Appointment> }) => {
      const { date, heure, patient_nom, patient_prenom, patient_telephone, ...rest } = data
      const payload: Record<string, unknown> = { ...rest }
      if (date && heure) payload.date_heure = toISO(date, heure)
      return appointmentsApi.update(id, payload)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, statut }: { id: number; statut: AppointmentStatus }) =>
      appointmentsApi.updateStatus(id, statut),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useDeleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => appointmentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
