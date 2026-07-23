'use client'

import { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  sub?: string
  onClose: () => void
  duration?: number
}

export function Toast({ message, sub, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-500">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-2xl border border-white/10 p-4 pr-6 min-w-[260px] max-w-xs flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 animate-pulse">
          <CheckCircle size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{message}</p>
          {sub && <p className="text-[11px] text-white/70 mt-0.5">{sub}</p>}
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={16} /></button>
      </div>
    </div>
  )
}
