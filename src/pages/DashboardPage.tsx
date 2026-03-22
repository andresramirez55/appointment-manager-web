import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { appointmentsApi, type Appointment } from '../api/client'

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function isToday(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date()
}

function AppointmentCard({
  appointment,
  onStatusChange,
}: {
  appointment: Appointment
  onStatusChange: (id: number, status: string) => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleAction(status: string) {
    setLoading(true)
    try {
      await appointmentsApi.update(appointment.id, { status })
      onStatusChange(appointment.id, status)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4 ${
        appointment.status === 'cancelled' ? 'opacity-50' : ''
      }`}
    >
      {/* Hora */}
      <div className="min-w-[56px] text-center">
        <p className="text-lg font-semibold text-slate-800 leading-none">
          {formatTime(appointment.starts_at)}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{appointment.duration_minutes} min</p>
      </div>

      <div className="w-px self-stretch bg-slate-100" />

      {/* Info paciente */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {appointment.patient?.name ?? '—'}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{appointment.patient?.phone ?? ''}</p>
        {appointment.notes && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{appointment.notes}</p>
        )}
      </div>

      {/* Estado y acciones */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[appointment.status]}`}
        >
          {STATUS_LABEL[appointment.status]}
        </span>

        {appointment.status === 'scheduled' && (
          <div className="flex gap-1.5">
            <button
              disabled={loading}
              onClick={() => handleAction('completed')}
              className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition disabled:opacity-50"
            >
              Completar
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction('cancelled')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function groupByDate(appointments: Appointment[]) {
  const groups: Record<string, Appointment[]> = {}
  for (const a of appointments) {
    const key = a.starts_at.slice(0, 10) // YYYY-MM-DD
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  }
  return groups
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    appointmentsApi
      .getAll()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        )
        setAppointments(sorted)
      })
      .catch(() => setError('No se pudieron cargar los turnos'))
      .finally(() => setLoading(false))
  }, [])

  function handleStatusChange(id: number, status: string) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: status as Appointment['status'] } : a))
    )
  }

  const todayAppointments = appointments.filter((a) => isToday(a.starts_at))
  const upcomingAppointments = appointments.filter(
    (a) => !isToday(a.starts_at) && isUpcoming(a.starts_at)
  )
  const upcomingGroups = groupByDate(upcomingAppointments)

  return (
    <Layout>
      <div className="p-8 max-w-3xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Turnos</h1>

        {loading && (
          <p className="text-sm text-slate-400">Cargando turnos...</p>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {/* Hoy */}
            <section className="mb-8">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Hoy
              </h2>
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-slate-400">No hay turnos para hoy.</p>
              ) : (
                <div className="space-y-2">
                  {todayAppointments.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Próximos */}
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Próximos
              </h2>
              {Object.keys(upcomingGroups).length === 0 ? (
                <p className="text-sm text-slate-400">No hay turnos próximos.</p>
              ) : (
                <div className="space-y-5">
                  {Object.entries(upcomingGroups).map(([date, items]) => (
                    <div key={date}>
                      <p className="text-sm font-medium text-slate-500 mb-2 capitalize">
                        {formatDate(date)}
                      </p>
                      <div className="space-y-2">
                        {items.map((a) => (
                          <AppointmentCard
                            key={a.id}
                            appointment={a}
                            onStatusChange={handleStatusChange}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}
