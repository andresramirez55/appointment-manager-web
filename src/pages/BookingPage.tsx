import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi, type TimeSlot } from '../api/client'

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

type Step = 'slots' | 'form' | 'confirmed'

export default function BookingPage() {
  const { id } = useParams<{ id: string }>()
  const professionalId = Number(id)

  const [professional, setProfessional] = useState<{ id: number; name: string; specialty: string } | null>(null)
  const [profError, setProfError] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const [step, setStep] = useState<Step>('slots')
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  useEffect(() => {
    publicApi.getProfessional(professionalId)
      .then(setProfessional)
      .catch(() => setProfError(true))
  }, [professionalId])

  useEffect(() => {
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot(null)
    publicApi.getSlots(professionalId, formatDate(selectedDate))
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [professionalId, selectedDate])

  async function handleBook(e: FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return
    setBooking(true)
    setBookingError(null)
    try {
      await publicApi.createAppointment({
        professional_id: professionalId,
        patient_name: form.name,
        patient_phone: form.phone.replace(/^\+/, '').replace(/\s/g, ''),
        starts_at: selectedSlot.starts_at,
        duration_minutes: Math.round((new Date(selectedSlot.ends_at).getTime() - new Date(selectedSlot.starts_at).getTime()) / 60000),
      })
      setStep('confirmed')
    } catch {
      setBookingError('No se pudo confirmar el turno. Intentá de nuevo.')
    } finally {
      setBooking(false)
    }
  }

  if (profError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-500 text-sm">No se encontró el profesional.</p>
        </div>
      </div>
    )
  }

  if (step === 'confirmed') {
    const start = selectedSlot ? new Date(selectedSlot.starts_at) : null
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">¡Turno confirmado!</h2>
          {start && (
            <p className="text-sm text-slate-600 mb-1 capitalize">
              {start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}
          {start && (
            <p className="text-sm text-slate-600">
              {start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
            </p>
          )}
          <p className="text-xs text-slate-400 mt-4">Recibirás una confirmación si dejaste tu contacto.</p>
        </div>
      </div>
    )
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-5 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-3">
          <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        {professional ? (
          <>
            <h1 className="text-lg font-semibold text-slate-800">{professional.name}</h1>
            {professional.specialty && (
              <p className="text-sm text-slate-500 mt-0.5">{professional.specialty}</p>
            )}
          </>
        ) : (
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mx-auto" />
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 'slots' && (
          <>
            {/* Selector de fecha */}
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Elegí una fecha</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {days.map((day) => {
                const isSelected = formatDate(day) === formatDate(selectedDate)
                return (
                  <button
                    key={formatDate(day)}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center px-3 py-2.5 rounded-xl border shrink-0 transition ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wide opacity-70">
                      {day.toLocaleDateString('es-AR', { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-semibold mt-0.5">{day.getDate()}</span>
                    <span className="text-xs opacity-70">
                      {day.toLocaleDateString('es-AR', { month: 'short' })}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Slots disponibles */}
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Horarios disponibles — <span className="capitalize font-normal text-slate-500">
                {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </h2>

            {loadingSlots && (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-200 rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {!loadingSlots && slots.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No hay turnos disponibles para este día.</p>
              </div>
            )}

            {!loadingSlots && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const time = new Date(slot.starts_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <button
                      key={slot.starts_at}
                      onClick={() => { setSelectedSlot(slot); setStep('form') }}
                      className="py-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 text-sm font-medium text-slate-700 transition"
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {step === 'form' && selectedSlot && (
          <>
            <button onClick={() => setStep('slots')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-indigo-800 capitalize">
                {new Date(selectedSlot.starts_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-sm text-indigo-700 mt-0.5">
                {new Date(selectedSlot.starts_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
              </p>
            </div>

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre completo *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono (WhatsApp)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="5491112345678"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-400 mt-1">Con código de país, sin + (ej: 5491112345678)</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@email.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              {bookingError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{bookingError}</p>
              )}

              <button
                type="submit"
                disabled={booking}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium transition"
              >
                {booking ? 'Confirmando...' : 'Confirmar turno'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
