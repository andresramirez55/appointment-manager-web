import { type Appointment } from '../api/client'

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
}

function StatCard({ label, value, sub, color = 'text-slate-800' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-1 min-w-0">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function StatsBar({ appointments }: { appointments: Appointment[] }) {
  const now = new Date()
  const weekStart = getWeekStart(now)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const todayScheduled = appointments.filter(
    (a) => a.status === 'scheduled' && isSameDay(new Date(a.starts_at), now)
  ).length

  const weekTotal = appointments.filter((a) => {
    const d = new Date(a.starts_at)
    return d >= weekStart && d < weekEnd && a.status !== 'cancelled'
  }).length

  const recentFinished = appointments.filter((a) => {
    const d = new Date(a.starts_at)
    return d >= thirtyDaysAgo && (a.status === 'completed' || a.status === 'cancelled')
  })
  const attendanceRate = recentFinished.length === 0
    ? null
    : Math.round((recentFinished.filter((a) => a.status === 'completed').length / recentFinished.length) * 100)

  const uniquePatients = new Set(appointments.map((a) => a.patient_id)).size

  return (
    <div className="flex gap-3 mb-5">
      <StatCard
        label="Turnos hoy"
        value={todayScheduled}
        sub="programados"
        color={todayScheduled > 0 ? 'text-indigo-600' : 'text-slate-800'}
      />
      <StatCard
        label="Esta semana"
        value={weekTotal}
        sub="confirmados"
      />
      <StatCard
        label="Asistencia"
        value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
        sub="últimos 30 días"
        color={attendanceRate !== null && attendanceRate >= 80 ? 'text-green-600' : 'text-slate-800'}
      />
      <StatCard
        label="Pacientes"
        value={uniquePatients}
        sub="registrados"
      />
    </div>
  )
}
