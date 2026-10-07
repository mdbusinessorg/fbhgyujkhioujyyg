'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, UserPlus, MessageSquare, Briefcase, CheckCheck, Sparkles, Clock, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { social, type Notification } from '@/lib/social'
import AppHeader from '@/components/AppHeader'
import { toast } from '@/lib/toast'

const TYPE_STYLE: Record<string, { bg: string; icon: any }> = {
  job_match: { bg: 'bg-blue-100 text-ms-blue', icon: Briefcase },
  vaga_expiring: { bg: 'bg-amber-100 text-amber-600', icon: Clock },
  network_request: { bg: 'bg-purple-100 text-purple-600', icon: UserPlus },
  network_accepted: { bg: 'bg-purple-100 text-purple-600', icon: UserPlus },
  message: { bg: 'bg-green-100 text-green-600', icon: MessageSquare },
  welcome: { bg: 'bg-cyan-100 text-cyan-600', icon: Sparkles },
  profile_reminder: { bg: 'bg-cyan-100 text-cyan-600', icon: Sparkles },
}
const DEFAULT_STYLE = { bg: 'bg-ms-surface text-ms-gray', icon: Bell }

function groupFor(iso: string): 'hoje' | 'ontem' | 'anteriores' {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  if (d >= today) return 'hoje'
  if (d >= yesterday) return 'ontem'
  return 'anteriores'
}

export default function NotificacoesPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { router.push('/auth/login/'); return }
      const { data: u } = await supabase.from('users').select('id').eq('email', session.user.email).single()
      if (!u) { router.push('/auth/login/'); return }
      setUserId(u.id)
      try {
        const items = await social.getNotifications(u.id)
        setNotifications(items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      } catch {}
      setLoading(false)
    }
    init()
  }, [router])

  const unread = notifications.filter(n => !n.read)

  const markRead = async (id: string) => {
    try { await social.markNotificationRead(id) } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    await Promise.all(unread.map(n => social.markNotificationRead(n.id).catch(() => {})))
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setMarkingAll(false)
    toast('Todas as notificações marcadas como lidas', 'success')
  }

  const handleOpen = async (n: Notification) => {
    await markRead(n.id)
    if (n.type === 'network_accepted') {
      const otherId = n.data?.recipient_id || n.sender?.id
      if (otherId) {
        const { data: existing } = await supabase.from('conversations').select('id').or(`and(participant_1_id.eq.${otherId},participant_2_id.eq.${userId}),and(participant_1_id.eq.${userId},participant_2_id.eq.${otherId})`).maybeSingle()
        if (existing) { router.push(`/mensagens/?conv=${existing.id}`); return }
      }
      router.push('/pessoas/')
    } else if (n.type === 'message' && n.data?.conversation_id) {
      router.push(`/mensagens/?conv=${n.data.conversation_id}`)
    } else if (n.type === 'job_match') {
      router.push('/vagas/?recentes=1')
    } else if (n.type === 'welcome' || n.type === 'profile_reminder') {
      router.push(n.data?.url || '/dashboard/candidato/?tab=perfil')
    } else if (n.type === 'vaga_expiring') {
      router.push('/dashboard/recrutador/?tab=vagas')
    } else {
      router.push('/mensagens/')
    }
  }

  const groups: { key: 'hoje' | 'ontem' | 'anteriores'; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: 'ontem', label: 'Ontem' },
    { key: 'anteriores', label: 'Anteriores' },
  ]

  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    return groupFor(iso) === 'anteriores'
      ? d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
      : d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-white pb-10">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-extrabold text-ms-dark flex items-center gap-2">
            Notificações
            {unread.length > 0 && <span className="text-[11px] font-bold bg-ms-blue text-white px-2 py-0.5 rounded-full">{unread.length} novas</span>}
          </h1>
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ms-blue press disabled:opacity-50"
            >
              <CheckCheck size={14} /> Marcar tudo como lido
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 items-center p-3">
                <div className="skeleton w-11 h-11 rounded-full" />
                <div className="flex-1"><div className="skeleton h-3.5 rounded w-2/3" /><div className="skeleton h-3 rounded w-1/2 mt-2" /></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={36} className="text-ms-gray mx-auto mb-3" />
            <p className="text-sm font-medium text-ms-dark">Sem notificações ainda</p>
            <p className="text-xs text-ms-gray mt-1">Vagas com match, mensagens e ligações aparecem aqui.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(g => {
              const items = notifications.filter(n => groupFor(n.created_at) === g.key)
              if (items.length === 0) return null
              return (
                <section key={g.key}>
                  <p className="text-[11px] font-bold text-ms-gray uppercase tracking-wide mb-2">{g.label}</p>
                  <div className="space-y-2">
                    {items.map((n, i) => {
                      const st = TYPE_STYLE[n.type] || DEFAULT_STYLE
                      const Icon = st.icon
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleOpen(n)}
                          className={`jobcard-enter w-full text-left flex gap-3 p-3 rounded-2xl border press ${n.read ? 'bg-white border-ms-border/60' : 'bg-blue-50/70 border-ms-blue/20'}`}
                          style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
                        >
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${n.read ? 'font-medium text-ms-dark' : 'font-bold text-ms-dark'}`}>{n.title}</p>
                              <span className="text-[10px] text-ms-gray whitespace-nowrap pt-0.5">{fmtTime(n.created_at)}</span>
                            </div>
                            {n.body && <p className="text-xs text-ms-gray mt-0.5 line-clamp-2">{n.body}</p>}
                          </div>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-ms-blue flex-shrink-0 mt-2" />}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
