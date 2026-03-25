import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { patientsApi, appointmentsApi, notesApi, type Patient, type Appointment, type SessionNote } from '../api/client'

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}
const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [noteText, setNoteText] = useState('')
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  async function handleOpen() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (notes.length === 0) {
      setLoadingNotes(true)
      try {
        const data = await notesApi.getByAppointment(appointment.id)
        setNotes(data)
      } finally {
        setLoadingNotes(false)
      }
    }
  }

  async function handleSaveNote(e: FormEvent) {
    e.preventDefault()
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      const note = await notesApi.create({ appointment_id: appointment.id, content: noteText })
      setNotes((prev) => [...prev, note])
      setNoteText('')
    } finally {
      setSavingNote(false)
    }
  }

  const start = new Date(appointment.starts_at)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition text-left"
      >
        <div className="min-w-[80px]">
          <p className="text-sm font-medium text-slate-700">
            {start.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-xs text-slate-400">
            {start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · {appointment.duration_minutes} min
          </p>
        </div>

        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[appointment.status]}`}>
          {STATUS_LABEL[appointment.status]}
        </span>

        {appointment.notes && (
          <p className="text-xs text-slate-400 flex-1 truncate">{appointment.notes}</p>
        )}

        <svg
          className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notas de sesión</p>

          {loadingNotes && <p className="text-xs text-slate-400">Cargando...</p>}

          {notes.length === 0 && !loadingNotes && (
            <p className="text-xs text-slate-400">Sin notas todavía.</p>
          )}

          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(note.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}

          {appointment.status === 'completed' && (
            <form onSubmit={handleSaveNote} className="flex gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Agregar nota..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <button
                type="submit"
                disabled={savingNote || !noteText.trim()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition"
              >
                Guardar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const patientId = Number(id)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      patientsApi.getById(patientId),
      appointmentsApi.getAll().then((all) => all.filter((a) => a.patient_id === patientId)),
    ]).then(([p, appts]) => {
      setPatient(p)
      setForm({ name: p.name, phone: p.phone, email: p.email, notes: p.notes })
      setAppointments(appts)
    }).finally(() => setLoading(false))
  }, [patientId])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await patientsApi.update(patientId, { ...form, phone: form.phone.replace(/^\+/, '').replace(/\s/g, '') })
      setPatient(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Layout><div className="p-8 text-sm text-slate-400">Cargando...</div></Layout>
  }

  if (!patient) {
    return <Layout><div className="p-8 text-sm text-slate-500">Paciente no encontrado.</div></Layout>
  }

  const upcoming = appointments.filter((a) => a.status === 'scheduled')
  const past = appointments.filter((a) => a.status !== 'scheduled')

  return (
    <Layout>
      <div className="p-8 max-w-2xl">
        {/* Header */}
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Pacientes
        </button>

        {/* Datos del paciente */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-base font-semibold">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-800">{patient.name}</h1>
                <p className="text-sm text-slate-400">{appointments.length} turnos en total</p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="5491112345678"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <p className="text-xs text-slate-400 mt-1">Con código de país, sin + (ej: 5491112345678)</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1.5 text-sm text-slate-600">
              <p><span className="text-slate-400">Teléfono:</span> {patient.phone}</p>
              {patient.email && <p><span className="text-slate-400">Email:</span> {patient.email}</p>}
              {patient.notes && <p><span className="text-slate-400">Notas:</span> {patient.notes}</p>}
            </div>
          )}
        </div>

        {/* Turnos próximos */}
        {upcoming.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Próximos</h2>
            <div className="space-y-2">
              {upcoming.map((a) => <AppointmentRow key={a.id} appointment={a} />)}
            </div>
          </section>
        )}

        {/* Historial */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Historial</h2>
          {past.length === 0 ? (
            <p className="text-sm text-slate-400">Sin historial todavía.</p>
          ) : (
            <div className="space-y-2">
              {past.map((a) => <AppointmentRow key={a.id} appointment={a} />)}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
