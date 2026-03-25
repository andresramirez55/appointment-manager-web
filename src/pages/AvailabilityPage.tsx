import { useEffect, useState, type FormEvent } from 'react'
import Layout from '../components/Layout'
import { availabilityApi, type AvailabilitySlot } from '../api/client'
import { useAuth } from '../hooks/useAuth'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DURATIONS = [30, 45, 60, 90, 120]

export default function AvailabilityPage() {
  const { professional } = useAuth()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '18:00',
    slot_duration_minutes: 60,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    availabilityApi.getAll()
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.start_time >= form.end_time) {
      setError('El horario de fin debe ser posterior al de inicio')
      return
    }
    setSaving(true)
    try {
      const slot = await availabilityApi.create(form)
      setSlots((prev) => [...prev, slot])
      setForm({ day_of_week: 1, start_time: '09:00', end_time: '18:00', slot_duration_minutes: 60 })
    } catch {
      setError('No se pudo guardar el horario')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    await availabilityApi.delete(id)
    setSlots((prev) => prev.filter((s) => s.id !== id))
  }

  const bookingUrl = `${window.location.origin}/book/${professional?.id}`

  return (
    <Layout>
      <div className="p-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-2">Disponibilidad</h1>
        <p className="text-sm text-slate-500 mb-6">Configurá tus horarios de atención para que los pacientes puedan reservar turnos online.</p>

        {/* Link de reserva */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-indigo-700 mb-1">Tu link de reserva</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-indigo-800 font-mono flex-1 truncate">{bookingUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(bookingUrl)}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition shrink-0"
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-indigo-600 mt-1.5">Compartí este link con tus pacientes para que reserven su turno sin llamarte.</p>
        </div>

        {/* Horarios configurados */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Horarios configurados</h2>

          {loading && <p className="text-sm text-slate-400">Cargando...</p>}

          {!loading && slots.length === 0 && (
            <p className="text-sm text-slate-400">No hay horarios configurados aún.</p>
          )}

          <div className="space-y-2">
            {slots
              .sort((a, b) => a.day_of_week - b.day_of_week)
              .map((slot) => (
                <div key={slot.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-slate-700">{DAYS[slot.day_of_week]}</span>
                    <span className="text-sm text-slate-500 ml-3">
                      {slot.start_time} – {slot.end_time}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">· {slot.slot_duration_minutes} min c/turno</span>
                  </div>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="text-slate-400 hover:text-red-500 transition p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Agregar horario */}
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Agregar horario</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Día</label>
              <select
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duración del turno</label>
              <select
                value={form.slot_duration_minutes}
                onChange={(e) => setForm({ ...form, slot_duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} minutos</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hora inicio</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hora fin</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition"
          >
            {saving ? 'Guardando...' : 'Agregar horario'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
