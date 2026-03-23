import { useState, useEffect, type FormEvent } from 'react'
import { appointmentsApi, patientsApi, type Appointment, type Patient } from '../api/client'

const DURATIONS = [30, 45, 60, 90]
const FREQUENCIES = [
  { label: 'Semanal', value: 1 },
  { label: 'Quincenal', value: 2 },
]
const OCCURRENCES = [4, 8, 12, 24]

interface Props {
  onClose: () => void
  onCreated: (appointments: Appointment | Appointment[]) => void
  prefilledDate?: string
  prefilledTime?: string
}

export default function NewAppointmentModal({ onClose, onCreated, prefilledDate, prefilledTime }: Props) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [date, setDate] = useState(prefilledDate ?? '')
  const [time, setTime] = useState(prefilledTime ?? '')
  const [duration, setDuration] = useState(60)
  const [recurring, setRecurring] = useState(false)
  const [frequencyWeeks, setFrequencyWeeks] = useState(1)
  const [occurrences, setOccurrences] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    patientsApi.getAll().then(setPatients).catch(() => {})
  }, [])

  const filtered = search.length >= 1
    ? patients.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
      )
    : []

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedPatient) return
    setError(null)
    setLoading(true)
    try {
      const starts_at = new Date(`${date}T${time}:00`).toISOString()
      if (recurring) {
        const appointments = await appointmentsApi.createRecurring({
          patient_id: selectedPatient.id,
          starts_at,
          duration_minutes: duration,
          frequency_weeks: frequencyWeeks,
          occurrences,
        })
        onCreated(appointments)
      } else {
        const appointment = await appointmentsApi.create({
          patient_id: selectedPatient.id,
          starts_at,
          duration_minutes: duration,
        })
        onCreated(appointment)
      }
    } catch {
      setError('No se pudo crear el turno. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Nuevo turno</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paciente */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Paciente</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-indigo-300 bg-indigo-50">
                <div>
                  <p className="text-sm font-medium text-indigo-800">{selectedPatient.name}</p>
                  <p className="text-xs text-indigo-500">{selectedPatient.phone}</p>
                </div>
                <button type="button" onClick={() => { setSelectedPatient(null); setSearch('') }}
                  className="text-indigo-400 hover:text-indigo-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                {filtered.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-md max-h-48 overflow-y-auto">
                    {filtered.map((p) => (
                      <li key={p.id} onClick={() => { setSelectedPatient(p); setSearch('') }}
                        className="px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer">
                        <p className="text-sm font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.phone}{p.email ? ` · ${p.email}` : ''}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {search.length >= 1 && filtered.length === 0 && (
                  <p className="mt-1.5 text-xs text-slate-400">No se encontró ningún paciente.</p>
                )}
              </div>
            )}
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {recurring ? 'Primer turno' : 'Fecha'}
              </label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hora</label>
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Duración</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                    duration === d ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}>
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Toggle recurrente */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">Turno recurrente</p>
              <p className="text-xs text-slate-400">Crear múltiples turnos automáticamente</p>
            </div>
            <button
              type="button"
              onClick={() => setRecurring((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${recurring ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${recurring ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Opciones de recurrencia */}
          {recurring && (
            <div className="space-y-3 bg-indigo-50 rounded-xl p-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Frecuencia</label>
                <div className="flex gap-2">
                  {FREQUENCIES.map((f) => (
                    <button key={f.value} type="button" onClick={() => setFrequencyWeeks(f.value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                        frequencyWeeks === f.value ? 'bg-white text-indigo-700 border-indigo-300' : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Cantidad de turnos</label>
                <div className="flex gap-2">
                  {OCCURRENCES.map((o) => (
                    <button key={o} type="button" onClick={() => setOccurrences(o)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                        occurrences === o ? 'bg-white text-indigo-700 border-indigo-300' : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-indigo-600 font-medium">
                Se van a crear {occurrences} turnos {frequencyWeeks === 1 ? 'semanales' : 'quincenales'} a partir del {date || '—'}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !selectedPatient}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition">
              {loading ? 'Guardando...' : recurring ? `Crear ${occurrences} turnos` : 'Guardar turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
