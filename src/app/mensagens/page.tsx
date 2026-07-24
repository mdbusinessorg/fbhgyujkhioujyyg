'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { social, MessageRequest as ApiMessageRequest } from '@/lib/social'
import { ArrowLeft, Send, MessageSquare, User, Search, Check, X, Users, ImagePlus, UserPlus } from 'lucide-react'
import NotificationsBell from '@/components/NotificationsBell'

interface Conversation {
  id: string
  participant_1_id: string
  participant_2_id: string
  last_message_at: string
  otherUser?: { id: string; nome: string; email: string; avatar_url?: string | null }
  lastMessage?: string
}

interface MessageRequest {
  id: string
  requester_id: string
  recipient_id: string
  status: string
  created_at: string
  requester?: { id: string; nome: string; email: string; avatar_url?: string | null }
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export default function MensagensPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1A56FF] border-t-transparent rounded-full animate-spin" /></div>}>
      <MensagensContent />
    </Suspense>
  )
}

const isImageMessage = (content: string) => /^\[imagem:https?:\/\/.+\]$/.test(content)
const extractImageUrl = (content: string) => content.slice(8, -1)

function MensagensContent() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [requests, setRequests] = useState<MessageRequest[]>([])
  const [activeView, setActiveView] = useState<'conversas' | 'pedidos'>('conversas')
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchConv, setSearchConv] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login/'); return }

      const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single()
      if (!user) return
      setCurrentUserId(user.id)

      await Promise.all([loadConversations(user.id), loadRequests(user.id)])

      const convParam = searchParams.get('conv')
      if (convParam) { setActiveConv(convParam); setActiveView('conversas') }

      setLoading(false)
    }
    init()
  }, [router, searchParams])

  const loadConversations = async (userId: string) => {
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (!convs || convs.length === 0) { setConversations([]); return }

    const otherIds = convs.map(c => c.participant_1_id === userId ? c.participant_2_id : c.participant_1_id)
    const { data: users } = await supabase.from('users').select('id, nome, email, avatar_url').in('id', otherIds)
    const usersMap: Record<string, any> = {}
    ;(users || []).forEach(u => { usersMap[u.id] = u })

    const convIds = convs.map(c => c.id)
    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('conversation_id, content')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })

    const lastMsgMap: Record<string, string> = {}
    ;(lastMsgs || []).forEach(m => {
      if (!lastMsgMap[m.conversation_id]) {
        lastMsgMap[m.conversation_id] = isImageMessage(m.content) ? '📷 Imagem' : m.content
      }
    })

    const enriched: Conversation[] = convs.map(c => {
      const otherId = c.participant_1_id === userId ? c.participant_2_id : c.participant_1_id
      return {
        ...c,
        otherUser: usersMap[otherId] || { id: otherId, nome: 'Utilizador', email: '' },
        lastMessage: lastMsgMap[c.id] || '',
      }
    })

    setConversations(enriched)
  }

  const loadRequests = async (userId: string) => {
    try {
      const reqs: ApiMessageRequest[] = await social.getRequestsByRecipient(userId)
      const requesterIds = reqs.map(r => r.requester_id)
      const { data: users } = await supabase.from('users').select('id, nome, email, avatar_url').in('id', requesterIds)
      const usersMap: Record<string, any> = {}
      ;(users || []).forEach(u => { usersMap[u.id] = u })

      const enriched: MessageRequest[] = reqs.map(r => ({
        ...r,
        requester: usersMap[r.requester_id] || (r.requester ? { ...r.requester, email: '' } : { id: r.requester_id, nome: 'Utilizador', email: '' }),
      }))

      setRequests(enriched)
    } catch {
      setRequests([])
    }
  }

  const acceptRequest = async (req: MessageRequest) => {
    // Verificar se já existe conversa
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1_id.eq.${req.requester_id},participant_2_id.eq.${currentUserId}),and(participant_1_id.eq.${currentUserId},participant_2_id.eq.${req.requester_id})`)
      .maybeSingle()

    let convId = existing?.id
    if (!convId) {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({ participant_1_id: req.requester_id, participant_2_id: currentUserId })
        .select('id')
        .single()
      if (conv) convId = conv.id
    }

    if (convId) {
      try { await social.updateRequest(req.id, 'accepted') } catch {}
      setRequests(prev => prev.filter(r => r.id !== req.id))
      await loadConversations(currentUserId)
      setActiveConv(convId)
      setActiveView('conversas')
    }
  }

  const rejectRequest = async (reqId: string) => {
    try { await social.updateRequest(reqId, 'rejected') } catch {}
    setRequests(prev => prev.filter(r => r.id !== reqId))
  }

  useEffect(() => {
    if (!activeConv || !currentUserId) return

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConv)
        .order('created_at', { ascending: true })
      setMessages(data || [])

      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', activeConv)
        .neq('sender_id', currentUserId)
        .is('read_at', null)
    }
    loadMessages()

    const channel = supabase
      .channel(`messages-${activeConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => [...prev, newMsg])
        if (newMsg.sender_id !== currentUserId) {
          supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', newMsg.id)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeConv, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content?: string) => {
    const text = (content ?? newMessage).trim()
    if (!text || !activeConv || !currentUserId) return
    setNewMessage('')

    await supabase.from('messages').insert({
      conversation_id: activeConv,
      sender_id: currentUserId,
      content: text,
    })

    await supabase.from('conversations').update({
      last_message_at: new Date().toISOString(),
    }).eq('id', activeConv)
  }

  const sendImage = async (file: File) => {
    if (!activeConv || !currentUserId) return
    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `chat-images/${currentUserId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('documentos').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path)
      await sendMessage(`[imagem:${publicUrl}]`)
    } catch (err: any) {
      alert('Erro ao enviar imagem: ' + (err.message || 'tenta de novo'))
    }
    setUploadingImage(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) sendImage(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const activeConvData = conversations.find(c => c.id === activeConv)

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return formatTime(date)
    if (diff < 172800000) return 'Ontem'
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' })
  }

  const filteredConvs = conversations.filter(c =>
    !searchConv || c.otherUser?.nome?.toLowerCase().includes(searchConv.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1A56FF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <div className={`${activeConv ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 lg:border-r border-gray-100 h-screen`}>
        <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-1"><ArrowLeft size={20} className="text-gray-700" /></Link>
              <h1 className="font-semibold text-gray-900">Mensagens</h1>
            </div>
            <NotificationsBell />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-3">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchConv}
              onChange={(e) => setSearchConv(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm">
            <button
              onClick={() => setActiveView('conversas')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeView === 'conversas' ? 'bg-[#1A56FF] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <MessageSquare size={16} /> Conversas
            </button>
            <button
              onClick={() => setActiveView('pedidos')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeView === 'pedidos' ? 'bg-[#1A56FF] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <UserPlus size={16} /> Pedidos {requests.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {activeView === 'conversas' ? (
            filteredConvs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Sem conversas</p>
                <p className="text-xs text-gray-400 mt-1">Vai a Pessoas para iniciar uma conversa</p>
                <Link href="/pessoas/" className="inline-block mt-3 text-xs text-[#1A56FF] font-medium">Encontrar Pessoas</Link>
              </div>
            ) : (
              filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${activeConv === conv.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {conv.otherUser?.avatar_url ? <img src={conv.otherUser.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={18} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{conv.otherUser?.nome || 'Utilizador'}</p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(conv.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'Nova conversa'}</p>
                  </div>
                </button>
              ))
            )
          ) : (
            requests.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Sem pedidos pendentes</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {req.requester?.avatar_url ? <img src={req.requester.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={18} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{req.requester?.nome || 'Utilizador'}</p>
                    <p className="text-xs text-gray-500">Quer fazer parte do teu network</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => acceptRequest(req)} className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white text-xs font-semibold rounded-xl hover:bg-green-600 shadow-sm">
                      <Check size={14} /> Aceitar
                    </button>
                    <button onClick={() => rejectRequest(req.id)} className="flex items-center gap-1 px-3 py-2 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-50">
                      <X size={14} /> Rejeitar
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {activeConv ? (
        <div className="flex-1 flex flex-col h-screen">
          <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10 flex items-center gap-3">
            <button onClick={() => setActiveConv(null)} className="lg:hidden p-1">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {activeConvData?.otherUser?.avatar_url ? <img src={activeConvData.otherUser.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-gray-400" />}
            </div>
            <p className="font-medium text-sm text-gray-900">{activeConvData?.otherUser?.nome || 'Utilizador'}</p>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xs text-gray-400">Início da conversa</p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.sender_id === currentUserId
              const isImage = isImageMessage(msg.content)
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 overflow-hidden ${isMe ? 'bg-[#1A56FF] text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'}`}>
                    {isImage ? (
                      <img src={extractImageUrl(msg.content)} alt="Imagem" className="max-w-full rounded-xl cursor-pointer" onClick={() => window.open(extractImageUrl(msg.content), '_blank')} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-[#1A56FF] transition-colors flex-shrink-0"
              >
                {uploadingImage ? <div className="w-4 h-4 border-2 border-[#1A56FF] border-t-transparent rounded-full animate-spin" /> : <ImagePlus size={18} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escreve uma mensagem..."
                className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1A56FF]/20"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!newMessage.trim()}
                className="w-10 h-10 bg-[#1A56FF] rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:bg-[#1445DD] transition-colors flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Selecciona uma conversa ou pedido</p>
          </div>
        </div>
      )}
    </div>
  )
}
