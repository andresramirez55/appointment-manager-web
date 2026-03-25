import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { patientsApi, type Patient } from '../api/client'

function NewPatientForm({ onCreated }: { onCreated: (p: Patient) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const patient = await patientsApi.create({ name, phone: phone.replace(/^\+/, '').replace(/\s/g, ''), email, notes })
      onCreated(patient)
      setName(''); setPhone(''); setEmail(''); setNotes('')
    } catch {
      setError('No se pudo guardar el paciente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-700">Nuevo paciente</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="María García"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono *</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="5491112345678"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <p className="text-xs text-slate-400 mt-1">Con código de país, sin + (ej: 5491112345678)</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="maria@email.com"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Observaciones generales..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition"
      >
        {loading ? 'Guardando...' : 'Guardar paciente'}
      </button>
    </form>
  )
}

export default function PatientsPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    patientsApi.getAll()
      .then(setPatients)
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="p-8 max-w-4xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Pacientes</h1>

        <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
          {/* Lista */}
          <div className="space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />

            {loading && <p className="text-sm text-slate-400">Cargando...</p>}

            {!loading && filtered.length === 0 && (
              <p className="text-sm text-slate-400">No hay pacientes registrados.</p>
            )}

            {filtered.map((p) => (
              <div key={p.id} onClick={() => navigate(`/patients/${p.id}`)} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-start gap-3 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{p.name}</p>
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    <p className="text-xs text-slate-400">{p.phone}</p>
                    {p.email && <p className="text-xs text-slate-400">{p.email}</p>}
                  </div>
                  {p.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{p.notes}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div className="sticky top-8">
            <NewPatientForm onCreated={(p) => setPatients((prev) => [p, ...prev])} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
