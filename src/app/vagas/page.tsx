'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import JobsHeader from '@/components/JobsHeader'
import JobGridCard from '@/components/JobGridCard'
import { JOB_CATEGORIES } from '@/lib/jobCategories'
import { useFavorites } from '@/lib/favorites'
import { MapPin, Star } from 'lucide-react'

const EXT_PAGE_SIZE = 20

type VagaItem = {
  id: string
  titulo?: string
  empresa_nome?: string
  area?: string
  localizacao?: string
  salario?: string
  is_prioritaria?: boolean
  created_at?: string
}

type ExternalItem = {
  id: string
  title?: string
  company?: string
  location?: string
  category?: string
  excerpt?: string
  description?: string
  posted_at?: string
  salary?: string
}

export default function VagasPage() {
  const [vagas, setVagas] = useState<VagaItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [source, setSource] = useState<'mosalo' | 'externas'>('mosalo')
  const [allExternal, setAllExternal] = useState<ExternalItem[]>([])
  const [extLoaded, setExtLoaded] = useState(false)
  const [extPage, setExtPage] = useState(1)
  const [loadingExternal, setLoadingExternal] = useState(false)
  const [externalError, setExternalError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [featuredPaused, setFeaturedPaused] = useState(false)
  const { isFavorite, toggle } = useFavorites()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsLoggedIn(true)
        const { data } = await supabase.from('users').select('role, nome').eq('email', session.user.email).single()
        if (data) {
          setUserName(data.nome || '')
        }
      }

      const { data } = await supabase.from('vagas').select('*').eq('status', 'aberta').order('is_prioritaria', { ascending: false }).order('created_at', { ascending: false })
      if (data) {
        setVagas(data)
      }
    }
    init()
  }, [])

  const loadExternalJobs = async (force = false) => {
    if (extLoaded && !force) return
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

  useEffect(() => {
    setExtPage(1)
    setFeaturedIndex(0)
  }, [searchQuery, activeFilter, source])

  const activeCategoryLabel = JOB_CATEGORIES.find((item) => item.key === activeFilter)?.label || activeFilter

  const filteredExternal = allExternal.filter((job) => {
    const kw = searchQuery.trim().toLowerCase()
    const matchSearch = !kw || job.title?.toLowerCase().includes(kw) || job.company?.toLowerCase().includes(kw)
    const matchCat = activeFilter === 'Todas' || job.category === activeCategoryLabel
    return matchSearch && matchCat
  })
  const extPages = Math.max(1, Math.ceil(filteredExternal.length / EXT_PAGE_SIZE))
  const externalJobs = filteredExternal.slice((extPage - 1) * EXT_PAGE_SIZE, extPage * EXT_PAGE_SIZE)

  const filteredVagas = useMemo(() => {
    return vagas.filter((vaga) => {
      const matchSearch = !searchQuery || vaga.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) || vaga.empresa_nome?.toLowerCase().includes(searchQuery.toLowerCase())
      let matchFilter = activeFilter === 'Todas'
      if (!matchFilter) {
        matchFilter = activeCategoryLabel ? Boolean(vaga.area?.includes(activeCategoryLabel)) : false
      }
      return matchSearch && matchFilter
    })
  }, [activeCategoryLabel, activeFilter, searchQuery, vagas])

  const destaques = filteredVagas.filter((vaga) => vaga.is_prioritaria)
  const normais = filteredVagas.filter((vaga) => !vaga.is_prioritaria)
  const featuredJobs = source === 'mosalo' ? destaques.slice(0, 5) : []

  useEffect(() => {
    if (source !== 'mosalo' || featuredJobs.length < 2 || featuredPaused) return
    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % featuredJobs.length)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [featuredJobs.length, featuredPaused, source])

  const handleToggleFavorite = (key: string, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    toggle(key)
  }

  const renderExternalCard = (job: ExternalItem) => {
    const favoriteKey = `ext:${job.id}`
    const favorite = isFavorite(favoriteKey)
    const chip = job.category && job.category !== 'Outro' ? job.category : 'Externa'
    const subtitle = [job.company, job.location].filter(Boolean).join(' • ') || 'Angola'
    const initials = job.company || job.title || 'MS'

    return (
      <JobGridCard
        key={job.id}
        href={`/vagas/externa/?id=${job.id}`}
        title={job.title || 'Vaga'}
        subtitle={subtitle}
        chip={chip}
        initials={initials}
        favoriteKey={favoriteKey}
        favorite={favorite}
        salary={job.salary}
        onToggleFavorite={handleToggleFavorite}
      />
    )
  }

  const renderInternalCard = (vaga: VagaItem) => {
    const favoriteKey = `int:${vaga.id}`
    const favorite = isFavorite(favoriteKey)
    const subtitle = [vaga.empresa_nome, vaga.localizacao].filter(Boolean).join(' • ') || 'MÔ SALO'
    const chip = activeFilter === 'Todas' ? (vaga.area || 'MÔ SALO') : activeCategoryLabel
    const initials = vaga.empresa_nome || vaga.titulo || 'MS'

    return (
      <JobGridCard
        key={vaga.id}
        href={`/vagas/detalhe/?id=${vaga.id}`}
        title={vaga.titulo || 'Vaga'}
        subtitle={subtitle}
        chip={chip}
        initials={initials}
        favoriteKey={favoriteKey}
        favorite={favorite}
        salary={vaga.salario}
        onToggleFavorite={handleToggleFavorite}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <main className="mx-auto max-w-6xl px-4 pb-6 pt-4 lg:px-8 lg:pt-6">
        <JobsHeader
          userName={userName || (isLoggedIn ? 'Utilizador' : 'Visitante')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeFilter}
          onCategoryChange={setActiveFilter}
          categories={JOB_CATEGORIES}
          onFilterClick={() => setActiveFilter('Todas')}
        />

        <div className="mb-5 flex gap-2 rounded-2xl bg-ms-surface p-1">
          <button
            onClick={() => setSource('mosalo')}
            className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition-colors ${source === 'mosalo' ? 'bg-white text-ms-blue shadow-sm' : 'text-ms-gray'}`}
          >
            MÔ SALO
          </button>
          <button
            onClick={() => setSource('externas')}
            className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition-colors ${source === 'externas' ? 'bg-white text-ms-blue shadow-sm' : 'text-ms-gray'}`}
          >
            Vagas Externas
          </button>
        </div>

        {source === 'mosalo' && featuredJobs.length > 0 && (
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Star size={16} className="fill-amber-500 text-amber-500" />
              <h2 className="text-sm font-semibold text-ms-dark">Vagas em Destaque</h2>
            </div>
            <div
              className="overflow-hidden rounded-2xl"
              onMouseEnter={() => setFeaturedPaused(true)}
              onMouseLeave={() => setFeaturedPaused(false)}
              onTouchStart={() => setFeaturedPaused(true)}
              onTouchEnd={() => setFeaturedPaused(false)}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${featuredIndex * 100}%)` }}
              >
                {featuredJobs.map((vaga) => {
                  const initials = (vaga.empresa_nome || vaga.titulo || 'MS').trim().split(/\s+/).filter(Boolean)
                  const badge = initials.length > 1 ? `${initials[0][0]}${initials[1][0]}` : (initials[0] || 'MS').slice(0, 2)
                  return (
                    <Link
                      key={vaga.id}
                      href={`/vagas/detalhe/?id=${vaga.id}`}
                      className="block w-full shrink-0"
                    >
                      <article className="rounded-2xl bg-gradient-to-br from-ms-blue to-ms-purple p-5 text-white shadow-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                              Destaque
                            </span>
                            <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-tight">
                              {vaga.titulo}
                            </h3>
                            <p className="mt-2 text-sm text-white/85">{vaga.empresa_nome || 'Empresa'}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-white/75">
                              <MapPin size={12} />
                              {vaga.localizacao || 'Angola'}
                            </p>
                          </div>
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-sm font-bold text-white">
                            {badge.toUpperCase()}
                          </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <span className="inline-flex rounded-full bg-ms-amber px-4 py-2 text-sm font-semibold text-ms-dark shadow-sm">
                            Ver vaga
                          </span>
                          {vaga.salario && <span className="text-xs text-white/80">{vaga.salario}</span>}
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            </div>
            {featuredJobs.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                {featuredJobs.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFeaturedIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${featuredIndex === index ? 'w-6 bg-ms-blue' : 'w-2.5 bg-ms-border'}`}
                    aria-label={`Ver destaque ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {source === 'externas' ? (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Star size={16} className="fill-amber-500 text-amber-500" />
                <h2 className="text-sm font-semibold text-ms-dark">Vagas Externas</h2>
              </div>
              <button onClick={() => { setExtLoaded(false); setAllExternal([]); loadExternalJobs(true) }} className="text-xs font-medium text-ms-blue">
                Actualizar
              </button>
            </div>
            <p className="mb-4 text-xs text-ms-gray">Vagas de toda a Angola, actualizadas diariamente. Ao candidatar, abre o site oficial.</p>

            {loadingExternal ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ms-blue border-t-transparent" />
              </div>
            ) : externalError ? (
              <div className="py-12 text-center">
                <Star size={32} className="mx-auto mb-3 text-ms-gray" />
                <p className="text-sm text-ms-gray">{externalError}</p>
                <button onClick={() => { setExtLoaded(false); loadExternalJobs(true) }} className="mt-2 text-sm font-medium text-ms-blue">
                  Tentar novamente
                </button>
              </div>
            ) : externalJobs.length === 0 ? (
              <div className="py-12 text-center">
                <Star size={32} className="mx-auto mb-3 text-ms-gray" />
                <p className="text-sm text-ms-gray">Sem vagas para esta pesquisa. Actualizamos diariamente.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {externalJobs.map(renderExternalCard)}
                </div>
                {extPages > 1 && (
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        if (extPage > 1) {
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                          setExtPage(extPage - 1)
                        }
                      }}
                      disabled={extPage <= 1 || loadingExternal}
                      className="flex-1 rounded-2xl border border-ms-border bg-white py-3.5 text-sm font-semibold text-ms-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-ms-gray">{extPage}/{extPages}</span>
                    <button
                      onClick={() => {
                        if (extPage < extPages) {
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                          setExtPage(extPage + 1)
                        }
                      }}
                      disabled={extPage >= extPages || loadingExternal}
                      className="flex-1 rounded-2xl bg-ms-blue py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          <>
            <section className="mb-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Star size={16} className="fill-amber-500 text-amber-500" />
                  <h2 className="text-sm font-semibold text-ms-dark">Vagas Encontradas</h2>
                </div>
                <span className="text-xs text-ms-gray">{filteredVagas.length} vagas</span>
              </div>
            </section>

            <section className="mb-8">
              {normais.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {normais.map(renderInternalCard)}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-ms-gray">Nenhuma vaga encontrada para esta pesquisa.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav active="vagas" userRole="candidato" />
    </div>
  )
}
