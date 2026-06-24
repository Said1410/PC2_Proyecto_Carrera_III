export default function StatsBar({ workers }) {
  const minors = workers.filter(w => w.is_minor)
  const riskWorkers = workers.filter(w => w.health_status !== 'APTO')

  const stats = [
    { label: 'Empadronados', value: workers.length, color: 'text-white' },
    { label: 'Riesgo salud', value: riskWorkers.length, color: 'text-amber-400' },
    { label: 'Menores de edad', value: minors.length, color: minors.length > 0 ? 'text-red-400' : 'text-slate-400' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
        </div>
      ))}
    </div>
  )
}