import { useEffect, useState } from 'react'
import { appointmentsApi, blocksApi } from '../api/client'
import Layout from '../components/Layout'
import WeekCalendar from '../components/WeekCalendar'
import NewAppointmentModal from '../components/NewAppointmentModal'
import EditAppointmentModal from '../components/EditAppointmentModal'
import BlockModal from '../components/BlockModal'
import TodayPanel from '../components/TodayPanel'
import StatsBar from '../components/StatsBar'
import { type Appointment, type Block } from '../api/client'

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>()
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>()
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  // Pending slot waiting for user to choose "turno" or "bloqueo"
  const [pendingSlot, setPendingSlot] = useState<{ date: string; time: string } | null>(null)

  useEffect(() => {
    Promise.all([appointmentsApi.getAll(), blocksApi.getAll()])
      .then(([appts, blks]) => {
        setAppointments(appts)
        setBlocks(blks)
      })
      .catch(() => setError('No se pudieron cargar los datos'))
      .finally(() => setLoading(false))
  }, [])

  function handleStatusChange(id: number, status: string) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: status as Appointment['status'] } : a))
    )
  }

  function handleCreated(result: Appointment | Appointment[]) {
    const newOnes = Array.isArray(result) ? result : [result]
    setAppointments((prev) => [...prev, ...newOnes])
    setShowModal(false)
    setPrefilledDate(undefined)
    setPrefilledTime(undefined)
  }

  function handleSlotClick(date: string, time: string) {
    setPendingSlot({ date, time })
  }

  function handleNewTurno() {
    setPrefilledDate(undefined)
    setPrefilledTime(undefined)
    setShowModal(true)
  }

  function handleChooseTurno() {
    if (pendingSlot) {
      setPrefilledDate(pendingSlot.date)
      setPrefilledTime(pendingSlot.time)
    }
    setPendingSlot(null)
    setShowModal(true)
  }

  function handleChooseBloqueo() {
    if (pendingSlot) {
      setPrefilledDate(pendingSlot.date)
      setPrefilledTime(pendingSlot.time)
    }
    setPendingSlot(null)
    setShowBlockModal(true)
  }

  function handleBlockCreated(block: Block) {
    setBlocks((prev) => [...prev, block])
    setShowBlockModal(false)
    setPrefilledDate(undefined)
    setPrefilledTime(undefined)
  }

  async function handleBlockDelete(id: number) {
    await blocksApi.delete(id)
    setBlocks((prev) => prev.filter((b) => b.id !== id))
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

      {showBlockModal && (
        <BlockModal
          onClose={() => setShowBlockModal(false)}
          onCreated={handleBlockCreated}
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

      {/* Slot action picker */}
      {pendingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setPendingSlot(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-slate-800 mb-1">
              {new Date(`${pendingSlot.date}T${pendingSlot.time}`).toLocaleString('es-AR', {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            <p className="text-xs text-slate-500 mb-4">¿Qué querés hacer en este horario?</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleChooseTurno}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
                Nuevo turno
              </button>
              <button onClick={handleChooseBloqueo}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition">
                Bloquear horario
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8 flex flex-col" style={{ minHeight: 'calc(100vh - 48px)', height: 'calc(100vh - 48px)' }}>
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

        {loading && <p className="text-sm text-slate-400">Cargando...</p>}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
          <StatsBar appointments={appointments} />
          <div className="flex-1 flex gap-4 min-h-0">
            <div className="flex-1 min-w-0">
              <WeekCalendar
                appointments={appointments}
                blocks={blocks}
                onSlotClick={handleSlotClick}
                onStatusChange={handleStatusChange}
                onEdit={setEditingAppointment}
                onBlockDelete={handleBlockDelete}
              />
            </div>
            <div className="hidden md:flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
              <TodayPanel appointments={appointments} onStatusChange={handleStatusChange} />
            </div>
          </div>
          </>
        )}
      </div>
    </Layout>
  )
}
