'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, UserPlus, Check, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { social, type Notification } from '@/lib/social'

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
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }
      const { data: u } = await supabase.from('users').select('id').eq('email', session.user.email).single()
      if (!u) { setLoading(false); return }
      setUserId(u.id)
      await load(u.id)
      setLoading(false)
    }
    init()
  }, [])

  const load = async (uid: string) => {
    try {
      const items = await social.getNotifications(uid)
      setNotifications(items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch { setNotifications([]) }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = async (id: string) => {
    try { await social.markNotificationRead(id) } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleAccept = async (n: Notification) => {
    const requestId = n.data?.request_id
    const requesterId = n.data?.requester_id || n.sender?.id
    if (!requestId || !requesterId || !userId) return

    try {
      await social.updateRequest(requestId, 'accepted')
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
    try { await social.updateRequest(requestId, 'rejected') } catch {}
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
    } else if (n.type === 'job_match' && n.data?.job_ids?.length) {
      router.push(`/vagas/externa/?id=${encodeURIComponent(n.data.job_ids[0])}`)
    } else {
      router.push('/pessoas/?tab=network')
    }
  }

  if (loading || !userId) return null

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative p-2 text-ms-dark hover:text-ms-blue rounded-full bg-ms-surface transition-colors">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div ref={modalRef} className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-ms-border">
              <h2 className="text-base font-bold text-ms-dark">Notificações</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-ms-gray hover:text-ms-dark"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-ms-gray text-sm">Nenhuma notificação</div>
              ) : (
                notifications.map(n => {
                  const avatar = getAvatarUrl(n.sender?.avatar_url)
                  return (
                    <div key={n.id} className={`flex gap-3 p-3 rounded-2xl border ${n.read ? 'bg-white border-ms-border/60' : 'bg-blue-50 border-blue-100'}`}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ms-blue to-ms-purple flex items-center justify-center flex-shrink-0 overflow-hidden text-white">
                        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <UserPlus size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ms-dark">{n.title}</p>
                        <p className="text-xs text-ms-gray mt-0.5">{n.body}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {n.type === 'network_request' && (
                            <>
                              <button onClick={() => handleAccept(n)} className="flex items-center gap-1 px-3 py-1.5 bg-ms-blue text-white text-xs font-medium rounded-lg hover:bg-blue-700"><Check size={12} /> Aceitar</button>
                              <button onClick={() => handleReject(n)} className="px-3 py-1.5 text-xs font-medium text-ms-gray hover:text-red-500">Rejeitar</button>
                            </>
                          )}
                          {n.type !== 'network_request' && (
                            <button onClick={() => handleOpen(n)} className="flex items-center gap-1 px-3 py-1.5 bg-ms-surface text-ms-dark text-xs font-medium rounded-lg hover:bg-ms-purple-light hover:text-ms-purple"><MessageSquare size={12} /> Ver</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
