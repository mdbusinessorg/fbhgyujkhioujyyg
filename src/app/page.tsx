'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import { parseCV } from '@/lib/ai'
import { sortByMatch } from '@/lib/match'
import { social } from '@/lib/social'
import {
  Search, Heart, Bell, Menu, X, Briefcase, User, LogOut, FileText,
  Star, MapPin, Monitor, Banknote, Stethoscope, Megaphone, Scale, GraduationCap, HardHat, Wrench,
  MessageSquare, Zap, Users, Clock, ChevronDown, Newspaper, BookOpen, HeartHandshake, MessageCircle,
  Building2, TrendingUp, Mail, Phone, ArrowRight, LayoutDashboard, Globe, Upload, Sparkles
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

function Reveal({ children, className = '', variant = '', delay = 0 }: { children: React.ReactNode; className?: string; variant?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true)
        obs.disconnect()
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={`neo-reveal ${variant} ${seen ? 'in-view' : ''} ${className}`} style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  )
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const dur = 1800
      const tick = (t: number) => {
        const p = Math.min((t - start) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(to * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{val.toLocaleString('pt-AO')}{suffix}</span>
}

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
  const [navScrolled, setNavScrolled] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvMsg, setCvMsg] = useState('')
  const cvInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      .slice(0, 6)
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

  const heroTitle = config.hero_title || 'O teu próximo emprego está aqui'
  const heroSubtitle = config.hero_subtitle || 'Vagas novas todos os dias das melhores empresas em Angola.'

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
        <div className={`card p-4 shadow-ios-sm hover:shadow-ios transition-all ${featured || recommended ? 'border-ms-blue/20' : ''} relative`}>
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
    <div className="absolute right-0 top-12 w-72 bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-ios border border-white/10 z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Notificações</p>
        <button onClick={() => setShowNotif(false)}><X size={14} className="text-white/60" /></button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-xs text-white/50 text-center py-4">Sem notificações novas</p>
        ) : (
          notifications.map((n, i) => (
            <Link key={i} href={isLoggedIn ? n.href : '/auth/login/'} onClick={() => setShowNotif(false)} className="block px-4 py-3 hover:bg-white/5 border-b border-white/10 last:border-0">
              <p className="text-xs text-white/80 line-clamp-2">{n.text}</p>
            </Link>
          ))
        )}
      </div>
      {isLoggedIn && (
        <Link href={`/dashboard/${userRole}/`} onClick={() => setShowNotif(false)} className="block text-center text-xs text-[#fd9a05] font-medium py-2 border-t border-white/10">
          Ver painel
        </Link>
      )}
    </div>
  )

  const navLinks = [
    { href: '/vagas/', label: 'Vagas' },
    { href: '/trabalho-rapido/', label: 'Trabalho Rápido' },
    { href: '/pessoas/', label: 'Pessoas' },
    { href: '/guia/', label: 'Guia' },
    { href: '/anuncios/', label: 'Anunciar' },
  ]

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* ===== Navbar (transparente → sólida no scroll) ===== */}
      <nav className={`neo-nav fixed top-0 left-0 right-0 z-50 ${navScrolled ? 'scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-[72px]">
          <Link href="/" className="flex items-center gap-2 neo-fade-up" style={{ '--fade-delay': '100ms' } as React.CSSProperties}>
            <Logo iconClassName="h-9 w-9" textClassName="text-white hidden sm:block" />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((l, i) => (
              <Link key={l.href + l.label} href={l.href} className="neo-link neo-fade-up text-[13px] font-medium tracking-wide text-white/80 hover:text-white uppercase" style={{ '--fade-delay': `${150 + i * 60}ms` } as React.CSSProperties}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <div className="relative">
                <button onClick={() => setShowNotif(!showNotif)} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-[#fd9a05] transition-colors relative">
                  <Bell size={18} className="text-white" />
                  {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#fd9a05] rounded-full" />}
                </button>
                {showNotif && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                    <NotificationDropdown />
                  </>
                )}
              </div>
            )}
            {isLoggedIn ? (
              <Link href={`/dashboard/${userRole}/`} className="neo-fade-up hidden sm:inline-flex items-center gap-2 border border-[#fd9a05] text-[#fd9a05] hover:bg-[#fd9a05] hover:text-[#121212] text-[12px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all" style={{ '--fade-delay': '500ms' } as React.CSSProperties}>
                <LayoutDashboard size={14} /> Painel
              </Link>
            ) : (
              <Link href="/auth/registar/" className="neo-fade-up hidden sm:inline-flex items-center border border-[#fd9a05] text-[#fd9a05] hover:bg-[#fd9a05] hover:text-[#121212] text-[12px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all" style={{ '--fade-delay': '500ms' } as React.CSSProperties}>
                Criar Conta
              </Link>
            )}
            <button onClick={() => setShowMenu(true)} className="lg:hidden w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] bg-[#121212] flex flex-col">
          <div className="flex items-center justify-between px-5 h-[72px] border-b border-white/10">
            <Logo iconClassName="h-8 w-8" textClassName="text-white" />
            <button onClick={() => setShowMenu(false)} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-8 space-y-1">
            <Link href="/" onClick={() => setShowMenu(false)} className="block py-3 text-2xl neo-font-heading font-semibold text-[#fd9a05]">Início</Link>
            {navLinks.map(l => (
              <Link key={l.href + l.label} href={l.href} onClick={() => setShowMenu(false)} className="block py-3 text-2xl neo-font-heading font-semibold text-white/85 hover:text-[#fd9a05] transition-colors">{l.label}</Link>
            ))}
            <Link href="/premium/" onClick={() => setShowMenu(false)} className="block py-3 text-2xl neo-font-heading font-semibold text-white/85">MÔ SALO PRO</Link>
            <Link href="/mensagens/" onClick={() => setShowMenu(false)} className="block py-3 text-2xl neo-font-heading font-semibold text-white/85">Mensagens</Link>
          </nav>
          <div className="px-5 pb-8 space-y-3">
            {isLoggedIn ? (
              <>
                <Link href={`/dashboard/${userRole}/`} onClick={() => setShowMenu(false)} className="neo-btn-orange block text-center text-[#121212] font-bold uppercase tracking-wider text-sm py-4 rounded-full">Painel</Link>
                <button onClick={handleLogout} className="block w-full text-center border border-white/20 text-white/70 text-sm py-4 rounded-full">Terminar Sessão</button>
              </>
            ) : (
              <>
                <Link href="/auth/registar/" onClick={() => setShowMenu(false)} className="neo-btn-orange block text-center text-[#121212] font-bold uppercase tracking-wider text-sm py-4 rounded-full">Criar Conta</Link>
                <Link href="/auth/login/" onClick={() => setShowMenu(false)} className="block text-center border border-white/20 text-white/80 text-sm py-4 rounded-full">Entrar</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== Hero full-screen ===== */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${config.hero_image_url || '/images/hero-destaque.jpg'}')` }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(18,18,18,0.88) 0%, rgba(18,18,18,0.55) 45%, rgba(18,18,18,0.72) 75%, rgba(253,154,5,0.35) 100%)' }} />
        <div className="absolute top-24 right-[8%] w-40 h-40 rounded-full bg-[#fd9a05]/20 blur-3xl neo-drift" />
        <div className="absolute bottom-32 left-[6%] w-56 h-56 rounded-full bg-white/5 blur-3xl neo-drift" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 text-center px-5 max-w-4xl mx-auto pt-28 pb-20">
          <div className="flex items-center justify-center gap-4 mb-7">
            <span className="neo-caption-line" style={{ animationDelay: '200ms' }} />
            <span className="neo-fade-up text-[12px] sm:text-sm font-medium tracking-[0.28em] uppercase text-white/90 border border-white/15 bg-white/5 backdrop-blur px-4 py-1.5" style={{ '--fade-delay': '300ms' } as React.CSSProperties}>
              Encontra. Candidata-te. Cresce.
            </span>
            <span className="neo-caption-line" style={{ animationDelay: '200ms' }} />
          </div>

          <h1 className="neo-font-heading text-[42px] sm:text-6xl lg:text-[76px] font-medium leading-[1.05] mb-6">
            {heroTitle.split(' ').map((w, i) => (
              <span key={i} className="neo-hero-word">
                <span style={{ '--word-delay': `${350 + i * 90}ms` } as React.CSSProperties}>{w}{i < heroTitle.split(' ').length - 1 ? '\u00A0' : ''}</span>
              </span>
            ))}
          </h1>

          <p className="neo-fade-up text-white/75 text-sm sm:text-base max-w-xl mx-auto mb-9" style={{ '--fade-delay': '900ms' } as React.CSSProperties}>
            {heroSubtitle}
          </p>

          <div className="neo-fade-up flex flex-col sm:flex-row items-center justify-center gap-4 mb-10" style={{ '--fade-delay': '1050ms' } as React.CSSProperties}>
            <Link href="/vagas/" className="neo-btn-orange inline-flex items-center gap-2 text-[#121212] font-bold uppercase tracking-wider text-[13px] px-9 py-4 rounded-full">
              Ver Vagas <ArrowRight size={15} />
            </Link>
            {isLoggedIn ? (
              <Link href={`/dashboard/${userRole}/`} className="inline-flex items-center gap-2 border border-white/30 text-white hover:border-[#fd9a05] hover:text-[#fd9a05] font-bold uppercase tracking-wider text-[13px] px-9 py-4 rounded-full transition-all">
                O Meu Painel
              </Link>
            ) : (
              <Link href="/auth/login/" className="inline-flex items-center gap-2 border border-white/30 text-white hover:border-[#fd9a05] hover:text-[#fd9a05] font-bold uppercase tracking-wider text-[13px] px-9 py-4 rounded-full transition-all">
                Entrar
              </Link>
            )}
          </div>

          {/* Search pill */}
          <div className="neo-fade-up max-w-xl mx-auto" style={{ '--fade-delay': '1200ms' } as React.CSSProperties}>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-5 py-1.5 flex items-center gap-3">
              <Search size={18} className="text-white/60 flex-shrink-0" />
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
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/50 min-w-0 py-2.5"
              />
              <button
                onClick={() => searchQuery.trim() ? router.push(`/vagas/?q=${encodeURIComponent(searchQuery.trim())}`) : router.push('/vagas/')}
                className="neo-btn-orange text-[#121212] text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full flex-shrink-0"
              >
                Procurar
              </button>
            </div>
          </div>
        </div>

        {/* scroll indicator */}
        <a href="#vagas-destaque" className="absolute bottom-8 left-1/2 -translate-x-1/2 w-7 h-12 rounded-full border border-white/30 flex items-start justify-center pt-2.5">
          <span className="neo-scroll-dot w-1.5 h-1.5 rounded-full bg-[#fd9a05]" />
        </a>
      </section>

      {/* ===== Stats count-up ===== */}
      <section className="border-y border-white/10 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { value: heroStats.vagas, suffix: '', label: 'Vagas Ativas' },
            { value: heroStats.empresas, suffix: '', label: 'Empresas' },
            { value: heroStats.novas, suffix: '', label: 'Novas Esta Semana' },
            { value: 24, suffix: '/7', label: 'Sempre Disponível' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <p className="neo-font-heading text-4xl sm:text-5xl font-medium text-white">
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 mt-2">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Marquee ===== */}
      <div className="overflow-hidden py-8 border-b border-white/10">
        <div className="neo-marquee-track">
          {[0, 1].map(n => (
            <div key={n} className="flex items-center gap-8 pr-8 whitespace-nowrap" aria-hidden={n === 1}>
              {['MÔ SALO', 'VAGAS EM ANGOLA', 'REDE PROFISSIONAL', 'CANDIDATURA AUTOMÁTICA', 'MÔ SALO', 'TRABALHO RÁPIDO'].map((t, i) => (
                <span key={i} className={`neo-font-heading text-4xl sm:text-5xl font-semibold uppercase tracking-wide flex items-center gap-8 ${i % 2 === 0 ? 'text-white' : 'neo-marquee-outline'}`}>
                  {t} <span className="text-[#fd9a05] text-2xl">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===== Vagas em Destaque (cards tipo programa) ===== */}
      {recommendedJobs.length > 0 && (
        <section id="vagas-destaque" className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <Reveal className="text-center mb-14">
              <p className="text-[12px] uppercase tracking-[0.3em] text-[#fd9a05] mb-4">As Nossas Vagas</p>
              <h2 className="neo-font-heading text-3xl sm:text-5xl font-medium">Oportunidades em Destaque</h2>
              <p className="text-white/60 text-sm mt-4 max-w-xl mx-auto">Explora as vagas mais relevantes em Angola, seleccionadas para ti.</p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedJobs.map((job: any, i: number) => {
                const title = job.titulo || job.title
                const company = job.empresa_nome || job.company
                const location = job.localizacao || job.location
                const date = job.created_at || job.first_seen_at || job.posted_at
                const salary = job.salario || job.salary
                return (
                  <Reveal key={job.favId} variant="fade-scale" delay={i * 90}>
                    <Link href={jobHref(job)} className="neo-card block rounded-2xl overflow-hidden bg-[#1c1c1c] border border-white/10">
                      <div className="relative h-44 bg-gradient-to-br from-[#2a2a2a] via-[#1c1c1c] to-[#121212] overflow-hidden">
                        <div className="neo-card-img absolute inset-0 flex items-center justify-center">
                          <CompanyLogo company={company} logoUrl={job.logo_url} size={72} rounded="rounded-3xl" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] to-transparent" />
                        {(job.is_prioritaria || (job.score || 0) >= 20) && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#121212] bg-[#fd9a05] px-2.5 py-1 rounded-full">
                            <Star size={10} /> Destaque
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="neo-font-heading text-lg font-semibold leading-snug line-clamp-2 mb-3">{title}</h3>
                        <div className="space-y-1.5 text-xs text-white/55">
                          {company && (
                            <p className="flex items-center gap-2"><Building2 size={12} className="text-[#fd9a05]" /> {company}</p>
                          )}
                          {location && (
                            <p className="flex items-center gap-2"><MapPin size={12} className="text-[#fd9a05]" /> {location}</p>
                          )}
                          {date && (
                            <p className="flex items-center gap-2"><Clock size={12} className="text-[#fd9a05]" /> {getTimeAgo(date)}</p>
                          )}
                        </div>
                        {salary && <p className="mt-3 text-xs font-semibold text-[#fd9a05]">{salary}</p>}
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
            <Reveal className="text-center mt-12" variant="fade-in" delay={200}>
              <Link href="/vagas/" className="neo-btn-orange inline-flex items-center gap-2 text-[#121212] font-bold uppercase tracking-wider text-[13px] px-9 py-4 rounded-full">
                Ver Todas as Vagas <ArrowRight size={15} />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ===== Sobre ===== */}
      <section className="py-20 sm:py-28 bg-[#0d0d0d] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal variant="fade-left">
            <div className="flex items-center gap-5 mb-8">
              <Logo iconClassName="h-14 w-14" textClassName="text-white" />
            </div>
            <h2 className="neo-font-heading text-3xl sm:text-4xl font-medium mb-6">A plataforma de emprego de Angola</h2>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-5">
              O MÔ SALO conecta candidatos e empresas em todo o país. Ao contrário dos portais tradicionais, oferece correspondência inteligente por IA, candidatura automática, networking profissional e ferramentas de CV — tudo num só lugar.
            </p>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed">
              Vagas internas e agregadas dos maiores portais de emprego, actualizadas todos os dias. Com o MÔ SALO, procurar emprego torna-se uma experiência simples e transformadora.
            </p>
            <Link href="/guia/" className="inline-flex items-center gap-2 text-[#fd9a05] text-[13px] font-bold uppercase tracking-wider mt-7 neo-link">
              Saber mais <ArrowRight size={14} />
            </Link>
          </Reveal>
          <Reveal variant="fade-right" delay={150}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Briefcase, title: 'Vagas Agregadas', desc: 'Oportunidades internas e dos maiores portais, num só feed.' },
                { icon: Zap, title: 'Candidatura Automática', desc: 'IA gera a tua carta e envia a candidatura por ti.' },
                { icon: Users, title: 'Rede Profissional', desc: 'Conecta-te com profissionais e recrutadores angolanos.' },
                { icon: FileText, title: 'CV Inteligente', desc: 'Modelos ATS prontos a descarregar em Word ou PDF.' },
              ].map((f, i) => {
                const Icon = f.icon
                return (
                  <Reveal key={f.title} variant="fade-scale" delay={i * 90}>
                    <div className="neo-feature rounded-2xl p-5 bg-[#161616] h-full">
                      <div className="w-11 h-11 rounded-xl bg-[#fd9a05]/15 flex items-center justify-center mb-4">
                        <Icon size={20} className="text-[#fd9a05]" />
                      </div>
                      <h3 className="neo-font-heading text-base font-semibold mb-2">{f.title}</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Áreas Populares ===== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-[12px] uppercase tracking-[0.3em] text-[#fd9a05] mb-4">Áreas</p>
            <h2 className="neo-font-heading text-3xl sm:text-5xl font-medium">Áreas Populares</h2>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIAS_HOME.map((cat, i) => {
              const Icon = cat.icon
              return (
                <Reveal key={cat.key} variant="fade-scale" delay={i * 60}>
                  <Link href={`/vagas/?area=${encodeURIComponent(cat.label)}`} className="neo-feature neo-card block rounded-2xl bg-[#161616] p-6 text-center group">
                    <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-[#fd9a05]/15 flex items-center justify-center mx-auto mb-4 transition-colors">
                      <Icon size={22} className="text-white/70 group-hover:text-[#fd9a05] transition-colors" />
                    </div>
                    <p className="text-sm font-semibold">{cat.label}</p>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA cards ===== */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Reveal variant="fade-left">
            <Link href="/trabalho-rapido/" className="neo-card block rounded-3xl p-8 sm:p-10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fd9a05 0%, #e07f00 100%)' }}>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
              <div className="absolute -top-8 -right-4 w-28 h-28 bg-white/10 rounded-full" />
              <Zap size={32} className="text-[#121212] mb-5" />
              <h3 className="neo-font-heading text-2xl font-semibold text-[#121212] mb-3">Trabalho Rápido</h3>
              <p className="text-sm text-[#121212]/75 mb-6 max-w-sm">Empregos diretos com contacto do empregador. Paga uma taxa mensal e acede a tudo.</p>
              <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#121212] bg-white/25 px-4 py-2 rounded-full">Saber mais <ArrowRight size={13} /></span>
            </Link>
          </Reveal>
          <Reveal variant="fade-right" delay={120}>
            <Link href={isLoggedIn ? `/dashboard/${userRole}/?tab=perfil` : '/auth/registar/'} className="neo-card block rounded-3xl p-8 sm:p-10 relative overflow-hidden bg-[#1c1c1c] border border-white/10">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#fd9a05]/10 rounded-full" />
              <User size={32} className="text-[#fd9a05] mb-5" />
              <h3 className="neo-font-heading text-2xl font-semibold mb-3">Perfil de Candidato</h3>
              <p className="text-sm text-white/60 mb-6 max-w-sm">Completa o teu perfil e deixa as empresas encontrarem-te. Match inteligente incluído.</p>
              <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#fd9a05] border border-[#fd9a05]/40 px-4 py-2 rounded-full">Criar perfil <ArrowRight size={13} /></span>
            </Link>
          </Reveal>
          <Reveal variant="fade-right" delay={200} className="sm:col-span-2 lg:col-span-1">
            <div className="neo-card rounded-3xl p-8 sm:p-10 relative overflow-hidden bg-[#1c1c1c] border border-white/10 h-full">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#fd9a05]/10 rounded-full" />
              <Sparkles size={32} className="text-[#fd9a05] mb-5" />
              <h3 className="neo-font-heading text-2xl font-semibold mb-3">Match com IA</h3>
              <p className="text-sm text-white/60 mb-6">Carrega o teu CV e a IA encontra as vagas ideais para ti.</p>
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCvFile(f); e.target.value = '' }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => { if (isLoggedIn) cvInputRef.current?.click(); else router.push('/auth/login/') }}
                  disabled={cvUploading}
                  className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#fd9a05] border-2 border-dashed border-[#fd9a05]/50 px-4 py-2.5 rounded-full hover:bg-[#fd9a05]/10 transition-colors disabled:opacity-60"
                >
                  <Upload size={14} /> {cvUploading ? cvMsg : 'Carregar CV'}
                </button>
                <button
                  onClick={() => {
                    if (!isLoggedIn) { router.push('/auth/login/'); return }
                    if (profile?.documentos?.length) router.push('/vagas/')
                    else cvInputRef.current?.click()
                  }}
                  disabled={cvUploading}
                  className="neo-btn-orange inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#121212] px-4 py-2.5 rounded-full disabled:opacity-60"
                >
                  Encontrar Match
                </button>
              </div>
              {cvMsg && !cvUploading && <p className="text-[11px] text-white/50 mt-4">{cvMsg}</p>}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Secção clara: vagas + notícias (conteúdo funcional) ===== */}
      <section className="bg-ms-surface text-ms-dark rounded-t-[40px] sm:rounded-t-[56px] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="mb-8">
            <h2 className="neo-font-heading text-3xl sm:text-4xl font-medium text-ms-dark">Explorar Vagas</h2>
          </Reveal>

          {/* filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
            {QUICK_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                  activeFilter === f.key ? 'bg-[#121212] text-white shadow-sm' : 'bg-white text-ms-gray border border-ms-border hover:bg-ms-border'
                }`}
              >
                {f.label === 'Favoritos' ? <span className="flex items-center gap-1"><Heart size={12} /> Favoritos</span> : f.label}
              </button>
            ))}
          </div>

          {/* Vagas de Hoje */}
          {todayJobs.length > 0 && (
            <Reveal className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="neo-font-heading text-xl font-semibold text-ms-dark flex items-center gap-2">Vagas de Hoje <span className="text-[10px] font-bold text-[#121212] bg-[#fd9a05] px-2 py-0.5 rounded-full">{todayJobs.length}</span></h3>
                <Link href="/vagas/" className="text-xs text-ms-blue font-medium">Ver todas</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {todayJobs.slice(0, 8).map((job: any) => (
                  <div key={job.favId} className="flex-shrink-0 w-72">
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {/* Job listings */}
          <Reveal className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="neo-font-heading text-xl font-semibold text-ms-dark">
                {activeFilter === 'Favoritos' ? 'Favoritos' : activeFilter === 'Todas' ? 'Vagas Disponíveis' : activeFilter}
              </h3>
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
              <div className="grid md:grid-cols-2 gap-3">
                {mainJobs.slice(0, 6).map((job: any) => <JobCard key={job.favId} job={job} featured={job.is_prioritaria || (job.score || 0) >= 20} />)}
              </div>
            )}
          </Reveal>

          {/* Anúncios pagos */}
          <Reveal variant="fade-in" className="mb-12">
            <PaidAdsCarousel />
          </Reveal>

          {/* Notícias */}
          {noticias.length > 0 && (
            <Reveal className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                    <Newspaper size={16} className="text-red-600" />
                  </div>
                  <h3 className="neo-font-heading text-xl font-semibold text-ms-dark">Últimas Notícias</h3>
                </div>
                <span className="text-[10px] text-ms-gray">{noticias[0]?.source || 'Jornal de Angola'}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 no-scrollbar -mx-5 px-5">
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
            </Reveal>
          )}

          {/* Estágio */}
          {estagioJobs.length > 0 && (
            <Reveal className="mb-12">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-7 h-7 rounded-lg bg-ms-purple-light flex items-center justify-center">
                      <BookOpen size={16} className="text-ms-blue" />
                    </div>
                    <h3 className="neo-font-heading text-xl font-semibold text-ms-dark">Programas de Estágio</h3>
                  </div>
                  <p className="text-[10px] text-ms-gray pl-9">Dá o primeiro passo na tua carreira</p>
                </div>
                <Link href="/vagas/?q=estágio" className="text-xs text-ms-blue font-medium whitespace-nowrap mt-2">Ver todas</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 no-scrollbar -mx-5 px-5">
                {estagioJobs.map((job: any) => (
                  <div key={job.favId} className="snap-start flex-shrink-0 w-72">
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {/* Voluntariado */}
          {volunteerJobs.length > 0 && (
            <Reveal className="mb-12">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                      <HeartHandshake size={16} className="text-green-600" />
                    </div>
                    <h3 className="neo-font-heading text-xl font-semibold text-ms-dark">Voluntariado</h3>
                  </div>
                  <p className="text-[10px] text-ms-gray pl-9">Contribui e cresce com causas importantes</p>
                </div>
                <Link href="/vagas/?q=voluntariado" className="text-xs text-ms-blue font-medium whitespace-nowrap mt-2">Ver todas</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 no-scrollbar -mx-5 px-5">
                {volunteerJobs.map((job: any) => (
                  <div key={job.favId} className="snap-start flex-shrink-0 w-72">
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {/* LinkedIn */}
          {linkedinJobs.length > 0 && (
            <Reveal>
              <h3 className="neo-font-heading text-xl font-semibold text-ms-dark mb-4">Vagas LinkedIn</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {linkedinJobs.map((job: any) => (
                  <a key={job.id} href={job.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-64 card p-4 shadow-ios-sm hover:border-ms-blue/30 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Globe size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-ms-dark line-clamp-2">{job.titulo}</p>
                        <p className="text-[10px] text-ms-gray">{job.empresa} {job.localizacao ? `• ${job.localizacao}` : ''}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ===== Contacto ===== */}
      <section className="py-20 sm:py-28 bg-[#121212]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-[12px] uppercase tracking-[0.3em] text-[#fd9a05] mb-4">Estamos Aqui Para Ajudar</p>
            <h2 className="neo-font-heading text-3xl sm:text-5xl font-medium">Contacta-nos</h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { icon: Mail, label: 'Email', value: 'matiasdomingos70@gmail.com', href: 'mailto:matiasdomingos70@gmail.com' },
              { icon: Phone, label: 'Telefone', value: '+244 926 115 429', href: 'tel:+244926115429' },
              { icon: MessageCircle, label: 'WhatsApp', value: '+244 926 115 429', href: 'https://wa.me/244926115429' },
              { icon: MapPin, label: 'Localização', value: 'Luanda, Angola', href: undefined },
            ].map((c, i) => {
              const Icon = c.icon
              const inner = (
                <div className="neo-feature neo-card rounded-2xl bg-[#161616] p-6 text-center h-full">
                  <div className="w-11 h-11 rounded-full bg-[#fd9a05]/15 flex items-center justify-center mx-auto mb-4">
                    <Icon size={20} className="text-[#fd9a05]" />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/45 mb-2">{c.label}</p>
                  <p className="text-xs font-medium text-white/85 break-words">{c.value}</p>
                </div>
              )
              return (
                <Reveal key={c.label} variant="fade-scale" delay={i * 90}>
                  {c.href ? <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{inner}</a> : inner}
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#0a0a0a] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <Reveal variant="fade-in">
              <Logo className="mb-4" iconClassName="h-9 w-9" textClassName="text-white" />
              <p className="text-white/50 text-xs leading-relaxed">
                Plataforma de recrutamento angolana. Conectamos talentos às melhores oportunidades. Junta-te ao MÔ SALO!
              </p>
            </Reveal>
            <Reveal variant="fade-in" delay={80}>
              <h3 className="neo-font-heading font-semibold mb-4 text-[12px] uppercase tracking-[0.2em] text-white/80">Plataforma</h3>
              <div className="space-y-2.5">
                <Link href="/vagas/" className="block text-white/50 hover:text-[#fd9a05] text-xs transition-colors">Vagas</Link>
                <Link href="/pessoas/" className="block text-white/50 hover:text-[#fd9a05] text-xs transition-colors">Pessoas</Link>
                <Link href="/guia/" className="block text-white/50 hover:text-[#fd9a05] text-xs transition-colors">Guia do Candidato</Link>
                <Link href="/modelos-cv/" className="block text-white/50 hover:text-[#fd9a05] text-xs transition-colors">Modelos de CV</Link>
              </div>
            </Reveal>
            <Reveal variant="fade-in" delay={160}>
              <h3 className="neo-font-heading font-semibold mb-4 text-[12px] uppercase tracking-[0.2em] text-white/80">Para Empresas</h3>
              <div className="space-y-2.5">
                <Link href="/anuncios/" className="block text-white/50 hover:text-[#fd9a05] text-xs transition-colors">Anunciar</Link>
                <Link href="/auth/registar/" className="block text-white/50 hover:text-[#fd9a05] text-xs transition-colors">Publicar Vagas</Link>
                <Link href="/auth/registar/" className="block text-white/50 hover:text-[#fd9a05] text-xs transition-colors">Área do Recrutador</Link>
                <Link href="/premium/" className="block text-white/50 hover:text-[#fd9a05] text-xs transition-colors">MÔ SALO PRO</Link>
              </div>
            </Reveal>
            <Reveal variant="fade-in" delay={240}>
              <h3 className="neo-font-heading font-semibold mb-4 text-[12px] uppercase tracking-[0.2em] text-white/80">Contacto</h3>
              <div className="space-y-2.5 text-xs text-white/50">
                <p className="flex items-center gap-2"><Mail size={13} className="text-[#fd9a05]" /> matiasdomingos70@gmail.com</p>
                <p className="flex items-center gap-2"><Phone size={13} className="text-[#fd9a05]" /> +244 926 115 429</p>
                <p className="flex items-center gap-2"><MapPin size={13} className="text-[#fd9a05]" /> Luanda, Angola</p>
              </div>
            </Reveal>
          </div>
          <div className="border-t border-white/10 mt-12 pt-6 text-center">
            <p className="text-white/35 text-[11px]">©{new Date().getFullYear()} MÔ SALO. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <InstallPWA />
    </div>
  )
}
