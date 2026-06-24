import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { X, AlertTriangle, ShieldAlert } from 'lucide-react'

export default function RegisterWorkerModal({ intersections, defaultIntersectionId, officerId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    full_name: '',
    document_number: '',
    nationality: 'Peruana',
    birth_date: '',
    health_status: 'APTO',
    intersection_id: defaultIntersectionId || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isMinor = form.birth_date
    ? Math.floor((Date.now() - new Date(form.birth_date)) / 31557600000) < 18
    : false

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.full_name || !form.document_number || !form.birth_date || !form.intersection_id) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    setLoading(true)
    setError(null)

    const { data: newWorker, error: workerErr } = await supabase
      .from('street_workers')
      .insert({
        full_name: form.full_name.trim(),
        document_number: form.document_number.trim(),
        nationality: form.nationality,
        birth_date: form.birth_date,
        is_minor: isMinor,
        intersection_id: form.intersection_id,
        health_status: form.health_status,
      })
      .select()
      .single()

    if (workerErr) {
      setError(workerErr.message.includes('unique')
        ? 'Ese número de documento ya está registrado.'
        : workerErr.message)
      setLoading(false)
      return
    }

    await supabase.from('audit_logs').insert({
      worker_id: newWorker.id,
      officer_id: officerId,
      action_type: 'EMPADRONAMIENTO_INICIAL',
    })

    if (isMinor) {
      await supabase.from('field_incidents').insert({
        worker_id: newWorker.id,
        incident_type: 'PROTOCOLO_DEMUNA',
        severity: 'CRÍTICO',
        description: 'Menor de edad detectado durante empadronamiento. Protocolo DEMUNA iniciado automáticamente.',
      })
    }

    setLoading(false)
    onSuccess(newWorker)
  }

  const inputCls = "w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-600 placeholder:text-slate-600"
  const labelCls = "block text-[11px] uppercase tracking-widest text-slate-500 mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-white">Registrar persona</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Nuevo empadronamiento en zona vial</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">

          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input
              className={inputCls}
              placeholder="Ej. Carlos Mendoza"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>N° documento *</label>
              <input
                className={inputCls}
                placeholder="DNI / CE / Pasaporte"
                value={form.document_number}
                onChange={e => set('document_number', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Nacionalidad</label>
              <select
                className={inputCls}
                value={form.nationality}
                onChange={e => set('nationality', e.target.value)}
              >
                <option>Peruana</option>
                <option>Venezolana</option>
                <option>Colombiana</option>
                <option>Ecuatoriana</option>
                <option>Otra</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Fecha de nacimiento *</label>
            <input
              type="date"
              className={inputCls}
              value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)}
            />
            {isMinor && form.birth_date && (
              <div className="mt-2 flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                <ShieldAlert size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-300 font-medium">
                  Menor de edad — protocolo DEMUNA se activará al guardar
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Estado de salud</label>
              <select
                className={inputCls}
                value={form.health_status}
                onChange={e => set('health_status', e.target.value)}
              >
                <option value="APTO">Apto</option>
                <option value="RIESGO_RESPIRATORIO">Riesgo respiratorio</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Cruce vial *</label>
              <select
                className={inputCls}
                value={form.intersection_id}
                onChange={e => set('intersection_id', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {intersections.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-xl px-3 py-2.5">
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-teal-900 border border-teal-700 text-sm text-teal-300 font-medium hover:bg-teal-800 transition-colors disabled:opacity-50"
            >
              {loading ? '⟳ Guardando...' : 'Registrar persona'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}