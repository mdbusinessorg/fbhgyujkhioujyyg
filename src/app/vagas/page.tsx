'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, SlidersHorizontal, Briefcase, Star, Globe, X, MessageCircle, LogIn, History, Eye, BookmarkCheck, Filter } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import JobListCard from '@/components/JobListCard'
import FilterSheet from './FilterSheet'
import { sortByMatch, computeJobMatchScore } from '@/lib/match'
import { useSavedJobs } from '@/lib/bookmarks'
import { useRecents, recordSearch } from '@/lib/recents'
import { toast } from '@/lib/toast'

const EXT_PAGE_SIZE = 20
const THREE_WEEKS = 21 * 24 * 60 * 60 * 1000
const jobDate = (j: any) => j?.created_at || j?.first_seen_at || j?.posted_at
const isTodayDate = (date?: string) => {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}
const isOlderThan3Weeks = (j: any) => {
  const d = jobDate(j)
  return !!d && (Date.now() - new Date(d).getTime()) > THREE_WEEKS
}

const CATEGORIAS = [
  { key: 'Todas', label: 'Todas', match: '', external: '' },
  { key: 'TI', label: 'Tecnologia', match: 'Tecnologia', external: 'Tecnologia' },
  { key: 'Financas', label: 'Finanças', match: 'Finanças', external: 'Finanças' },
  { key: 'Engenharia', label: 'Engenharia', match: 'Engenharia', external: 'Engenharia' },
  { key: 'Saude', label: 'Saúde', match: 'Saúde', external: 'Saúde' },
  { key: 'Marketing', label: 'Marketing', match: 'Marketing', external: 'Marketing' },
  { key: 'Direito', label: 'Direito', match: 'Direito', external: 'Direito' },
  { key: 'Petroleo', label: 'Petróleo', match: 'Petróleo', external: 'Petróleo' },
  { key: 'Educacao', label: 'Educação', match: 'Educação', external: 'Educação' },
  { key: 'Administracao', label: 'Administração', match: 'Administração', external: 'Administração' },
  { key: 'Contabilidade', label: 'Contabilidade', match: 'Contabilidade', external: 'Contabilidade' },
  { key: 'Logistica', label: 'Logística', match: 'Logística', external: 'Logística' },
  { key: 'Hotelaria', label: 'Hotelaria', match: 'Hotelaria', external: 'Hotelaria' },
  { key: 'Construcao', label: 'Construção', match: 'Construção', external: 'Construção' },
  { key: 'RH', label: 'RH', match: 'Recursos Humanos', external: 'RH' },
  { key: 'Design', label: 'Design', match: 'Design', external: 'Design' },
]

function getCategoryByKeyOrLabel(area: string) {
  return CATEGORIAS.find(c => c.key === area || c.label === area || c.external === area)
}

function getCategoryByKey(key: string) {
  return CATEGORIAS.find(c => c.key === key)
}

const CONTRATOS = ['Todos', 'Efetivo', 'Temporário', 'Estágio', 'Trainee', 'Freelancer']
const MODALIDADES = ['Todas', 'Presencial', 'Remoto', 'Híbrido']
const DEFAULT_LOCATIONS = ['Luanda', 'Benguela', 'Lubango', 'Cabinda', 'Huambo', 'Malanje', 'Namibe', 'Lobito', 'Uíge', 'Kuito', 'Sumbe', 'Angola', 'Remoto']

export default function VagasPage() {
  const [vagas, setVagas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [activeContract, setActiveContract] = useState('Todos')
  const [activeModality, setActiveModality] = useState('Todas')
  const [activeLocation, setActiveLocation] = useState('Todas')
  const [showFilters, setShowFilters] = useState(false)
  const [onlyToday, setOnlyToday] = useState(false)
  const [hideOld, setHideOld] = useState(false)
  const [onlyApply, setOnlyApply] = useState(false)
  const [onlySalary, setOnlySalary] = useState(false)
  const [source, setSource] = useState<'mosalo' | 'externas'>('externas')
  const [allExternal, setAllExternal] = useState<any[]>([])
  const [extLoaded, setExtLoaded] = useState(false)
  const [extPage, setExtPage] = useState(1)
  const [loadingExternal, setLoadingExternal] = useState(false)
  const [externalError, setExternalError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('candidato')
  const [profile, setProfile] = useState<any>(null)
  const [vagasLoaded, setVagasLoaded] = useState(false)
  const [savedOnly, setSavedOnly] = useState(false)
  const { keys: savedKeys, toggle: toggleSaved } = useSavedJobs()
  const { searches: recentSearches, views: recentViews, clearSearch: removeSearchTerm } = useRecents()
  const recentesRef = useRef<HTMLElement>(null)

  const saveJob = (kind: 'int' | 'ext', j: any) => {
    const nowSaved = toggleSaved({ key: `${kind}:${j.id}`, kind, id: j.id, title: j.titulo || j.title || 'Vaga', company: j.empresa_nome || j.company || '' })
    toast(nowSaved ? 'Vaga guardada nas tuas guardadas' : 'Vaga removida das guardadas', nowSaved ? 'success' : 'info')
  }

  const syncUserFromSession = async (session: any) => {
    if (session?.user?.email) {
      const { data, error } = await supabase.from('users').select('role, nome, id').eq('email', session.user.email).single()
      if (!error && data) {
        setIsLoggedIn(true)
        setUserRole(data.role || 'candidato')
        const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', data.id).single()
        setProfile(prof || null)
        return
      }
    }
    setIsLoggedIn(!!session)
    setUserRole('candidato')
    setProfile(null)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await syncUserFromSession(session)

      const { data } = await supabase.from('vagas').select('*').eq('status', 'aberta').order('is_prioritaria', { ascending: false }).order('created_at', { ascending: false })
      if (data) {
        setVagas(data)
      }
      setVagasLoaded(true)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUserFromSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadExternalJobs = async () => {
    if (extLoaded) return
    setLoadingExternal(true)
    setExternalError('')
    try {
      const res = await fetch('/external-jobs.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setAllExternal(Array.isArray(data.jobs) ? data.jobs : [])
    } catch {
      setExternalError('Não foi possível carregar vagas agora.')
      setAllExternal([])
    }
    setExtLoaded(true)
    setLoadingExternal(false)
  }

  useEffect(() => {
    if (source === 'externas') loadExternalJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  // Carrega vagas externas logo ao abrir a página para mostrar secção "Recentes"
  useEffect(() => {
    loadExternalJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const area = params.get('area')
    const q = params.get('q')
    const openFilters = params.get('showFilters')
    const recentes = params.get('recentes')
    const loc = params.get('loc')
    const tipo = params.get('tipo')
    const modalidade = params.get('modalidade')
    if (loc) setActiveLocation(loc)
    if (tipo && CONTRATOS.includes(tipo)) setActiveContract(tipo)
    if (modalidade && MODALIDADES.includes(modalidade)) setActiveModality(modalidade)
    if (loc || tipo || modalidade) setShowFilters(true)
    const cat = area ? getCategoryByKeyOrLabel(area) : null
    if (cat) {
      setActiveFilter(cat.key)
    }
    if (q) setSearchQuery(q)
    if (openFilters === '1') setShowFilters(true)
    if (recentes === '1' && recentesRef.current) {
      setTimeout(() => recentesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400)
    }
  }, [])

  const detectContractType = (text: string) => {
    const t = (text || '').toLowerCase()
    if (t.includes('estágio') || t.includes('estagiario') || t.includes('estagiári')) return 'Estágio'
    if (t.includes('trainee')) return 'Trainee'
    if (t.includes('freelancer') || t.includes('freelance') || t.includes('consultor')) return 'Freelancer'
    if (t.includes('temporário') || t.includes('temporaria') || t.includes('tempo determinado') || t.includes('termo certo')) return 'Temporário'
    if (t.includes('efetivo') || t.includes('efectivo') || t.includes('efetiva') || t.includes('indefinido') || t.includes('tempo indeterminado')) return 'Efetivo'
    return null
  }

  const detectModality = (text: string) => {
    const t = (text || '').toLowerCase()
    if (t.includes('híbrido') || t.includes('hibrido') || t.includes('misto')) return 'Híbrido'
    if (t.includes('remoto') || t.includes('teletrabalho') || t.includes('home office') || t.includes('home-office')) return 'Remoto'
    if (t.includes('presencial') || t.includes('no local') || t.includes('no escritório')) return 'Presencial'
    return null
  }

  const normalizeContract = (raw: string | null | undefined, text: string) => {
    const t = (raw || '').toLowerCase()
    if (t.includes('estágio') || t.includes('estagi')) return 'Estágio'
    if (t.includes('trainee')) return 'Trainee'
    if (t.includes('freelancer') || t.includes('serviço') || t.includes('servico') || t.includes('consultor')) return 'Freelancer'
    if (t.includes('determinado') || t.includes('tempor')) return 'Temporário'
    if (t.includes('efetiv') || t.includes('efectiv') || t.includes('indeterminado') || t.includes('integral') || t.includes('full')) return 'Efetivo'
    return detectContractType(text)
  }

  const matchPct = (job: any) => (isLoggedIn && profile ? computeJobMatchScore(job, profile) : 0)

  const filteredExternal = allExternal.filter((j) => {
    if (savedOnly && !savedKeys.has(`ext:${j.id}`)) return false
    if (hideOld && isOlderThan3Weeks(j)) return false
    if (onlyToday && !isTodayDate(jobDate(j))) return false
    const kw = searchQuery.trim().toLowerCase()
    const matchSearch = !kw || j.title?.toLowerCase().includes(kw) || j.company?.toLowerCase().includes(kw) || j.excerpt?.toLowerCase().includes(kw)
    const cat = activeFilter === 'Todas' ? null : getCategoryByKey(activeFilter)
    const matchCat = activeFilter === 'Todas' || (!!cat && (j.category === cat.external || j.category?.includes(cat.external) || cat.external?.includes(j.category)))
    const text = `${j.title || ''} ${j.excerpt || ''}`
    const matchContract = activeContract === 'Todos' || normalizeContract(j.tipo_contrato, text) === activeContract
    const matchModality = activeModality === 'Todas' || detectModality(`${j.modalidade || ''} ${text}`) === activeModality
    const matchLocation = activeLocation === 'Todas' || j.location === activeLocation
    if (onlyApply && !j.has_apply) return false
    if (onlySalary && !j.salary) return false
    return matchSearch && matchCat && matchContract && matchModality && matchLocation
  })
  const stripHtml = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

  const filteredVagas = vagas.filter(v => {
    if (savedOnly && !savedKeys.has(`int:${v.id}`)) return false
    if (hideOld && isOlderThan3Weeks(v)) return false
    if (onlyToday && !isTodayDate(jobDate(v))) return false
    const matchSearch = !searchQuery || v.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) || v.empresa_nome?.toLowerCase().includes(searchQuery.toLowerCase()) || stripHtml(v.descricao || '').toLowerCase().includes(searchQuery.toLowerCase())
    let matchFilter = activeFilter === 'Todas'
    if (!matchFilter) {
      const cat = getCategoryByKey(activeFilter)
      matchFilter = !!cat && !!cat.match && (v.area?.includes(cat.match) || v.titulo?.toLowerCase().includes(cat.match.toLowerCase()) || stripHtml(v.descricao || '').toLowerCase().includes(cat.match.toLowerCase()))
    }
    const text = `${v.titulo || ''} ${stripHtml(v.descricao || '')} ${v.salario || ''}`
    const matchContract = activeContract === 'Todos' || detectContractType(text) === activeContract
    const matchModality = activeModality === 'Todas' || detectModality(text) === activeModality
    const matchLocation = activeLocation === 'Todas' || v.localizacao === activeLocation
    if (onlySalary && !v.salario) return false
    return matchSearch && matchFilter && matchContract && matchModality && matchLocation
  })

  const sortedVagas = sortByMatch(filteredVagas, profile)
  const sortedExternal = sortByMatch(filteredExternal, profile)

  const uniqueLocations = useMemo(() => {
    const counts = new Map<string, number>()
    vagas.forEach(v => { if (v.localizacao) counts.set(v.localizacao, (counts.get(v.localizacao) || 0) + 1) })
    allExternal.forEach(j => { if (j.location) counts.set(j.location, (counts.get(j.location) || 0) + 1) })
    const locs = new Set<string>(DEFAULT_LOCATIONS)
    counts.forEach((n, loc) => { if (n >= 8 && loc.length <= 22) locs.add(loc) })
    return Array.from(locs).sort()
  }, [vagas, allExternal])

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  const HOURS_60 = 60 * 60 * 60 * 1000
  const isRecent = (date?: string) => !!date && (Date.now() - new Date(date).getTime()) <= HOURS_60

  const recentVagas = sortedVagas.filter(v => isRecent(v.created_at))
  const olderVagas = sortedVagas.filter(v => !isRecent(v.created_at))
  const destaques = olderVagas.filter(v => v.is_prioritaria)
  const normais = olderVagas.filter(v => !v.is_prioritaria)

  const recentExternal = sortedExternal.filter(j => isRecent(j.first_seen_at))
  const olderExternal = sortedExternal.filter(j => !isRecent(j.first_seen_at))
  const extOlderPages = Math.max(1, Math.ceil(olderExternal.length / EXT_PAGE_SIZE))

  const JobCard = ({ v, variant, index = 0 }: { v: any; variant: 'recent' | 'destaque' | 'normal'; index?: number }) => (
    <JobListCard
      id={v.id}
      href={`/vagas/detalhe/?id=${v.id}`}
      title={v.titulo}
      company={v.empresa_nome}
      location={v.localizacao}
      specs={[detectContractType(`${v.titulo} ${stripHtml(v.descricao || '')}`) || v.tipo_emprego, detectModality(`${v.titulo} ${stripHtml(v.descricao || '')}`), v.nivel_minimo, v.area]}
      salary={v.salario}
      timeAgo={getTimeAgo(v.created_at)}
      matchPct={matchPct(v)}
      isNew={variant === 'recent'}
      isFeatured={variant === 'destaque'}
      excerpt={stripHtml(v.descricao || '').slice(0, 220)}
      loggedIn={isLoggedIn}
      bookmarkKey={`int:${v.id}`}
      saved={savedKeys.has(`int:${v.id}`)}
      onToggleSave={() => saveJob('int', v)}
      applyLabel="Candidatar"
      index={index}
    />
  )

  const ExternalJobCard = ({ j, variant, index = 0 }: { j: any; variant: 'recent' | 'normal'; index?: number }) => (
    <JobListCard
      id={j.id}
      href={`/vagas/externa/?id=${j.id}`}
      title={j.title}
      company={j.company}
      logoUrl={j.logo_url}
      location={j.location}
      specs={[normalizeContract(j.tipo_contrato, `${j.title || ''} ${j.excerpt || ''}`), j.modalidade, j.category !== 'Outro' ? j.category : null]}
      salary={j.salary}
      timeAgo={getTimeAgo(j.first_seen_at || j.posted_at)}
      matchPct={matchPct(j)}
      isNew={variant === 'recent'}
      isFeatured={(j.score || 0) >= 20}
      isExternal
      excerpt={stripHtml(j.excerpt || j.description || '')}
      loggedIn={isLoggedIn}
      bookmarkKey={`ext:${j.id}`}
      saved={savedKeys.has(`ext:${j.id}`)}
      onToggleSave={() => saveJob('ext', j)}
      applyLabel="Candidatar-se"
      index={index}
    />
  )

  const FilterGroup = ({ title, options, value, onChange, allLabel = 'Todas' }: { title: string; options: string[]; value: string; onChange: (v: string) => void; allLabel?: string }) => (
    <div>
      <p className="text-[11px] font-bold text-ms-dark mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
        {[allLabel, ...options].map((o) => (
          <button key={o} onClick={() => onChange(o)} className={`chip-toggle text-[11px] font-medium px-2.5 py-1.5 rounded-full border ${value === o ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-gray border-ms-border'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )

  const JobCardSkeleton = ({ index = 0 }: { index?: number }) => (
    <div className="bg-white rounded-2xl border border-ms-border p-4 jobcard-enter" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start gap-3">
        <div className="skeleton w-[46px] h-[46px] rounded-xl" />
        <div className="flex-1">
          <div className="skeleton h-3.5 rounded w-3/4" />
          <div className="skeleton h-3 rounded w-1/2 mt-2" />
          <div className="skeleton h-2.5 rounded w-2/3 mt-2" />
        </div>
      </div>
      <div className="skeleton h-3 rounded w-1/3 mt-4" />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-ms-border/50">
        <div className="skeleton h-3 rounded w-16" />
        <div className="skeleton h-7 rounded-full w-24" />
      </div>
    </div>
  )

  const resultsCount = source === 'externas' ? filteredExternal.length : filteredVagas.length

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 pt-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-ms-surface rounded-full px-4 py-3 mb-2 border-2 border-ms-blue/10 focus-within:border-ms-blue">
          <Search size={18} className="text-ms-gray flex-shrink-0" />
          <input
            type="text"
            placeholder="título da vaga ou palavra-chave"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { recordSearch(searchQuery); if (source === 'externas') setExtPage(1) } }}
            className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray"
          />
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-ms-blue"
            aria-label="Abrir filtros"
          >
            <SlidersHorizontal size={14} className="text-white" />
          </button>
        </div>

        {/* Pesquisas recentes */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
            <History size={13} className="text-ms-gray flex-shrink-0" />
            {recentSearches.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 bg-ms-surface border border-ms-border text-xs text-ms-dark pl-3 pr-1.5 py-1.5 rounded-full whitespace-nowrap">
                <button onClick={() => setSearchQuery(s)} className="font-medium">{s}</button>
                <button onClick={() => removeSearchTerm(s)} className="text-ms-gray hover:text-red-500" aria-label={`Remover ${s}`}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Guest CTA */}
        {!isLoggedIn && (
          <div className="bg-gradient-to-r from-ms-blue to-ms-purple rounded-2xl p-4 mb-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Entre para ver as vagas completas</p>
              <p className="text-xs text-white/80 mt-0.5">Vês título e empresa, mas as descrições completas e candidatura exigem login. Fala connosco no WhatsApp se precisares de ajuda.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/auth/login/" className="inline-flex items-center gap-1 bg-white text-ms-blue text-xs font-bold px-3 py-2 rounded-xl hover:bg-ms-surface">
                <LogIn size={14} /> Entrar
              </Link>
              <a
                href={`https://wa.me/244934859497?text=${encodeURIComponent('Olá! Vi as vagas no MÔ SALO e quero saber mais.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-600"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>
        )}

        <div className="lg:flex lg:gap-6 lg:items-start">
          {/* Desktop filters sidebar (estilo Mirantes) */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-ms-surface rounded-2xl p-4 space-y-5 sticky top-20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ms-dark flex items-center gap-1"><Filter size={14} /> Todos os filtros</span>
                <button
                  onClick={() => { setActiveContract('Todos'); setActiveModality('Todas'); setActiveLocation('Todas'); setSearchQuery(''); setActiveFilter('Todas'); setOnlyApply(false); setOnlySalary(false) }}
                  className="text-[10px] text-ms-blue font-medium flex items-center gap-0.5"
                >
                  <X size={10} /> Limpar
                </button>
              </div>
              <FilterGroup title="Localização" options={uniqueLocations} value={activeLocation} onChange={setActiveLocation} />
              <FilterGroup title="Modalidade" options={MODALIDADES.filter(m => m !== 'Todas')} value={activeModality} onChange={setActiveModality} />
              <FilterGroup title="Tipo de contrato" options={CONTRATOS.filter(c => c !== 'Todos')} value={activeContract} onChange={setActiveContract} allLabel="Todos" />
              <div className="pt-3 border-t border-ms-border">
                <p className="text-[11px] font-bold text-ms-dark mb-2">Extras</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setOnlyApply(v => !v)} className={`chip-toggle text-[11px] font-medium px-2.5 py-1.5 rounded-full border ${onlyApply ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-gray border-ms-border'}`}>Candidatura directa</button>
                  <button onClick={() => setOnlySalary(v => !v)} className={`chip-toggle text-[11px] font-medium px-2.5 py-1.5 rounded-full border ${onlySalary ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-gray border-ms-border'}`}>Com salário</button>
                  <button onClick={() => setOnlyToday(v => !v)} className={`chip-toggle text-[11px] font-medium px-2.5 py-1.5 rounded-full border ${onlyToday ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-gray border-ms-border'}`}>Só de hoje</button>
                </div>
              </div>
            </div>
          </aside>
          <div className="flex-1 min-w-0">

        {/* Source toggle: MÔ SALO vs External (CareerJet) */}
        <div className="flex gap-2 mb-4 bg-ms-surface rounded-xl p-1">
          <button
            onClick={() => setSource('externas')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${source === 'externas' ? 'bg-white text-ms-blue shadow-sm' : 'text-ms-gray'}`}
          >
            <Globe size={14} /> Vagas
          </button>
          <button
            onClick={() => setSource('mosalo')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${source === 'mosalo' ? 'bg-white text-ms-blue shadow-sm' : 'text-ms-gray'}`}
          >
            <Briefcase size={14} /> MÔ SALO
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
          <button
            onClick={() => setSavedOnly(v => !v)}
            className={`chip-toggle inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full whitespace-nowrap font-medium ${
              savedOnly ? 'bg-ms-blue text-white' : 'bg-ms-surface text-ms-gray border border-ms-border hover:bg-ms-border'
            }`}
          >
            <BookmarkCheck size={12} /> Guardadas{savedKeys.size > 0 ? ` (${savedKeys.size})` : ''}
          </button>
          <button
            onClick={() => setOnlyToday(v => !v)}
            className={`chip-toggle text-xs px-4 py-2 rounded-full whitespace-nowrap font-medium ${
              onlyToday ? 'bg-ms-blue text-white' : 'bg-ms-surface text-ms-gray border border-ms-border hover:bg-ms-border'
            }`}
          >
            Vagas do dia
          </button>
          <button
            onClick={() => setHideOld(v => !v)}
            className={`chip-toggle text-xs px-4 py-2 rounded-full whitespace-nowrap font-medium ${
              hideOld ? 'bg-ms-blue text-white' : 'bg-ms-surface text-ms-gray border border-ms-border hover:bg-ms-border'
            }`}
          >
            Sem vagas +3 semanas
          </button>
          {CATEGORIAS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`chip-toggle text-xs px-4 py-2 rounded-full whitespace-nowrap font-medium ${
                activeFilter === f.key ? 'bg-ms-blue text-white' : 'bg-ms-surface text-ms-gray border border-ms-border hover:bg-ms-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Vistas recentemente */}
        {!searchQuery && !savedOnly && recentViews.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-ms-gray uppercase tracking-wide mb-2 flex items-center gap-1"><Eye size={12} /> Vistas recentemente</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {recentViews.slice(0, 8).map((v) => (
                <Link
                  key={`${v.kind}:${v.id}`}
                  href={v.kind === 'ext' ? `/vagas/externa/?id=${v.id}` : `/vagas/detalhe/?id=${v.id}`}
                  className="flex-shrink-0 w-[190px] bg-white border border-ms-border rounded-xl px-3 py-2.5 hover:border-ms-blue/40 press"
                >
                  <p className="text-xs font-semibold text-ms-dark line-clamp-1">{v.title}</p>
                  <p className="text-[10px] text-ms-gray line-clamp-1 mt-0.5">{v.company}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Vagas Recentes (internas + externas, visível sempre no topo) */}
        {(recentVagas.length > 0 || recentExternal.length > 0) && (
          <section ref={recentesRef} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-sm font-semibold text-ms-dark">Vagas Recentes <span className="text-xs font-normal text-ms-gray">(últimas 60h)</span></h2>
            </div>
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {recentExternal.slice(0, 10).map((j, i) => <ExternalJobCard key={j.id} j={j} variant="recent" index={i} />)}
              {recentVagas.map((v, i) => <JobCard key={v.id} v={v} variant="recent" index={i} />)}  
            </div>
          </section>
        )}

        {/* External jobs (aggregated Angolan boards, stored natively) */}
        {source === 'externas' && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-ms-blue" />
                <h2 className="text-sm font-semibold text-ms-dark">Vagas de Emprego em Angola</h2>
              </div>
              <button onClick={() => { setExtLoaded(false); setAllExternal([]); loadExternalJobs() }} className="text-xs text-ms-blue font-medium">Actualizar</button>
            </div>
            <p className="text-xs text-ms-gray mb-1">{filteredExternal.length} vagas encontradas</p>
            <p className="text-xs text-ms-gray mb-4">Lê o resumo de cada vaga sem precisar abrir. Ao candidatar, vais direto à fonte oficial da empresa.</p>

            {loadingExternal ? (
              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {[0, 1, 2, 3, 4, 5].map(i => <JobCardSkeleton key={i} index={i} />)}
              </div>
            ) : externalError ? (
              <div className="text-center py-12">
                <Globe size={32} className="text-ms-gray mx-auto mb-3" />
                <p className="text-sm text-ms-gray">{externalError}</p>
                <button onClick={() => { setExtLoaded(false); loadExternalJobs() }} className="text-sm text-ms-blue font-medium mt-2">Tentar novamente</button>
              </div>
            ) : filteredExternal.length === 0 ? (
              <div className="text-center py-12">
                <Globe size={32} className="text-ms-gray mx-auto mb-3" />
                <p className="text-sm text-ms-gray">Sem vagas para esta pesquisa. Actualizamos diariamente.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {olderExternal.slice((extPage - 1) * EXT_PAGE_SIZE, extPage * EXT_PAGE_SIZE).map((j, i) => (
                    <ExternalJobCard key={j.id} j={j} variant="normal" index={i} />
                  ))}
                </div>
                {extOlderPages > 1 && (
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <button
                      onClick={() => {
                        if (extPage > 1) {
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                          setExtPage(extPage - 1)
                        }
                      }}
                      disabled={extPage <= 1 || loadingExternal}
                      className="flex-1 bg-ms-surface text-ms-dark border border-ms-border rounded-full py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-ms-gray self-center">{extPage}/{extOlderPages}</span>
                    <button
                      onClick={() => {
                        if (extPage < extOlderPages) {
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                          setExtPage(extPage + 1)
                        }
                      }}
                      disabled={extPage >= extOlderPages || loadingExternal}
                      className="flex-1 bg-ms-blue text-white rounded-full py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {source === 'mosalo' && (<>
        {/* Vagas em Destaque */}
        {destaques.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <h2 className="text-sm font-semibold text-ms-dark">Vagas em Destaque</h2>
            </div>
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {destaques.map((v, i) => <JobCard key={v.id} v={v} variant="destaque" index={i} />)}
            </div>
          </section>
        )}

        {/* Normal jobs */}
        <section>
          {normais.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-ms-dark mb-1">Todas as Vagas</h2>
              <p className="text-xs text-ms-gray mb-3">{filteredVagas.length} vagas encontradas</p>
            </>
          )}
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {normais.map((v, i) => <JobCard key={v.id} v={v} variant="normal" index={i} />)}
          </div>
          {!vagasLoaded && (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 mt-3">
              {[0, 1, 2, 3].map(i => <JobCardSkeleton key={i} index={i} />)}
            </div>
          )}
        </section>

        {filteredVagas.length === 0 && (
          <div className="text-center py-12">
            <Briefcase size={32} className="text-ms-gray mx-auto mb-3" />
            <p className="text-sm text-ms-gray">Nenhuma vaga encontrada para &ldquo;{activeFilter}&rdquo;</p>
            <button onClick={() => setActiveFilter('Todas')} className="text-sm text-ms-blue font-medium mt-2">Ver todas as vagas</button>
            <button onClick={() => setSource('externas')} className="block mx-auto text-sm text-ms-blue font-medium mt-2">Procurar em vagas externas</button>
          </div>
        )}
        </>)}
          </div>
        </div>
      </main>

      <FilterSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        resultCount={resultsCount}
        locations={uniqueLocations}
        contract={activeContract}
        setContract={setActiveContract}
        modality={activeModality}
        setModality={setActiveModality}
        location={activeLocation}
        setLocation={setActiveLocation}
        onlyToday={onlyToday}
        setOnlyToday={setOnlyToday}
        hideOld={hideOld}
        setHideOld={setHideOld}
        onlyApply={onlyApply}
        setOnlyApply={setOnlyApply}
        onlySalary={onlySalary}
        setOnlySalary={setOnlySalary}
        contracts={CONTRATOS}
        modalities={MODALIDADES}
        onClear={() => { setActiveContract('Todos'); setActiveModality('Todas'); setActiveLocation('Todas'); setSearchQuery(''); setActiveFilter('Todas'); setOnlyApply(false); setOnlySalary(false); setOnlyToday(false); setHideOld(false); setSavedOnly(false) }}
      />
    </div>
  )
}
