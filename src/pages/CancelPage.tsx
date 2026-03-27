import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

interface AppointmentInfo {
  patient_name: string
  professional_name: string
  starts_at: string
  duration_minutes: number
  status: string
}

export default function CancelPage() {
  const { token } = useParams<{ token: string }>()
  const [info, setInfo] = useState<AppointmentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios.get<AppointmentInfo>(`${BASE}/public/appointments/${token}`)
      .then((r) => setInfo(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  async function handleCancel() {
    setCancelling(true)
    setError(null)
    try {
      await axios.post(`${BASE}/public/appointments/${token}/cancel`)
      setCancelled(true)
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'No se pudo cancelar el turno.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm text-center">
          <p className="text-slate-500 text-sm">No se encontró el turno o el link ya no es válido.</p>
        </div>
      </div>
    )
  }

  if (cancelled || info?.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Turno cancelado</h2>
          <p className="text-sm text-slate-500">Tu turno fue cancelado correctamente. Si necesitás un nuevo turno, contactá al profesional.</p>
        </div>
      </div>
    )
  }

  if (info?.status !== 'scheduled') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm text-center">
          <p className="text-slate-500 text-sm">Este turno ya no puede cancelarse.</p>
        </div>
      </div>
    )
  }

  const start = new Date(info!.starts_at)

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Cancelar turno</h2>
        <p className="text-sm text-slate-500 mb-6">¿Confirmás que querés cancelar el siguiente turno?</p>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6 space-y-1">
          <p className="text-sm font-medium text-slate-800">{info!.patient_name}</p>
          <p className="text-sm text-slate-500">con {info!.professional_name}</p>
          <p className="text-sm text-slate-700 mt-2 capitalize">
            {start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-sm text-slate-700">
            {start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs · {info!.duration_minutes} min
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium text-sm transition"
        >
          {cancelling ? 'Cancelando...' : 'Sí, cancelar turno'}
        </button>
      </div>
    </div>
  )
}
