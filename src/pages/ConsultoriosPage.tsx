import { useState, type FormEvent } from 'react'
import Layout from '../components/Layout'
import { consultoriosApi, type Consultorio } from '../api/client'
import { useConsultorio } from '../contexts/ConsultorioContext'

export default function ConsultoriosPage() {
  const { consultorios, reload } = useConsultorio()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      await consultoriosApi.create({ name, address })
      setName('')
      setAddress('')
      reload()
    } catch {
      setCreateError('No se pudo crear el consultorio.')
    } finally {
      setCreating(false)
    }
  }

  function startEdit(c: Consultorio) {
    setEditingId(c.id)
    setEditName(c.name)
    setEditAddress(c.address)
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (editingId === null) return
    setSaving(true)
    try {
      await consultoriosApi.update(editingId, { name: editName, address: editAddress })
      setEditingId(null)
      reload()
    } catch {
      // silently ignore, keep modal open
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este consultorio?')) return
    try {
      await consultoriosApi.delete(id)
      reload()
    } catch {
      // silently ignore
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Consultorios</h1>

        {/* List */}
        <div className="space-y-3 mb-8">
          {consultorios.length === 0 && (
            <p className="text-sm text-slate-400">No hay consultorios registrados.</p>
          )}
          {consultorios.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                {c.address && <p className="text-xs text-slate-400 mt-0.5 truncate">{c.address}</p>}
              </div>
              <button
                onClick={() => startEdit(c)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition px-2 py-1"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition px-2 py-1"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Nuevo consultorio</h2>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Consultorio Norte"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dirección</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Corrientes 1234, CABA"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          {createError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createError}</p>
          )}
          <button
            type="submit"
            disabled={creating}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition"
          >
            {creating ? 'Guardando...' : 'Crear consultorio'}
          </button>
        </form>

        {/* Edit modal */}
        {editingId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
            onClick={() => setEditingId(null)}>
            <form
              onSubmit={handleUpdate}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4"
            >
              <h2 className="text-sm font-semibold text-slate-800">Editar consultorio</h2>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dirección</label>
                <input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingId(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  )
}
