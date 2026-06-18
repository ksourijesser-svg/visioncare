import { create } from 'zustand'

export type AppointmentStatus = 'programme' | 'confirme' | 'complete' | 'annule'

export interface Appointment {
  id: number
  patient_id: number
  patient_nom: string
  patient_prenom: string
  patient_telephone: string
  date: string
  heure: string
  duree: number
  motif: string
  statut: AppointmentStatus
  notes: string
  diagnostic?: string
  traitement?: string
}

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 1, patient_id: 1, patient_nom: 'Martin', patient_prenom: 'Sophie', patient_telephone: '06 12 34 56 78', date: '2026-06-18', heure: '09:00', duree: 30, motif: 'Bilan visuel annuel', statut: 'complete', notes: '', diagnostic: 'Myopie stable -3.5D', traitement: 'Renouvellement lentilles' },
  { id: 2, patient_id: 2, patient_nom: 'Dubois', patient_prenom: 'Pierre', patient_telephone: '06 98 76 54 32', date: '2026-06-18', heure: '09:30', duree: 30, motif: 'Contrôle glaucome', statut: 'complete', notes: '', diagnostic: 'Glaucome stable, PIO 18mmHg', traitement: 'Continuer Xalatan 1 goutte/soir' },
  { id: 3, patient_id: 3, patient_nom: 'Bernard', patient_prenom: 'Marie', patient_telephone: '07 11 22 33 44', date: '2026-06-18', heure: '10:00', duree: 30, motif: 'Prescription lunettes', statut: 'programme', notes: '' },
  { id: 4, patient_id: 4, patient_nom: 'Petit', patient_prenom: 'Jean', patient_telephone: '06 55 66 77 88', date: '2026-06-18', heure: '10:30', duree: 45, motif: 'Urgence oculaire', statut: 'programme', notes: 'Douleur œil gauche depuis 2 jours' },
  { id: 5, patient_id: 5, patient_nom: 'Moreau', patient_prenom: 'Claire', patient_telephone: '07 44 55 66 77', date: '2026-06-18', heure: '11:00', duree: 30, motif: 'Suivi post-op', statut: 'complete', notes: '', diagnostic: 'Bonne récupération visuelle', traitement: 'Surveillance à 1 mois, collyres anti-inflammatoires' },
  { id: 6, patient_id: 6, patient_nom: 'Durand', patient_prenom: 'Paul', patient_telephone: '06 33 22 11 00', date: '2026-06-19', heure: '09:00', duree: 30, motif: 'Surveillance DMLA', statut: 'complete', notes: '', diagnostic: 'DMLA stable, pas de néovascularisation', traitement: 'Supplémentation AREDS2, prochain contrôle 6 mois' },
  { id: 7, patient_id: 7, patient_nom: 'Leroy', patient_prenom: 'Alice', patient_telephone: '07 88 99 00 11', date: '2026-06-19', heure: '10:00', duree: 30, motif: 'Contrôle annuel', statut: 'confirme', notes: '' },
  { id: 8, patient_id: 8, patient_nom: 'Simon', patient_prenom: 'Marc', patient_telephone: '06 77 88 99 00', date: '2026-06-20', heure: '14:00', duree: 45, motif: 'Bilan kératocône', statut: 'programme', notes: '' },
  { id: 9, patient_id: 1, patient_nom: 'Martin', patient_prenom: 'Sophie', patient_telephone: '06 12 34 56 78', date: '2026-06-23', heure: '09:30', duree: 30, motif: 'Renouvellement ordonnance', statut: 'confirme', notes: '' },
  { id: 10, patient_id: 2, patient_nom: 'Dubois', patient_prenom: 'Pierre', patient_telephone: '06 98 76 54 32', date: '2026-06-25', heure: '11:00', duree: 30, motif: 'Résultats analyse', statut: 'annule', notes: 'Patient absent' },
]

let nextId = 11

interface AppointmentsStore {
  appointments: Appointment[]
  addAppointment: (data: Omit<Appointment, 'id'>) => void
  updateAppointment: (id: number, data: Partial<Appointment>) => void
  updateStatus: (id: number, statut: AppointmentStatus) => void
  deleteAppointment: (id: number) => void
}

export const useAppointmentsStore = create<AppointmentsStore>((set) => ({
  appointments: INITIAL_APPOINTMENTS,

  addAppointment: (data) => {
    set((s) => ({ appointments: [...s.appointments, { ...data, id: nextId++ }] }))
  },

  updateAppointment: (id, data) => {
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...data } : a)),
    }))
  },

  updateStatus: (id, statut) => {
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, statut } : a)),
    }))
  },

  deleteAppointment: (id) => {
    set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) }))
  },
}))
