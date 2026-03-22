import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface LoginRequest {
  email: string
  password: string
}

export interface Professional {
  id: number
  email: string
  name: string
  phone: string
  specialty: string
}

export interface LoginResponse {
  token: string
  professional: Professional
}

export interface Patient {
  id: number
  name: string
  phone: string
  email: string
  notes: string
}

export interface Appointment {
  id: number
  patient_id: number
  patient: Patient
  professional_id: number
  starts_at: string
  duration_minutes: number
  status: 'scheduled' | 'completed' | 'cancelled'
  reminder_sent_at: string | null
  notes: string
  created_at: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
}

export const appointmentsApi = {
  getAll: () => api.get<Appointment[]>('/appointments').then((r) => r.data),
  update: (id: number, data: { status?: string; notes?: string }) =>
    api.put(`/appointments/${id}`, data).then((r) => r.data),
  cancel: (id: number) =>
    api.delete(`/appointments/${id}`).then((r) => r.data),
}

export default api
