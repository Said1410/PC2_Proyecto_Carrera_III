import { useState } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'

export default function ZoneSelector({ intersections, selected, onSelect }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex-1 max-w-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-slate-900 border border-slate-700 text-sm text-teal-300 px-3 py-2 rounded-xl hover:border-teal-600 transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin size={13} />
          {selected?.name || 'Seleccionar cruce'}
        </span>
        <ChevronDown size={13} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden z-50 shadow-2xl">
          {intersections.map(z => (
            <button
              key={z.id}
              onClick={() => { onSelect(z); setOpen(false) }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0 ${z.id === selected?.id ? 'text-teal-400 font-medium' : 'text-slate-300'}`}
            >
              <p className="leading-tight">{z.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{z.district} · Riesgo {z.hazard_level}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}