'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { social, type Post } from '@/lib/social'
import ProfileAvatar from '@/components/ProfileAvatar'
import NotificationsBell from '@/components/NotificationsBell'
import Logo from '@/components/Logo'
import FeedCard from '@/components/FeedCard'
import PostComposer from '@/components/PostComposer'
import {
  MessageSquare, Users, User, Home, Search, Bell,
  Sparkles, TrendingUp, Building2, UserPlus, Check, X
} from 'lucide-react'

interface PersonResult {
  id: string
  nome: string
  email: string
  role: string
  telefone?: string
  avatar_url?: string | null
  created_at?: string
  profile?: { area?: string; localizacao?: string; competencias?: string; bio?: string; nivel_academico?: string; experiencias?: string }
}

interface ConnectionRequest {
  id: string
  requester_id: string
  recipient_id: string
  status: string
  requester?: { id: string; nome: string; avatar_url?: string | null; role: string }
}

type FeedTab = 'para-ti' | 'rede' | 'empresas' | 'vagas-em-alta'

const TAB_CONFIG: { key: FeedTab; label: string; icon: any }[] = [
  { key: 'para-ti', label: 'Para Ti', icon: Sparkles },
  { key: 'rede', label: 'Rede', icon: Users },
  { key: 'empresas', label: 'Empresas', icon: Building2 },
  { key: 'vagas-em-alta', label: 'Vagas em Alta', icon: TrendingUp },
]

export default function PessoasPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<FeedTab>('para-ti')
  const [currentUser, setCurrentUser] = useState<{ id: string; nome: string; role: string; avatar_url?: string | null } | null>(null)
  const [currentProfile, setCurrentProfile] = useState<{ area?: string; localizacao?: string } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [people, setPeople] = useState<PersonResult[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)

  const [feed, setFeed] = useState<Post[]>([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [feedTotal, setFeedTotal] = useState(0)
  const [postedToday, setPostedToday] = useState(false)

  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [follows, setFollows] = useState<{ following_id: string }[]>([])

  const loadPeople = useCallback(async (currentUserId?: string) => {
    setLoadingPeople(true)
    const { data: users } = await supabase.from('users').select('id, nome, email, role, telefone, avatar_url, created_at').order('created_at', { ascending: false }).limit(60)
    if (!users) { setLoadingPeople(false); return }
    const userIds = users.map(u => u.id)
    const { data: profiles } = await supabase.from('profiles').select('user_id, area, localizacao, competencias, bio').in('user_id', userIds)
    const profilesMap: Record<string, any> = {}
    ;(profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p })
    const enriched: PersonResult[] = users.filter(u => u.id !== currentUserId).filter(u => u.role !== 'admin').map(u => ({ ...u, profile: profilesMap[u.id] }))
    setPeople(enriched)
    setLoadingPeople(false)
  }, [])

  const loadRequests = useCallback(async (userId?: string) => {
    if (!userId) return
    try {
      const reqs = await social.getConnections(userId)
      setRequests(reqs)
    } catch { setRequests([]) }
  }, [])

  const loadFollows = useCallback(async (userId?: string) => {
    if (!userId) return
    try {
      const data = await social.getFollows(userId)
      setFollows(data)
    } catch { setFollows([]) }
  }, [])

  const loadFeed = useCallback(async (tab: FeedTab, userId?: string) => {
    setLoadingFeed(true)
    try {
      const data = await social.getFeed(tab, userId, 50, 0)
      setFeed(data.posts)
      setFeedTotal(data.total)
    } catch (err: any) { console.error('feed error', err); setFeed([]) }
    setLoadingFeed(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setIsLoggedIn(false); loadPeople(); loadFeed('para-ti'); return }
      setIsLoggedIn(true)
      const { data: u } = await supabase.from('users').select('id, nome, role, avatar_url, created_at').eq('email', session.user.email).single()
      if (u) {
        setCurrentUser(u)
        const { data: p } = await supabase.from('profiles').select('area, localizacao').eq('user_id', u.id).single()
        setCurrentProfile(p || {})
        loadPeople(u.id)
        loadRequests(u.id)
        loadFollows(u.id)
        checkPostedToday(u.id)
        loadFeed('para-ti', u.id)
      } else {
        loadPeople()
        loadFeed('para-ti')
      }
    }
    init()
  }, [loadPeople, loadRequests, loadFollows, loadFeed])

  const checkPostedToday = async (userId: string) => {
    try {
      const data = await social.getPosts()
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const already = data.find(p => p.user_id === userId && new Date(p.created_at) >= today)
      setPostedToday(!!already)
    } catch { setPostedToday(false) }
  }

  useEffect(() => {
    if (currentUser) loadFeed(activeTab, currentUser.id)
    else loadFeed(activeTab)
  }, [activeTab, currentUser, loadFeed])

  const handlePosted = () => {
    setPostedToday(true)
    if (currentUser) loadFeed(activeTab, currentUser.id)
    else loadFeed(activeTab)
  }

  const handleDelete = async (id: string) => {
    if (!currentUser || !confirm('Apagar publicação?')) return
    try { await social.deletePost(id, currentUser.id); setFeed(prev => prev.filter(p => p.id !== id)) } catch {}
  }

  const handleUpdatePost = (updated: Post) => {
    setFeed(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
  }

  const handleConnectFromStory = async (person: PersonResult) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    try {
      const { data: u } = await supabase.from('users').select('id, nome, avatar_url, role').eq('id', currentUser.id).single()
      await social.createConnection({ requester_id: currentUser.id, recipient_id: person.id, requester: u || { id: currentUser.id, nome: currentUser.nome, role: currentUser.role } })
      loadRequests(currentUser.id)
      alert('Pedido de network enviado.')
    } catch {}
  }

  const StoryAvatar = ({ person, isMe = false }: { person?: PersonResult; isMe?: boolean }) => (
    <div className="flex-shrink-0 flex flex-col items-center gap-2 w-16">
      <div className="relative w-16 h-16 rounded-full p-[3px] overflow-hidden" style={{ background: isMe ? '#E5E7EB' : 'linear-gradient(135deg, #1A56FF 0%, #6C47FF 100%)' }}>
        <ProfileAvatar url={isMe ? currentUser?.avatar_url : person?.avatar_url} name={isMe ? currentUser?.nome : person?.nome} size={58} className="rounded-full border-2 border-white bg-white" />
        {!isMe && (
          <button onClick={() => person && handleConnectFromStory(person)} className="absolute bottom-0 right-0 w-5 h-5 bg-ms-blue text-white rounded-full flex items-center justify-center border-2 border-white">
            <UserPlus size={10} />
          </button>
        )}
      </div>
      <span className="text-[10px] font-medium text-ms-dark text-center leading-tight max-w-[60px] truncate">{isMe ? 'Eu' : (person?.nome || '').split(' ')[0]}</span>
    </div>
  )

  const renderStories = () => (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 pt-1">
      <Link href={currentUser ? `/pessoas/perfil/?id=${currentUser.id}` : '/auth/login/'} className="flex-shrink-0"><StoryAvatar isMe /></Link>
      {people.slice(0, 12).map(person => (
        <Link key={person.id} href={`/pessoas/perfil/?id=${person.id}`} className="flex-shrink-0">
          <StoryAvatar person={person} />
        </Link>
      ))}
    </div>
  )

  const connectedIds = new Set(requests.filter(r => r.status === 'accepted').flatMap(r => [r.requester_id, r.recipient_id]))
  const pendingReceived = requests.filter(r => r.status === 'pending' && r.recipient_id === currentUser?.id)

  const renderNetworkCTA = () => {
    if (activeTab !== 'rede') return null
    if (currentUser && connectedIds.size <= 1) {
      return (
        <div className="bg-gradient-to-r from-ms-blue/5 to-ms-purple/5 rounded-2xl p-4 border border-ms-border mb-4 text-center">
          <p className="text-sm text-ms-dark font-medium">Ainda não tens conexões.</p>
          <p className="text-xs text-ms-gray mt-1">Conecta com profissionais para ver o feed da tua rede.</p>
        </div>
      )
    }
    return null
  }

  const renderPendingRequests = () => {
    if (!currentUser || pendingReceived.length === 0) return null
    return (
      <div className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm mb-4">
        <h3 className="text-sm font-bold text-ms-dark mb-3 flex items-center gap-2"><Bell size={16} className="text-ms-blue" /> Pedidos de conexão pendentes</h3>
        <div className="space-y-2">
          {pendingReceived.map(req => (
            <div key={req.id} className="flex items-center justify-between gap-3">
              <Link href={`/pessoas/perfil/?id=${req.requester_id}`} className="flex items-center gap-3 min-w-0">
                <ProfileAvatar url={req.requester?.avatar_url} name={req.requester?.nome} size={40} />
                <span className="text-sm font-semibold text-ms-dark truncate">{req.requester?.nome || 'Utilizador'}</span>
              </Link>
              <div className="flex gap-2">
                <button onClick={async () => { try { await social.updateConnection(req.id, 'accepted'); loadRequests(currentUser.id); loadFeed('rede', currentUser.id) } catch {} }} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600"><Check size={12} /> Aceitar</button>
                <button onClick={async () => { try { await social.updateConnection(req.id, 'rejected'); loadRequests(currentUser.id) } catch {} }} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50"><X size={12} /> Ignorar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderFeed = () => (
    <div className="space-y-4">
      {currentUser && <PostComposer currentUser={{ ...currentUser, area: currentProfile?.area }} postedToday={postedToday} onPosted={handlePosted} />}
      {renderPendingRequests()}
      {renderNetworkCTA()}
      {loadingFeed ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : feed.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-ms-border">
          <Sparkles size={40} className="text-ms-gray mx-auto mb-3" />
          <p className="text-sm text-ms-gray">Ainda não há publicações nesta secção.</p>
        </div>
      ) : (
        feed.map(post => <FeedCard key={post.id} post={post} currentUser={currentUser} onDelete={handleDelete} onUpdate={handleUpdatePost} />)
      )}
    </div>
  )

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
        {activeTab === 'para-ti' && renderStories()}

        <div className="bg-white border border-ms-border rounded-2xl p-1.5 mb-4 shadow-sm sticky top-[60px] z-40">
          <div className="flex items-center justify-between">
            {TAB_CONFIG.map(t => {
              const Icon = t.icon
              const active = activeTab === t.key
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${active ? 'bg-ms-blue text-white shadow-md' : 'text-ms-gray hover:text-ms-dark hover:bg-ms-surface'}`}>
                  <Icon size={14} /> {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {renderFeed()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
        <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
          <Link href="/" className="flex flex-col items-center gap-0.5 py-1"><Home size={22} className="text-ms-gray" /><span className="text-[10px] text-ms-gray">Início</span></Link>
          <Link href="/vagas/" className="flex flex-col items-center gap-0.5 py-1"><Search size={22} className="text-ms-gray" /><span className="text-[10px] text-ms-gray">Vagas</span></Link>
          <Link href="/pessoas/" className="flex flex-col items-center gap-0.5 py-1"><Users size={22} className="text-ms-blue" /><span className="text-[10px] text-ms-blue font-medium">Pessoas</span></Link>
          <Link href={isLoggedIn && currentUser ? `/dashboard/${currentUser.role}/?tab=perfil` : '/auth/login/'} className="flex flex-col items-center gap-0.5 py-1"><User size={22} className="text-ms-gray" /><span className="text-[10px] text-ms-gray">Perfil</span></Link>
        </div>
      </nav>
    </div>
  )
}
