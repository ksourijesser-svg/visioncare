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

export const publicApi = {
  searchDoctors: (q: string) => api.get('/public/doctors/search', { params: { q } }),
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
