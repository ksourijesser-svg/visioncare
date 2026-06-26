import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/auth/me'),
  register: (data: unknown) => api.post('/auth/register', data),
  sendCode: (email: string, type: 'signup' | 'reset') =>
    api.post('/auth/send-code', { email, type }),
  verifyCode: (email: string, code: string, type: 'signup' | 'reset') =>
    api.post('/auth/verify-code', { email, code, type }),
  resetPassword: (email: string, code: string, new_password: string) =>
    api.post('/auth/reset-password', { email, code, new_password }),
}

export const patientsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/patients', { params }),
  get: (id: number) => api.get(`/patients/${id}`),
  create: (data: unknown) => api.post('/patients', data),
  update: (id: number, data: unknown) => api.put(`/patients/${id}`, data),
  delete: (id: number) => api.delete(`/patients/${id}`),
  exportExcel: () => api.get('/patients/export', { responseType: 'blob' }),
}

export const appointmentsApi = {
  list: (params?: { date?: string; statut?: string; patient_id?: number }) =>
    api.get('/rendez-vous', { params }),
  get: (id: number) => api.get(`/rendez-vous/${id}`),
  create: (data: unknown) => api.post('/rendez-vous', data),
  update: (id: number, data: unknown) => api.put(`/rendez-vous/${id}`, data),
  delete: (id: number) => api.delete(`/rendez-vous/${id}`),
  updateStatus: (id: number, statut: string) =>
    api.patch(`/rendez-vous/${id}/statut`, { statut }),
}

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
}

export const facturesApi = {
  list: (params?: { statut?: string; patient_id?: number }) =>
    api.get('/factures', { params }),
  get: (id: number) => api.get(`/factures/${id}`),
  create: (data: unknown) => api.post('/factures', data),
  update: (id: number, data: unknown) => api.put(`/factures/${id}`, data),
  delete: (id: number) => api.delete(`/factures/${id}`),
  pay: (id: number, data: { montant: number; methode_paiement: string; date_paiement?: string }) =>
    api.post(`/factures/${id}/paiement`, data),
}

export const salleAttenteApi = {
  list: () => api.get('/salle-attente'),
  updateStatut: (id: number, salle_statut: string | null) =>
    api.patch(`/salle-attente/${id}`, { salle_statut }),
}

export const rapportsApi = {
  get: (periode: 'mois' | 'trimestre' | 'annee') =>
    api.get('/rapports', { params: { periode } }),
}

export const patientFilesApi = {
  list: (patientId: number) => api.get(`/patients/${patientId}/files`),
  upload: (patientId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/patients/${patientId}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  download: (patientId: number, fileId: number) =>
    api.get(`/patients/${patientId}/files/${fileId}`, { responseType: 'blob' }),
  delete: (patientId: number, fileId: number) =>
    api.delete(`/patients/${patientId}/files/${fileId}`),
}

export const operationsApi = {
  list: (params?: { statut?: string; patient_id?: number }) =>
    api.get('/operations', { params }),
  get: (id: number) => api.get(`/operations/${id}`),
  create: (data: unknown) => api.post('/operations', data),
  update: (id: number, data: unknown) => api.put(`/operations/${id}`, data),
  delete: (id: number) => api.delete(`/operations/${id}`),
}

export const ordonnancesApi = {
  list: (params?: { patient_id?: number; type?: string }) =>
    api.get('/ordonnances', { params }),
  get: (id: number) => api.get(`/ordonnances/${id}`),
  create: (data: unknown) => api.post('/ordonnances', data),
  delete: (id: number) => api.delete(`/ordonnances/${id}`),
}

export const publicApi = {
  searchDoctors: (q: string) => api.get('/public/doctors/search', { params: { q } }),
  doctorBusy: (id: number) => api.get(`/public/doctors/${id}/busy`),
  createRdv: (data: {
    medecin_id: number
    nom: string
    prenom: string
    telephone: string
    adresse?: string | null
    date_heure: string
    motif?: string | null
  }) => api.post('/public/rendez-vous', data),
}
