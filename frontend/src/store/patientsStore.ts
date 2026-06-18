import { create } from 'zustand'

export interface Patient {
  id: number
  nom: string
  prenom: string
  date_naissance: string
  telephone: string
  email: string
  adresse: string
  notes: string
  nb_consultations: number
  derniere_visite: string
  created_at: string
}

const INITIAL_PATIENTS: Patient[] = [
  { id: 1, nom: 'Martin', prenom: 'Sophie', date_naissance: '1985-03-12', telephone: '06 12 34 56 78', email: 'sophie.martin@email.fr', adresse: '12 rue de la Paix, Paris', notes: 'Myopie forte, port de lentilles', nb_consultations: 8, derniere_visite: '2026-06-10', created_at: '2024-01-15' },
  { id: 2, nom: 'Dubois', prenom: 'Pierre', date_naissance: '1972-07-22', telephone: '06 98 76 54 32', email: 'pierre.dubois@email.fr', adresse: '5 avenue Victor Hugo, Lyon', notes: 'Glaucome suivi régulier', nb_consultations: 15, derniere_visite: '2026-06-05', created_at: '2023-06-20' },
  { id: 3, nom: 'Bernard', prenom: 'Marie', date_naissance: '1990-11-08', telephone: '07 11 22 33 44', email: 'marie.bernard@email.fr', adresse: '8 rue du Moulin, Bordeaux', notes: 'Astigmatisme léger', nb_consultations: 3, derniere_visite: '2026-05-28', created_at: '2025-03-10' },
  { id: 4, nom: 'Petit', prenom: 'Jean', date_naissance: '1965-01-30', telephone: '06 55 66 77 88', email: 'jean.petit@email.fr', adresse: '22 bd Haussmann, Paris', notes: 'Cataracte opérée œil droit 2024', nb_consultations: 22, derniere_visite: '2026-06-01', created_at: '2022-11-05' },
  { id: 5, nom: 'Moreau', prenom: 'Claire', date_naissance: '1998-05-17', telephone: '07 44 55 66 77', email: 'claire.moreau@email.fr', adresse: '3 impasse des Lilas, Nantes', notes: 'Suivi post-opératoire', nb_consultations: 2, derniere_visite: '2026-06-15', created_at: '2026-04-01' },
  { id: 6, nom: 'Durand', prenom: 'Paul', date_naissance: '1955-09-03', telephone: '06 33 22 11 00', email: 'paul.durand@email.fr', adresse: '17 rue Gambetta, Marseille', notes: 'DMLA, surveillance semestrielle', nb_consultations: 31, derniere_visite: '2026-04-20', created_at: '2021-08-12' },
  { id: 7, nom: 'Leroy', prenom: 'Alice', date_naissance: '2001-12-25', telephone: '07 88 99 00 11', email: 'alice.leroy@email.fr', adresse: '9 allée des Roses, Toulouse', notes: 'Hypermétropie, lunettes depuis 2019', nb_consultations: 5, derniere_visite: '2026-05-10', created_at: '2023-09-18' },
  { id: 8, nom: 'Simon', prenom: 'Marc', date_naissance: '1980-04-14', telephone: '06 77 88 99 00', email: 'marc.simon@email.fr', adresse: '45 rue de la République, Lille', notes: 'Kératocône stade 2', nb_consultations: 9, derniere_visite: '2026-06-08', created_at: '2024-02-22' },
]

let nextId = 9

interface PatientsStore {
  patients: Patient[]
  addPatient: (data: Omit<Patient, 'id' | 'nb_consultations' | 'derniere_visite' | 'created_at'>) => number
  updatePatient: (id: number, data: Partial<Patient>) => void
  deletePatient: (id: number) => void
  getPatient: (id: number) => Patient | undefined
}

export const usePatientsStore = create<PatientsStore>((set, get) => ({
  patients: INITIAL_PATIENTS,

  addPatient: (data) => {
    const id = nextId++
    const patient: Patient = {
      ...data,
      id,
      nb_consultations: 0,
      derniere_visite: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString().split('T')[0],
    }
    set((s) => ({ patients: [...s.patients, patient] }))
    return id
  },

  updatePatient: (id, data) => {
    set((s) => ({
      patients: s.patients.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }))
  },

  deletePatient: (id) => {
    set((s) => ({ patients: s.patients.filter((p) => p.id !== id) }))
  },

  getPatient: (id) => get().patients.find((p) => p.id === id),
}))
