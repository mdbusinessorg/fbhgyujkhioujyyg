'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Info, AlertCircle } from 'lucide-react'
import type { ToastKind } from '@/lib/toast'

interface UiToast {
  id: number
  message: string
  kind: ToastKind
}

const ICONS = {
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
}

const STYLES: Record<ToastKind, string> = {
  success: 'bg-ms-dark text-white',
  info: 'bg-ms-blue text-white',
  error: 'bg-red-600 text-white',
}

export default function UiToastHost() {
  const [toasts, setToasts] = useState<UiToast[]>([])

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, kind } = (e as CustomEvent<{ message: string; kind: ToastKind }>).detail
      const id = Date.now() + Math.random()
      setToasts(prev => [...prev.slice(-2), { id, message, kind }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800)
    }
    window.addEventListener('mosalo:ui-toast', onToast)
    return () => window.removeEventListener('mosalo:ui-toast', onToast)
  }, [])

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.kind]
        return (
          <div key={t.id} className={`ui-toast inline-flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium max-w-full ${STYLES[t.kind]}`}>
            <Icon size={16} className="flex-shrink-0" />
            <span className="truncate">{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
