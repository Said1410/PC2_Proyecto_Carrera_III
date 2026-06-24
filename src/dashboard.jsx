import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  MapPin, User, AlertTriangle, Coffee, ShieldAlert,
  LogOut, CheckCircle, Clock, ChevronDown, Shield,
  X, UserPlus
} from 'lucide-react'

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const HEALTH_CONFIG = {
  APTO: {
    card: 'bg-teal-950 border-teal-900',
    badge: 'bg-teal-900 text-teal-300 border border-teal-700',
    icon: 'text-teal-400',
    label: 'Apto',
  },
  RIESGO_RESPIRATORIO: {
    card: 'bg-amber-950 border-amber-900',
    badge: 'bg-amber-900 text-amber-300 border border-amber-700',
    icon: 'text-amber-400',
    label: 'Riesgo resp.',
  },
}

const DEFAULT_HEALTH = {
  card: 'bg-slate-900 border-slate-800',
  badge: 'bg-slate-800 text-slate-300 border border-slate-700',
  icon: 'text-slate-400',
  label: 'Sin datos',
}

const ACTION_LABEL = {
  ENTREGA_VALE_ALIMENTOS: 'Vale entregado',
  ALERTA_SALUD_SMOG: 'Alerta smog',
  PROTOCOLO_DEMUNA_ACTIVADO: 'DEMUNA activado',
  EMPADRONAMIENTO_INICIAL: 'Empadronado',
}

const ACTION_COLOR = {
  ENTREGA_VALE_ALIMENTOS: 'text-teal-400',
  ALERTA_SALUD_SMOG: 'text-amber-400',
  PROTOCOLO_DEMUNA_ACTIVADO: 'text-red-400',
  EMPADRONAMIENTO_INICIAL: 'text-slate-400',
}

// ─── TOAST ───────────────────────────────────────────────────────────────────

function Toast({ message, variant, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: 'border-teal-700 bg-teal-950 text-teal-300',
    warning: 'border-amber-700 bg-amber-950 text-amber-300',
    danger:  'border-red-700 bg-red-950 text-red-300',
    error:   'border-slate-700 bg-slate-900 text-slate-300',
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-medium shadow-xl ${styles[variant]}`}>
      <CheckCircle size={15} />
      {message}
    </div>
  )
}

// ─── MODAL REGISTRO ───────────────────────────────────────────────────────────

function RegisterWorkerModal({ intersections, defaultIntersectionId, officerId, onClose, onSuccess }) {
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

// ─── WORKER CARD ─────────────────────────────────────────────────────────────

function WorkerCard({ worker, officerId, onToast }) {
  const [loading, setLoading] = useState(null)
  const [todayLogs, setTodayLogs] = useState([])

  const cfg = HEALTH_CONFIG[worker.health_status] || DEFAULT_HEALTH
  const isMinor = worker.is_minor
  const age = worker.birth_date
    ? Math.floor((Date.now() - new Date(worker.birth_date)) / 31557600000)
    : '?'

  useEffect(() => {
    async function fetchLogs() {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('audit_logs')
        .select('action_type, created_at')
        .eq('worker_id', worker.id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(4)
      setTodayLogs(data || [])
    }
    fetchLogs()
  }, [worker.id])

  const addLog = (entry) => setTodayLogs(prev => [entry, ...prev].slice(0, 4))

  const handleVale = async () => {
    setLoading('VALE')
    const now = new Date().toISOString()
    const { error } = await supabase.from('aid_distributions').insert({
      worker_id: worker.id,
      officer_id: officerId,
      aid_type: 'VALE_ALIMENTACION',
    })
    if (error) { onToast('Error al registrar vale', 'error'); setLoading(null); return }
    await supabase.from('audit_logs').insert({
      worker_id: worker.id,
      officer_id: officerId,
      action_type: 'ENTREGA_VALE_ALIMENTOS',
    })
    addLog({ action_type: 'ENTREGA_VALE_ALIMENTOS', created_at: now })
    onToast(`Vale registrado · ${worker.full_name}`, 'success')
    setLoading(null)
  }

  const handleSalud = async () => {
    setLoading('SALUD')
    const now = new Date().toISOString()
    const { error } = await supabase.from('field_incidents').insert({
      worker_id: worker.id,
      incident_type: 'ALERTA_SALUD',
      severity: 'MEDIO',
      description: 'Síntomas por inhalación de smog reportados en campo.',
    })
    if (error) { onToast('Error al registrar alerta', 'error'); setLoading(null); return }
    await supabase.from('audit_logs').insert({
      worker_id: worker.id,
      officer_id: officerId,
      action_type: 'ALERTA_SALUD_SMOG',
    })
    addLog({ action_type: 'ALERTA_SALUD_SMOG', created_at: now })
    onToast(`Alerta de salud enviada · ${worker.full_name}`, 'warning')
    setLoading(null)
  }

  const handleDemuna = async () => {
    setLoading('DEMUNA')
    const now = new Date().toISOString()
    const { error } = await supabase.from('field_incidents').insert({
      worker_id: worker.id,
      incident_type: 'PROTOCOLO_DEMUNA',
      severity: 'CRÍTICO',
      description: 'Menor de edad detectado en zona vial. Protocolo DEMUNA activado.',
    })
    if (error) { onToast('Error al activar DEMUNA', 'error'); setLoading(null); return }
    await supabase.from('audit_logs').insert({
      worker_id: worker.id,
      officer_id: officerId,
      action_type: 'PROTOCOLO_DEMUNA_ACTIVADO',
    })
    addLog({ action_type: 'PROTOCOLO_DEMUNA_ACTIVADO', created_at: now })
    onToast(`Protocolo DEMUNA activado · ${worker.full_name}`, 'danger')
    setLoading(null)
  }

  return (
    <div className={`border rounded-2xl p-5 flex flex-col gap-4 ${cfg.card} ${isMinor ? 'ring-1 ring-red-700' : ''}`}>

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full border border-slate-700 bg-slate-900">
            <User size={17} className={cfg.icon} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm">{worker.full_name}</h3>
              {isMinor && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-900 text-red-300 border border-red-700">
                  MENOR
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {age} años · {worker.nationality} · {worker.traffic_intersections?.name || 'Sin cruce'}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleVale}
          disabled={!!loading}
          className="flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all disabled:opacity-40 bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
        >
          {loading === 'VALE' ? <span className="animate-spin text-sm">⟳</span> : <Coffee size={14} />}
          <span>Vale</span>
        </button>
        <button
          onClick={handleSalud}
          disabled={!!loading}
          className="flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all disabled:opacity-40 bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900"
        >
          {loading === 'SALUD' ? <span className="animate-spin text-sm">⟳</span> : <AlertTriangle size={14} />}
          <span>Smog</span>
        </button>
        <button
          onClick={handleDemuna}
          disabled={!!loading}
          className="flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all disabled:opacity-40 bg-red-950 text-red-300 border-red-800 hover:bg-red-900"
        >
          {loading === 'DEMUNA' ? <span className="animate-spin text-sm">⟳</span> : <ShieldAlert size={14} />}
          <span>DEMUNA</span>
        </button>
      </div>

      {todayLogs.length > 0 && (
        <div className="border-t border-slate-800 pt-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
            <Clock size={10} /> Hoy
          </p>
          <div className="flex flex-col gap-1">
            {todayLogs.map((log, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className={`text-xs font-medium ${ACTION_COLOR[log.action_type] || 'text-slate-400'}`}>
                  {ACTION_LABEL[log.action_type] || log.action_type}
                </span>
                <span className="text-[10px] text-slate-600">
                  {new Date(log.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────

export default function Dashboard({ officer, onLogout }) {
  const [workers, setWorkers] = useState([])
  const [intersections, setIntersections] = useState([])
  const [selectedIntersection, setSelectedIntersection] = useState(null)
  const [zoneOpen, setZoneOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    async function loadIntersections() {
      const { data } = await supabase.from('traffic_intersections').select('*')
      if (data?.length) {
        setIntersections(data)
        setSelectedIntersection(data[0])
      }
    }
    loadIntersections()
  }, [])

  useEffect(() => {
    if (!selectedIntersection) return
    async function loadWorkers() {
      setLoading(true)
      const { data } = await supabase
        .from('street_workers')
        .select('*, traffic_intersections(name, district, hazard_level)')
        .eq('intersection_id', selectedIntersection.id)
      setWorkers(data || [])
      setLoading(false)
    }
    loadWorkers()
  }, [selectedIntersection])

  const minors = workers.filter(w => w.is_minor)
  const riskWorkers = workers.filter(w => w.health_status !== 'APTO')

  const todayStr = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {showRegister && (
        <RegisterWorkerModal
          intersections={intersections}
          defaultIntersectionId={selectedIntersection?.id}
          officerId={officer?.id}
          onClose={() => setShowRegister(false)}
          onSuccess={(newWorker) => {
            if (newWorker.intersection_id === selectedIntersection?.id) {
              setWorkers(prev => [...prev, {
                ...newWorker,
                traffic_intersections: selectedIntersection,
              }])
            }
            setShowRegister(false)
            const wasMinor = Math.floor((Date.now() - new Date(newWorker.birth_date)) / 31557600000) < 18
            setToast({
              message: wasMinor
                ? `${newWorker.full_name} registrado · DEMUNA activado`
                : `${newWorker.full_name} registrado exitosamente`,
              variant: wasMinor ? 'danger' : 'success',
            })
          }}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-white">VíaDigna</h1>
            <p className="text-[11px] text-slate-500 capitalize">{todayStr}</p>
          </div>

          <div className="relative flex-1 max-w-sm">
            <button
              onClick={() => setZoneOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 bg-slate-900 border border-slate-700 text-sm text-teal-300 px-3 py-2 rounded-xl hover:border-teal-600 transition-colors"
            >
              <span className="flex items-center gap-2 truncate">
                <MapPin size={13} />
                {selectedIntersection?.name || 'Seleccionar cruce'}
              </span>
              <ChevronDown size={13} className={`shrink-0 transition-transform ${zoneOpen ? 'rotate-180' : ''}`} />
            </button>
            {zoneOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden z-50 shadow-2xl">
                {intersections.map(z => (
                  <button
                    key={z.id}
                    onClick={() => { setSelectedIntersection(z); setZoneOpen(false) }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0 ${z.id === selectedIntersection?.id ? 'text-teal-400 font-medium' : 'text-slate-300'}`}
                  >
                    <p className="leading-tight">{z.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{z.district} · Riesgo {z.hazard_level}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="text-right">
              <p className="text-xs font-medium text-white">{officer?.full_name || 'Oficial'}</p>
              <p className="text-[10px] text-slate-500">{officer?.area || ''}</p>
            </div>
            <Shield size={18} className="text-teal-400" />
          </div>

          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-1.5 text-xs bg-teal-900 border border-teal-700 text-teal-300 px-3 py-2 rounded-xl hover:bg-teal-800 transition-colors shrink-0"
          >
            <UserPlus size={14} /> Registrar
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 transition-colors shrink-0"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-6">

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Empadronados', value: workers.length, color: 'text-white' },
            { label: 'Riesgo salud', value: riskWorkers.length, color: 'text-amber-400' },
            { label: 'Menores de edad', value: minors.length, color: minors.length > 0 ? 'text-red-400' : 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <p className="text-[11px] text-slate-500 uppercase tracking-widest">
            {selectedIntersection?.name} · {selectedIntersection?.district} · Nivel {selectedIntersection?.hazard_level}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-600 text-sm">Cargando padrón...</div>
        ) : workers.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <p className="text-slate-600 text-sm">Sin personas empadronadas en este cruce.</p>
            <button
              onClick={() => setShowRegister(true)}
              className="flex items-center gap-2 text-xs bg-teal-900 border border-teal-700 text-teal-300 px-4 py-2 rounded-xl hover:bg-teal-800 transition-colors"
            >
              <UserPlus size={13} /> Registrar primera persona
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map(w => (
              <WorkerCard
                key={w.id}
                worker={w}
                officerId={officer?.id}
                onToast={(message, variant) => setToast({ message, variant })}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}