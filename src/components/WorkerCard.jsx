import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { User, Coffee, AlertTriangle, ShieldAlert, Clock } from 'lucide-react'
import { HEALTH_CONFIG, DEFAULT_HEALTH, ACTION_LABEL, ACTION_COLOR } from '../constants/actionConfig'

export default function WorkerCard({ worker, officerId, onToast }) {
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