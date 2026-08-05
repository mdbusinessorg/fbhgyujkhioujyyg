'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { social, type Notification } from '@/lib/social'
import { X, MessageSquare, Briefcase, UserPlus, Bell } from 'lucide-react'

interface Toast {
  id: string
  notification: Notification
  entering: boolean
}

export default function ToastNotifications() {
  const [userId, setUserId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [ready, setReady] = useState(false)
  const knownIds = useRef<Set<string>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const iconFor = (type: Notification['type']) => {
    switch (type) {
      case 'message': return MessageSquare
      case 'job_match': return Briefcase
      case 'network_request':
      case 'network_accepted': return UserPlus
      default: return Bell
    }
  }

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((n: Notification) => {
    if (knownIds.current.has(n.id)) return
    knownIds.current.add(n.id)
    const toastId = `toast-${n.id}-${Date.now()}`
    setToasts(prev => [...prev, { id: toastId, notification: n, entering: true }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === toastId ? { ...t, entering: false } : t))
    }, 50)
    setTimeout(() => removeToast(toastId), 6000)
  }, [removeToast])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setReady(true); return }
      const { data: u } = await supabase.from('users').select('id').eq('email', session.user.email).single()
      if (!u) { setReady(true); return }
      setUserId(u.id)

      const initial = await social.getNotifications(u.id).catch(() => [] as Notification[])
      initial.forEach(n => knownIds.current.add(n.id))
      setReady(true)

      const poll = async () => {
        try {
          const items = await social.getNotifications(u.id)
          items.filter(n => !n.read).forEach(n => addToast(n))
        } catch {}
      }

      poll()
      intervalRef.current = setInterval(poll, 15000)
    }

    init()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [addToast])

  const handleClick = async (toast: Toast) => {
    const n = toast.notification
    try { await social.markNotificationRead(n.id) } catch {}
    removeToast(toast.id)

    if (n.type === 'network_accepted') {
      const otherId = n.data?.recipient_id || n.sender?.id
      if (otherId && userId) {
        const { data: existing } = await supabase.from('conversations').select('id').or(`and(participant_1_id.eq.${otherId},participant_2_id.eq.${userId}),and(participant_1_id.eq.${userId},participant_2_id.eq.${otherId})`).maybeSingle()
        if (existing?.id) router.push(`/mensagens/?conv=${existing.id}`)
        else router.push('/mensagens/')
      }
    } else if (n.type === 'message' && n.data?.conversation_id) {
      router.push(`/mensagens/?conv=${n.data.conversation_id}`)
    } else if (n.type === 'job_match') {
      router.push('/vagas/?recentes=1')
    } else if (n.type === 'network_request') {
      router.push('/mensagens/')
    } else if (n.data?.href) {
      router.push(n.data.href)
    }
  }

  if (!ready || !userId) return null

  return (
    <div className="fixed top-4 right-4 z-[150] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const Icon = iconFor(t.notification.type)
        return (
          <div
            key={t.id}
            onClick={() => handleClick(t)}
            className={`pointer-events-auto w-80 bg-white/95 backdrop-blur-xl rounded-3xl shadow-ios border border-white/50 p-4 flex gap-3 cursor-pointer transition-all duration-300 ${t.entering ? 'translate-x-10 opacity-0' : 'translate-x-0 opacity-100'}`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ms-blue to-ms-purple flex items-center justify-center text-white flex-shrink-0">
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ms-dark truncate">{t.notification.title}</p>
              <p className="text-xs text-ms-gray line-clamp-2">{t.notification.body}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); removeToast(t.id) }} className="text-ms-gray hover:text-ms-dark flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
