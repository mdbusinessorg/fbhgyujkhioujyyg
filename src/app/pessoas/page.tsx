'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'
import { startOrRequestConversation } from '@/lib/messaging'
import { social, type MessageRequest, type Post, type PostAuthor } from '@/lib/social'
import Logo from '@/components/Logo'
import NotificationsBell from '@/components/NotificationsBell'
import ShareMenu from '@/components/ShareMenu'
import ProfileAvatar from '@/components/ProfileAvatar'
import {
  Search, MessageSquare, Users, User, MapPin, Home, FileText,
  UserPlus, UserCheck, Link2, Send, Trash2, MoreHorizontal, Heart,
  MessageCircle, Plus, Bell, Check, X, ImagePlus
} from 'lucide-react'
import { AreaIcon } from '@/lib/area-icons'

interface PersonResult {
  id: string
  nome: string
  email: string
  role: string
  telefone?: string
  avatar_url?: string | null
  created_at?: string
  profile?: {
    area?: string
    localizacao?: string
    competencias?: string
    bio?: string
    nivel_academico?: string
    experiencias?: string
  }
}

interface Conversation {
  id: string
  participant_1_id: string
  participant_2_id: string
  last_message_at: string
  otherUser?: { id: string; nome: string; email: string; avatar_url?: string | null; role?: string }
  lastMessage?: string
}

const FILTROS = ['Todos', 'Talentos', 'Recrutadores']

const getTimeAgo = (date?: string) => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}m`
}



function parseCompetencias(comp: any): string[] {
  if (!comp) return []
  if (Array.isArray(comp)) return comp.map(c => String(c).trim()).filter(Boolean)
  if (typeof comp === 'string') {
    const trimmed = comp.trim()
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.map(c => String(c).trim()).filter(Boolean)
      } catch {}
    }
    return trimmed.split(',').map(c => c.trim()).filter(Boolean)
  }
  return []
}

export default function PessoasPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'descobrir' | 'network' | 'mensagens' | 'feed'>('feed')
  const [currentUser, setCurrentUser] = useState<{ id: string; nome: string; role: string; avatar_url?: string | null } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [people, setPeople] = useState<PersonResult[]>([])
  const [filtered, setFiltered] = useState<PersonResult[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState('Todos')
  const [areaFilter, setAreaFilter] = useState<string | null>(null)

  const [requests, setRequests] = useState<MessageRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(false)

  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [postedToday, setPostedToday] = useState(false)
  const [postImage, setPostImage] = useState<File | null>(null)
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null)
  const postFileInputRef = useRef<HTMLInputElement>(null)
  const [likersModal, setLikersModal] = useState<{ open: boolean; postId: string | null; likers: { id: string; nome: string }[] }>({ open: false, postId: null, likers: [] })

  const loadPeople = useCallback(async (search: string, currentUserId?: string) => {
    setLoadingPeople(true)
    let usersQuery = supabase.from('users').select('id, nome, email, role, telefone, avatar_url, created_at')
    if (search.trim()) {
      usersQuery = usersQuery.or(`nome.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
    }
    const { data: users } = await usersQuery.order('created_at', { ascending: false }).limit(60)
    if (!users) { setLoadingPeople(false); return }

    const userIds = users.map(u => u.id)
    const { data: profiles } = await supabase.from('profiles').select('user_id, area, localizacao, competencias, bio, nivel_academico, experiencias').in('user_id', userIds)
    const profilesMap: Record<string, any> = {}
    ;(profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p })

    const enriched: PersonResult[] = users.filter(u => u.id !== currentUserId).filter(u => u.role !== 'admin').map(u => ({ ...u, profile: profilesMap[u.id] }))
    setPeople(enriched)
    setLoadingPeople(false)
  }, [])

  const loadRequests = useCallback(async (userId?: string) => {
    if (!userId) return
    setLoadingRequests(true)
    try {
      const reqs = await social.getUserRequests(userId)
      setRequests(reqs)
    } catch {
      setRequests([])
    }
    setLoadingRequests(false)
  }, [])

  const loadConversations = useCallback(async (userId?: string) => {
    if (!userId) { setConversations([]); return }
    setLoadingConvs(true)
    const { data: convs } = await supabase.from('conversations').select('*').or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`).order('last_message_at', { ascending: false })
    if (!convs || convs.length === 0) { setConversations([]); setLoadingConvs(false); return }

    const otherIds = convs.map(c => c.participant_1_id === userId ? c.participant_2_id : c.participant_1_id)
    const { data: users } = await supabase.from('users').select('id, nome, email, avatar_url, role').in('id', otherIds)
    const usersMap: Record<string, any> = {}
    ;(users || []).forEach(u => { usersMap[u.id] = u })

    const convIds = convs.map(c => c.id)
    const { data: lastMsgs } = await supabase.from('messages').select('conversation_id, content').in('conversation_id', convIds).order('created_at', { ascending: false })
    const lastMsgMap: Record<string, string> = {}
    ;(lastMsgs || []).forEach(m => { if (!lastMsgMap[m.conversation_id]) lastMsgMap[m.conversation_id] = m.content })

    const enriched: Conversation[] = convs.map(c => {
      const otherId = c.participant_1_id === userId ? c.participant_2_id : c.participant_1_id
      return { ...c, otherUser: usersMap[otherId] || { id: otherId, nome: 'Utilizador', email: '' }, lastMessage: lastMsgMap[c.id] || '' }
    })
    setConversations(enriched)
    setLoadingConvs(false)
  }, [])

  const loadPosts = useCallback(async (currentUserId?: string) => {
    setLoadingPosts(true)
    try {
      const postsData = await social.getPosts()
      const likesByPost: Record<string, string[]> = {}
      await Promise.all(postsData.map(async p => {
        try { const { likes } = await social.getLikes(p.id); likesByPost[p.id] = likes } catch { likesByPost[p.id] = [] }
      }))
      const today = new Date(); today.setHours(0,0,0,0)
      let hasPostedToday = false
      const enriched: Post[] = postsData.map(p => {
        const author = p.author || { id: p.user_id, nome: 'Utilizador', role: 'candidato' }
        const likesUsers = likesByPost[p.id] || []
        if (currentUserId && p.user_id === currentUserId && new Date(p.created_at) >= today) hasPostedToday = true
        return { ...p, author, likes_count: likesUsers.length, liked_by_me: currentUserId ? likesUsers.includes(currentUserId) : false }
      })
      setPosts(enriched)
      if (currentUserId) setPostedToday(hasPostedToday)
    } catch { setPosts([]) }
    setLoadingPosts(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login/'); return }
      setIsLoggedIn(true)
      const { data: u } = await supabase.from('users').select('id, nome, role, avatar_url, created_at').eq('email', session.user.email).single()
      if (u) {
        setCurrentUser(u)
        loadPeople('', u.id)
        loadRequests(u.id)
        loadConversations(u.id)
        loadPosts(u.id)
      } else {
        loadPeople('')
        loadPosts()
      }
    }
    init()
  }, [router, loadPeople, loadRequests, loadConversations, loadPosts])

  useEffect(() => {
    let list = people
    if (filtro === 'Talentos') list = list.filter(p => p.role === 'candidato')
    if (filtro === 'Recrutadores') list = list.filter(p => p.role === 'recrutador')
    if (areaFilter) list = list.filter(p => p.profile?.area === areaFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p => (p.nome || '').toLowerCase().includes(q) || (p.profile?.area || '').toLowerCase().includes(q) || (p.profile?.localizacao || '').toLowerCase().includes(q))
    }
    setFiltered(list)
  }, [people, filtro, areaFilter, query])

  const categorias = Array.from(new Set(people.filter(p => p.role === 'candidato' && p.profile?.area).map(p => p.profile!.area as string))).sort()

  const relationshipWith = (personId?: string) => {
    if (!currentUser || !personId) return 'none'
    const r = requests.find(r =>
      (r.requester_id === currentUser.id && r.recipient_id === personId) ||
      (r.requester_id === personId && r.recipient_id === currentUser.id)
    )
    if (!r) return 'none'
    if (r.status === 'accepted') return 'connected'
    if (r.status === 'rejected') return 'rejected'
    return r.requester_id === currentUser.id ? 'sent' : 'received'
  }

  const handleConnect = async (personId: string) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    await startOrRequestConversation(currentUser.id, personId, router)
    loadRequests(currentUser.id)
  }

  const handleMessage = async (personId: string) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    const { data: existing } = await supabase.from('conversations').select('id').or(`and(participant_1_id.eq.${currentUser.id},participant_2_id.eq.${personId}),and(participant_1_id.eq.${personId},participant_2_id.eq.${currentUser.id})`).maybeSingle()
    if (existing) router.push(`/mensagens/?conv=${existing.id}`)
    else await startOrRequestConversation(currentUser.id, personId, router)
  }

  const acceptRequest = async (req: MessageRequest) => {
    if (!currentUser) return
    const { data: existing } = await supabase.from('conversations').select('id').or(`and(participant_1_id.eq.${req.requester_id},participant_2_id.eq.${currentUser.id}),and(participant_1_id.eq.${currentUser.id},participant_2_id.eq.${req.requester_id})`).maybeSingle()
    let convId = existing?.id
    if (!convId) {
      const { data: conv } = await supabase.from('conversations').insert({ participant_1_id: req.requester_id, participant_2_id: currentUser.id }).select('id').single()
      if (conv) convId = conv.id
    }
    if (convId) {
      try { await social.updateRequest(req.id, 'accepted') } catch {}
      loadRequests(currentUser.id)
      loadConversations(currentUser.id)
      router.push(`/mensagens/?conv=${convId}`)
    }
  }

  const rejectRequest = async (reqId: string) => {
    try { await social.updateRequest(reqId, 'rejected') } catch {}
    if (currentUser) loadRequests(currentUser.id)
  }

  const recordView = async (viewedId: string) => {
    if (!currentUser || currentUser.id === viewedId) return
    try { await supabase.from('profile_views').insert({ viewer_id: currentUser.id, viewed_id: viewedId }) } catch {}
  }

  const toggleLike = async (post: Post) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    const newLiked = !post.liked_by_me
    try {
      const { likes } = newLiked ? await social.likePost(post.id, currentUser.id) : await social.unlikePost(post.id, currentUser.id)
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked_by_me: likes.includes(currentUser.id), likes_count: likes.length } : p))
    } catch {}
  }

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Só podes carregar imagens.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Imagem demasiado grande. Máx. 5 MB.'); return }
    setPostImage(file)
    setPostImagePreview(URL.createObjectURL(file))
    if (postFileInputRef.current) postFileInputRef.current.value = ''
  }

  const handlePublish = async () => {
    if (!currentUser || (!postContent.trim() && !postImage)) return
    if (postedToday) { alert('Só podes publicar uma vez por dia.'); return }
    setPosting(true)
    try {
      let media_url: string | undefined
      if (postImage) {
        const ext = postImage.name.split('.').pop() || 'jpg'
        const path = `post-images/${currentUser.id}/${Date.now()}.${ext}`
        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, postImage, { upsert: true })
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
        media_url = publicUrl
      }
      await social.createPost({ user_id: currentUser.id, content: postContent.trim() || (media_url ? '' : '...'), media_url, author: { id: currentUser.id, nome: currentUser.nome, avatar_url: currentUser.avatar_url, role: currentUser.role } })
      setPostContent('')
      setPostImage(null)
      setPostImagePreview(null)
      setPostedToday(true)
      loadPosts(currentUser.id)
    } catch (err: any) { alert('Erro ao publicar: ' + (err.message || 'tenta de novo')) }
    setPosting(false)
  }

  const deletePost = async (postId: string) => {
    if (!currentUser) return
    if (!confirm('Apagar publicação?')) return
    try { await social.deletePost(postId, currentUser.id); setPosts(prev => prev.filter(p => p.id !== postId)) } catch {}
  }

  const openLikers = async (postId: string) => {
    try {
      const { likes } = await social.getLikes(postId)
      const { data: users } = await supabase.from('users').select('id, nome').in('id', likes)
      const usersMap: Record<string, string> = {}
      ;(users || []).forEach((u: any) => { usersMap[u.id] = u.nome })
      setLikersModal({ open: true, postId, likers: likes.map(id => ({ id, nome: usersMap[id] || 'Utilizador' })) })
    } catch { setLikersModal({ open: true, postId: '', likers: [] }) }
  }

  const bottomNav = [
    { key: 'home', label: 'Início', href: '/', icon: Home },
    { key: 'vagas', label: 'Vagas', href: '/vagas/', icon: Search },
    { key: 'candidaturas', label: 'Candidaturas', href: isLoggedIn && currentUser ? `/dashboard/${currentUser.role}/?tab=candidaturas` : '/auth/login/', icon: FileText },
    { key: 'pessoas', label: 'Pessoas', href: '/pessoas/', icon: Users },
    { key: 'perfil', label: 'Perfil', href: isLoggedIn && currentUser ? `/dashboard/${currentUser.role}/?tab=perfil` : '/auth/login/', icon: User },
  ]

  const StoryAvatar = ({ url, name, isMe = false }: { url?: string | null; name?: string; isMe?: boolean }) => (
    <div className="relative w-16 h-16 rounded-full p-[3px] overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A56FF 0%, #6C47FF 100%)' }}>
      <ProfileAvatar url={url} name={name} size={58} className="rounded-full border-2 border-white" />
      {isMe && (
        <div className="absolute bottom-0 right-0 w-5 h-5 bg-ms-blue text-white rounded-full flex items-center justify-center border-2 border-white">
          <Plus size={12} />
        </div>
      )}
    </div>
  )

  const renderStories = () => {
    const highlights = people.slice(0, 12)
    return (
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 mb-5 -mx-4 px-4 pt-1">
        <Link href={currentUser ? `/dashboard/${currentUser.role}/?tab=perfil` : '/auth/login/'} className="flex-shrink-0 flex flex-col items-center gap-2">
          <StoryAvatar url={currentUser?.avatar_url} name={currentUser?.nome} isMe />
          <span className="text-[10px] font-medium text-ms-dark max-w-[60px] truncate">Eu</span>
        </Link>
        {highlights.map(person => (
          <button key={person.id} onClick={() => { recordView(person.id); router.push(`/pessoas/perfil/?id=${person.id}`) }} className="flex-shrink-0 flex flex-col items-center gap-2">
            <StoryAvatar url={person.avatar_url} name={person.nome} />
            <span className="text-[10px] font-medium text-ms-dark text-center leading-tight max-w-[60px] truncate">{(person.nome || '').split(' ')[0]}</span>
          </button>
        ))}
      </div>
    )
  }

  const renderDiscover = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-3 border border-ms-border/60 shadow-sm flex items-center gap-2">
        <Search size={18} className="text-ms-gray ml-1" />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar por nome, área ou cidade..." className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTROS.map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${filtro === f ? 'bg-blue-50 text-ms-blue ring-1 ring-ms-blue/20' : 'bg-white text-ms-dark border border-ms-border/80 hover:bg-ms-surface'}`}>{f}</button>
        ))}
      </div>

      {categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setAreaFilter(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${areaFilter === null ? 'bg-purple-50 text-ms-purple ring-1 ring-ms-purple/20' : 'bg-white text-ms-dark border border-ms-border/80 hover:bg-ms-surface'}`}>Todas as áreas</button>
          {categorias.slice(0, 8).map(a => (
            <button key={a} onClick={() => setAreaFilter(areaFilter === a ? null : a)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${areaFilter === a ? 'bg-purple-50 text-ms-purple ring-1 ring-ms-purple/20' : 'bg-white text-ms-dark border border-ms-border/80 hover:bg-ms-surface'}`}>{a}</button>
          ))}
        </div>
      )}

      {loadingPeople ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-ms-border">
          <Users size={40} className="text-ms-gray mx-auto mb-3" />
          <p className="text-sm text-ms-gray">Nenhuma pessoa encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(person => {
            const comps = parseCompetencias(person.profile?.competencias)
            const rel = relationshipWith(person.id)
            const isMe = currentUser?.id === person.id
            return (
              <div key={person.id} className="bg-white rounded-2xl p-4 border border-ms-border/80 shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
                <button onClick={() => { recordView(person.id); router.push(`/pessoas/perfil/?id=${person.id}`) }}>
                  <ProfileAvatar url={person.avatar_url} name={person.nome} size={52} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-ms-dark truncate" onClick={() => { recordView(person.id); router.push(`/pessoas/perfil/?id=${person.id}`) }}>{person.nome || 'Utilizador'}</h3>
                      <p className="text-[10px] text-ms-gray">{getTimeAgo(person.created_at)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${person.role === 'recrutador' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {person.role === 'recrutador' ? 'Recrutador' : 'Talento'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-ms-gray">
                    {person.profile?.area && <span className="flex items-center gap-1"><AreaIcon area={person.profile.area} size={12} className="text-ms-blue" /> {person.profile.area}</span>}
                    {person.profile?.localizacao && <span className="flex items-center gap-1"><MapPin size={11} /> {person.profile.localizacao}</span>}
                  </div>
                  {person.profile?.bio && <p className="text-xs text-ms-dark mt-1.5 line-clamp-2">{person.profile.bio}</p>}
                  {comps.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {comps.slice(0, 4).map((c, i) => <span key={i} className="text-[10px] px-2 py-0.5 bg-ms-surface text-ms-dark rounded-full font-medium">{c}</span>)}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {!isMe && (
                      <button onClick={() => { recordView(person.id); router.push(`/pessoas/perfil/?id=${person.id}`) }} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-ms-border text-ms-dark text-xs font-medium rounded-xl hover:bg-ms-surface transition-colors">
                        <User size={14} /> Ver perfil
                      </button>
                    )}
                    {!isMe && rel === 'none' && (
                      <button onClick={() => handleConnect(person.id)} className="flex items-center justify-center gap-1.5 bg-ms-blue text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                        <UserPlus size={14} /> Conectar
                      </button>
                    )}
                    {!isMe && rel === 'sent' && (
                      <span className="text-center text-xs py-2 px-3 bg-ms-surface text-ms-gray rounded-xl font-medium">Pedido enviado</span>
                    )}
                    {!isMe && rel === 'received' && (
                      <>
                        <button onClick={() => { const req = requests.find(r => r.requester_id === person.id && r.recipient_id === currentUser?.id); if (req) acceptRequest(req) }} className="flex items-center justify-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-2 rounded-xl hover:bg-green-100 transition-colors"><Check size={14} /> Aceitar</button>
                        <button onClick={() => { const req = requests.find(r => r.requester_id === person.id && r.recipient_id === currentUser?.id); if (req) rejectRequest(req.id) }} className="flex items-center justify-center gap-1.5 bg-red-50 text-red-700 text-xs font-medium px-3 py-2 rounded-xl hover:bg-red-100 transition-colors"><X size={14} /> Rejeitar</button>
                      </>
                    )}
                    {!isMe && rel === 'connected' && (
                      <button onClick={() => handleMessage(person.id)} className="flex items-center justify-center gap-1.5 bg-ms-surface text-ms-dark border border-ms-border text-xs font-medium px-4 py-2 rounded-xl hover:bg-ms-purple-light hover:text-ms-purple transition-colors">
                        <MessageSquare size={14} /> Mensagem
                      </button>
                    )}
                    <ShareMenu url={`${typeof window !== 'undefined' ? window.location.origin : ''}/pessoas/perfil/?id=${person.id}`} text={`Perfil de ${person.nome} no MÔ SALO`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderNetwork = () => {
    const connected = requests.filter(r => r.status === 'accepted' && (r.requester_id === currentUser?.id || r.recipient_id === currentUser?.id))
    const received = requests.filter(r => r.status === 'pending' && r.recipient_id === currentUser?.id)
    const sent = requests.filter(r => r.status === 'pending' && r.requester_id === currentUser?.id)

    const renderUserItem = (userId: string, actions: React.ReactNode) => {
      const p = people.find(x => x.id === userId)
      if (!p) return null
      return (
        <div key={userId} className="bg-white rounded-2xl p-3 border border-ms-border shadow-sm flex items-center gap-3">
          <button onClick={() => router.push(`/pessoas/perfil/?id=${userId}`)}><ProfileAvatar url={p.avatar_url} name={p.nome} size={44} /></button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-ms-dark truncate">{p.nome}</h3>
            <p className="text-[10px] text-ms-gray">{p.role === 'recrutador' ? 'Recrutador' : 'Talento'}{p.profile?.area ? ` • ${p.profile.area}` : ''}</p>
          </div>
          <div className="flex items-center gap-1">{actions}</div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 border border-ms-border text-center"><p className="text-lg font-bold text-ms-dark">{connected.length}</p><p className="text-[10px] text-ms-gray">Conexões</p></div>
          <div className="bg-white rounded-2xl p-3 border border-ms-border text-center"><p className="text-lg font-bold text-ms-dark">{received.length}</p><p className="text-[10px] text-ms-gray">Pendentes</p></div>
          <div className="bg-white rounded-2xl p-3 border border-ms-border text-center"><p className="text-lg font-bold text-ms-dark">{sent.length}</p><p className="text-[10px] text-ms-gray">Enviados</p></div>
        </div>

        {received.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-ms-dark mb-2 flex items-center gap-1"><Bell size={14} className="text-ms-blue" /> Pedidos recebidos</h2>
            <div className="space-y-2">
              {received.map(req => (
                <div key={req.id} className="bg-white rounded-2xl p-3 border border-ms-border shadow-sm flex items-center gap-3">
                  <button onClick={() => router.push(`/pessoas/perfil/?id=${req.requester_id}`)}>
                    <ProfileAvatar url={req.requester?.avatar_url} name={req.requester?.nome} size={44} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-ms-dark truncate">{req.requester?.nome || 'Utilizador'}</h3>
                    <p className="text-[10px] text-ms-gray">Quer conectar contigo</p>
                  </div>
                  <button onClick={() => acceptRequest(req)} className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white text-xs font-semibold rounded-xl hover:bg-green-600 shadow-sm"><Check size={14} /> Aceitar</button>
                  <button onClick={() => rejectRequest(req.id)} className="flex items-center gap-1 px-3 py-2 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-50"><X size={14} /> Rejeitar</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-ms-dark mb-2 flex items-center gap-1"><Link2 size={14} className="text-ms-purple" /> Conexões</h2>
          {connected.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-ms-border text-center">
              <Users size={40} className="text-ms-gray mx-auto mb-3" />
              <p className="text-sm text-ms-gray">Ainda não tens conexões.</p>
              <p className="text-xs text-ms-gray mt-1">Vai a Descobrir para convidar pessoas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connected.map(req => {
                const otherId = req.requester_id === currentUser?.id ? req.recipient_id : req.requester_id
                const p = people.find(x => x.id === otherId)
                return renderUserItem(otherId, (
                  <>
                    <button onClick={() => handleMessage(otherId)} className="p-2 bg-ms-surface text-ms-blue rounded-xl hover:bg-ms-purple-light"><MessageSquare size={18} /></button>
                    <button onClick={() => router.push(`/pessoas/perfil/?id=${otherId}`)} className="p-2 bg-ms-surface text-ms-dark rounded-xl hover:bg-ms-purple-light"><User size={18} /></button>
                  </>
                ))
              })}
            </div>
          )}
        </section>

        {sent.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-ms-dark mb-2 flex items-center gap-1"><Send size={14} className="text-ms-gray" /> Enviados</h2>
            <div className="space-y-2">
              {sent.map(req => {
                const p = people.find(x => x.id === req.recipient_id)
                if (!p) return null
                return (
                  <div key={req.id} className="bg-white rounded-2xl p-3 border border-ms-border shadow-sm flex items-center gap-3 opacity-70">
                    <ProfileAvatar url={p.avatar_url} name={p.nome} size={44} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-ms-dark truncate">{p.nome}</h3>
                      <p className="text-[10px] text-ms-gray">Aguarda aceitação</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-amber-50 text-amber-600 rounded-lg font-medium">Pendente</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    )
  }

  const renderMessages = () => (
    <div className="space-y-2">
      {loadingConvs ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : conversations.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-ms-border text-center">
          <MessageSquare size={40} className="text-ms-gray mx-auto mb-3" />
          <p className="text-sm text-ms-gray">Sem mensagens</p>
          <p className="text-xs text-ms-gray mt-1">Conecta com pessoas para começar a conversar.</p>
        </div>
      ) : (
        conversations.map(conv => (
          <Link key={conv.id} href={`/mensagens/?conv=${conv.id}`} className="block bg-white rounded-2xl p-3 border border-ms-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <ProfileAvatar url={conv.otherUser?.avatar_url} name={conv.otherUser?.nome} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ms-dark truncate">{conv.otherUser?.nome || 'Utilizador'}</h3>
                  <span className="text-[10px] text-ms-gray flex-shrink-0">{getTimeAgo(conv.last_message_at)}</span>
                </div>
                <p className="text-xs text-ms-gray truncate">{conv.lastMessage || 'Nova conversa'}</p>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  )

  const renderFeed = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm">
        <div className="flex items-start gap-3">
          <ProfileAvatar url={currentUser?.avatar_url} name={currentUser?.nome} size={44} />
          <div className="flex-1">
            <textarea value={postContent} onChange={e => setPostContent(e.target.value)} maxLength={500} rows={3} placeholder={currentUser ? "Partilha uma ideia, oportunidade ou conquista profissional..." : "Inicia sessão para publicares"} disabled={!currentUser || postedToday || posting} className="w-full bg-ms-surface rounded-xl px-4 py-3 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20 resize-none disabled:opacity-60" />
            {postImagePreview && (
              <div className="relative mt-2 inline-block">
                <img src={postImagePreview} alt="Pré-visualização" className="h-24 w-auto rounded-xl object-cover" />
                <button onClick={() => { setPostImage(null); setPostImagePreview(null) }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button onClick={() => postFileInputRef.current?.click()} disabled={!currentUser || postedToday || posting} className="flex items-center gap-1 px-3 py-2 bg-ms-surface text-ms-gray rounded-xl text-xs font-medium hover:text-ms-blue disabled:opacity-50">
                  <ImagePlus size={14} /> Foto
                </button>
                <input ref={postFileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePostImageSelect} />
                <span className="text-[10px] text-ms-gray">{postContent.length}/500</span>
              </div>
              {postedToday ? <span className="text-xs text-ms-gray">Já publicaste hoje</span> : (
                <button onClick={handlePublish} disabled={!currentUser || (!postContent.trim() && !postImage) || posting} className="flex items-center gap-1.5 px-4 py-2 bg-ms-blue text-white rounded-xl text-xs font-medium disabled:opacity-50 hover:bg-ms-blue-dark transition-colors">
                  {posting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />} Publicar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {loadingPosts ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-ms-border">
          <MessageSquare size={40} className="text-ms-gray mx-auto mb-3" />
          <p className="text-sm text-ms-gray">Ainda não há publicações.</p>
        </div>
      ) : (
        posts.map(post => (
          <article key={post.id} className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <button onClick={() => router.push(`/pessoas/perfil/?id=${post.user_id}`)}><ProfileAvatar url={post.author.avatar_url} name={post.author.nome} size={44} /></button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ms-dark truncate" onClick={() => router.push(`/pessoas/perfil/?id=${post.user_id}`)}>{post.author.nome || 'Utilizador'}</h3>
                  {currentUser?.id === post.user_id && <button onClick={() => deletePost(post.id)} className="text-ms-gray hover:text-red-500 p-1"><Trash2 size={16} /></button>}
                </div>
                <p className="text-[10px] text-ms-gray">{getTimeAgo(post.created_at)}</p>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${post.author.role === 'recrutador' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{post.author.role === 'recrutador' ? 'Recrutador' : 'Talento'}</span>
              </div>
            </div>
            {post.content && <p className="text-sm text-ms-dark whitespace-pre-wrap mb-3">{post.content}</p>}
            {post.media_url && <img src={post.media_url} alt="" className="w-full h-auto max-h-96 object-contain rounded-2xl mb-3 select-none" draggable={false} />}
            <div className="flex items-center justify-between pt-3 border-t border-ms-border">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleLike(post)} className={`flex items-center gap-1.5 text-xs font-medium ${post.liked_by_me ? 'text-red-500' : 'text-ms-gray hover:text-ms-dark'}`}>
                  <Heart size={18} className={post.liked_by_me ? 'fill-red-500' : ''} /> {post.likes_count || 0}
                </button>
                {currentUser?.id === post.user_id && (post.likes_count || 0) > 0 && (
                  <button onClick={() => openLikers(post.id)} className="flex items-center gap-1 text-xs text-ms-gray hover:text-ms-blue"><UserCheck size={14} /> Quem reagiu</button>
                )}
              </div>
              <ShareMenu url={`${typeof window !== 'undefined' ? window.location.origin : ''}/pessoas/?post=${post.id}`} text={`Publicação de ${post.author.nome} no MÔ SALO`} />
            </div>
          </article>
        ))
      )}

      {likersModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={() => setLikersModal({ open: false, postId: null, likers: [] })}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-ms-dark mb-3">Reacções</h3>
            {likersModal.likers.length === 0 ? <p className="text-sm text-ms-gray">Sem reacções.</p> : (
              <ul className="space-y-3">
                {likersModal.likers.map(l => (
                  <li key={l.id} className="flex items-center gap-3"><ProfileAvatar url={null} name={l.nome} size={32} /><span className="text-sm text-ms-dark">{l.nome}</span></li>
                ))}
              </ul>
            )}
            <button onClick={() => setLikersModal({ open: false, postId: null, likers: [] })} className="w-full mt-4 py-2.5 bg-ms-surface rounded-xl text-sm text-ms-dark font-medium">Fechar</button>
          </div>
        </div>
      )}
    </div>
  )

  const tabs = [
    { key: 'feed', label: 'Feed', icon: MessageCircle },
    { key: 'network', label: 'Network', icon: Link2 },
    { key: 'descobrir', label: 'Descobrir', icon: Search },
    { key: 'mensagens', label: 'Mensagens', icon: MessageSquare },
  ] as const

  return (
    <div className="min-h-screen bg-ms-surface pb-24 lg:pb-0">
      <header className="sticky top-0 bg-white z-50 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center max-w-[120px]"><Logo variant="full" className="h-7 w-auto max-w-full" /></Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationsBell />
            <Link href="/mensagens/" className="p-2 text-ms-dark hover:text-ms-blue rounded-full bg-ms-surface"><MessageSquare size={20} /></Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4">
        {renderStories()}

        <div className="flex items-center justify-between bg-white border border-ms-border rounded-2xl p-1.5 mb-4 shadow-sm">
          {tabs.map(t => {
            const Icon = t.icon
            const active = activeTab === t.key
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${active ? 'bg-ms-blue text-white shadow-md' : 'text-ms-gray hover:text-ms-dark hover:bg-ms-surface'}`}>
                <Icon size={16} /> {t.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'descobrir' && renderDiscover()}
        {activeTab === 'network' && renderNetwork()}
        {activeTab === 'mensagens' && renderMessages()}
        {activeTab === 'feed' && renderFeed()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
        <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
          {bottomNav.map(item => {
            const Icon = item.icon
            const active = item.key === 'pessoas'
            return (
              <Link key={item.key} href={item.href} className="flex flex-col items-center gap-0.5 py-1">
                <Icon size={22} className={active ? 'text-ms-blue' : 'text-ms-gray'} />
                <span className={`text-[10px] ${active ? 'text-ms-blue font-medium' : 'text-ms-gray'}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
