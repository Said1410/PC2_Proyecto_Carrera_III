import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

const STYLES = {
  success: 'border-teal-700 bg-teal-950 text-teal-300',
  warning: 'border-amber-700 bg-amber-950 text-amber-300',
  danger:  'border-red-700 bg-red-950 text-red-300',
  error:   'border-slate-700 bg-slate-900 text-slate-300',
}

export default function Toast({ message, variant, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-medium shadow-xl ${STYLES[variant] || STYLES.error}`}>
      <CheckCircle size={15} />
      {message}
    </div>
  )
}