import { useState } from 'react'
import { LogOut, Shield, UserPlus } from 'lucide-react'
import { useWorkers } from './hooks/useWorkers'
import Toast from './components/Toast'
import StatsBar from './components/StatsBar'
import ZoneSelector from './components/ZoneSelector'
import WorkerCard from './components/WorkerCard'
import RegisterWorkerModal from './components/RegisterWorkerModal'

export default function Dashboard({ officer, onLogout }) {
  const {
    workers,
    intersections,
    selectedIntersection,
    setSelectedIntersection,
    loading,
    addWorker,
  } = useWorkers()

  const [showRegister, setShowRegister] = useState(false)
  const [toast, setToast] = useState(null)

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
              addWorker(newWorker, selectedIntersection)
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

          <ZoneSelector
            intersections={intersections}
            selected={selectedIntersection}
            onSelect={setSelectedIntersection}
          />

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

        <StatsBar workers={workers} />

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