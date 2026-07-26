'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Heart, MapPin, Trash2, Briefcase, Search } from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'
import Logo from '@/components/Logo'

const stripHtml = (html?: string) => (html || '').replace(/<[^>]*>/g, '').trim()

export default function VagasGuardadasPage() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let favs: string[] = []
    try { favs = JSON.parse(localStorage.getItem('mosalo_favorites') || '[]') } catch {}
    setFavorites(favs)

    const load = async () => {
      const internalIds = favs.filter(f => f.startsWith('internal:')).map(f => f.slice('internal:'.length))
      const externalIds = new Set(favs.filter(f => f.startsWith('external:')).map(f => f.slice('external:'.length)))

      const results: any[] = []

      if (internalIds.length > 0) {
        const { data } = await supabase.from('vagas').select('*').in('id', internalIds)
        ;(data || []).forEach(v => results.push({ ...v, source: 'internal', favId: `internal:${v.id}` }))
      }

      if (externalIds.size > 0) {
        try {
          const res = await fetch('/external-jobs.json', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const ext = Array.isArray(data.jobs) ? data.jobs : []
            ext.filter((j: any) => externalIds.has(String(j.id))).forEach((j: any) => results.push({ ...j, source: 'external', favId: `external:${j.id}` }))
          }
        } catch {}
      }

      setJobs(results)
      setLoading(false)
    }
    load()
  }, [])

  const remove = (favId: string) => {
    const next = favorites.filter(f => f !== favId)
    setFavorites(next)
    setJobs(prev => prev.filter(j => j.favId !== favId))
    localStorage.setItem('mosalo_favorites', JSON.stringify(next))
  }

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      <header className="sticky top-0 bg-white border-b border-ms-border z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/vagas/" className="flex items-center gap-2">
            <ArrowLeft size={20} className="text-ms-dark" />
          </Link>
          <Logo variant="full" className="h-8 w-auto" />
          <Heart size={20} className="text-red-500 fill-red-500" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-ms-dark flex items-center gap-2">
            <Heart size={20} className="text-red-500 fill-red-500" /> Vagas Guardadas
          </h1>
          {jobs.length > 0 && (
            <span className="text-xs font-bold text-white bg-gradient-to-r from-ms-blue to-ms-purple px-3 py-1 rounded-full">{jobs.length}</span>
          )}
        </div>
        <p className="text-xs text-ms-gray mb-5">As vagas que selecionaste para te candidatares. Guarda vagas tocando no coração ♥ em qualquer lista.</p>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton-shimmer rounded-xl h-28" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 animate-fade-up">
            <div className="w-16 h-16 mx-auto rounded-full bg-ms-surface flex items-center justify-center mb-3">
              <Heart size={28} className="text-ms-gray" />
            </div>
            <p className="text-sm font-semibold text-ms-dark">Ainda não guardaste nenhuma vaga</p>
            <p className="text-xs text-ms-gray mt-1 mb-5">Toca no coração ♥ nas vagas que te interessam e volta aqui para te candidatares.</p>
            <Link href="/vagas/" className="inline-flex items-center gap-2 bg-gradient-to-r from-ms-blue to-ms-purple text-white text-sm font-bold px-5 py-2.5 rounded-xl btn-shine">
              <Search size={16} /> Explorar vagas
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job, idx) => {
              const isInternal = job.source === 'internal'
              const title = isInternal ? job.titulo : job.title
              const company = isInternal ? job.empresa_nome : job.company
              const location = isInternal ? job.localizacao : job.location
              const desc = stripHtml(isInternal ? job.descricao : (job.excerpt || job.description))
              const href = isInternal ? `/vagas/detalhe/?id=${job.id}` : `/vagas/externa/?id=${job.id}`
              return (
                <div key={job.favId} className="bg-white border border-ms-border rounded-xl p-4 card-tilt animate-fade-up" style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}>
                  <div className="flex items-start gap-3">
                    <CompanyLogo company={company} logoUrl={job.logo_url} size={40} rounded="rounded-lg" className="border border-ms-border" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-ms-dark line-clamp-2">{title}</h3>
                      {company && <p className="text-xs text-ms-gray">{company}</p>}
                      {desc && <p className="text-xs text-ms-gray mt-1 line-clamp-2">{desc.slice(0, 180)}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {location && <span className="inline-flex items-center gap-0.5 text-[11px] text-ms-gray"><MapPin size={10} /> {location}</span>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isInternal ? 'text-ms-blue bg-ms-blue/10' : 'text-ms-purple bg-ms-purple-light'}`}>
                          {isInternal ? 'MÔ SALO' : 'Externa'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Link href={href} className="flex-1 text-center bg-gradient-to-r from-ms-blue to-ms-purple text-white text-xs font-bold py-2 rounded-lg btn-shine">
                          Candidatar-me
                        </Link>
                        <button onClick={() => remove(job.favId)} className="p-2 text-ms-gray hover:text-red-500 rounded-lg bg-ms-surface" aria-label="Remover">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="mt-6 bg-ms-purple-light rounded-2xl p-4 flex items-center gap-3 animate-fade-up">
            <Briefcase size={20} className="text-ms-purple flex-shrink-0" />
            <p className="text-xs text-ms-dark">Dica: candidata-te às vagas guardadas o quanto antes — as melhores oportunidades fecham rápido!</p>
          </div>
        )}
      </main>
    </div>
  )
}
