'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sortByMatch } from '@/lib/match'
import {
  Search, SlidersHorizontal, Heart, Bell, Menu, X, Briefcase, Home as HomeIcon, User, LogOut, FileText,
  Settings, Star, MapPin, Monitor, Banknote, Stethoscope, Megaphone, Scale, GraduationCap, HardHat, Wrench,
  MessageSquare, Zap, Users, Clock, ChevronDown, Newspaper, BookOpen, HeartHandshake, MessageCircle,
  Building2, Sparkles, TrendingUp
} from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'
import InstallPWA from '@/components/InstallPWA'
import Logo from '@/components/Logo'
import PaidAdsCarousel from '@/components/PaidAdsCarousel'
import { useSiteConfig } from '@/components/SiteConfigProvider'

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
const isToday = (date?: string) => {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}
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
  const { config } = useSiteConfig()
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
  const [noticias, setNoticias] = useState<any[]>([])

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

      try {
        const res = await fetch('/noticias.json', { cache: 'no-store' })
        if (res.ok) {
          const news = await res.json()
          setNoticias(Array.isArray(news.items) ? news.items : [])
        }
      } catch {
        setNoticias([])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const todayJobIds = useMemo(() => {
    const list = baseFiltered.filter((job: any) => isToday(job.created_at || job.first_seen_at || job.posted_at))
    return new Set(list.map((j: any) => j.favId))
  }, [baseFiltered])

  const todayJobs = baseFiltered.filter((job: any) => todayJobIds.has(job.favId))
  const mainJobs = baseFiltered.filter((job: any) => !todayJobIds.has(job.favId))

  const estagioJobs = useMemo(() => {
    const kw = /estágio|estagio|internship|trainee|recém[- ]formados|recémformados|jovem|jovens/i
    return allJobs.filter((job: any) => {
      const text = `${job.titulo || job.title || ''} ${job.descricao || job.description || job.excerpt || ''} ${job.area || job.category || ''}`
      return kw.test(text)
    }).slice(0, 8)
  }, [allJobs])

  const volunteerJobs = useMemo(() => {
    const kw = /voluntariado|voluntário|voluntario|ong|responsabilidade social|projecto social|comunidade|solidariedade|volunteer/i
    return allJobs.filter((job: any) => {
      const text = `${job.titulo || job.title || ''} ${job.descricao || job.description || job.excerpt || ''} ${job.area || job.category || ''}`
      return kw.test(text)
    }).slice(0, 8)
  }, [allJobs])

  const toggleFavorite = (e: React.MouseEvent, job: any) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev => prev.includes(job.favId) ? prev.filter(id => id !== job.favId) : [...prev, job.favId])
  }

  const jobHref = (job: any) => job.source === 'external' ? `/vagas/externa/?id=${encodeURIComponent(job.id)}` : `/vagas/detalhe/?id=${job.id}`

  const heroStats = useMemo(() => {
    const companies = new Set<string>()
    allJobs.forEach((j: any) => { const c = (j.empresa_nome || j.company || '').trim().toLowerCase(); if (c) companies.add(c) })
    const newThisWeek = allJobs.filter((j: any) => isThisWeek(j.created_at || j.first_seen_at || j.posted_at)).length
    return { vagas: allJobs.length, empresas: companies.size, novas: newThisWeek }
  }, [allJobs])

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
              <Link href="/anuncios/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}><Megaphone size={18} /> Anunciar</Link>
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

        {/* Hero */}
        <section className="mb-6">
          <div
            className="rounded-3xl text-white relative overflow-hidden"
            style={{ backgroundImage: `url('${config.hero_image_url || '/images/hero-destaque.jpg'}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-ms-dark/90 via-ms-blue/70 to-ms-purple/60" />
            <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-20 translate-x-16" />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-ms-purple/20 rounded-full translate-y-16 blur-2xl" />
            <div className="relative z-10 p-5 sm:p-7">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/15 backdrop-blur px-2.5 py-1 rounded-full mb-3">
                <Sparkles size={11} /> A rede profissional de Angola
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold leading-tight mb-1.5 max-w-md">{config.hero_title || 'Encontra o teu próximo emprego'}</h2>
              <p className="text-xs sm:text-sm text-white/85 mb-4 max-w-md">{config.hero_subtitle || 'Vagas novas todos os dias das melhores empresas em Angola.'}</p>

              <div className="bg-white rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2 max-w-xl">
                <Search size={18} className="text-ms-gray flex-shrink-0 ml-1" />
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
                  className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray min-w-0"
                />
                <Link href="/vagas/?showFilters=1" className="w-9 h-9 bg-ms-surface rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-ms-border transition-colors">
                  <SlidersHorizontal size={16} className="text-ms-blue" />
                </Link>
                <button
                  onClick={() => searchQuery.trim() && router.push(`/vagas/?q=${encodeURIComponent(searchQuery.trim())}`)}
                  className="hidden sm:flex items-center gap-1 bg-ms-blue text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex-shrink-0"
                >
                  Procurar
                </button>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 mt-4">
                <div className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-white/70" />
                  <span className="text-sm font-bold">{heroStats.vagas}</span>
                  <span className="text-[11px] text-white/70">vagas ativas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-white/70" />
                  <span className="text-sm font-bold">{heroStats.empresas}</span>
                  <span className="text-[11px] text-white/70">empresas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-white/70" />
                  <span className="text-sm font-bold">{heroStats.novas}</span>
                  <span className="text-[11px] text-white/70">novas esta semana</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Atalhos rápidos */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-ms-dark mb-3">Acesso Rápido</h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { href: '/vagas/', label: 'Ver Vagas', icon: Briefcase, grad: 'from-ms-blue to-blue-400' },
              { href: '/trabalho-rapido/', label: 'Trabalho Rápido', icon: Zap, grad: 'from-orange-400 to-amber-400' },
              { href: '/pessoas/', label: 'Rede', icon: Users, grad: 'from-ms-purple to-fuchsia-400' },
              { href: '/modelos-cv/', label: 'Modelos CV', icon: FileText, grad: 'from-emerald-500 to-teal-400' },
              { href: '/mensagens/', label: 'Mensagens', icon: MessageSquare, grad: 'from-sky-500 to-cyan-400' },
              { href: '/anuncios/', label: 'Anunciar', icon: Megaphone, grad: 'from-rose-500 to-pink-400' },
              { href: isLoggedIn ? `/dashboard/${userRole}/?tab=candidaturas` : '/auth/login/', label: 'Candidaturas', icon: BookOpen, grad: 'from-indigo-500 to-violet-400' },
              { href: '/premium/', label: 'MÔ SALO PRO', icon: Star, grad: 'from-amber-500 to-yellow-400' },
            ].map(item => {
              const Icon = item.icon
              return (
                <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1.5 bg-white border border-ms-border rounded-2xl py-3 px-1 hover:shadow-md hover:border-ms-blue/30 transition-all">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center shadow-sm`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-ms-dark text-center leading-tight">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

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

        {/* Anúncios pagos — carrossel horizontal automático */}
        <PaidAdsCarousel />

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

        {/* Vagas de Hoje */}
        {todayJobs.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ms-dark flex items-center gap-1.5">Vagas de Hoje <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">{todayJobs.length}</span></h2>
              <Link href="/vagas/" className="text-xs text-ms-blue font-medium">Ver todas</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {todayJobs.slice(0, 8).map((job: any) => (
                <div key={job.favId} className="flex-shrink-0 w-72">
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Últimas Notícias */}
        {noticias.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                    <Newspaper size={16} className="text-red-600" />
                  </div>
                  <h2 className="text-base font-bold text-ms-dark">Últimas Notícias</h2>
                </div>
                <p className="text-[10px] text-ms-gray pl-9">Fica a par do que move Angola</p>
              </div>
              <span className="text-[10px] text-ms-gray">{noticias[0]?.source || 'Jornal de Angola'}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 no-scrollbar -mx-4 px-4">
              {noticias.map((news: any, idx: number) => (
                <a
                  key={news.id || idx}
                  href={news.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="snap-start flex-shrink-0 w-72 bg-white border border-ms-border rounded-2xl p-4 hover:border-red-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded-md">Notícia</span>
                    <span className="text-[10px] text-ms-gray">{getTimeAgo(news.date)}</span>
                  </div>
                  <p className="text-sm font-bold text-ms-dark leading-snug line-clamp-3 mb-2 group-hover:text-red-700 transition-colors">{news.title}</p>
                  <p className="text-xs text-ms-gray line-clamp-3 mb-3">{news.excerpt || ''}</p>
                  <span className="inline-flex items-center text-[10px] font-semibold text-red-600">Ler notícia <ChevronDown size={12} className="-rotate-90 ml-0.5" /></span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Programas de Estágio */}
        {estagioJobs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-7 h-7 rounded-lg bg-ms-purple-light flex items-center justify-center">
                    <BookOpen size={16} className="text-ms-blue" />
                  </div>
                  <h2 className="text-base font-bold text-ms-dark">Programas de Estágio</h2>
                </div>
                <p className="text-[10px] text-ms-gray pl-9">Dá o primeiro passo na tua carreira</p>
              </div>
              <Link href="/vagas/?q=estágio" className="text-xs text-ms-blue font-medium whitespace-nowrap mt-2">Ver todas</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 no-scrollbar -mx-4 px-4">
              {estagioJobs.map((job: any) => (
                <div key={job.favId} className="snap-start flex-shrink-0 w-72">
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Voluntariado */}
        {volunteerJobs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                    <HeartHandshake size={16} className="text-green-600" />
                  </div>
                  <h2 className="text-base font-bold text-ms-dark">Voluntariado</h2>
                </div>
                <p className="text-[10px] text-ms-gray pl-9">Contribui e cresce com causas importantes</p>
              </div>
              <Link href="/vagas/?q=voluntariado" className="text-xs text-ms-blue font-medium whitespace-nowrap mt-2">Ver todas</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 no-scrollbar -mx-4 px-4">
              {volunteerJobs.map((job: any) => (
                <div key={job.favId} className="snap-start flex-shrink-0 w-72">
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          </section>
        )}

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
              {mainJobs.slice(0, 6).map((job: any) => <JobCard key={job.favId} job={job} featured={job.is_prioritaria || (job.score || 0) >= 20} />)}
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
          <Link href="/anuncios/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1"><Megaphone size={18} /> Anunciar</Link>
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
