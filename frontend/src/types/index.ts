export type UserRole = 'medecin' | 'secretaire'

export interface User {
  id: number
  email: string
  nom: string
  prenom: string
  role: UserRole
  cabinet?: string
  telephone?: string
  specialisation?: string
  adresse?: string
  google_maps_url?: string
  photo?: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
}

export type AppointmentStatus = 'programme' | 'confirme' | 'complete' | 'annule'

export interface Patient {
  id: number
  nom: string
  prenom: string
  date_naissance: string
  telephone: string
  email?: string
  adresse?: string
  numero_securite_sociale?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: number
  patient_id: number
  patient: Patient
  medecin_id: number
  date_heure: string
  duree: number
  statut: AppointmentStatus
  motif?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Consultation {
  id: number
  patient_id: number
  medecin_id: number
  date: string
  diagnostic?: string
  traitement?: string
  notes?: string
  ordonnance?: string
}

export interface DashboardStats {
  patients_total: number
  rendez_vous_aujourd_hui: number
  consultations_semaine: number
  rendez_vous_confirmes: number
  rendez_vous_annules: number
  rendez_vous_completes: number
  patients_aujourd_hui: Appointment[]
  activite_mensuelle: { mois: string; count: number }[]
}
