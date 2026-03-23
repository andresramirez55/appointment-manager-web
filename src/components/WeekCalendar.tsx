import { useState, useRef, useEffect } from 'react'
import { appointmentsApi, type Appointment } from '../api/client'

const HOUR_START = 7
const HOUR_END = 21
const HOUR_HEIGHT = 64
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const TOTAL_HEIGHT = (HOUR_END - HOUR_START) * HOUR_HEIGHT

function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-indigo-100 border-indigo-400 text-indigo-800',
  completed: 'bg-green-100 border-green-400 text-green-800',
  cancelled: 'bg-slate-100 border-slate-300 text-slate-400',
}

interface PopoverProps {
  appointment: Appointment
  onClose: () => void
  onAction: (status: string) => void
  onEdit: () => void
  loading: boolean
  mobile?: boolean
}

function AppointmentPopover({ appointment, onClose, onAction, onEdit, loading, mobile }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const start = new Date(appointment.starts_at)
  const end = new Date(start.getTime() + appointment.duration_minutes * 60000)
  const timeRange = `${start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
  const dateStr = start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  // Mobile: fixed bottom sheet
  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
        <div
          ref={ref}
          className="w-full bg-white rounded-t-2xl shadow-xl border-t border-slate-200 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
          <p className="text-base font-semibold text-slate-800">{appointment.patient?.name ?? '—'}</p>
          {appointment.patient?.phone && (
            <p className="text-sm text-slate-500 mt-0.5">{appointment.patient.phone}</p>
          )}
          <div className="my-3 border-t border-slate-100" />
          <div className="space-y-1 text-sm text-slate-600 mb-4">
            <p className="capitalize">{dateStr}</p>
            <p>{timeRange} · {appointment.duration_minutes} min</p>
          </div>
          {appointment.status === 'scheduled' && (
            <div className="flex flex-col gap-2">
              <button disabled={loading} onClick={onEdit}
                className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium transition disabled:opacity-50">
                Reprogramar
              </button>
              <button disabled={loading} onClick={() => onAction('completed')}
                className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition disabled:opacity-50">
                Marcar como completado
              </button>
              <button disabled={loading} onClick={() => onAction('cancelled')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium transition disabled:opacity-50">
                Cancelar turno
              </button>
            </div>
          )}
          {appointment.status !== 'scheduled' && (
            <p className={`text-sm font-medium text-center py-2 rounded-xl ${
              appointment.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {appointment.status === 'completed' ? 'Completado' : 'Cancelado'}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Desktop: floating popover
  return (
    <div
      ref={ref}
      className="absolute left-full ml-2 top-0 z-50 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <p className="text-sm font-semibold text-slate-800 pr-5 leading-tight">{appointment.patient?.name ?? '—'}</p>
      {appointment.patient?.phone && (
        <p className="text-xs text-slate-500 mt-0.5">{appointment.patient.phone}</p>
      )}
      <div className="my-3 border-t border-slate-100" />
      <div className="space-y-1 text-xs text-slate-600">
        <p className="capitalize">{dateStr}</p>
        <p>{timeRange} · {appointment.duration_minutes} min</p>
      </div>
      {appointment.status === 'scheduled' && (
        <div className="flex flex-col gap-1.5 mt-3">
          <button disabled={loading} onClick={onEdit}
            className="w-full py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-medium transition disabled:opacity-50">
            Reprogramar
          </button>
          <button disabled={loading} onClick={() => onAction('completed')}
            className="w-full py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition disabled:opacity-50">
            Marcar como completado
          </button>
          <button disabled={loading} onClick={() => onAction('cancelled')}
            className="w-full py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition disabled:opacity-50">
            Cancelar turno
          </button>
        </div>
      )}
      {appointment.status !== 'scheduled' && (
        <p className={`mt-3 text-xs font-medium text-center py-1 rounded-lg ${
          appointment.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {appointment.status === 'completed' ? 'Completado' : 'Cancelado'}
        </p>
      )}
    </div>
  )
}

interface AppointmentBlockProps {
  appointment: Appointment
  onStatusChange: (id: number, status: string) => void
  onEdit: (appointment: Appointment) => void
  mobile?: boolean
}

function AppointmentBlock({ appointment, onStatusChange, onEdit, mobile }: AppointmentBlockProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const start = new Date(appointment.starts_at)
  const startMinutes = (start.getHours() - HOUR_START) * 60 + start.getMinutes()
  const top = (startMinutes / 60) * HOUR_HEIGHT
  const height = Math.max((appointment.duration_minutes / 60) * HOUR_HEIGHT, 28)

  async function handleAction(status: string) {
    setLoading(true)
    try {
      await appointmentsApi.update(appointment.id, { status })
      onStatusChange(appointment.id, status)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <div
        className={`absolute left-1 right-1 rounded-md border-l-2 px-2 py-1 cursor-pointer select-none overflow-hidden transition-shadow ${STATUS_COLOR[appointment.status]} ${open ? 'shadow-md z-30' : 'z-10'}`}
        style={{ top, height }}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
      >
        <p className="text-xs font-semibold truncate leading-tight">{appointment.patient?.name ?? '—'}</p>
        <p className="text-xs opacity-70 leading-tight truncate">
          {start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          {' · '}{appointment.duration_minutes} min
        </p>
      </div>

      {open && (
        <AppointmentPopover
          appointment={appointment}
          onClose={() => setOpen(false)}
          onAction={handleAction}
          onEdit={() => { setOpen(false); onEdit(appointment) }}
          loading={loading}
          mobile={mobile}
        />
      )}
    </>
  )
}

// ─── Time grid compartida ────────────────────────────────────────────────────

function TimeGrid({
  days,
  appointments,
  onSlotClick,
  onStatusChange,
  onEdit,
  mobile,
  gridRef,
}: {
  days: Date[]
  appointments: Appointment[]
  onSlotClick: (date: string, time: string) => void
  onStatusChange: (id: number, status: string) => void
  onEdit: (appointment: Appointment) => void
  mobile?: boolean
  gridRef: React.RefObject<HTMLDivElement>
}) {
  const today = new Date()

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollTop = gridRef.current?.scrollTop ?? 0
    const y = e.clientY - rect.top + scrollTop
    const totalMinutes = Math.floor((y / HOUR_HEIGHT) * 2) * 30 + HOUR_START * 60
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    onSlotClick(
      day.toISOString().slice(0, 10),
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    )
  }

  return (
    <div className="flex flex-col flex-1 border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Day headers */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <div className="w-12 shrink-0" />
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          const dayIndex = (day.getDay() + 6) % 7
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-slate-200">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{DAYS[dayIndex]}</p>
              <p className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                {isToday ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs">
                    {day.getDate()}
                  </span>
                ) : (
                  day.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                )}
              </p>
            </div>
          )
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={gridRef} className="flex-1 overflow-y-auto" style={{ maxHeight: mobile ? 'calc(100vh - 200px)' : '600px' }}>
        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          {/* Hour labels */}
          <div className="w-12 shrink-0 relative">
            {HOURS.map((h) => (
              <div key={h} className="absolute right-2 text-xs text-slate-400"
                style={{ top: (h - HOUR_START) * HOUR_HEIGHT - 8 }}>
                {h}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, i) => {
            const dayAppts = appointments.filter((a) => isSameDay(new Date(a.starts_at), day))
            return (
              <div key={i}
                className="flex-1 border-l border-slate-200 relative cursor-pointer"
                style={{ height: TOTAL_HEIGHT }}
                onClick={(e) => handleColumnClick(e, day)}
              >
                {HOURS.map((h) => (
                  <div key={h} className="absolute left-0 right-0 border-t border-slate-100"
                    style={{ top: (h - HOUR_START) * HOUR_HEIGHT }} />
                ))}
                {dayAppts.map((a) => (
                  <AppointmentBlock key={a.id} appointment={a}
                    onStatusChange={onStatusChange} onEdit={onEdit} mobile={mobile} />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  appointments: Appointment[]
  onSlotClick: (date: string, time: string) => void
  onStatusChange: (id: number, status: string) => void
  onEdit: (appointment: Appointment) => void
}

export default function WeekCalendar({ appointments, onSlotClick, onStatusChange, onEdit }: Props) {
  const isMobile = useIsMobile()
  const gridRef = useRef<HTMLDivElement>(null)

  // Desktop: week navigation
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  // Mobile: day navigation
  const [currentDay, setCurrentDay] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Day navigation */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCurrentDay((d) => addDays(d, -1))}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800 capitalize">
              {currentDay.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <button onClick={() => setCurrentDay((d) => addDays(d, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {!isSameDay(currentDay, new Date()) && (
          <button onClick={() => { const d = new Date(); d.setHours(0,0,0,0); setCurrentDay(d) }}
            className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition self-center mb-3">
            Hoy
          </button>
        )}

        <TimeGrid
          days={[currentDay]}
          appointments={appointments}
          onSlotClick={onSlotClick}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          mobile
          gridRef={gridRef}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-slate-700 capitalize">
          {weekStart.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button onClick={() => setWeekStart(getWeekStart(new Date()))}
          className="ml-1 text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
          Hoy
        </button>
      </div>

      <TimeGrid
        days={weekDays}
        appointments={appointments}
        onSlotClick={onSlotClick}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        gridRef={gridRef}
      />
    </div>
  )
}
