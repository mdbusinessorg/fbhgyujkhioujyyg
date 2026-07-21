'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, SlidersHorizontal, Heart, Briefcase, ArrowLeft, Home as HomeIcon, User, Star, MapPin, Globe, Building2 } from 'lucide-react'

const EXT_PAGE_SIZE = 20

const CATEGORIAS = [
  { key: 'Todas', label: 'Todas' },
  { key: 'TI', label: 'TI', match: 'Tecnologia' },
  { key: 'Finanças', label: 'Finanças', match: 'Finanças' },
  { key: 'Engenharia', label: 'Engenharia', match: 'Engenharia' },
  { key: 'Saúde', label: 'Saúde', match: 'Saúde' },
  { key: 'Marketing', label: 'Marketing', match: 'Marketing' },
  { key: 'Direito', label: 'Direito', match: 'Direito' },
  { key: 'Petróleo', label: 'Petróleo', match: 'Petróleo' },
  { key: 'Educação', label: 'Educação', match: 'Educação' },
  { key: 'Administração', label: 'Administração', match: 'Administração' },
  { key: 'Contabilidade', label: 'Contabilidade', match: 'Contabilidade' },
  { key: 'Logística', label: 'Logística', match: 'Logística' },
  { key: 'Hotelaria', label: 'Hotelaria', match: 'Hotelaria' },
  { key: 'Construção', label: 'Construção', match: 'Construção' },
  { key: 'RH', label: 'RH', match: 'Recursos Humanos' },
  { key: 'Design', label: 'Design', match: 'Design' },
]

export default function VagasPage() {
  const [vagas, setVagas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todas')
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

  useEffect(() => { setExtPage(1) }, [searchQuery, activeFilter])

  const filteredExternal = allExternal.filter((j) => {
    const kw = searchQuery.trim().toLowerCase()
    const matchSearch = !kw || j.title?.toLowerCase().includes(kw) || j.company?.toLowerCase().includes(kw)
    const matchCat = activeFilter === 'Todas' || j.category === (activeFilter === 'TI' ? 'Tecnologia' : activeFilter)
    return matchSearch && matchCat
  })
  const extPages = Math.max(1, Math.ceil(filteredExternal.length / EXT_PAGE_SIZE))
  const externalJobs = filteredExternal.slice((extPage - 1) * EXT_PAGE_SIZE, extPage * EXT_PAGE_SIZE)

  const stripHtml = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

  const filteredVagas = vagas.filter(v => {
    const matchSearch = !searchQuery || v.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) || v.empresa_nome?.toLowerCase().includes(searchQuery.toLowerCase())
    let matchFilter = activeFilter === 'Todas'
    if (!matchFilter) {
      const cat = CATEGORIAS.find(c => c.key === activeFilter)
      matchFilter = cat?.match ? v.area?.includes(cat.match) : false
    }
    return matchSearch && matchFilter
  })

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  const destaques = filteredVagas.filter(v => v.is_prioritaria)
  const normais = filteredVagas.filter(v => !v.is_prioritaria)

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      {/* Top Nav */}
      <header className="sticky top-0 bg-white border-b border-ms-border z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={20} className="text-ms-dark" />
          </Link>
          <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
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
          <button className="w-8 h-8 bg-ms-blue rounded-lg flex items-center justify-center flex-shrink-0">
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
            <p className="text-xs text-ms-gray mb-4">Lê a vaga completa aqui. Ao candidatar, vais direto à fonte oficial da empresa ou ao LinkedIn.</p>

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
            ) : externalJobs.length === 0 ? (
              <div className="text-center py-12">
                <Globe size={32} className="text-ms-gray mx-auto mb-3" />
                <p className="text-sm text-ms-gray">Sem vagas para esta pesquisa. Actualizamos diariamente.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {externalJobs.map((j) => (
                    <Link key={j.id} href={`/vagas/externa/?id=${j.id}`} className="block">
                      <div className="bg-white border border-ms-border rounded-xl p-4 flex items-start gap-3 hover:shadow-md hover:border-ms-blue/30 transition-all">
                        <div className="w-10 h-10 bg-ms-blue/5 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 size={16} className="text-ms-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-ms-dark leading-snug mb-1">{j.title}</h3>
                          {j.company && <p className="text-xs text-ms-gray mb-1">{j.company}</p>}
                          <p className="text-xs text-ms-gray mt-1 line-clamp-2">{stripHtml(j.excerpt || j.description)}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {j.location && <span className="inline-flex items-center gap-0.5 text-[11px] text-ms-gray"><MapPin size={10} /> {j.location}</span>}
                            {j.salary && <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{j.salary}</span>}
                            {j.category && j.category !== 'Outro' && <span className="text-[10px] text-ms-blue bg-ms-blue/10 px-2 py-0.5 rounded-full">{j.category}</span>}
                            {(j.score || 0) >= 20 && <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Destaque</span>}
                          </div>
                          <div className="flex items-center justify-end mt-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ms-blue">Ver detalhes</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {extPages > 1 && (
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
                    <span className="text-xs text-ms-gray self-center">{extPage}/{extPages}</span>
                    <button
                      onClick={() => {
                        if (extPage < extPages) {
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                          setExtPage(extPage + 1)
                        }
                      }}
                      disabled={extPage >= extPages || loadingExternal}
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

        {/* Vagas em Destaque */}
        {source === 'mosalo' && (<>
        {destaques.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <h2 className="text-sm font-semibold text-ms-dark">Vagas em Destaque</h2>
            </div>
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {destaques.map(v => (
                <Link key={v.id} href={`/vagas/detalhe/?id=${v.id}`} className="block">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Star size={10} className="fill-amber-500 text-amber-500" /> DESTAQUE
                      </span>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-amber-200">
                      <Briefcase size={16} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="text-sm font-semibold text-ms-dark truncate">{v.titulo}</h3>
                      <p className="text-xs text-ms-gray">{v.empresa_nome}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Normal jobs */}
        <section>
          {normais.length > 0 && destaques.length > 0 && (
            <h2 className="text-sm font-semibold text-ms-dark mb-3">Todas as Vagas</h2>
          )}
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {normais.map(v => (
              <Link key={v.id} href={`/vagas/detalhe/?id=${v.id}`} className="block">
                <div className="bg-ms-surface rounded-xl p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-ms-border">
                    <Briefcase size={16} className="text-ms-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-ms-dark truncate">{v.titulo}</h3>
                    <p className="text-xs text-ms-gray">{v.empresa_nome}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {v.localizacao && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-ms-gray">
                          <MapPin size={10} /> {v.localizacao}
                        </span>
                      )}
                      {v.salario && (
                        <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{v.salario}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-ms-gray">{getTimeAgo(v.created_at)}</span>
                      <span className="text-[11px] font-medium text-ms-blue bg-ms-blue/5 px-3 py-1 rounded-full">Candidatar</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
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
