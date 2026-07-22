'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, SlidersHorizontal, Heart, Briefcase, ArrowLeft, Home as HomeIcon, User, Star, MapPin, Globe, Building2, X, Filter, ChevronDown } from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'
import Logo from '@/components/Logo'

const EXT_PAGE_SIZE = 20

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
  const [source, setSource] = useState<'mosalo' | 'externas'>('mosalo')
  const [allExternal, setAllExternal] = useState<any[]>([])
  const [extLoaded, setExtLoaded] = useState(false)
  const [extPage, setExtPage] = useState(1)
  const [loadingExternal, setLoadingExternal] = useState(false)
  const [externalError, setExternalError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('candidato')

  const syncUserFromSession = async (session: any) => {
    if (session?.user?.email) {
      const { data, error } = await supabase.from('users').select('role, nome').eq('email', session.user.email).single()
      if (!error && data) {
        setIsLoggedIn(true)
        setUserRole(data.role || 'candidato')
        return
      }
    }
    setIsLoggedIn(!!session)
    setUserRole('candidato')
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await syncUserFromSession(session)

      const { data } = await supabase.from('vagas').select('*').eq('status', 'aberta').order('is_prioritaria', { ascending: false }).order('created_at', { ascending: false })
      if (data) {
        setVagas(data)
      }
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
    const cat = area ? getCategoryByKeyOrLabel(area) : null
    if (cat) {
      setActiveFilter(cat.key)
    }
    if (q) setSearchQuery(q)
    if (openFilters === '1') setShowFilters(true)
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

  const filteredExternal = allExternal.filter((j) => {
    const kw = searchQuery.trim().toLowerCase()
    const matchSearch = !kw || j.title?.toLowerCase().includes(kw) || j.company?.toLowerCase().includes(kw) || j.excerpt?.toLowerCase().includes(kw)
    const cat = activeFilter === 'Todas' ? null : getCategoryByKey(activeFilter)
    const matchCat = activeFilter === 'Todas' || (!!cat && (j.category === cat.external || j.category?.includes(cat.external) || cat.external?.includes(j.category)))
    const text = `${j.title || ''} ${j.excerpt || ''}`
    const matchContract = activeContract === 'Todos' || detectContractType(text) === activeContract
    const matchModality = activeModality === 'Todas' || detectModality(text) === activeModality
    const matchLocation = activeLocation === 'Todas' || j.location === activeLocation
    return matchSearch && matchCat && matchContract && matchModality && matchLocation
  })
  const stripHtml = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

  const filteredVagas = vagas.filter(v => {
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
    return matchSearch && matchFilter && matchContract && matchModality && matchLocation
  })

  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>(DEFAULT_LOCATIONS)
    vagas.forEach(v => { if (v.localizacao) locs.add(v.localizacao) })
    allExternal.forEach(j => { if (j.location) locs.add(j.location) })
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

  const recentVagas = filteredVagas.filter(v => isRecent(v.created_at))
  const olderVagas = filteredVagas.filter(v => !isRecent(v.created_at))
  const destaques = olderVagas.filter(v => v.is_prioritaria)
  const normais = olderVagas.filter(v => !v.is_prioritaria)

  const recentExternal = filteredExternal.filter(j => isRecent(j.first_seen_at))
  const olderExternal = filteredExternal.filter(j => !isRecent(j.first_seen_at))
  const extOlderPages = Math.max(1, Math.ceil(olderExternal.length / EXT_PAGE_SIZE))

  const JobCard = ({ v, variant }: { v: any; variant: 'recent' | 'destaque' | 'normal' }) => {
    const isDestaque = variant === 'destaque'
    const isRecent = variant === 'recent'
    const baseBg = isDestaque ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : isRecent ? 'bg-green-50 border-green-200' : 'bg-ms-surface'
    const borderClass = isDestaque ? 'border-2' : isRecent ? 'border' : ''
    const iconColor = isDestaque ? 'text-amber-600' : isRecent ? 'text-green-600' : 'text-ms-blue'
    const iconBg = isDestaque ? 'bg-white border-amber-200' : isRecent ? 'bg-white border-green-200' : 'bg-white border-ms-border'

    return (
      <Link key={v.id} href={`/vagas/detalhe/?id=${v.id}`} className="block">
        <div className={`${baseBg} ${borderClass} rounded-xl p-4 hover:shadow-md transition-shadow relative overflow-hidden`}>
          {isDestaque && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <Star size={10} className="fill-amber-500 text-amber-500" /> DESTAQUE
              </span>
            </div>
          )}
          {isRecent && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">NOVA</span>
            </div>
          )}
          <div className="flex items-start gap-3">
            <CompanyLogo company={v.empresa_nome} size={40} rounded="rounded-full" className="border border-ms-border" />
            <div className="flex-1 min-w-0 pr-16">
              <h3 className={`text-sm ${isDestaque ? 'font-semibold' : 'font-medium'} text-ms-dark line-clamp-2`}>{v.titulo}</h3>
              <p className="text-xs text-ms-gray">{v.empresa_nome}</p>
              <p className="text-xs text-ms-gray mt-1.5 line-clamp-3 sm:line-clamp-2">{stripHtml(v.descricao || '').slice(0, 220)}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {v.area && (
                  <span className="text-[10px] text-ms-blue bg-ms-blue/10 px-2 py-0.5 rounded-full">{v.area}</span>
                )}
                {v.localizacao && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] text-ms-gray">
                    <MapPin size={10} /> {v.localizacao}
                  </span>
                )}
                {v.salario && (
                  <span className="text-[11px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{v.salario}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-ms-gray">{getTimeAgo(v.created_at)}</span>
                <span className="text-[11px] font-medium text-ms-blue bg-ms-blue/10 px-3 py-1 rounded-full">Candidatar</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const ExternalJobCard = ({ j, variant }: { j: any; variant: 'recent' | 'normal' }) => {
    const isRecent = variant === 'recent'
    return (
      <Link key={j.id} href={`/vagas/externa/?id=${j.id}`} className="block">
        <div className={`bg-white border ${isRecent ? 'border-green-200' : 'border-ms-border'} rounded-xl p-4 hover:shadow-md hover:border-ms-blue/30 transition-all relative overflow-hidden`}>
          {isRecent && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">NOVA</span>
            </div>
          )}
          <div className="flex items-start gap-3">
            <CompanyLogo company={j.company} logoUrl={j.logo_url} size={40} rounded="rounded-lg" className="border border-ms-border" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-ms-dark leading-snug mb-1 line-clamp-2">{j.title}</h3>
              {j.company && <p className="text-xs text-ms-gray mb-1">{j.company}</p>}
              <p className="text-xs text-ms-gray mt-1 line-clamp-4 sm:line-clamp-2">{stripHtml(j.excerpt || j.description)}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {j.location && <span className="inline-flex items-center gap-0.5 text-[11px] text-ms-gray"><MapPin size={10} /> {j.location}</span>}
                {j.salary && <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{j.salary}</span>}
                {j.category && j.category !== 'Outro' && <span className="text-[10px] text-ms-blue bg-ms-blue/10 px-2 py-0.5 rounded-full">{j.category}</span>}
                {(j.score || 0) >= 20 && <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Destaque</span>}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-ms-gray">{getTimeAgo(j.first_seen_at || j.posted_at)}</span>
                <span className="text-[11px] font-medium text-ms-blue bg-ms-blue/10 px-3 py-1 rounded-full">Ver detalhes</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      {/* Top Nav */}
      <header className="sticky top-0 bg-white border-b border-ms-border z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={20} className="text-ms-dark" />
          </Link>
          <Logo variant="full" className="h-8 w-auto" />
          <button>
            <Heart size={20} className="text-ms-gray" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-ms-surface rounded-full px-4 py-3 mb-4 border-2 border-ms-blue/10 focus-within:border-ms-blue">
          <Search size={18} className="text-ms-gray flex-shrink-0" />
          <input
            type="text"
            placeholder="título da vaga ou palavra-chave"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && source === 'externas') setExtPage(1) }}
            className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray"
          />
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${showFilters ? 'bg-ms-blue' : 'bg-ms-blue'}`}
          >
            <SlidersHorizontal size={14} className="text-white" />
          </button>
        </div>

        {/* Source toggle: MÔ SALO vs External (CareerJet) */}
        <div className="flex gap-2 mb-4 bg-ms-surface rounded-xl p-1">
          <button
            onClick={() => setSource('mosalo')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${source === 'mosalo' ? 'bg-white text-ms-blue shadow-sm' : 'text-ms-gray'}`}
          >
            <Briefcase size={14} /> MÔ SALO
          </button>
          <button
            onClick={() => setSource('externas')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${source === 'externas' ? 'bg-white text-ms-blue shadow-sm' : 'text-ms-gray'}`}
          >
            <Globe size={14} /> Vagas Externas
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-ms-surface rounded-xl p-3 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ms-dark flex items-center gap-1"><Filter size={14} /> Filtros</span>
              <button
                onClick={() => { setActiveContract('Todos'); setActiveModality('Todas'); setActiveLocation('Todas'); setSearchQuery(''); setActiveFilter('Todas') }}
                className="text-[10px] text-ms-blue font-medium flex items-center gap-0.5"
              >
                <X size={10} /> Limpar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-ms-gray mb-1 block">Tipo de contrato</label>
                <div className="relative">
                  <select value={activeContract} onChange={(e) => setActiveContract(e.target.value)} className="w-full appearance-none bg-white border border-ms-border rounded-lg px-3 py-2 text-xs text-ms-dark outline-none focus:border-ms-blue">
                    {CONTRATOS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-ms-gray mb-1 block">Modalidade</label>
                <div className="relative">
                  <select value={activeModality} onChange={(e) => setActiveModality(e.target.value)} className="w-full appearance-none bg-white border border-ms-border rounded-lg px-3 py-2 text-xs text-ms-dark outline-none focus:border-ms-blue">
                    {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-ms-gray mb-1 block">Localização</label>
                <div className="relative">
                  <select value={activeLocation} onChange={(e) => setActiveLocation(e.target.value)} className="w-full appearance-none bg-white border border-ms-border rounded-lg px-3 py-2 text-xs text-ms-dark outline-none focus:border-ms-blue">
                    <option value="Todas">Todas</option>
                    {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {CATEGORIAS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`text-xs px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                activeFilter === f.key ? 'bg-ms-blue text-white' : 'bg-ms-surface text-ms-gray border border-ms-border hover:bg-ms-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Vagas Recentes (internas + externas, visível sempre no topo) */}
        {(recentVagas.length > 0 || recentExternal.length > 0) && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-sm font-semibold text-ms-dark">Vagas Recentes <span className="text-xs font-normal text-ms-gray">(últimas 60h)</span></h2>
            </div>
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {recentVagas.map(v => <JobCard key={v.id} v={v} variant="recent" />)}
              {recentExternal.slice(0, 10).map(j => <ExternalJobCard key={j.id} j={j} variant="recent" />)}
            </div>
          </section>
        )}

        {/* External jobs (aggregated Angolan boards, stored natively) */}
        {source === 'externas' && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-ms-blue" />
                <h2 className="text-sm font-semibold text-ms-dark">Vagas de Angola</h2>
              </div>
              <button onClick={() => { setExtLoaded(false); setAllExternal([]); loadExternalJobs() }} className="text-xs text-ms-blue font-medium">Actualizar</button>
            </div>
            <p className="text-xs text-ms-gray mb-4">Lê o resumo de cada vaga sem precisar abrir. Ao candidatar, vais direto à fonte oficial da empresa.</p>

            {loadingExternal ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" />
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
                  {olderExternal.slice((extPage - 1) * EXT_PAGE_SIZE, extPage * EXT_PAGE_SIZE).map((j) => (
                    <ExternalJobCard key={j.id} j={j} variant="normal" />
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
              {destaques.map(v => <JobCard key={v.id} v={v} variant="destaque" />)}
            </div>
          </section>
        )}

        {/* Normal jobs */}
        <section>
          {normais.length > 0 && (
            <h2 className="text-sm font-semibold text-ms-dark mb-3">Todas as Vagas</h2>
          )}
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {normais.map(v => <JobCard key={v.id} v={v} variant="normal" />)}
          </div>
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
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          <Link href="/" className="flex flex-col items-center gap-0.5 py-1">
            <HomeIcon size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Início</span>
          </Link>
          <Link href="/vagas/" className="flex flex-col items-center gap-0.5 py-1">
            <Search size={22} className="text-ms-blue" />
            <span className="text-[10px] text-ms-blue font-medium">Pesquisar</span>
          </Link>
          <Link href={isLoggedIn ? `/dashboard/${userRole}/` : '/auth/login/'} className="flex flex-col items-center gap-0.5 py-1">
            <Briefcase size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Dashboard</span>
          </Link>
          <Link href={isLoggedIn ? `/dashboard/${userRole}/?tab=perfil` : '/auth/login/'} className="flex flex-col items-center gap-0.5 py-1">
            <User size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
