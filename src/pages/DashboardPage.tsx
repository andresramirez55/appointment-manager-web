import { useEffect, useState } from 'react'
import { appointmentsApi } from '../api/client'
import Layout from '../components/Layout'
import WeekCalendar from '../components/WeekCalendar'
import NewAppointmentModal from '../components/NewAppointmentModal'
import EditAppointmentModal from '../components/EditAppointmentModal'
import { type Appointment } from '../api/client'

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>()
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>()
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    appointmentsApi
      .getAll()
      .then(setAppointments)
      .catch(() => setError('No se pudieron cargar los turnos'))
      .finally(() => setLoading(false))
  }, [])

  function handleStatusChange(id: number, status: string) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: status as Appointment['status'] } : a))
    )
  }

  function handleCreated(appointment: Appointment) {
    setAppointments((prev) => [...prev, appointment])
    setShowModal(false)
    setPrefilledDate(undefined)
    setPrefilledTime(undefined)
  }

  function handleSlotClick(date: string, time: string) {
    setPrefilledDate(date)
    setPrefilledTime(time)
    setShowModal(true)
  }

  function handleNewTurno() {
    setPrefilledDate(undefined)
    setPrefilledTime(undefined)
    setShowModal(true)
  }

  return (
    <Layout>
      {showModal && (
        <NewAppointmentModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
          prefilledDate={prefilledDate}
          prefilledTime={prefilledTime}
        />
      )}

      {editingAppointment && (
        <EditAppointmentModal
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onUpdated={(updated) => {
            setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            setEditingAppointment(null)
          }}
        />
      )}

      <div className="p-8 flex flex-col" style={{ height: '100vh' }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-800">Turnos</h1>
          <button
            onClick={handleNewTurno}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo turno
          </button>
        </div>

        {loading && <p className="text-sm text-slate-400">Cargando turnos...</p>}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="flex-1">
            <WeekCalendar
              appointments={appointments}
              onSlotClick={handleSlotClick}
              onStatusChange={handleStatusChange}
              onEdit={setEditingAppointment}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}
