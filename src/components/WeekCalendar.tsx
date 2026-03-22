import { useState, useRef } from 'react'
import { appointmentsApi, type Appointment } from '../api/client'

const HOUR_START = 7
const HOUR_END = 21
const HOUR_HEIGHT = 64 // px por hora
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

function formatDateHeader(date: Date) {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-indigo-100 border-indigo-400 text-indigo-800',
  completed: 'bg-green-100 border-green-400 text-green-800',
  cancelled: 'bg-slate-100 border-slate-300 text-slate-400',
}

interface AppointmentBlockProps {
  appointment: Appointment
  onStatusChange: (id: number, status: string) => void
}

function AppointmentBlock({ appointment, onStatusChange }: AppointmentBlockProps) {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)

  const start = new Date(appointment.starts_at)
  const startMinutes = (start.getHours() - HOUR_START) * 60 + start.getMinutes()
  const top = (startMinutes / 60) * HOUR_HEIGHT
  const height = Math.max((appointment.duration_minutes / 60) * HOUR_HEIGHT, 24)

  async function handleAction(status: string) {
    setLoading(true)
    try {
      await appointmentsApi.update(appointment.id, { status })
      onStatusChange(appointment.id, status)
    } finally {
      setLoading(false)
      setActive(false)
    }
  }

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border-l-2 px-2 py-1 cursor-pointer select-none overflow-hidden transition-shadow ${STATUS_COLOR[appointment.status]} ${active ? 'shadow-md z-20' : 'z-10'}`}
      style={{ top, height }}
      onClick={(e) => {
        e.stopPropagation()
        if (appointment.status === 'scheduled') setActive((v) => !v)
      }}
    >
      <p className="text-xs font-semibold truncate leading-tight">
        {appointment.patient?.name ?? '—'}
      </p>
      <p className="text-xs opacity-70 leading-tight">
        {new Date(appointment.starts_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        {' · '}{appointment.duration_minutes} min
      </p>

      {active && appointment.status === 'scheduled' && (
        <div className="flex gap-1 mt-1">
          <button
            disabled={loading}
            onClick={(e) => { e.stopPropagation(); handleAction('completed') }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white disabled:opacity-50"
          >
            Completado
          </button>
          <button
            disabled={loading}
            onClick={(e) => { e.stopPropagation(); handleAction('cancelled') }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500 text-white disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

interface Props {
  appointments: Appointment[]
  onSlotClick: (date: string, time: string) => void
  onStatusChange: (id: number, status: string) => void
}

export default function WeekCalendar({ appointments, onSlotClick, onStatusChange }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const gridRef = useRef<HTMLDivElement>(null)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollTop = gridRef.current?.scrollTop ?? 0
    const y = e.clientY - rect.top + scrollTop
    const totalMinutes = Math.floor(y / HOUR_HEIGHT * 2) * 30 + HOUR_START * 60
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const dateStr = day.toISOString().slice(0, 10)
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    onSlotClick(dateStr, timeStr)
  }

  const today = new Date()

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-slate-700 capitalize">
          {weekStart.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={() => setWeekStart(getWeekStart(new Date()))}
          className="ml-1 text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
        >
          Hoy
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col flex-1 border border-slate-200 rounded-xl overflow-hidden bg-white">
        {/* Day headers */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <div className="w-14 shrink-0" />
          {days.map((day, i) => {
            const isToday = isSameDay(day, today)
            return (
              <div key={i} className="flex-1 text-center py-2.5 border-l border-slate-200">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{DAYS[i]}</p>
                <p className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {isToday ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs">
                      {day.getDate()}
                    </span>
                  ) : (
                    formatDateHeader(day)
                  )}
                </p>
              </div>
            )
          })}
        </div>

        {/* Scrollable time grid */}
        <div ref={gridRef} className="flex-1 overflow-y-auto" style={{ maxHeight: '600px' }}>
          <div className="flex" style={{ height: TOTAL_HEIGHT }}>
            {/* Hour labels */}
            <div className="w-14 shrink-0 relative">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 text-xs text-slate-400"
                  style={{ top: (h - HOUR_START) * HOUR_HEIGHT - 8 }}
                >
                  {h}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, i) => {
              const dayAppts = appointments.filter((a) =>
                isSameDay(new Date(a.starts_at), day)
              )
              return (
                <div
                  key={i}
                  className="flex-1 border-l border-slate-200 relative cursor-pointer"
                  style={{ height: TOTAL_HEIGHT }}
                  onClick={(e) => handleColumnClick(e, day)}
                >
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-slate-100"
                      style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Appointments */}
                  {dayAppts.map((a) => (
                    <AppointmentBlock
                      key={a.id}
                      appointment={a}
                      onStatusChange={onStatusChange}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
