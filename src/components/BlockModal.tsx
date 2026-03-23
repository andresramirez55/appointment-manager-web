import { useState } from 'react'
import { blocksApi, type Block } from '../api/client'

interface Props {
  prefilledDate?: string
  prefilledTime?: string
  onClose: () => void
  onCreated: (block: Block) => void
}

function toDateTimeLocal(date: string, time: string) {
  return `${date}T${time}`
}

function addMinutes(dateStr: string, timeStr: string, minutes: number) {
  const dt = new Date(`${dateStr}T${timeStr}`)
  dt.setMinutes(dt.getMinutes() + minutes)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

export default function BlockModal({ prefilledDate, prefilledTime, onClose, onCreated }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const startDate = prefilledDate ?? today
  const startTime = prefilledTime ?? defaultTime

  const [startsAt, setStartsAt] = useState(toDateTimeLocal(startDate, startTime))
  const [endsAt, setEndsAt] = useState(addMinutes(startDate, startTime, 60))
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError('La hora de fin debe ser posterior al inicio')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const block = await blocksApi.create({
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        reason,
      })
      onCreated(block)
    } catch {
      setError('No se pudo crear el bloqueo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Bloquear horario</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ej. Almuerzo, Reunión..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Bloquear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
