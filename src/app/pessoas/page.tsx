'use client'

import { Suspense } from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { social, type Post } from '@/lib/social'
import ProfileAvatar from '@/components/ProfileAvatar'
import NotificationsBell from '@/components/NotificationsBell'
import Logo from '@/components/Logo'
import FeedCard from '@/components/FeedCard'
import PostComposer from '@/components/PostComposer'
import StoryBar from '@/components/StoryBar'
import {
  MessageSquare, Users, User, Home, Search, Bell, Hash, Globe,
  Sparkles, TrendingUp, Building2, UserPlus, Check, X, MapPin, Briefcase,
  Filter, SlidersHorizontal, Eye, Zap, BookOpen, ChevronRight,
  Menu, LogOut, LayoutDashboard, Megaphone, Crown, LifeBuoy
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

type FeedTab = 'para-ti' | 'rede' | 'empresas' | 'vagas-em-alta' | 'descobrir' | 'comunidades'

const TAB_CONFIG: { key: FeedTab; label: string; icon: any }[] = [
  { key: 'para-ti', label: 'Casa', icon: Home },
  { key: 'rede', label: 'Rede', icon: Users },
  { key: 'empresas', label: 'Empresas', icon: Building2 },
  { key: 'vagas-em-alta', label: 'Vagas', icon: TrendingUp },
  { key: 'descobrir', label: 'Descobrir', icon: Search },
  { key: 'comunidades', label: 'Comunidades', icon: Hash },
]

function PessoasPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as FeedTab) || 'para-ti'
  const initialArea = searchParams.get('area') || ''
  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab)
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
  const [memberships, setMemberships] = useState<{ area: string; created_at: string }[]>([])
  const [allMemberships, setAllMemberships] = useState<{ user_id: string; area: string; created_at: string }[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('todos')
  const [filterArea, setFilterArea] = useState('todas')
  const [filterLocation, setFilterLocation] = useState('todas')

  const [communityArea, setCommunityArea] = useState<string | null>(initialArea || null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadPeople = useCallback(async (currentUserId?: string) => {
    setLoadingPeople(true)
    const { data: users } = await supabase.from('users').select('id, nome, email, role, telefone, avatar_url, created_at').order('created_at', { ascending: false }).limit(120)
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

  const loadMyMemberships = useCallback(async (userId: string) => {
    try {
      const data = await social.getCommunityMemberships(userId)
      setMemberships(data)
    } catch { setMemberships([]) }
  }, [])

  const loadAllMemberships = useCallback(async () => {
    try {
      const data = await social.getCommunityMemberships()
      setAllMemberships(data)
    } catch { setAllMemberships([]) }
  }, [])

  const loadFeed = useCallback(async (tab: FeedTab, userId?: string) => {
    setLoadingFeed(true)
    try {
      const data = await social.getFeed(tab === 'comunidades' ? 'para-ti' : tab, userId, 100, 0)
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
        loadMyMemberships(u.id)
        loadAllMemberships()
        checkPostedToday(u.id)
        loadFeed('para-ti', u.id)
      } else {
        loadPeople()
        loadAllMemberships()
        loadFeed('para-ti')
      }
    }
    init()
  }, [loadPeople, loadRequests, loadFollows, loadMyMemberships, loadAllMemberships, loadFeed])

  useEffect(() => {
    if (currentUser) loadFeed(activeTab, currentUser.id)
    else loadFeed(activeTab)
  }, [activeTab, currentUser, loadFeed])

  const checkPostedToday = async (userId: string) => {
    try {
      const data = await social.getPosts()
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const already = data.find(p => p.user_id === userId && new Date(p.created_at) >= today)
      setPostedToday(!!already)
    } catch { setPostedToday(false) }
  }

  const handlePosted = () => {
    setPostedToday(true)
    if (currentUser) loadFeed(activeTab, currentUser.id)
    else loadFeed(activeTab)
  }

  const handleDelete = async (id: string) => {
    if (!currentUser) return
    try {
      await social.deletePost(id, currentUser.id)
      setFeed(prev => prev.filter(p => p.id !== id))
      checkPostedToday(currentUser.id)
    } catch {}
  }

  const handleUpdatePost = (updated: Post) => {
    setFeed(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
  }

  const handleConnect = async (person: PersonResult) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    try {
      const { data: u } = await supabase.from('users').select('id, nome, avatar_url, role').eq('id', currentUser.id).single()
      await social.createConnection({ requester_id: currentUser.id, recipient_id: person.id, requester: u || { id: currentUser.id, nome: currentUser.nome, role: currentUser.role } })
      if (currentUser) loadRequests(currentUser.id)
    } catch {}
  }

  const handleFollow = async (personId: string) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    try {
      await social.follow(currentUser.id, personId)
      if (currentUser) loadFollows(currentUser.id)
    } catch {}
  }

  const connectionState = (personId: string) => {
    if (!currentUser) return 'none'
    const connected = requests.some(r => r.status === 'accepted' && (r.requester_id === personId || r.recipient_id === personId))
    if (connected) return 'connected'
    const pendingTo = requests.some(r => r.status === 'pending' && r.requester_id === currentUser.id && r.recipient_id === personId)
    if (pendingTo) return 'sent'
    const pendingFrom = requests.some(r => r.status === 'pending' && r.recipient_id === currentUser.id && r.requester_id === personId)
    if (pendingFrom) return 'received'
    return 'none'
  }

  const isFollowing = (personId: string) => follows.some(f => f.following_id === personId)
  const isCommunityMember = (area: string) => memberships.some(m => m.area === area)

  const handleJoinCommunity = async (area: string) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    try {
      await social.joinCommunity(currentUser.id, area)
      loadMyMemberships(currentUser.id)
      loadAllMemberships()
    } catch {}
  }

  const handleLeaveCommunity = async (area: string) => {
    if (!currentUser) return
    try {
      await social.leaveCommunity(currentUser.id, area)
      loadMyMemberships(currentUser.id)
      loadAllMemberships()
    } catch {}
  }

  const connectedIds = useMemo(() => new Set(requests.filter(r => r.status === 'accepted').flatMap(r => [r.requester_id, r.recipient_id])), [requests])
  const pendingReceived = requests.filter(r => r.status === 'pending' && r.recipient_id === currentUser?.id)

  const renderNetworkCTA = () => {
    if (activeTab !== 'rede') return null
    if (currentUser && connectedIds.size <= 1) {
      return (
        <div className="bg-gradient-to-r from-ms-blue/5 to-ms-purple/5 rounded-2xl p-4 border border-ms-border mb-4 text-center">
          <p className="text-sm text-ms-dark font-medium">Ainda não tens conexões.</p>
          <p className="text-xs text-ms-gray mt-1">Conecta com profissionais para ver o feed da tua rede.</p>
          <button onClick={() => setActiveTab('descobrir')} className="mt-2 text-xs font-bold text-ms-blue bg-white border border-ms-border px-3 py-1.5 rounded-lg hover:bg-ms-surface">Descobrir pessoas</button>
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
                <button onClick={async () => { try { await social.updateConnection(req.id, 'accepted'); if (currentUser) { loadRequests(currentUser.id); loadFeed('rede', currentUser.id) } } catch {} }} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600"><Check size={12} /> Aceitar</button>
                <button onClick={async () => { try { await social.updateConnection(req.id, 'rejected'); if (currentUser) loadRequests(currentUser.id) } catch {} }} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50"><X size={12} /> Ignorar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const uniqueAreas = useMemo(() => {
    const areas = new Set<string>()
    people.forEach(p => { if (p.profile?.area) areas.add(p.profile.area) })
    feed.forEach(p => { if (p.area) areas.add(p.area) })
    return Array.from(areas).sort()
  }, [people, feed])

  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>()
    people.forEach(p => { if (p.profile?.localizacao) locs.add(p.profile.localizacao) })
    return Array.from(locs).sort()
  }, [people])

  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      const q = searchQuery.trim().toLowerCase()
      const matchesQ = !q || p.nome.toLowerCase().includes(q) || (p.profile?.area || '').toLowerCase().includes(q) || (p.profile?.localizacao || '').toLowerCase().includes(q) || (p.profile?.competencias || '').toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
      const matchesRole = filterRole === 'todos' || p.role === filterRole
      const matchesArea = filterArea === 'todas' || (p.profile?.area || '') === filterArea
      const matchesLocation = filterLocation === 'todas' || (p.profile?.localizacao || '') === filterLocation
      return matchesQ && matchesRole && matchesArea && matchesLocation
    })
  }, [people, searchQuery, filterRole, filterArea, filterLocation])

  const discoverAreas = useMemo(() => ['todas', ...uniqueAreas], [uniqueAreas])
  const discoverLocations = useMemo(() => ['todas', ...uniqueLocations], [uniqueLocations])

  const renderDiscover = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ms-gray" size={16} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Procurar por nome, área, localização..." className="w-full bg-ms-surface rounded-xl pl-9 pr-4 py-2.5 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-ms-surface rounded-lg px-2 py-2 text-xs text-ms-dark outline-none">
            <option value="todos">Todos</option>
            <option value="candidato">Talentos</option>
            <option value="recrutador">Recrutadores</option>
          </select>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="bg-ms-surface rounded-lg px-2 py-2 text-xs text-ms-dark outline-none">
            {discoverAreas.map(a => <option key={a} value={a}>{a === 'todas' ? 'Todas áreas' : a}</option>)}
          </select>
          <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="bg-ms-surface rounded-lg px-2 py-2 text-xs text-ms-dark outline-none">
            {discoverLocations.map(l => <option key={l} value={l}>{l === 'todas' ? 'Todas cidades' : l}</option>)}
          </select>
        </div>
      </div>

      {loadingPeople ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : filteredPeople.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-ms-border">
          <Users size={40} className="text-ms-gray mx-auto mb-3" />
          <p className="text-sm text-ms-gray">Nenhum profissional encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredPeople.map(person => {
            const state = connectionState(person.id)
            const following = isFollowing(person.id)
            return (
              <div key={person.id} className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Link href={`/pessoas/perfil/?id=${person.id}`}><ProfileAvatar url={person.avatar_url} name={person.nome} size={52} /></Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/pessoas/perfil/?id=${person.id}`} className="text-sm font-bold text-ms-dark truncate hover:text-ms-blue">{person.nome}</Link>
                    <p className="text-[11px] text-ms-gray flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="flex items-center gap-1"><Briefcase size={11} /> {person.role === 'recrutador' ? 'Recrutador' : 'Talento'}</span>
                      {person.profile?.area ? <span className="flex items-center gap-1"><Globe size={11} /> {person.profile.area}</span> : null}
                      {person.profile?.localizacao ? <span className="flex items-center gap-1"><MapPin size={11} /> {person.profile.localizacao}</span> : null}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {state === 'connected' ? (
                    <Link href={`/mensagens/`} className="flex-1 text-center text-xs font-bold py-2 bg-ms-blue text-white rounded-xl hover:bg-blue-700">Mensagem</Link>
                  ) : state === 'sent' ? (
                    <button disabled className="flex-1 text-xs font-bold py-2 bg-ms-surface text-ms-gray rounded-xl">Pendente</button>
                  ) : state === 'received' ? (
                    <button onClick={async () => { const req = requests.find(r => r.status === 'pending' && r.recipient_id === currentUser?.id && r.requester_id === person.id); if (req && currentUser) { await social.updateConnection(req.id, 'accepted'); loadRequests(currentUser.id) } }} className="flex-1 text-xs font-bold py-2 bg-green-500 text-white rounded-xl hover:bg-green-600">Aceitar</button>
                  ) : (
                    <button onClick={() => handleConnect(person)} className="flex-1 text-xs font-bold py-2 bg-ms-blue text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1"><UserPlus size={12} /> Conectar</button>
                  )}
                  {state !== 'connected' && (
                    <button onClick={() => handleFollow(person.id)} disabled={following} className="flex-1 text-xs font-bold py-2 bg-white border border-ms-border text-ms-dark rounded-xl hover:bg-ms-surface disabled:opacity-50">{following ? 'A seguir' : 'Seguir'}</button>
                  )}
                  <Link href={`/pessoas/perfil/?id=${person.id}`} className="flex-1 text-center text-xs font-bold py-2 bg-ms-surface text-ms-dark rounded-xl hover:bg-ms-border">Ver perfil</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const communities = useMemo(() => {
    const map: Record<string, { area: string; members: number; posts: number; memberIds: Set<string> }> = {}
    people.forEach(p => {
      const a = p.profile?.area
      if (!a) return
      if (!map[a]) map[a] = { area: a, members: 0, posts: 0, memberIds: new Set<string>() }
      map[a].memberIds.add(p.id)
    })
    allMemberships.forEach(m => {
      if (!map[m.area]) map[m.area] = { area: m.area, members: 0, posts: 0, memberIds: new Set<string>() }
      map[m.area].memberIds.add(m.user_id)
    })
    feed.forEach(p => {
      const a = p.area || p.author?.area
      if (!a || !map[a]) return
      map[a].posts += 1
    })
    const extras = ['Dicas de CV', 'Entrevistas', 'Empreendedorismo', 'Freelance']
    extras.forEach(name => {
      if (!map[name]) {
        const extraMembers = new Set<string>()
        const extraCount = people.length ? Math.floor(people.length / 3) : 0
        for (let i = 0; i < Math.min(extraCount, people.length); i++) extraMembers.add(people[i].id)
        map[name] = { area: name, members: 0, posts: 0, memberIds: extraMembers }
      }
      map[name].posts = feed.filter(p => (p.content || '').toLowerCase().includes(name.toLowerCase().split(' ')[0])).length
    })
    return Object.values(map).map(c => ({ ...c, members: c.memberIds.size })).sort((a, b) => b.members - a.members)
  }, [people, feed, allMemberships])

  const renderCommunities = () => {
    const isMember = (area: string) => memberships.some(m => m.area === area)

    if (communityArea) {
      const community = communities.find(c => c.area === communityArea)
      const communityFeed = feed.filter(p => (p.area || p.author?.area) === communityArea)
      const member = isMember(communityArea)
      return (
        <div className="space-y-4">
          <button onClick={() => setCommunityArea(null)} className="text-xs font-bold text-ms-blue flex items-center gap-1"><X size={14} /> Voltar às comunidades</button>
          <div className="bg-gradient-to-r from-ms-blue to-ms-purple rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{communityArea}</h2>
                <p className="text-xs text-white/90 mt-1">{community?.members || 0} {community?.members === 1 ? 'membro' : 'membros'} • {community?.posts || communityFeed.length || 0} {community?.posts === 1 || (communityFeed.length === 1 && (community?.posts || 0) === 0) ? 'publicação' : 'publicações'}</p>
              </div>
              {member ? (
                <button onClick={() => handleLeaveCommunity(communityArea)} className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 bg-white/20 text-white rounded-full hover:bg-white/30">Membro ✓</button>
              ) : (
                <button onClick={() => handleJoinCommunity(communityArea)} className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 bg-white text-ms-blue rounded-full hover:bg-ms-surface">Aderir</button>
              )}
            </div>
          </div>
          {loadingFeed ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
          ) : communityFeed.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-ms-border">
              <Hash size={40} className="text-ms-gray mx-auto mb-3" />
              <p className="text-sm text-ms-gray">Ainda não há publicações nesta comunidade.</p>
            </div>
          ) : (
            communityFeed.map(post => <FeedCard key={post.id} post={post} currentUser={currentUser} onDelete={handleDelete} onUpdate={handleUpdatePost} />)
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm">
          <h3 className="text-sm font-bold text-ms-dark flex items-center gap-2"><Hash size={16} className="text-ms-blue" /> Comunidades profissionais</h3>
          <p className="text-xs text-ms-gray mt-1">Junta-te a grupos por área e partilha conhecimento, oportunidades e apoio.</p>
        </div>
        {loadingPeople ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-ms-border">
            <Hash size={40} className="text-ms-gray mx-auto mb-3" />
            <p className="text-sm text-ms-gray">Ainda não há comunidades. Cria publicações com área para formar novas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {communities.map(c => {
              const member = isMember(c.area)
              return (
                <div key={c.area} className="text-left bg-white rounded-2xl p-4 border border-ms-border shadow-sm hover:border-ms-blue/40 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-ms-dark">{c.area}</h4>
                    <span className="bg-ms-surface text-ms-blue text-[10px] font-bold px-2 py-0.5 rounded-full">{c.members} {c.members === 1 ? 'membro' : 'membros'}</span>
                  </div>
                  <p className="text-[11px] text-ms-gray mt-1">{c.posts} {c.posts === 1 ? 'publicação' : 'publicações'} recentes</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => { setCommunityArea(c.area); if (currentUser) loadFeed('para-ti', currentUser.id); else loadFeed('para-ti') }} className="flex-1 text-center text-[11px] font-bold py-2 bg-ms-surface text-ms-dark rounded-xl hover:bg-ms-border">Ver grupo</button>
                    {member ? (
                      <button onClick={() => handleLeaveCommunity(c.area)} className="flex-1 text-center text-[11px] font-bold py-2 bg-green-500 text-white rounded-xl hover:bg-green-600">Membro ✓</button>
                    ) : (
                      <button onClick={() => handleJoinCommunity(c.area)} className="flex-1 text-center text-[11px] font-bold py-2 bg-ms-blue text-white rounded-xl hover:bg-blue-700">Aderir</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderFeed = () => (
    <div className="space-y-4">
      {activeTab === 'para-ti' && currentUser && (
        <div className="bg-gradient-to-r from-ms-blue to-ms-purple rounded-2xl p-4 text-white shadow-md">
          <h2 className="text-base font-bold">Bom dia, {currentUser.nome?.split(' ')[0]} 👋</h2>
          <p className="text-xs text-white/90 mt-1">O que há de novo na tua área hoje?</p>
        </div>
      )}
      {currentUser && activeTab !== 'descobrir' && activeTab !== 'comunidades' && <PostComposer currentUser={{ ...currentUser, area: currentProfile?.area }} postedToday={postedToday} onPosted={handlePosted} />}
      {activeTab === 'rede' && renderPendingRequests()}
      {activeTab !== 'descobrir' && activeTab !== 'comunidades' && renderNetworkCTA()}
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

  const renderContent = () => {
    if (activeTab === 'descobrir') return renderDiscover()
    if (activeTab === 'comunidades') return renderCommunities()
    return renderFeed()
  }

  const connectionsCount = useMemo(() => requests.filter(r => r.status === 'accepted').length, [requests])

  const suggestions = useMemo(() => {
    return people
      .filter(p => connectionState(p.id) === 'none' && !isFollowing(p.id))
      .sort((a, b) => {
        const aScore = (a.profile?.area && a.profile.area === currentProfile?.area ? 2 : 0) + (a.avatar_url ? 1 : 0)
        const bScore = (b.profile?.area && b.profile.area === currentProfile?.area ? 2 : 0) + (b.avatar_url ? 1 : 0)
        return bScore - aScore
      })
      .slice(0, 5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, requests, follows, currentProfile, currentUser])

  const trendingCommunities = useMemo(() => communities.slice(0, 4), [communities])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setDrawerOpen(false)
    router.push('/')
  }

  const drawerLinks = [
    { href: '/vagas/', label: 'Vagas de emprego', icon: Briefcase, cls: 'text-ms-gray' },
    { href: '/trabalho-rapido/', label: 'Trabalho Rápido', icon: Zap, cls: 'text-orange-500' },
    { href: '/modelos-cv/', label: 'Modelos de CV', icon: BookOpen, cls: 'text-ms-gray' },
    { href: '/mensagens/', label: 'Mensagens', icon: MessageSquare, cls: 'text-ms-gray' },
    { href: '/anuncios/', label: 'Anunciar', icon: Megaphone, cls: 'text-ms-gray' },
    { href: '/premium/', label: 'MÔ SALO PRO', icon: Crown, cls: 'text-amber-500' },
    { href: '/suporte/', label: 'Suporte', icon: LifeBuoy, cls: 'text-ms-gray' },
  ]

  const renderMobileDrawer = () => {
    if (!drawerOpen) return null
    return (
      <div className="fixed inset-0 z-[70] lg:hidden">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
        <div className="absolute left-0 top-0 h-full w-[300px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto animate-[slideIn_0.2s_ease-out]">
          <div className="relative bg-gradient-to-br from-ms-blue to-ms-purple px-5 pt-5 pb-10">
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white"><X size={16} /></button>
            <Logo variant="full" className="h-7 w-auto brightness-0 invert" />
          </div>
          <div className="px-5 -mt-7">
            <Link href={currentUser ? `/pessoas/perfil/?id=${currentUser.id}` : '/auth/login/'} onClick={() => setDrawerOpen(false)} className="inline-block ring-4 ring-white rounded-full">
              <ProfileAvatar url={currentUser?.avatar_url} name={currentUser?.nome || 'Visitante'} size={56} />
            </Link>
            <h3 className="text-base font-bold text-ms-dark mt-2 truncate">{currentUser?.nome || 'Bem-vindo ao MÔ SALO'}</h3>
            <p className="text-xs text-ms-gray truncate">
              {currentUser
                ? `${currentUser.role === 'recrutador' ? 'Recrutador' : 'Talento'}${currentProfile?.area ? ` • ${currentProfile.area}` : ''}`
                : 'Cria o teu perfil profissional e conecta-te.'}
            </p>
            {currentUser ? (
              <>
                <div className="grid grid-cols-3 gap-1 mt-3 py-3 border-y border-ms-border text-center">
                  <div><p className="text-sm font-bold text-ms-dark">{connectionsCount}</p><p className="text-[10px] text-ms-gray">Conexões</p></div>
                  <div><p className="text-sm font-bold text-ms-dark">{follows.length}</p><p className="text-[10px] text-ms-gray">A seguir</p></div>
                  <div><p className="text-sm font-bold text-ms-dark">{memberships.length}</p><p className="text-[10px] text-ms-gray">Grupos</p></div>
                </div>
                <Link href={`/pessoas/perfil/?id=${currentUser.id}`} onClick={() => setDrawerOpen(false)} className="mt-3 block text-center text-xs font-bold py-2.5 bg-ms-blue text-white rounded-xl hover:bg-blue-700">Ver o meu perfil</Link>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Link href="/auth/login/" onClick={() => setDrawerOpen(false)} className="text-center text-xs font-bold py-2.5 bg-white border border-ms-blue text-ms-blue rounded-xl">Entrar</Link>
                <Link href="/auth/registar/" onClick={() => setDrawerOpen(false)} className="text-center text-xs font-bold py-2.5 bg-ms-blue text-white rounded-xl">Criar conta</Link>
              </div>
            )}
          </div>

          <nav className="px-3 py-4 space-y-0.5">
            {currentUser && (
              <Link href={`/dashboard/${currentUser.role}/`} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface hover:text-ms-dark"><LayoutDashboard size={17} /> Dashboard</Link>
            )}
            {drawerLinks.map(l => {
              const Icon = l.icon
              return (
                <Link key={l.href} href={l.href} onClick={() => setDrawerOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-ms-surface ${l.cls}`}><Icon size={17} /> {l.label}</Link>
              )
            })}
          </nav>

          {currentUser && memberships.length > 0 && (
            <div className="px-5 pb-2">
              <h4 className="text-[11px] font-bold text-ms-gray uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Hash size={12} className="text-ms-blue" /> Os meus grupos</h4>
              <div className="space-y-0.5">
                {memberships.slice(0, 5).map(m => (
                  <button key={m.area} onClick={() => { setActiveTab('comunidades'); setCommunityArea(m.area); setDrawerOpen(false) }} className="w-full text-left text-xs text-ms-gray hover:text-ms-blue hover:bg-ms-surface rounded-lg px-2 py-1.5 truncate">{m.area}</button>
                ))}
              </div>
            </div>
          )}

          {currentUser && (
            <div className="px-3 pb-6 pt-2 border-t border-ms-border mx-2 mt-2">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"><LogOut size={17} /> Terminar Sessão</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderLeftSidebar = () => (
    <aside className="hidden lg:block space-y-4 sticky top-[80px] self-start">
      <div className="bg-white rounded-2xl border border-ms-border shadow-sm overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-ms-blue to-ms-purple" />
        <div className="px-4 pb-4 -mt-7">
          <Link href={currentUser ? `/pessoas/perfil/?id=${currentUser.id}` : '/auth/login/'} className="inline-block ring-4 ring-white rounded-full">
            <ProfileAvatar url={currentUser?.avatar_url} name={currentUser?.nome || 'Visitante'} size={56} />
          </Link>
          <h3 className="text-sm font-bold text-ms-dark mt-2 truncate">{currentUser?.nome || 'Bem-vindo ao MÔ SALO'}</h3>
          <p className="text-[11px] text-ms-gray truncate">
            {currentUser
              ? `${currentUser.role === 'recrutador' ? 'Recrutador' : 'Talento'}${currentProfile?.area ? ` • ${currentProfile.area}` : ''}${currentProfile?.localizacao ? ` • ${currentProfile.localizacao}` : ''}`
              : 'Cria o teu perfil profissional e conecta-te.'}
          </p>
          {currentUser ? (
            <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-ms-border text-center">
              <div><p className="text-sm font-bold text-ms-dark">{connectionsCount}</p><p className="text-[10px] text-ms-gray">Conexões</p></div>
              <div><p className="text-sm font-bold text-ms-dark">{follows.length}</p><p className="text-[10px] text-ms-gray">A seguir</p></div>
              <div><p className="text-sm font-bold text-ms-dark">{memberships.length}</p><p className="text-[10px] text-ms-gray">Grupos</p></div>
            </div>
          ) : (
            <Link href="/auth/registar/" className="mt-3 block text-center text-xs font-bold py-2 bg-ms-blue text-white rounded-xl hover:bg-blue-700">Criar conta grátis</Link>
          )}
        </div>
      </div>

      {currentUser && memberships.length > 0 && (
        <div className="bg-white rounded-2xl border border-ms-border shadow-sm p-4">
          <h4 className="text-xs font-bold text-ms-dark mb-2 flex items-center gap-1.5"><Hash size={13} className="text-ms-blue" /> Os meus grupos</h4>
          <div className="space-y-1">
            {memberships.slice(0, 5).map(m => (
              <button key={m.area} onClick={() => { setActiveTab('comunidades'); setCommunityArea(m.area) }} className="w-full text-left text-xs text-ms-gray hover:text-ms-blue hover:bg-ms-surface rounded-lg px-2 py-1.5 truncate">{m.area}</button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-ms-border shadow-sm p-2">
        <Link href="/vagas/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ms-gray hover:bg-ms-surface hover:text-ms-dark"><Briefcase size={15} /> Vagas de emprego</Link>
        <Link href="/trabalho-rapido/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-orange-500 hover:bg-orange-50"><Zap size={15} /> Trabalho Rápido</Link>
        <Link href="/modelos-cv/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ms-gray hover:bg-ms-surface hover:text-ms-dark"><BookOpen size={15} /> Modelos de CV</Link>
        <Link href="/mensagens/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ms-gray hover:bg-ms-surface hover:text-ms-dark"><MessageSquare size={15} /> Mensagens</Link>
      </div>
    </aside>
  )

  const renderRightSidebar = () => (
    <aside className="hidden lg:block space-y-4 sticky top-[80px] self-start">
      <div className="bg-white rounded-2xl border border-ms-border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-ms-dark flex items-center gap-1.5"><UserPlus size={13} className="text-ms-blue" /> Sugestões para ti</h4>
          <button onClick={() => setActiveTab('descobrir')} className="text-[10px] font-bold text-ms-blue hover:underline">Ver todas</button>
        </div>
        {loadingPeople ? (
          <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
        ) : suggestions.length === 0 ? (
          <p className="text-[11px] text-ms-gray">Sem sugestões de momento.</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map(person => (
              <div key={person.id} className="flex items-center gap-2.5">
                <Link href={`/pessoas/perfil/?id=${person.id}`} className="flex-shrink-0"><ProfileAvatar url={person.avatar_url} name={person.nome} size={36} /></Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/pessoas/perfil/?id=${person.id}`} className="block text-xs font-bold text-ms-dark truncate hover:text-ms-blue">{person.nome}</Link>
                  <p className="text-[10px] text-ms-gray truncate">{person.profile?.area || (person.role === 'recrutador' ? 'Recrutador' : 'Talento')}</p>
                </div>
                <button onClick={() => handleConnect(person)} className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-ms-blue text-ms-blue hover:bg-ms-blue hover:text-white transition-colors">Conectar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-ms-border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-ms-dark flex items-center gap-1.5"><TrendingUp size={13} className="text-ms-purple" /> Comunidades em alta</h4>
          <button onClick={() => { setActiveTab('comunidades'); setCommunityArea(null) }} className="text-[10px] font-bold text-ms-blue hover:underline">Ver todas</button>
        </div>
        {trendingCommunities.length === 0 ? (
          <p className="text-[11px] text-ms-gray">Ainda sem comunidades.</p>
        ) : (
          <div className="space-y-1">
            {trendingCommunities.map(c => (
              <button key={c.area} onClick={() => { setActiveTab('comunidades'); setCommunityArea(c.area) }} className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-xl hover:bg-ms-surface text-left">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-ms-purple-light flex items-center justify-center flex-shrink-0"><Hash size={13} className="text-ms-blue" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ms-dark truncate">{c.area}</p>
                    <p className="text-[10px] text-ms-gray">{c.members} {c.members === 1 ? 'membro' : 'membros'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-ms-gray flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Link href="/premium/" className="block bg-gradient-to-br from-ms-blue to-ms-purple rounded-2xl p-4 text-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <Sparkles size={20} className="mb-2" />
        <h4 className="text-sm font-bold">MÔ SALO PRO</h4>
        <p className="text-[11px] text-white/85 mt-1">Destaca o teu perfil, acede a ferramentas de IA e candidata-te sem limites.</p>
        <span className="inline-block mt-2 text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-lg">Saber mais</span>
      </Link>

      <p className="text-[10px] text-ms-gray text-center px-2">MÔ SALO © {new Date().getFullYear()} • A rede profissional de Angola</p>
    </aside>
  )

  return (
    <div className="min-h-screen bg-ms-surface pb-24 lg:pb-0">
      <header className="sticky top-0 bg-white z-50 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden p-1.5 -ml-1 text-ms-dark rounded-lg hover:bg-ms-surface flex-shrink-0" aria-label="Abrir menu"><Menu size={22} /></button>
            <Link href="/" className="flex items-center max-w-[120px] flex-shrink-0"><Logo variant="full" className="h-7 w-auto max-w-full" /></Link>
            <div className="hidden md:flex items-center relative w-64">
              <Search className="absolute left-3 text-ms-gray" size={15} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setActiveTab('descobrir')}
                placeholder="Procurar profissionais..."
                className="w-full bg-ms-surface rounded-full pl-9 pr-4 py-2 text-xs text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationsBell />
            <Link href="/mensagens/" className="p-2 text-ms-dark hover:text-ms-blue rounded-full bg-ms-surface"><MessageSquare size={20} /></Link>
            {currentUser && (
              <Link href={`/pessoas/perfil/?id=${currentUser.id}`} className="hidden sm:block"><ProfileAvatar url={currentUser.avatar_url} name={currentUser.nome} size={34} /></Link>
            )}
          </div>
        </div>
      </header>

      {renderMobileDrawer()}

      <main className="max-w-6xl mx-auto px-4 pt-4 lg:grid lg:grid-cols-[240px_minmax(0,1fr)_280px] lg:gap-5 lg:items-start">
        {renderLeftSidebar()}

        <div className="min-w-0">
          {activeTab === 'para-ti' && <StoryBar currentUser={currentUser} people={people} />}

          <div className="bg-white border border-ms-border rounded-2xl p-1.5 mb-4 shadow-sm sticky top-[60px] z-40">
            <div className="flex items-center overflow-x-auto no-scrollbar">
              {TAB_CONFIG.map(t => {
                const Icon = t.icon
                const active = activeTab === t.key
                return (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-shrink-0 flex items-center justify-center gap-1 py-2.5 px-2.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap ${active ? 'bg-ms-blue text-white shadow-md' : 'text-ms-gray hover:text-ms-dark hover:bg-ms-surface'}`}>
                    <Icon size={14} /> {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {renderContent()}
        </div>

        {renderRightSidebar()}
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

export default function PessoasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ms-surface flex items-center justify-center"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <PessoasPageContent />
    </Suspense>
  )
}
