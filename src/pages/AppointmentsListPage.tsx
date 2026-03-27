import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { appointmentsApi, type Appointment } from '../api/client'
import { useConsultorio } from '../contexts/ConsultorioContext'

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-400 border-slate-200',
}

const PATIENT_COLORS = [
  'bg-indigo-400', 'bg-purple-400', 'bg-pink-400', 'bg-orange-400',
  'bg-teal-400', 'bg-rose-400', 'bg-amber-400', 'bg-cyan-400',
  'bg-lime-400', 'bg-violet-400',
]

function getPatientColor(id: number) {
  return PATIENT_COLORS[id % PATIENT_COLORS.length]
}

type Period = 'upcoming' | 'past' | 'all'
type StatusFilter = 'all' | 'scheduled' | 'completed' | 'cancelled'

export default function AppointmentsListPage() {
  const navigate = useNavigate()
  const { selected } = useConsultorio()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<Period>('upcoming')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    if (selected === null) return
    setLoading(true)
    appointmentsApi.getAll(selected?.id)
      .then((data) => setAppointments(data.sort((a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )))
      .finally(() => setLoading(false))
  }, [selected?.id])

  const now = new Date()

  const filtered = appointments.filter((a) => {
    const d = new Date(a.starts_at)
    if (period === 'upcoming' && d < now) return false
    if (period === 'past' && d >= now) return false
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!a.patient?.name.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Group by date
  const groups: Record<string, Appointment[]> = {}
  for (const a of filtered) {
    const key = new Date(a.starts_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-3xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Historial de turnos</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente..."
            className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />

          <div className="flex gap-2">
            {(['upcoming', 'past', 'all'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                  period === p
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                {p === 'upcoming' ? 'Próximos' : p === 'past' ? 'Pasados' : 'Todos'}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
          >
            <option value="all">Todos los estados</option>
            <option value="scheduled">Programados</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>

        {loading && <p className="text-sm text-slate-400">Cargando...</p>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-slate-400">No hay turnos para mostrar.</p>
          </div>
        )}

        {/* Grouped list */}
        <div className="space-y-6">
          {Object.entries(groups).map(([date, appts]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 capitalize">{date}</p>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {appts.map((a) => {
                  const start = new Date(a.starts_at)
                  return (
                    <div
                      key={a.id}
                      onClick={() => navigate(`/patients/${a.patient_id}`)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition"
                    >
                      {/* Color dot */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${a.status === 'cancelled' ? 'bg-slate-300' : getPatientColor(a.patient_id)}`} />

                      {/* Time */}
                      <p className="text-sm font-medium text-slate-700 w-14 shrink-0">
                        {start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {/* Patient */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${a.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {a.patient?.name ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400">{a.duration_minutes} min</p>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        {a.status === 'completed' && (
                          a.paid
                            ? <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full capitalize hidden sm:inline">
                                $ {a.payment_method || 'Cobrado'}
                              </span>
                            : <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hidden sm:inline">
                                Sin cobrar
                              </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[a.status]}`}>
                          {STATUS_LABEL[a.status]}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
