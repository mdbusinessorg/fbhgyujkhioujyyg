'use client'

import { useState, useEffect, Suspense, type MouseEvent, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Heart,
  Building2,
  MapPin,
  Clock,
  Linkedin,
  Send,
  Share2,
  BadgeCheck,
  ChevronRight,
  Briefcase,
  Globe2,
} from 'lucide-react'
import { useFavorites } from '@/lib/favorites'
import VagaAssistant from '@/components/VagaAssistant'

function ExternaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = searchParams.get('id')
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'descricao' | 'requisitos' | 'empresa'>('descricao')
  const { isFavorite, toggle } = useFavorites()

  useEffect(() => {
    const load = async () => {
      if (!jobId) { setLoading(false); return }
      try {
        const res = await fetch(`/vagas-data/${encodeURIComponent(jobId)}.json`, { cache: 'no-store' })
        if (res.ok) setJob(await res.json())
      } catch {
        // ignore — handled by not-found state below
      }
      setLoading(false)
    }
    load()
  }, [jobId])

  const getTimeAgo = (date: string) => {
    if (!date) return ''
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days <= 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 30) return `Há ${days} dias`
    return new Date(date).toLocaleDateString('pt-PT')
  }

  const shareJob = async () => {
    if (!jobId) return
    const url = window.location.href
    const title = job?.title ? `${job.title} — MÔ SALO` : 'Vaga — MÔ SALO'
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // ignore
      }
    }
    await navigator.clipboard.writeText(url)
    alert('Link da vaga copiado!')
  }

  const favoriteKey = jobId ? `ext:${jobId}` : ''
  const favorite = favoriteKey ? isFavorite(favoriteKey) : false
  const handleFavoriteToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (favoriteKey) toggle(favoriteKey)
  }

  const companyLabel = job?.company || 'Empresa'
  const initials = useMemo(() => {
    const base = companyLabel || job?.title || 'MS'
    const parts = base.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'MS'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }, [companyLabel, job?.title])

  const requirements = useMemo(() => {
    const text = String(job?.description || '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
    const match = text.match(/(requisitos|qualificações|requirements)[:\-]?\s*(.*)/i)
    if (!match) return []
    return match[2]
      .split(/\.|\n|•|-/)
      .map((item) => item.trim())
      .filter(Boolean)
  }, [job?.description])

  const stats = [
    job?.category && job.category !== 'Outro' ? { icon: Briefcase, value: job.category, label: 'Categoria' } : null,
    job?.location ? { icon: MapPin, value: job.location, label: 'Localização' } : null,
    job?.posted_at ? { icon: Clock, value: getTimeAgo(job.posted_at), label: 'Publicado' } : null,
    job?.salary ? { icon: Globe2, value: job.salary, label: 'Salário' } : null,
  ].filter(Boolean) as Array<{ icon: typeof Briefcase; value: string; label: string }>

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-ms-gray mb-4">Vaga não encontrada</p>
          <Link href="/vagas/" className="text-ms-blue font-medium">← Voltar às vagas</Link>
        </div>
      </div>
    )
  }

  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title || '')}&location=Angola`

  const tabContent = {
    descricao: (
      <div className="space-y-4">
        <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ms-dark">Descrição da vaga</h2>
          <div
            className="external-job-desc mt-3 text-sm leading-relaxed text-ms-dark"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </div>
      </div>
    ),
    requisitos: (
      <div className="space-y-3">
        {requirements.length > 0 ? requirements.map((req, i) => (
          <div key={i} className="flex items-start justify-between gap-4 rounded-2xl border border-ms-border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue">
                <ChevronRight size={14} />
              </div>
              <p className="text-sm leading-relaxed text-ms-dark">{req}</p>
            </div>
          </div>
        )) : (
          <div className="rounded-2xl border border-ms-border bg-white p-5 text-sm text-ms-gray shadow-sm">
            A descrição desta vaga não separa requisitos em lista. Consulta a descrição completa para mais detalhes.
          </div>
        )}
      </div>
    ),
    empresa: (
      <div className="space-y-3">
        <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ms-dark">{companyLabel}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ms-gray">
            {job.location ? `Localização: ${job.location}` : 'Localização não indicada'}
            {job.category && job.category !== 'Outro' ? ` • ${job.category}` : ''}
          </p>
        </div>
        <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ms-dark">Fonte oficial</h3>
          <p className="mt-2 text-sm leading-relaxed text-ms-gray">
            A candidatura abre no site original da empresa quando disponível.
          </p>
        </div>
      </div>
    ),
  } as const

  return (
    <div className="min-h-screen bg-ms-surface pb-36">
      <main className="mx-auto max-w-4xl pb-6">
        <section className="relative overflow-hidden bg-gradient-to-br from-ms-blue to-ms-purple px-4 pb-10 pt-5 text-white">
          <div className="absolute inset-0 opacity-15">
            <div className="absolute -left-8 top-6 h-24 w-24 rounded-full border border-white/40" />
            <div className="absolute right-6 top-12 h-16 w-16 rounded-full border border-white/30" />
            <div className="absolute bottom-0 left-1/2 h-28 w-28 -translate-x-1/2 translate-y-1/2 rounded-full border border-white/20" />
          </div>

          <div className="relative mx-auto flex max-w-4xl items-center justify-between">
            <button onClick={() => router.back()} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ms-dark shadow-lg shadow-black/10" aria-label="Voltar">
              <ArrowLeft size={20} />
            </button>
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/15 text-3xl font-black text-white shadow-lg shadow-black/10">
              {initials}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={shareJob} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ms-dark shadow-lg shadow-black/10" aria-label="Partilhar vaga">
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={handleFavoriteToggle}
                disabled={!favoriteKey}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ms-dark shadow-lg shadow-black/10 disabled:opacity-50"
                aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar vaga'}
              >
                <Heart size={18} fill={favorite ? 'currentColor' : 'none'} className={favorite ? 'text-red-500' : 'text-ms-gray'} />
              </button>
            </div>
          </div>

          <div className="relative mx-auto mt-8 max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">MÔ SALO</p>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{job.title}</h1>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-white/85">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                <BadgeCheck size={14} /> {companyLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                <MapPin size={14} /> {job.location || 'Angola'}
              </span>
            </div>
          </div>
        </section>

        <section className="relative -mt-8 rounded-t-[28px] bg-white px-4 pb-6 pt-6 shadow-[0_-18px_40px_rgba(17,24,39,0.08)] sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-2 rounded-full border border-ms-border bg-ms-surface px-3 py-2 text-xs font-medium text-ms-gray">
              <BadgeCheck size={14} className="text-ms-blue" /> Vaga verificada
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ms-gray">
              <MapPin size={14} /> {job.location || 'Angola'}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ms-surface text-ms-blue">
                <Building2 size={22} />
              </div>
              <div className="min-w-0 text-center">
                <p className="text-sm font-semibold text-ms-dark">{companyLabel}</p>
                <p className="text-xs text-ms-gray">{job.category && job.category !== 'Outro' ? job.category : 'Oportunidade profissional'}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button type="button" onClick={() => setActiveTab('empresa')} className="flex flex-col items-center gap-2 rounded-2xl border border-ms-border bg-white px-3 py-3 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue"><Building2 size={18} /></span>
                <span className="text-[11px] font-medium text-ms-gray">Empresa</span>
              </button>
              <button type="button" onClick={handleFavoriteToggle} className="flex flex-col items-center gap-2 rounded-2xl border border-ms-border bg-white px-3 py-3 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue"><Heart size={18} fill={favorite ? 'currentColor' : 'none'} className={favorite ? 'text-red-500' : 'text-ms-blue'} /></span>
                <span className="text-[11px] font-medium text-ms-gray">Guardar</span>
              </button>
              <button type="button" onClick={shareJob} className="flex flex-col items-center gap-2 rounded-2xl border border-ms-border bg-white px-3 py-3 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue"><Share2 size={18} /></span>
                <span className="text-[11px] font-medium text-ms-gray">Partilhar</span>
              </button>
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 rounded-2xl border border-ms-border bg-white px-3 py-3 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ms-blue/10 text-[#0A66C2]"><Linkedin size={18} /></span>
                <span className="text-[11px] font-medium text-ms-gray">LinkedIn</span>
              </a>
            </div>

            {stats.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={index} className="rounded-2xl border border-ms-border bg-ms-surface p-4">
                      <div className="flex items-center gap-2 text-ms-blue">
                        <Icon size={16} />
                        <span className="text-[11px] font-medium text-ms-gray">{stat.label}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-snug text-ms-dark">{stat.value}</p>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-6 border-b border-ms-border">
              <div className="flex gap-6 overflow-x-auto text-sm font-semibold scrollbar-hide">
                {[
                  { key: 'descricao', label: 'Descrição' },
                  { key: 'requisitos', label: 'Requisitos' },
                  { key: 'empresa', label: 'Empresa' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`pb-3 transition-colors ${activeTab === tab.key ? 'border-b-2 border-ms-blue text-ms-blue' : 'text-ms-gray'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              {tabContent[activeTab]}
            </div>

            <div className="mt-5">
              <VagaAssistant
                titulo={job.title}
                empresa={companyLabel}
                localizacao={job.location}
                area={job.category}
                descricao={job.description}
                requisitos={requirements}
              />
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ms-border bg-white p-4 shadow-[0_-10px_30px_rgba(17,24,39,0.08)]">
        <div className="mx-auto max-w-4xl flex flex-col gap-3 sm:flex-row">
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-2xl bg-ms-blue px-4 py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Candidatar no site oficial
            </a>
          )}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${job.apply_url ? 'sm:flex-shrink-0' : 'flex-1'} rounded-2xl border border-ms-border px-4 py-3.5 text-center text-base font-semibold text-ms-dark transition-colors hover:bg-ms-surface`}
          >
            Ver no LinkedIn
          </a>
        </div>
        {!job.apply_url && (
          <p className="mt-2 text-center text-[11px] text-ms-gray">Link oficial indisponível — procura a vaga no LinkedIn.</p>
        )}
      </div>
    </div>
  )
}

export default function VagaExternaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <ExternaContent />
    </Suspense>
  )
}
