'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, UserPlus, Check, CheckCheck, MessageSquare, Briefcase, Clock, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { social, type Notification } from '@/lib/social'

const TYPE_STYLE: Record<string, { bg: string; icon: typeof Bell }> = {
  job_match: { bg: 'bg-blue-100 text-ms-blue', icon: Briefcase },
  vaga_expiring: { bg: 'bg-amber-100 text-amber-600', icon: Clock },
  network_request: { bg: 'bg-violet-100 text-violet-600', icon: UserPlus },
  network_accepted: { bg: 'bg-violet-100 text-violet-600', icon: UserPlus },
  message: { bg: 'bg-green-100 text-green-600', icon: MessageSquare },
  welcome: { bg: 'bg-sky-100 text-sky-600', icon: Sparkles },
  profile_reminder: { bg: 'bg-sky-100 text-sky-600', icon: Sparkles },
}
const DEFAULT_STYLE = { bg: 'bg-ms-surface text-ms-gray', icon: Bell }

function getAvatarUrl(avatar?: string | null) {
  if (!avatar) return null
  if (avatar.startsWith('http')) return avatar
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos/${avatar}`
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }
      const { data: u } = await supabase.from('users').select('id').eq('email', session.user.email).single()
      if (!u) { setLoading(false); return }
      setUserId(u.id)
      await load(u.id)
      setLoading(false)
      interval = setInterval(() => load(u.id), 60000)
    }
    init()
    return () => { if (interval) clearInterval(interval) }
  }, [])

  const showBrowserNotifications = (items: Notification[]) => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    let shown: string[] = []
    try { shown = JSON.parse(localStorage.getItem('mosalo_notified_ids') || '[]') } catch {}
    const shownSet = new Set(shown)
    const fresh = items
      .filter(n => !n.read && !shownSet.has(n.id))
      .filter(n => n.type !== 'job_match' || (Math.max(0, ...((n.data?.scores as number[]) || [0]))) >= 40)
      .slice(0, 3)
    fresh.forEach(n => {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => reg.showNotification(n.title, { body: n.body || '', icon: '/icons/icon-192x192.png', badge: '/icons/icon-192x192.png', tag: n.id }))
        } else {
          new Notification(n.title, { body: n.body || '', icon: '/icons/icon-192x192.png' })
        }
      } catch {}
      shownSet.add(n.id)
    })
    if (fresh.length > 0) localStorage.setItem('mosalo_notified_ids', JSON.stringify(Array.from(shownSet).slice(-200)))
  }

  const load = async (uid: string) => {
    try {
      const items = await social.getNotifications(uid)
      const sorted = items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setNotifications(sorted)
      showBrowserNotifications(sorted)
    } catch { setNotifications([]) }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = async (id: string) => {
    try { await social.markNotificationRead(id) } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await Promise.all(ids.map(id => social.markNotificationRead(id).catch(() => {})))
  }

  const handleAccept = async (n: Notification) => {
    const requestId = n.data?.request_id
    const requesterId = n.data?.requester_id || n.sender?.id
    if (!requestId || !requesterId || !userId) return

    try {
      await social.updateConnection(requestId, 'accepted')
      const { data: existing } = await supabase.from('conversations').select('id').or(`and(participant_1_id.eq.${requesterId},participant_2_id.eq.${userId}),and(participant_1_id.eq.${userId},participant_2_id.eq.${requesterId})`).maybeSingle()
      let convId = existing?.id
      if (!convId) {
        const { data: conv } = await supabase.from('conversations').insert({ participant_1_id: requesterId, participant_2_id: userId }).select('id').single()
        if (conv) convId = conv.id
      }
      await markRead(n.id)
      setOpen(false)
      if (convId) router.push(`/mensagens/?conv=${convId}`)
    } catch {}
  }

  const handleReject = async (n: Notification) => {
    const requestId = n.data?.request_id
    if (!requestId) return
    try { await social.updateConnection(requestId, 'rejected') } catch {}
    await markRead(n.id)
  }

  const handleOpen = async (n: Notification) => {
    await markRead(n.id)
    setOpen(false)
    if (n.type === 'network_accepted') {
      const otherId = n.data?.recipient_id || n.sender?.id
      if (!otherId) return
      const { data: existing } = await supabase.from('conversations').select('id').or(`and(participant_1_id.eq.${otherId},participant_2_id.eq.${userId}),and(participant_1_id.eq.${userId},participant_2_id.eq.${otherId})`).maybeSingle()
      if (existing) router.push(`/mensagens/?conv=${existing.id}`)
      else router.push('/pessoas/')
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

  const [tab, setTab] = useState<'todas' | 'pessoas' | 'vagas'>('todas')

  const PEOPLE_TYPES = ['network_request', 'network_accepted', 'message']
  const JOB_TYPES = ['job_match', 'vaga_expiring']
  const filtered = notifications.filter(n =>
    tab === 'todas' ? true : tab === 'pessoas' ? PEOPLE_TYPES.includes(n.type) : JOB_TYPES.includes(n.type)
  )
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const fresh = filtered.filter(n => !n.read || new Date(n.created_at) >= startOfToday)
  const older = filtered.filter(n => n.read && new Date(n.created_at) < startOfToday)

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    const sameDay = d >= startOfToday
    return sameDay
      ? d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
  }

  const renderItem = (n: Notification, i: number) => {
    const avatar = getAvatarUrl(n.sender?.avatar_url)
    const st = TYPE_STYLE[n.type] || DEFAULT_STYLE
    const Icon = st.icon
    return (
      <div
        key={n.id}
        role="button"
        tabIndex={0}
        onClick={() => { if (n.type !== 'network_request') handleOpen(n) }}
        onKeyDown={(e) => { if (e.key === 'Enter' && n.type !== 'network_request') handleOpen(n) }}
        className={`jobcard-enter relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-ms-surface/70 active:bg-ms-surface ${n.read ? '' : 'bg-ms-blue/[0.06]'}`}
        style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
      >
        {!n.read && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-ms-blue" />}
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
          ) : (
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${st.bg}`}><Icon size={19} /></div>
          )}
          {avatar && <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white ${st.bg}`}><Icon size={11} /></span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] leading-snug text-ms-dark ${n.read ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
          {n.body && <p className="text-xs text-ms-gray mt-0.5 line-clamp-2">{n.body}</p>}
          {n.type === 'network_request' && (
            <div className="flex items-center gap-2 mt-2">
              <button onClick={(e) => { e.stopPropagation(); handleAccept(n) }} className="inline-flex items-center gap-1 px-4 py-1.5 bg-ms-blue text-white text-xs font-bold rounded-full press"><Check size={12} /> Aceitar</button>
              <button onClick={(e) => { e.stopPropagation(); handleReject(n) }} className="px-4 py-1.5 text-xs font-bold text-ms-gray border border-ms-border rounded-full press">Ignorar</button>
            </div>
          )}
        </div>
        <span className={`text-[10px] whitespace-nowrap pt-0.5 ${n.read ? 'text-ms-gray' : 'text-ms-blue font-bold'}`}>{fmtDate(n.created_at)}</span>
      </div>
    )
  }

  if (loading || !userId) return null

  return (
    <>
      <button
        onClick={() => { setOpen(true); if (typeof Notification !== 'undefined' && Notification.permission === 'default') { try { Notification.requestPermission() } catch {} } }}
        className="relative flex-shrink-0 w-9 h-9 flex items-center justify-center text-ms-dark hover:text-ms-blue rounded-full hover:bg-ms-surface transition-colors press"
        aria-label={`Notificações${unreadCount ? ` (${unreadCount} novas)` : ''}`}
      >
        <Bell size={20} className={unreadCount > 0 ? 'ms-bell-ring' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-ms-red text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white anim-pop">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-start justify-center sm:justify-end sm:p-4 sm:pt-16">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] backdrop-in" onClick={() => setOpen(false)} />
          <div ref={modalRef} className="sheet-up sm:ms-menu-in relative w-full sm:max-w-[400px] max-h-[82vh] flex flex-col rounded-t-[28px] sm:rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/80 shadow-[0_24px_60px_-16px_rgba(33,33,33,0.35)] overflow-hidden">
            <span className="sm:hidden mx-auto mt-2 w-10 h-1 rounded-full bg-ms-border" />
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <h2 className="text-lg font-extrabold text-ms-dark tracking-tight">Notificações</h2>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="inline-flex items-center gap-1 text-[11px] font-bold text-ms-blue px-2.5 py-1.5 rounded-full hover:bg-ms-blue/10 press"><CheckCheck size={13} /> Marcar lidas</button>
                )}
                <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-ms-surface text-ms-gray hover:text-ms-dark press" aria-label="Fechar"><X size={16} /></button>
              </div>
            </div>
            <div className="mx-4 mb-2 grid grid-cols-3 p-1 rounded-full bg-ms-surface">
              {([['todas', 'Todas'], ['pessoas', 'Pessoas'], ['vagas', 'Vagas']] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`text-xs font-bold py-1.5 rounded-full transition-all ${tab === k ? 'bg-white text-ms-dark shadow-sm' : 'text-ms-gray'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <span className="mx-auto w-14 h-14 rounded-full bg-ms-surface flex items-center justify-center text-ms-gray mb-3"><Bell size={24} /></span>
                  <p className="text-sm font-bold text-ms-dark">Sem notificações</p>
                  <p className="text-xs text-ms-gray mt-1">Vagas com match, mensagens e ligações aparecem aqui.</p>
                </div>
              ) : (
                <>
                  {fresh.length > 0 && (
                    <div>
                      <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ms-gray">Novas</p>
                      <div className="divide-y divide-ms-border/50">{fresh.map(renderItem)}</div>
                    </div>
                  )}
                  {older.length > 0 && (
                    <div>
                      <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-ms-gray">Anteriores</p>
                      <div className="divide-y divide-ms-border/50">{older.map(renderItem)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); router.push('/notificacoes/') }}
              className="w-full text-center text-xs font-bold text-ms-blue py-3.5 border-t border-ms-border/70 press"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
            >
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </>
  )
}
