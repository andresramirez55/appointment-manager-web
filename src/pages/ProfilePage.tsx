import { useEffect, useState, type FormEvent } from 'react'
import Layout from '../components/Layout'
import { authApi, type Professional } from '../api/client'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { updateProfessional } = useAuth()
  const [profile, setProfile] = useState<Professional | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', specialty: '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)

  useEffect(() => {
    authApi.getProfile().then((p) => {
      setProfile(p)
      setForm({ name: p.name, phone: p.phone, specialty: p.specialty ?? '' })
    })
  }, [])

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      const updated = await authApi.updateProfile(form)
      setProfile(updated)
      updateProfessional(updated)
      setSuccessMsg('Perfil actualizado')
    } catch {
      setErrorMsg('No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePassword(e: FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(null)
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('Las contraseñas no coinciden')
      return
    }
    if (pwForm.new_password.length < 6) {
      setPwError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    setSavingPw(true)
    try {
      await authApi.updatePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      setPwSuccess('Contraseña actualizada')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setPwError(msg ?? 'No se pudo actualizar la contraseña')
    } finally {
      setSavingPw(false)
    }
  }

  if (!profile) return null

  return (
    <Layout>
      <div className="p-8 max-w-xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Mi perfil</h1>

        {/* Datos del perfil */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 mb-6">
          <h2 className="text-sm font-semibold text-slate-700">Datos personales</h2>

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
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              value={profile.email}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">El email no se puede cambiar</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Especialidad</label>
            <input
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="Psicología, Medicina general..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {successMsg && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{successMsg}</p>}
          {errorMsg && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMsg}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        {/* Cambiar contraseña */}
        <form onSubmit={handleUpdatePassword} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Cambiar contraseña</h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña actual</label>
            <input
              type="password"
              required
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nueva contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              required
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {pwError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{pwSuccess}</p>}

          <button
            type="submit"
            disabled={savingPw}
            className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium transition"
          >
            {savingPw ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
