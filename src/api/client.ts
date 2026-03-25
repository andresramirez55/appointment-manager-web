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

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('professional')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

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

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phone: string
  specialty: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
  register: (data: RegisterRequest) =>
    api.post<LoginResponse>('/auth/register', data).then((r) => r.data),
  getProfile: () =>
    api.get<Professional>('/profile').then((r) => r.data),
  updateProfile: (data: { name: string; phone: string; specialty: string }) =>
    api.put<Professional>('/profile', data).then((r) => r.data),
  updatePassword: (data: { current_password: string; new_password: string }) =>
    api.put('/profile/password', data).then((r) => r.data),
}

export const appointmentsApi = {
  getAll: () => api.get<Appointment[]>('/appointments').then((r) => r.data),
  create: (data: { patient_id: number; starts_at: string; duration_minutes: number }) =>
    api.post<Appointment>('/appointments', data).then((r) => r.data),
  createRecurring: (data: { patient_id: number; starts_at: string; duration_minutes: number; frequency_weeks: number; occurrences: number }) =>
    api.post<Appointment[]>('/appointments/recurring', data).then((r) => r.data),
  update: (id: number, data: { status?: string; notes?: string; starts_at?: string; duration_minutes?: number }) =>
    api.put(`/appointments/${id}`, data).then((r) => r.data),
  cancel: (id: number) =>
    api.delete(`/appointments/${id}`).then((r) => r.data),
}

export interface SessionNote {
  id: number
  appointment_id: number
  content: string
  created_at: string
}

export const patientsApi = {
  getAll: () => api.get<Patient[]>('/patients').then((r) => r.data),
  getById: (id: number) => api.get<Patient>(`/patients/${id}`).then((r) => r.data),
  create: (data: { name: string; phone: string; email: string; notes: string }) =>
    api.post<Patient>('/patients', data).then((r) => r.data),
  update: (id: number, data: { name: string; phone: string; email: string; notes: string }) =>
    api.put<Patient>(`/patients/${id}`, data).then((r) => r.data),
}

export interface Block {
  id: number
  professional_id: number
  starts_at: string
  ends_at: string
  reason: string
  created_at: string
}

export const blocksApi = {
  getAll: () => api.get<Block[]>('/blocks').then((r) => r.data),
  create: (data: { starts_at: string; ends_at: string; reason: string }) =>
    api.post<Block>('/blocks', data).then((r) => r.data),
  delete: (id: number) => api.delete(`/blocks/${id}`).then((r) => r.data),
}

export interface AvailabilitySlot {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
}

export interface TimeSlot {
  starts_at: string
  ends_at: string
  available: boolean
}

export const availabilityApi = {
  getAll: () => api.get<AvailabilitySlot[]>('/availability').then((r) => r.data),
  create: (data: { day_of_week: number; start_time: string; end_time: string; slot_duration_minutes: number }) =>
    api.post<AvailabilitySlot>('/availability', data).then((r) => r.data),
  delete: (id: number) => api.delete(`/availability/${id}`).then((r) => r.data),
}

export const publicApi = {
  getProfessional: (id: number) =>
    axios.get<{ id: number; name: string; specialty: string }>(`${import.meta.env.VITE_API_BASE_URL ?? '/api'}/public/professional/${id}`).then((r) => r.data),
  getSlots: (professionalId: number, date: string) =>
    axios.get<TimeSlot[]>(`${import.meta.env.VITE_API_BASE_URL ?? '/api'}/public/slots?professional_id=${professionalId}&date=${date}`).then((r) => r.data),
  createAppointment: (data: { professional_id: number; patient_name: string; patient_phone: string; starts_at: string; duration_minutes: number }) =>
    axios.post(`${import.meta.env.VITE_API_BASE_URL ?? '/api'}/public/appointments`, data).then((r) => r.data),
}

export const notesApi = {
  getByAppointment: (appointmentId: number) =>
    api.get<SessionNote[]>(`/notes?appointment_id=${appointmentId}`).then((r) => r.data),
  create: (data: { appointment_id: number; content: string }) =>
    api.post<SessionNote>('/notes', data).then((r) => r.data),
}

export default api
