'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import { parseCV } from '@/lib/ai'
import { sortByMatch } from '@/lib/match'
import { social } from '@/lib/social'
import {
  Search, SlidersHorizontal, Heart, Bell, Menu, X, Briefcase, Home as HomeIcon, User, LogOut, FileText,
  Settings, MapPin, Monitor, Banknote, Stethoscope, Megaphone, Scale, GraduationCap, HardHat, Wrench,
  MessageSquare, Zap, Users, Clock, ChevronDown, Newspaper, BookOpen, HeartHandshake, MessageCircle,
  Sparkles, Bookmark, BadgeCheck, Upload, LogIn
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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoc, setSearchLoc] = useState('')
  const [searchNivel, setSearchNivel] = useState('')
  const [searchTipo, setSearchTipo] = useState('')
  const [cvUploading, setCvUploading] = useState(false)
  const [cvMsg, setCvMsg] = useState('')
  const cvInputRef = useRef<HTMLInputElement>(null)
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

  const runEngagementTriggers = async (user: any) => {
    if (user.role !== 'candidato') return
    const bot = { id: 'mosalo-bot', nome: 'MÔ SALO', role: 'admin' }
    const key = `mosalo_triggers_${user.id}`
    let state: any = {}
    try { state = JSON.parse(localStorage.getItem(key) || '{}') } catch {}
    const now = Date.now()
    try {
      if (!state.welcomed) {
        const existing = await social.getNotifications(user.id)
        if (!existing.some(n => n.type === 'welcome')) {
          await social.createNotification({
            user_id: user.id,
            type: 'welcome',
            title: `Bem-vindo(a) ao MÔ SALO, ${user.nome}! 🎉`,
            body: 'Primeiros passos: completa o teu perfil, adiciona as tuas competências, cria o teu CV e explora as vagas de hoje. Conecta-te com profissionais na aba Pessoas!',
            data: { url: '/dashboard/candidato/?tab=perfil' },
            sender: bot,
          })
        }
        state.welcomed = true
        localStorage.setItem(key, JSON.stringify(state))
      }
      const p = user.profile
      const fields = [p?.area, p?.localizacao, p?.competencias, p?.experiencias, p?.nivel_academico, p?.bio]
      const filled = fields.filter(f => f && String(f).trim().length > 0).length
      const completeness = Math.round((filled / fields.length) * 100)
      if (completeness < 60 && (!state.lastProfileReminder || now - state.lastProfileReminder > 7 * 86400000)) {
        await social.createNotification({
          user_id: user.id,
          type: 'profile_reminder',
          title: 'O teu perfil está incompleto',
          body: `O teu perfil está a ${completeness}%. Completa a tua área, competências e experiência para receberes melhores recomendações de vagas.`,
          data: { url: '/dashboard/candidato/?tab=perfil', completeness },
          sender: bot,
        })
        state.lastProfileReminder = now
        localStorage.setItem(key, JSON.stringify(state))
      }
    } catch {}
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
        runEngagementTriggers(user)
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

  const doSearch = () => {
    const params = new URLSearchParams()
    const q = [searchQuery.trim(), searchNivel].filter(Boolean).join(' ').trim()
    if (q) params.set('q', q)
    if (searchLoc) params.set('loc', searchLoc)
    if (searchTipo === 'Remoto' || searchTipo === 'Híbrido') params.set('modalidade', searchTipo)
    else if (searchTipo) params.set('tipo', searchTipo)
    router.push(`/vagas/?${params.toString()}`)
  }

  const handleCvFile = async (file: File) => {
    if (!isLoggedIn || !userId) { router.push('/auth/login/'); return }
    setCvUploading(true)
    setCvMsg('A carregar o CV...')
    try {
      const path = `${userId}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file)
      if (upErr) throw upErr
      const url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
      const docs = [...(profile?.documentos || []), url].slice(-2)

      setCvMsg('A ler o CV com IA...')
      const parsed = await parseCV(url)
      await supabase.from('profiles').upsert({
        user_id: userId,
        documentos: docs,
        area: parsed.area || profile?.area || null,
        localizacao: parsed.localizacao || profile?.localizacao || null,
        nivel_academico: parsed.nivel_academico || profile?.nivel_academico || null,
        bio: parsed.bio || profile?.bio || null,
        experiencias: parsed.experiencias || profile?.experiencias || null,
        competencias: parsed.competencias || profile?.competencias || null,
      }, { onConflict: 'user_id' })
      if (parsed.nome) await supabase.from('users').update({ nome: parsed.nome }).eq('id', userId)
      setProfile((p: any) => ({ ...(p || {}), documentos: docs, area: parsed.area || p?.area, localizacao: parsed.localizacao || p?.localizacao, competencias: parsed.competencias || p?.competencias }))
      setCvMsg(parsed.error ? 'CV guardado. A mostrar vagas...' : 'Perfil criado! A mostrar vagas para ti...')
      setTimeout(() => router.push('/vagas/'), 800)
    } catch (e) {
      setCvMsg('Não foi possível carregar o CV. Tenta novamente.')
    }
    setCvUploading(false)
  }

  const heroStats = useMemo(() => {
    const companies = new Set<string>()
    allJobs.forEach((j: any) => { const c = (j.empresa_nome || j.company || '').trim().toLowerCase(); if (c) companies.add(c) })
    const newThisWeek = allJobs.filter((j: any) => isThisWeek(j.created_at || j.first_seen_at || j.posted_at)).length
    return { vagas: allJobs.length, empresas: companies.size, novas: newThisWeek }
  }, [allJobs])

  const fmtShortDate = (date?: string) => {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const JobCard = ({ job, featured, recommended }: { job: any; featured?: boolean; recommended?: boolean }) => {
    const fav = favorites.includes(job.favId)
    const title = job.titulo || job.title
    const company = job.empresa_nome || job.company
    const location = job.localizacao || job.location
    const salary = job.salario || job.salary
    const date = job.created_at || job.first_seen_at || job.posted_at
    const category = job.area || job.category
    const jobType = job.tipo || job.contract_type || job.job_type
    const chip = 'inline-flex items-center text-[10px] font-medium text-ms-gray bg-ms-surface border border-ms-border px-2 py-0.5 rounded-md'
    return (
      <Link key={job.favId} href={jobHref(job)} className="block h-full group">
        <div className={`relative h-full bg-white rounded-3xl border p-4 sm:p-5 transition-all group-hover:shadow-ios group-hover:border-ms-blue/40 ${featured || recommended ? 'border-ms-blue/25' : 'border-ms-border'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-ms-gray">{fmtShortDate(date) || getTimeAgo(date)}</span>
            <div className="flex items-center gap-1.5">
              {recommended && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ms-blue bg-ms-blue/10 px-2 py-0.5 rounded-full">
                  <Sparkles size={10} /> Match
                </span>
              )}
              <button
                onClick={(e) => toggleFavorite(e, job)}
                aria-label="Guardar vaga"
                className={`z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${fav ? 'text-ms-blue' : 'text-ms-gray hover:text-ms-blue'}`}
              >
                <Bookmark size={15} className={fav ? 'fill-ms-blue' : ''} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <CompanyLogo company={company} logoUrl={job.logo_url} size={38} rounded="rounded-full" className="border border-ms-border flex-shrink-0" />
            {company && (
              <span className="text-xs font-medium text-ms-dark truncate flex items-center gap-1">
                {company}
                <BadgeCheck size={14} className="text-ms-blue flex-shrink-0" />
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-bold text-ms-dark leading-snug line-clamp-2 mb-2.5">{title}</h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {jobType && <span className={chip}>{jobType}</span>}
            {location && <span className={chip}><MapPin size={10} className="mr-0.5" />{location}</span>}
            {category && <span className={chip}>{category}</span>}
          </div>
          <div className="flex items-center justify-between">
            {salary ? (
              <span className="text-xs font-semibold text-ms-dark">{salary}</span>
            ) : (
              <span className="text-[11px] text-ms-gray flex items-center gap-1"><Clock size={11} />{getTimeAgo(date)}</span>
            )}
            <span className="inline-flex items-center gap-1 bg-ms-dark text-white text-[11px] font-semibold px-4 py-2 rounded-full group-hover:bg-ms-blue transition-colors">
              Detalhes
            </span>
          </div>
        </div>
      </Link>
    )
  }

  const NotificationDropdown = () => (
    <div className="absolute right-0 top-12 w-72 bg-white/95 backdrop-blur-xl rounded-3xl shadow-ios border border-white/50 z-50 overflow-hidden">
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

  const mobileTopNav = [
    { key: 'home', label: 'Início', href: '/', icon: HomeIcon },
    { key: 'vagas', label: 'Vagas', href: '/vagas/', icon: Search },
    { key: 'rapido', label: 'Rápido', href: '/trabalho-rapido/', icon: Zap, accent: true },
    { key: 'anuncios', label: 'Anunciar', href: '/anuncios/', icon: Megaphone },
    { key: 'pessoas', label: 'Pessoas', href: '/pessoas/', icon: Users },
    { key: 'mensagens', label: 'Mensagens', href: '/mensagens/', icon: MessageSquare },
    ...(isLoggedIn
      ? [
          { key: 'dashboard', label: 'Dashboard', href: `/dashboard/${userRole}/`, icon: Briefcase },
          { key: 'perfil', label: 'Perfil', href: `/dashboard/${userRole}/?tab=perfil`, icon: User },
        ]
      : [
          { key: 'entrar', label: 'Entrar', href: '/auth/login/', icon: LogIn },
          { key: 'conta', label: 'Criar Conta', href: '/auth/registar/', icon: FileText },
        ]),
  ]

  const desktopNav = mobileTopNav.filter(item => !['entrar', 'conta'].includes(item.key))

  return (
    <div className="min-h-screen bg-ms-surface pb-8">
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

      {/* Desktop top nav — estilo Facebook */}
      <header className="hidden lg:block sticky top-0 bg-white z-50 border-b border-ms-border shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 gap-4">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>
          <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar scrollbar-hide">
            {desktopNav.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.key} href={item.href} className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1.5 px-2 rounded-lg hover:bg-ms-surface flex-shrink-0 ${item.accent ? 'text-ms-blue' : 'text-ms-dark'}`}>
                  <Icon size={19} />
                  <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="w-9 h-9 bg-ms-surface border border-ms-border rounded-full flex items-center justify-center relative hover:bg-ms-border" aria-label="Notificações">
                <Bell size={18} className="text-ms-dark" />
                {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              {showNotif && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                  <NotificationDropdown />
                </>
              )}
            </div>
            {isLoggedIn ? (
              <button onClick={handleLogout} title="Terminar Sessão" aria-label="Terminar Sessão" className="w-9 h-9 bg-ms-surface border border-ms-border rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-200">
                <LogOut size={18} className="text-ms-red" />
              </button>
            ) : (
              <>
                <Link href="/auth/login/" className="text-xs font-bold text-ms-blue border border-ms-blue rounded-xl px-4 py-2 hover:bg-ms-blue/5">Entrar</Link>
                <Link href="/auth/registar/" className="text-xs font-bold text-white bg-ms-blue rounded-xl px-4 py-2 hover:bg-blue-700">Criar Conta</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Top header — estilo Facebook: navegação sempre visível */}
      <header className="sticky top-0 bg-white z-50 shadow-sm lg:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2.5">
          <button className="p-1 -ml-2" onClick={() => setShowMenu(true)} aria-label="Menu completo"><Menu size={22} className="text-ms-dark" /></button>
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
        <nav className="flex items-center gap-1 overflow-x-auto px-3 pb-1.5 no-scrollbar scrollbar-hide border-t border-ms-border/60">
          {mobileTopNav.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.key} href={item.href} className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] py-1.5 px-1 rounded-lg flex-shrink-0 active:bg-ms-surface ${item.accent ? 'text-ms-blue' : 'text-ms-dark'}`}>
                <Icon size={19} />
                <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </header>

      <main className="max-w-3xl lg:max-w-6xl mx-auto px-4 pt-4 lg:pt-6">
        {/* Greeting */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ms-dark">Olá{userName ? `, ${userName.split(' ')[0]}` : ''}!</h1>
            <p className="text-xs sm:text-sm text-ms-gray mt-1">
              <span className="font-semibold text-ms-blue">{heroStats.vagas}</span> vagas ativas
              <span className="mx-1.5 text-ms-border">·</span>
              <span className="font-semibold text-ms-blue">{heroStats.empresas}</span> empresas
              <span className="mx-1.5 text-ms-border">·</span>
              <span className="font-semibold text-ms-blue">{heroStats.novas}</span> novas esta semana
            </p>
          </div>
        </div>

        {/* Search bar */}
        <section className="bg-white rounded-3xl border border-ms-border shadow-ios-sm p-4 sm:p-5 mb-6">
          <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:gap-3 lg:items-end">
            <div className="flex gap-2 lg:contents">
              <div className="flex-1 min-w-0">
                <label className="hidden lg:block text-[11px] font-semibold text-ms-dark mb-1.5">Título / Palavras-chave</label>
                <input
                  type="text"
                  placeholder="Título da vaga, empresa ou área"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') doSearch() }}
                  className="w-full bg-ms-surface border border-ms-border rounded-xl px-3 py-2.5 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:border-ms-blue"
                />
              </div>
              <button
                onClick={doSearch}
                aria-label="Procurar"
                className="lg:hidden flex items-center justify-center bg-ms-blue text-white px-4 rounded-xl hover:bg-blue-700 transition-colors self-end h-[42px]"
              >
                <Search size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:contents">
              <div>
                <label className="hidden lg:block text-[11px] font-semibold text-ms-dark mb-1.5">Localização</label>
                <div className="relative">
                  <select value={searchLoc} onChange={(e) => setSearchLoc(e.target.value)} className="w-full appearance-none bg-ms-surface border border-ms-border rounded-xl px-2 lg:px-3 py-2.5 text-xs lg:text-sm text-ms-dark outline-none focus:border-ms-blue pr-6 lg:pr-8">
                    <option value="">Localização</option>
                    {['Luanda', 'Benguela', 'Lubango', 'Cabinda', 'Huambo', 'Malanje', 'Namibe', 'Lobito', 'Uíge', 'Kuito', 'Sumbe', 'Remoto'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="hidden lg:block text-[11px] font-semibold text-ms-dark mb-1.5">Nível de Experiência</label>
                <div className="relative">
                  <select value={searchNivel} onChange={(e) => setSearchNivel(e.target.value)} className="w-full appearance-none bg-ms-surface border border-ms-border rounded-xl px-2 lg:px-3 py-2.5 text-xs lg:text-sm text-ms-dark outline-none focus:border-ms-blue pr-6 lg:pr-8">
                    <option value="">Experiência</option>
                    {['Júnior', 'Intermédio', 'Sénior', 'Estágio', 'Gestão / Direcção'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="hidden lg:block text-[11px] font-semibold text-ms-dark mb-1.5">Tipo de Vaga</label>
                <div className="relative">
                  <select value={searchTipo} onChange={(e) => setSearchTipo(e.target.value)} className="w-full appearance-none bg-ms-surface border border-ms-border rounded-xl px-2 lg:px-3 py-2.5 text-xs lg:text-sm text-ms-dark outline-none focus:border-ms-blue pr-6 lg:pr-8">
                    <option value="">Tipo</option>
                    {['Efetivo', 'Temporário', 'Freelancer', 'Remoto', 'Híbrido'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
                </div>
              </div>
            </div>
            <button
              onClick={doSearch}
              className="hidden lg:flex items-center justify-center gap-2 bg-ms-blue text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Search size={16} /> Procurar
            </button>
          </div>
        </section>

        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex flex-col gap-4 mb-6 lg:mb-0">
          <div className="bg-white rounded-3xl border border-ms-border p-5 shadow-ios-sm">
            <h3 className="text-base font-bold text-ms-dark">Deixa a IA encontrar a tua vaga ideal</h3>
            <p className="text-xs text-ms-gray mt-1 mb-4">Carrega o teu CV e recebe correspondências instantâneas.</p>
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCvFile(f); e.target.value = '' }}
            />
            <button
              onClick={() => { if (isLoggedIn) cvInputRef.current?.click(); else router.push('/auth/login/') }}
              disabled={cvUploading}
              className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ms-border rounded-2xl py-6 text-ms-gray text-xs mb-3 hover:border-ms-blue/40 hover:text-ms-blue transition-colors disabled:opacity-60"
            >
              <Upload size={20} /> {cvUploading ? cvMsg : 'Carrega o CV aqui'}
            </button>
            <button
              onClick={() => {
                if (!isLoggedIn) { router.push('/auth/login/'); return }
                if (profile?.documentos?.length) router.push('/vagas/')
                else cvInputRef.current?.click()
              }}
              disabled={cvUploading}
              className="w-full bg-ms-dark text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ms-blue transition-colors disabled:opacity-60"
            >
              Encontrar Match
            </button>
            {cvMsg && !cvUploading && <p className="text-[10px] text-ms-gray text-center mt-2">{cvMsg}</p>}
          </div>
          <div className="bg-white rounded-3xl border border-ms-border p-5 shadow-ios-sm space-y-4">
            <h3 className="text-sm font-bold text-ms-dark">Filtros rápidos</h3>
            <div>
              <label className="text-[10px] text-ms-gray mb-1 block">Indústria</label>
              <div className="relative">
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && router.push(`/vagas/?area=${encodeURIComponent(e.target.value)}`)}
                  className="w-full appearance-none bg-ms-surface border border-ms-border rounded-xl px-3 py-2 text-xs text-ms-dark outline-none focus:border-ms-blue pr-8"
                >
                  <option value="">Todas</option>
                  {CATEGORIAS_HOME.map(c => <option key={c.key} value={c.label}>{c.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-ms-gray mb-1 block">Modalidade</label>
              <div className="relative">
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && router.push(`/vagas/?modalidade=${encodeURIComponent(e.target.value)}`)}
                  className="w-full appearance-none bg-ms-surface border border-ms-border rounded-xl px-3 py-2 text-xs text-ms-dark outline-none focus:border-ms-blue pr-8"
                >
                  <option value="">Todas</option>
                  {['Presencial', 'Remoto', 'Híbrido'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-ms-gray mb-1 block">Tipo de contrato</label>
              <div className="relative">
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && router.push(`/vagas/?tipo=${encodeURIComponent(e.target.value)}`)}
                  className="w-full appearance-none bg-ms-surface border border-ms-border rounded-xl px-3 py-2 text-xs text-ms-dark outline-none focus:border-ms-blue pr-8"
                >
                  <option value="">Todos</option>
                  {['Efetivo', 'Temporário', 'Estágio', 'Trainee', 'Freelancer'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
              </div>
            </div>
            <Link href="/vagas/?showFilters=1" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ms-blue bg-ms-blue/10 rounded-xl py-2.5 hover:bg-ms-blue/15 transition-colors">
              <SlidersHorizontal size={13} /> Todos os filtros
            </Link>
          </div>
        </aside>
        <div className="min-w-0">

        {/* Atalhos rápidos */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-ms-dark mb-3">Acesso Rápido</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {[
              { href: '/vagas/', label: 'Ver Vagas', icon: Briefcase, bg: 'bg-ms-blue', text: 'text-white' },
              { href: '/trabalho-rapido/', label: 'Trabalho Rápido', icon: Zap, bg: 'bg-sky-50', text: 'text-sky-600' },
              { href: '/pessoas/', label: 'Rede', icon: Users, bg: 'bg-ms-purple-light', text: 'text-ms-purple' },
              { href: '/modelos-cv/', label: 'Modelos CV', icon: FileText, bg: 'bg-emerald-50', text: 'text-emerald-600' },
            ].map(item => {
              const Icon = item.icon
              const solid = item.bg === 'bg-ms-blue' || item.bg === 'bg-ms-dark'
              return (
                <Link key={item.label} href={item.href} className={`flex-shrink-0 w-[160px] sm:w-auto sm:flex-1 flex flex-col gap-3 rounded-3xl p-4 border transition-all hover:shadow-ios ${solid ? `${item.bg} border-transparent` : 'bg-white border-ms-border hover:border-ms-blue/30'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${solid ? 'bg-white/20' : item.bg}`}>
                    <Icon size={18} className={item.text} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold leading-tight ${solid ? 'text-white' : 'text-ms-dark'}`}>{item.label}</p>
                    <p className={`text-[10px] mt-0.5 ${solid ? 'text-white/70' : 'text-ms-gray'}`}>Abrir</p>
                  </div>
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
            <Link href="/trabalho-rapido/" className="bg-gradient-to-br from-ms-blue to-sky-500 rounded-3xl p-4 text-white relative overflow-hidden hover:shadow-ios transition-shadow shadow-ios-sm">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <Zap size={24} className="mb-3" />
              <h3 className="text-sm font-bold mb-1">Trabalho Rápido</h3>
              <p className="text-[10px] text-white/80 mb-3">Empregos diretos. Paga uma taxa mensal e acede aos contactos.</p>
              <span className="inline-flex items-center text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">Saber mais</span>
            </Link>
            <Link href={isLoggedIn ? `/dashboard/${userRole}/?tab=perfil` : '/auth/registar/'} className="bg-gradient-to-br from-ms-blue to-ms-purple rounded-3xl p-4 text-white relative overflow-hidden hover:shadow-ios transition-shadow shadow-ios-sm">
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
                  className="snap-start flex-shrink-0 w-72 card p-4 shadow-ios-sm hover:border-red-400 hover:shadow-ios transition-all group"
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
            <div className="card p-8 text-center shadow-ios-sm">
              <Briefcase size={32} className="text-ms-gray mx-auto mb-3" />
              <p className="text-sm text-ms-gray">Nenhuma vaga encontrada</p>
              {activeFilter === 'Favoritos' && <p className="text-xs text-ms-gray mt-1">Guarda vagas clicando no coração</p>}
              <button onClick={() => { setActiveFilter('Todas'); setSearchQuery('') }} className="text-xs text-ms-blue font-medium mt-3">Limpar filtros</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {mainJobs.slice(0, 9).map((job: any) => <JobCard key={job.favId} job={job} featured={job.is_prioritaria || (job.score || 0) >= 20} />)}
            </div>
          )}
        </section>

        {/* LinkedIn jobs (horizontal) */}
        {linkedinJobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold text-ms-dark mb-3">Vagas LinkedIn</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {linkedinJobs.map((job: any) => (
                <a key={job.id} href={job.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-64 card p-4 shadow-ios-sm hover:border-ms-blue/30 transition-all">
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
        </div>
        </div>
      </main>

      <InstallPWA />
    </div>
  )
}
