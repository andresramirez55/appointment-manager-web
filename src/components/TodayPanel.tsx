import { type Appointment } from '../api/client'
import { appointmentsApi } from '../api/client'
import { useState } from 'react'

const PATIENT_COLORS = [
  'border-indigo-400 bg-indigo-50 text-indigo-700',
  'border-purple-400 bg-purple-50 text-purple-700',
  'border-pink-400 bg-pink-50 text-pink-700',
  'border-orange-400 bg-orange-50 text-orange-700',
  'border-teal-400 bg-teal-50 text-teal-700',
  'border-rose-400 bg-rose-50 text-rose-700',
  'border-amber-400 bg-amber-50 text-amber-700',
  'border-cyan-400 bg-cyan-50 text-cyan-700',
  'border-lime-400 bg-lime-50 text-lime-700',
  'border-violet-400 bg-violet-50 text-violet-700',
]

function getPatientColor(patientId: number) {
  return PATIENT_COLORS[patientId % PATIENT_COLORS.length]
}

interface Props {
  appointments: Appointment[]
  onStatusChange: (id: number, status: string) => void
}

export default function TodayPanel({ appointments, onStatusChange }: Props) {
  const today = new Date()
  const todayAppts = appointments
    .filter((a) => {
      const d = new Date(a.starts_at)
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      )
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  const scheduled = todayAppts.filter((a) => a.status === 'scheduled').length
  const completed = todayAppts.filter((a) => a.status === 'completed').length

  return (
    <div className="w-72 shrink-0 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-sm font-semibold text-slate-800 capitalize">
          {today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {todayAppts.length === 0
            ? 'Sin turnos hoy'
            : `${scheduled} pendiente${scheduled !== 1 ? 's' : ''} · ${completed} completado${completed !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {todayAppts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm text-slate-400">No hay turnos para hoy</p>
          </div>
        )}
        {todayAppts.map((a) => (
          <AppointmentRow key={a.id} appointment={a} onStatusChange={onStatusChange} />
        ))}
      </div>
    </div>
  )
}

function AppointmentRow({
  appointment,
  onStatusChange,
}: {
  appointment: Appointment
  onStatusChange: (id: number, status: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const start = new Date(appointment.starts_at)
  const end = new Date(start.getTime() + appointment.duration_minutes * 60000)
  const timeStr = `${start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`

  async function handleAction(status: string) {
    setLoading(true)
    try {
      await appointmentsApi.update(appointment.id, { status })
      onStatusChange(appointment.id, status)
    } finally {
      setLoading(false)
    }
  }

  const colorClass = appointment.status === 'cancelled'
    ? 'border-slate-300 bg-slate-50 text-slate-400'
    : getPatientColor(appointment.patient_id)

  return (
    <div className={`px-3 py-3 border-l-4 ${colorClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${appointment.status === 'cancelled' ? 'line-through opacity-60' : ''}`}>
            {appointment.patient?.name ?? '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{timeStr} · {appointment.duration_minutes} min</p>
        </div>

        {appointment.status === 'scheduled' && (
          <div className="flex gap-1 shrink-0 mt-0.5">
            <button
              disabled={loading}
              onClick={() => handleAction('completed')}
              title="Marcar completado"
              className="p-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction('cancelled')}
              title="Cancelar turno"
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {appointment.status === 'completed' && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">✓</span>
        )}

        {appointment.status === 'cancelled' && (
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">Cancelado</span>
        )}
      </div>
    </div>
  )
}
