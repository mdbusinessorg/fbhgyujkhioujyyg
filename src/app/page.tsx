'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sortByMatch } from '@/lib/match'
import {
  Search, SlidersHorizontal, Heart, Bell, Menu, X, Briefcase, Home as HomeIcon, User, LogOut, FileText,
  Settings, Star, MapPin, Monitor, Banknote, Stethoscope, Megaphone, Scale, GraduationCap, HardHat, Wrench,
  MessageSquare, Zap, Users, Clock, ChevronDown
} from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'
import InstallPWA from '@/components/InstallPWA'
import Logo from '@/components/Logo'

const CATEGORIAS_HOME = [
  { key: 'TI', label: 'Tecnologia', icon: Monitor, match: 'Tecnologia' },
  { key: 'Financas', label: 'Finanças', icon: Banknote, match: 'Finanças' },
  { key: 'Engenharia', label: 'Engenharia', icon: HardHat, match: 'Engenharia' },
  { key: 'Saude', label: 'Saúde', icon: Stethoscope, match: 'Saúde' },
  { key: 'Marketing', label: 'Marketing', icon: Megaphone, match: 'Marketing' },
  { key: 'Direito', label: 'Direito', icon: Scale, match: 'Direito' },
  { key: 'Educacao', label: 'Educação', icon: GraduationCap, match: 'Educação' },
  { key: 'Petroleo', label: 'Petróleo', icon: Wrench, match: 'Petróleo' },
]

const QUICK_FILTERS = [
  { key: 'Todas', label: 'Todas' },
  { key: 'Recentes', label: 'Recentes' },
  { key: 'Destaques', label: 'Destaques' },
  { key: 'Favoritos', label: 'Favoritos' },
  { key: 'TI', label: 'TI' },
  { key: 'Finanças', label: 'Finanças' },
  { key: 'Engenharia', label: 'Engenharia' },
  { key: 'Saúde', label: 'Saúde' },
  { key: 'Petróleo', label: 'Petróleo' },
  { key: 'Marketing', label: 'Marketing' },
]

const HOURS_60 = 60 * 60 * 60 * 1000
const DAYS_7 = 7 * 24 * 60 * 60 * 1000
const isRecent = (date?: string) => !!date && (Date.now() - new Date(date).getTime()) <= HOURS_60
const isThisWeek = (date?: string) => !!date && (Date.now() - new Date(date).getTime()) <= DAYS_7
const getTimeAgo = (date?: string) => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}
const stripHtml = (html?: string) => (html || '').replace(/<[^>]*>/g, '').trim()

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('candidato')
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [vagas, setVagas] = useState<any[]>([])
  const [allExternal, setAllExternal] = useState<any[]>([])
  const [linkedinJobs, setLinkedinJobs] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [favorites, setFavorites] = useState<string[]>([])

  const loadUserFromSession = async (session: any) => {
    if (!session?.user?.email) return null
    const { data, error } = await supabase.from('users').select('id, role, nome').eq('email', session.user.email).single()
    if (error || !data) return { id: session.user.id, role: 'candidato', nome: session.user.email?.split('@')[0] || '', profile: null }
    const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', data.id).single()
    return { id: data.id || session.user.id, role: data.role || 'candidato', nome: data.nome || session.user.email?.split('@')[0] || '', profile: prof || null }
  }

  const loadNotifications = async (uid: string, role: string) => {
    const notifs: any[] = []
    try {
      if (role === 'candidato') {
        const { data } = await supabase.from('candidaturas').select('*, vagas(titulo)').eq('candidato_id', uid).eq('status', 'aprovada').order('data_candidatura', { ascending: false }).limit(5)
        ;(data || []).forEach((c: any) => notifs.push({ text: `A tua candidatura a "${c.vagas?.titulo || 'vaga'}" foi aprovada`, href: '/dashboard/candidato/?tab=candidaturas' }))
      } else if (role === 'recrutador') {
        const { data } = await supabase.from('candidaturas').select('*, vagas(titulo)').eq('status', 'enviada').order('data_candidatura', { ascending: false }).limit(10)
        ;(data || []).forEach((c: any) => notifs.push({ text: `Nova candidatura a "${c.vagas?.titulo || 'vaga'}"`, href: '/dashboard/recrutador/?tab=candidatos' }))
      } else if (role === 'admin') {
        const [pendentes, vagasPendentes, pagPendentes] = await Promise.all([
          supabase.from('users').select('*').eq('role', 'recrutador').eq('aprovado', false).limit(3),
          supabase.from('vagas').select('*').eq('status', 'em_analise').limit(3),
          supabase.from('payment_requests').select('*').eq('status', 'pending').limit(3),
        ])
        ;(pendentes.data || []).forEach((u: any) => notifs.push({ text: `Recrutador pendente: ${u.nome || u.email}`, href: '/dashboard/admin/?tab=recrutadores' }))
        ;(vagasPendentes.data || []).forEach((v: any) => notifs.push({ text: `Vaga pendente: ${v.titulo}`, href: '/dashboard/admin/?tab=vagas' }))
        ;(pagPendentes.data || []).forEach((p: any) => notifs.push({ text: `Pagamento pendente: ${p.plan || '—'}`, href: '/dashboard/admin/?tab=pagamentos' }))
      }
    } catch (e) {
      console.error('Erro notificações:', e)
    }
    setNotifications(notifs)
  }

  useEffect(() => {
    const fav = typeof window !== 'undefined' ? localStorage.getItem('mosalo_favorites') : null
    if (fav) {
      try { setFavorites(JSON.parse(fav)) } catch {}
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session ? await loadUserFromSession(session) : null
      if (user) {
        setIsLoggedIn(true)
        setUserRole(user.role)
        setUserName(user.nome)
        setUserId(user.id)
        setProfile(user.profile)
        loadNotifications(user.id, user.role)
      } else {
        setIsLoggedIn(false)
      }

      const { data: vagasData } = await supabase.from('vagas').select('*').eq('status', 'aberta').order('created_at', { ascending: false }).limit(20)
      if (vagasData) setVagas(vagasData)

      const { data: ljobs } = await supabase.from('linkedin_jobs').select('*').order('created_at', { ascending: false }).limit(10)
      if (ljobs) setLinkedinJobs(ljobs)

      try {
        const res = await fetch('/external-jobs.json', { cache: 'no-store' })
        if (res.ok) {
          const ext = await res.json()
          setAllExternal(Array.isArray(ext.jobs) ? ext.jobs : [])
        }
      } catch {
        setAllExternal([])
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserFromSession(session).then((u) => {
          if (u) {
            setIsLoggedIn(true)
            setUserRole(u.role)
            setUserName(u.nome)
            setUserId(u.id)
            setProfile(u.profile)
            loadNotifications(u.id, u.role)
          }
        })
      } else {
        setIsLoggedIn(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mosalo_favorites', JSON.stringify(favorites))
    }
  }, [favorites])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUserRole('')
    setUserName('')
    setUserId('')
    setShowMenu(false)
    router.push('/')
  }

  const allJobs = useMemo(() => {
    const internal = vagas.map((v: any) => ({ ...v, source: 'internal' as const, favId: `internal:${v.id}` }))
    const external = allExternal.map((j: any) => ({ ...j, source: 'external' as const, favId: `external:${j.id}` }))
    const list = [...internal, ...external]
    return sortByMatch(list, profile)
  }, [vagas, allExternal, profile])

  const recommendedJobs = useMemo(() => {
    const seen = new Set()
    return allJobs
      .filter((job: any) => {
        if (seen.has(job.favId)) return false
        seen.add(job.favId)
        return (job.score || 0) >= 20 || job.is_prioritaria === true || !!job.salary
      })
      .sort((a: any, b: any) => {
        const scoreDiff = (b.score || 0) - (a.score || 0)
        if (scoreDiff !== 0) return scoreDiff
        return new Date(b.first_seen_at || b.posted_at || 0).getTime() - new Date(a.first_seen_at || a.posted_at || 0).getTime()
      })
      .slice(0, 8)
  }, [allJobs])

  const baseFiltered = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase()
    return allJobs.filter((job: any) => {
      const title = (job.titulo || job.title || '').toLowerCase()
      const company = (job.empresa_nome || job.company || '').toLowerCase()
      const area = (job.area || job.category || '').toLowerCase()
      const desc = (stripHtml(job.descricao || job.excerpt || job.description || '')).toLowerCase()
      const matchSearch = !kw || title.includes(kw) || company.includes(kw) || area.includes(kw) || desc.includes(kw)

      let matchFilter = true
      if (activeFilter === 'Favoritos') {
        matchFilter = favorites.includes(job.favId)
      } else if (activeFilter === 'Recentes') {
        matchFilter = isRecent(job.created_at || job.first_seen_at || job.posted_at)
      } else if (activeFilter === 'Destaques') {
        matchFilter = job.is_prioritaria === true || (job.score || 0) >= 20
      } else if (activeFilter !== 'Todas') {
        const cat = CATEGORIAS_HOME.find(c => c.label === activeFilter || c.key === activeFilter)
        const label = cat?.match || activeFilter
        const isInternal = job.source === 'internal'
        const isExternal = job.source === 'external'
        const internalMatch = isInternal && (job.area?.includes(label) || title.includes(label.toLowerCase()))
        const externalMatch = isExternal && (job.category === (activeFilter === 'TI' ? 'Tecnologia' : activeFilter) || job.category?.toLowerCase().includes(label.toLowerCase()))
        matchFilter = internalMatch || externalMatch
      }
      return matchSearch && matchFilter
    })
  }, [allJobs, searchQuery, activeFilter, favorites])

  const weeklyJobIds = useMemo(() => {
    const list = baseFiltered.filter((job: any) => {
      const isDestaque = job.is_prioritaria === true || (job.score || 0) >= 20
      const isWeek = isThisWeek(job.created_at || job.first_seen_at || job.posted_at)
      return isWeek && !isDestaque
    })
    return new Set(list.map((j: any) => j.favId))
  }, [baseFiltered])

  const weeklyJobs = baseFiltered.filter((job: any) => weeklyJobIds.has(job.favId))
  const mainJobs = baseFiltered.filter((job: any) => !weeklyJobIds.has(job.favId))

  const toggleFavorite = (e: React.MouseEvent, job: any) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev => prev.includes(job.favId) ? prev.filter(id => id !== job.favId) : [...prev, job.favId])
  }

  const jobHref = (job: any) => job.source === 'external' ? `/vagas/externa/?id=${encodeURIComponent(job.id)}` : `/vagas/detalhe/?id=${job.id}`

  const JobCard = ({ job, featured, recommended }: { job: any; featured?: boolean; recommended?: boolean }) => {
    const fav = favorites.includes(job.favId)
    const title = job.titulo || job.title
    const company = job.empresa_nome || job.company
    const location = job.localizacao || job.location
    const salary = job.salario || job.salary
    const date = job.created_at || job.first_seen_at || job.posted_at
    const category = job.area || job.category
    return (
      <Link key={job.favId} href={jobHref(job)} className="block">
        <div className={`bg-white rounded-2xl p-4 border ${featured || recommended ? 'border-ms-blue/20 shadow-md' : 'border-ms-border'} hover:shadow-md hover:border-ms-blue/30 transition-all relative`}>
          {recommended && (
            <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-ms-blue to-ms-purple px-2 py-0.5 rounded-full">
              <Star size={10} className="fill-white" /> Recomendada
            </span>
          )}
          <button
            onClick={(e) => toggleFavorite(e, job)}
            className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${fav ? 'bg-red-50 text-red-500' : 'bg-ms-surface text-ms-gray hover:text-red-400'}`}
          >
            <Heart size={16} className={fav ? 'fill-red-500' : ''} />
          </button>
          <div className="flex items-start gap-3 pr-10">
            <CompanyLogo company={company} logoUrl={job.logo_url} size={56} rounded="rounded-2xl" className="border border-ms-border flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-ms-dark leading-snug line-clamp-2">{title}</h3>
              {company && <p className="text-xs text-ms-gray mt-0.5">{company}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {location && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-ms-gray">
                    <MapPin size={10} /> {location}
                  </span>
                )}
                {salary && (
                  <span className="text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{salary}</span>
                )}
                {category && (
                  <span className="text-[10px] text-ms-blue bg-ms-blue/10 px-2 py-0.5 rounded-full">{category}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-ms-gray flex items-center gap-0.5">
                  <Clock size={10} /> {getTimeAgo(date)}
                </span>
                <span className="text-[10px] font-semibold text-ms-blue">Ver detalhes</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const NotificationDropdown = () => (
    <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-ms-border z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-ms-border flex items-center justify-between">
        <p className="text-sm font-semibold text-ms-dark">Notificações</p>
        <button onClick={() => setShowNotif(false)}><X size={14} className="text-ms-gray" /></button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-xs text-ms-gray text-center py-4">Sem notificações novas</p>
        ) : (
          notifications.map((n, i) => (
            <Link key={i} href={isLoggedIn ? n.href : '/auth/login/'} onClick={() => setShowNotif(false)} className="block px-4 py-3 hover:bg-ms-surface border-b border-ms-border last:border-0">
              <p className="text-xs text-ms-dark line-clamp-2">{n.text}</p>
            </Link>
          ))
        )}
      </div>
      {isLoggedIn && (
        <Link href={`/dashboard/${userRole}/`} onClick={() => setShowNotif(false)} className="block text-center text-xs text-ms-blue font-medium py-2 border-t border-ms-border">
          Ver painel
        </Link>
      )}
    </div>
  )

  const bottomNav = [
    { key: 'home', label: 'Início', href: '/', icon: HomeIcon },
    { key: 'vagas', label: 'Vagas', href: '/vagas/', icon: Search },
    { key: 'candidaturas', label: 'Candidaturas', href: isLoggedIn ? `/dashboard/${userRole}/?tab=candidaturas` : '/auth/login/', icon: FileText },
    { key: 'mensagens', label: 'Mensagens', href: '/mensagens/', icon: MessageSquare },
    { key: 'perfil', label: 'Perfil', href: isLoggedIn ? `/dashboard/${userRole}/?tab=perfil` : '/auth/login/', icon: User },
  ]

  return (
    <div className="min-h-screen bg-ms-surface pb-24 lg:pb-0 lg:pl-60">
      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-8">
              <Logo iconClassName="h-8 w-8" textClassName="text-ms-blue" />
              <button onClick={() => setShowMenu(false)}>
                <X size={22} className="text-ms-dark" />
              </button>
            </div>
            {isLoggedIn && (
              <div className="mb-6 pb-4 border-b border-ms-border">
                <p className="text-sm font-medium text-ms-dark">{userName || 'Utilizador'}</p>
                <p className="text-xs text-ms-gray capitalize">{userRole}</p>
              </div>
            )}
            <nav className="space-y-1">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-dark bg-ms-surface" onClick={() => setShowMenu(false)}><HomeIcon size={18} /> Início</Link>
              <Link href="/vagas/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}><Search size={18} /> Pesquisar Vagas</Link>
              <Link href="/trabalho-rapido/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-500 hover:bg-orange-50" onClick={() => setShowMenu(false)}><Zap size={18} /> Trabalho Rápido</Link>
              {isLoggedIn ? (
                <>
                  <Link href={`/dashboard/${userRole}/`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}><Briefcase size={18} /> Dashboard</Link>
                  <Link href={`/dashboard/${userRole}/?tab=perfil`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}><User size={18} /> Perfil</Link>
                  <Link href="/pessoas/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}><Users size={18} /> Pessoas</Link>
                  <Link href="/mensagens/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}><MessageSquare size={18} /> Mensagens</Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-red hover:bg-red-50"><LogOut size={18} /> Terminar Sessão</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-blue hover:bg-ms-surface" onClick={() => setShowMenu(false)}><User size={18} /> Entrar</Link>
                  <Link href="/auth/registar/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-blue hover:bg-ms-surface" onClick={() => setShowMenu(false)}><FileText size={18} /> Criar Conta</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Top header */}
      <header className="sticky top-0 bg-white z-50 px-4 py-3 shadow-sm lg:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button className="p-1 -ml-2" onClick={() => setShowMenu(true)}><Menu size={22} className="text-ms-dark" /></button>
          <Link href="/" className="flex items-center">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>
          <div className="relative">
            <button onClick={() => setShowNotif(!showNotif)} className="p-1 relative">
              <Bell size={22} className="text-ms-dark" />
              {notifications.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                <NotificationDropdown />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 lg:pt-6">
        {/* Greeting / Desktop header */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ms-dark">Olá{userName ? `, ${userName.split(' ')[0]}` : ''}!</h1>
            <p className="text-sm text-ms-gray">Encontra as melhores oportunidades em Angola.</p>
          </div>
          <div className="relative">
            <button onClick={() => setShowNotif(!showNotif)} className="w-10 h-10 bg-white border border-ms-border rounded-full flex items-center justify-center relative hover:bg-ms-surface">
              <Bell size={20} className="text-ms-dark" />
              {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                <NotificationDropdown />
              </>
            )}
          </div>
        </div>

        {/* Promotional banner */}
        <section className="mb-6">
          <div className="bg-gradient-to-r from-ms-blue to-ms-purple rounded-3xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 pr-4">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-lg mb-2">Destaque</span>
                <h2 className="text-lg font-bold leading-tight mb-1">Encontra o teu próximo emprego</h2>
                <p className="text-xs text-white/80 mb-3">Vagas novas todos os dias das melhores empresas em Angola.</p>
                <Link href="/vagas/" className="inline-flex items-center gap-1 bg-white text-ms-blue text-xs font-bold px-4 py-2 rounded-xl hover:bg-ms-surface transition-colors">
                  Ver vagas <ChevronDown size={12} className="-rotate-90" />
                </Link>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Briefcase size={40} className="text-white" />
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <div className="bg-white rounded-full px-4 py-3 shadow-sm flex items-center gap-3 mb-4">
          <Search size={20} className="text-ms-gray flex-shrink-0" />
          <input
            type="text"
            placeholder="Título da vaga, empresa ou área"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/vagas/?q=${encodeURIComponent(searchQuery.trim())}`)
              }
            }}
            className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray"
          />
          <Link href="/vagas/?showFilters=1" className="w-9 h-9 bg-ms-blue rounded-xl flex items-center justify-center flex-shrink-0">
            <SlidersHorizontal size={16} className="text-white" />
          </Link>
        </div>

        {/* Quick filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {QUICK_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeFilter === f.key ? 'bg-ms-blue text-white shadow-sm' : 'bg-white text-ms-gray border border-ms-border hover:bg-ms-surface'
              }`}
            >
              {f.label === 'Favoritos' ? <span className="flex items-center gap-1"><Heart size={12} /> Favoritos</span> : f.label}
            </button>
          ))}
        </div>

        {/* Categories */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ms-dark">Áreas Populares</h2>
            <Link href="/vagas/" className="text-xs text-ms-blue font-medium">Ver todas</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIAS_HOME.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.key}
                  href={`/vagas/?area=${encodeURIComponent(cat.label)}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl min-w-[76px] bg-white text-ms-dark border border-ms-border hover:bg-ms-surface hover:border-ms-blue/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-ms-purple-light">
                    <Icon size={20} className="text-ms-blue" />
                  </div>
                  <span className="text-[10px] font-medium whitespace-nowrap">{cat.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Info cards: Trabalho Rápido + Perfil */}
        <section className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/trabalho-rapido/" className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-4 text-white relative overflow-hidden hover:shadow-md transition-shadow">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <Zap size={24} className="mb-3" />
              <h3 className="text-sm font-bold mb-1">Trabalho Rápido</h3>
              <p className="text-[10px] text-white/80 mb-3">Empregos diretos. Paga uma taxa mensal e acede aos contactos.</p>
              <span className="inline-flex items-center text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">Saber mais</span>
            </Link>
            <Link href={isLoggedIn ? `/dashboard/${userRole}/?tab=perfil` : '/auth/registar/'} className="bg-gradient-to-br from-ms-blue to-ms-purple rounded-2xl p-4 text-white relative overflow-hidden hover:shadow-md transition-shadow">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <User size={24} className="mb-3" />
              <h3 className="text-sm font-bold mb-1">Perfil de Candidato</h3>
              <p className="text-[10px] text-white/80 mb-3">Completa o teu perfil e deixa as empresas encontrarem-te.</p>
              <span className="inline-flex items-center text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">Criar perfil</span>
            </Link>
          </div>
        </section>

        {/* Recomendadas */}
        {recommendedJobs.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ms-dark">Nossas Recomendações</h2>
              <Link href="/vagas/" className="text-xs text-ms-blue font-medium">Ver todas</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {recommendedJobs.map((job: any) => (
                <div key={job.favId} className="flex-shrink-0 w-72">
                  <JobCard job={job} recommended />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vagas da Semana */}
        {weeklyJobs.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ms-dark">Vagas da Semana</h2>
              <Link href="/vagas/" className="text-xs text-ms-blue font-medium">Ver todas</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {weeklyJobs.slice(0, 8).map((job: any) => (
                <div key={job.favId} className="flex-shrink-0 w-72">
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ad placeholder */}
        <section className="mb-6">
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-5 border border-dashed border-gray-300 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Publicidade</span>
              <p className="text-sm font-bold text-gray-700 mt-1">Espaço para anúncio</p>
              <p className="text-[10px] text-gray-500">Promove a tua empresa ou formação aqui.</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Megaphone size={24} className="text-gray-400" />
            </div>
          </div>
        </section>

        {/* Job listings */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ms-dark">
              {activeFilter === 'Favoritos' ? 'Favoritos' : activeFilter === 'Todas' ? 'Vagas Disponíveis' : activeFilter}
            </h2>
            <Link href="/vagas/" className="text-xs text-ms-blue font-medium">Ver todas</Link>
          </div>
          {mainJobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-ms-border">
              <Briefcase size={32} className="text-ms-gray mx-auto mb-3" />
              <p className="text-sm text-ms-gray">Nenhuma vaga encontrada</p>
              {activeFilter === 'Favoritos' && <p className="text-xs text-ms-gray mt-1">Guarda vagas clicando no coração</p>}
              <button onClick={() => { setActiveFilter('Todas'); setSearchQuery('') }} className="text-xs text-ms-blue font-medium mt-3">Limpar filtros</button>
            </div>
          ) : (
            <div className="space-y-3">
              {mainJobs.slice(0, 10).map((job: any) => <JobCard key={job.favId} job={job} featured={job.is_prioritaria || (job.score || 0) >= 20} />)}
            </div>
          )}
        </section>

        {/* LinkedIn jobs (horizontal) */}
        {linkedinJobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold text-ms-dark mb-3">Vagas LinkedIn</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {linkedinJobs.map((job: any) => (
                <a key={job.id} href={job.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-64 bg-white border border-ms-border rounded-2xl p-4 hover:border-ms-blue/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Settings size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ms-dark line-clamp-2">{job.titulo}</p>
                      <p className="text-[10px] text-ms-gray">{job.empresa} {job.localizacao ? `• ${job.localizacao}` : ''}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
        <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
          {bottomNav.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.replace(/\?.*$/, '')))
            return (
              <Link key={item.key} href={item.href} className="flex flex-col items-center gap-0.5 py-1 px-2 min-w-[56px]">
                <Icon size={22} className={active ? 'text-ms-blue' : 'text-gray-400'} />
                <span className={`text-[10px] ${active ? 'text-ms-blue font-medium' : 'text-gray-400'}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 h-screen fixed left-0 top-0 bg-white border-r border-ms-border z-40">
        <div className="p-6 border-b border-ms-border">
          <Link href="/" className="flex items-center gap-2">
            <Logo iconClassName="h-8 w-8" textClassName="text-ms-blue" />
          </Link>
        </div>
        {isLoggedIn && (
          <div className="px-6 py-4 border-b border-ms-border">
            <p className="text-sm font-medium text-ms-dark">{userName || 'Utilizador'}</p>
            <p className="text-xs text-ms-gray capitalize">{userRole}</p>
          </div>
        )}
        <nav className="flex-1 py-4 px-3">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium bg-ms-purple-light text-ms-purple mb-1"><HomeIcon size={18} /> Início</Link>
          <Link href="/vagas/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1"><Search size={18} /> Pesquisar</Link>
          <Link href="/trabalho-rapido/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-orange-500 hover:bg-orange-50 mb-1"><Zap size={18} /> Trabalho Rápido</Link>
          {isLoggedIn ? (
            <>
              <Link href={`/dashboard/${userRole}/`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1"><Briefcase size={18} /> Dashboard</Link>
              <Link href={`/dashboard/${userRole}/?tab=perfil`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1"><User size={18} /> Perfil</Link>
              <Link href="/pessoas/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1"><Users size={18} /> Pessoas</Link>
              <Link href="/mensagens/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1"><MessageSquare size={18} /> Mensagens</Link>
            </>
          ) : (
            <>
              <Link href="/auth/login/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1"><User size={18} /> Entrar</Link>
              <Link href="/auth/registar/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1"><FileText size={18} /> Registar</Link>
            </>
          )}
        </nav>
        {isLoggedIn && (
          <div className="p-4 border-t border-ms-border">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-red hover:bg-red-50 transition-colors"><LogOut size={18} /> Terminar Sessão</button>
          </div>
        )}
      </aside>

      <InstallPWA />
    </div>
  )
}
