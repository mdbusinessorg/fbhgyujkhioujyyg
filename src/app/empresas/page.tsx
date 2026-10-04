'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import { CompanyLogo } from '@/components/CompanyLogo'
import { Building2, Search, MapPin, Briefcase, ChevronRight, TrendingUp } from 'lucide-react'

interface CompanyRow {
  name: string
  logo_url?: string | null
  openings: number
  locations: string[]
  categories: string[]
  latest: string
}

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/external-jobs.json', { cache: 'no-store' })
        const data = await res.json()
        const jobs: any[] = Array.isArray(data) ? data : (data.jobs || [])
        const map = new Map<string, CompanyRow>()
        for (const j of jobs) {
          const name = (j.company || '').trim()
          if (!name || name === 'Empresa não divulgada') continue
          const row: CompanyRow = map.get(name) || { name, logo_url: j.logo_url || null, openings: 0, locations: [] as string[], categories: [] as string[], latest: '' }
          row.openings++
          if (!row.logo_url && j.logo_url) row.logo_url = j.logo_url
          const d = j.posted_at || j.first_seen_at || ''
          if (d > row.latest) row.latest = d
          if (j.location && !row.locations.includes(j.location)) row.locations.push(j.location)
          if (j.category && j.category !== 'Outro' && !row.categories.includes(j.category)) row.categories.push(j.category)
          map.set(name, row)
        }
        setCompanies(Array.from(map.values()).sort((a, b) => b.openings - a.openings))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return companies
    return companies.filter(c => c.name.toLowerCase().includes(q) || c.categories.some(cat => cat.toLowerCase().includes(q)))
  }, [companies, query])

  const featured = useMemo(() => filtered.slice(0, query ? filtered.length : 12), [filtered, query])
  const rest = useMemo(() => (query ? [] : filtered.slice(12)), [filtered, query])

  const CompanyCard = ({ c, big }: { c: CompanyRow; big?: boolean }) => (
    <Link
      href={`/vagas/?q=${encodeURIComponent(c.name)}`}
      className={`block bg-white border border-ms-border rounded-2xl hover:border-ms-blue/40 hover:shadow-md transition-all ${big ? 'p-4' : 'p-3'}`}
    >
      <div className="flex items-center gap-3">
        <CompanyLogo company={c.name} logoUrl={c.logo_url ?? undefined} size={big ? 52 : 44} rounded="rounded-xl" className="border border-ms-border flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-ms-dark truncate ${big ? 'text-sm' : 'text-[13px]'}`}>{c.name}</p>
          <p className="text-[11px] text-ms-gray mt-0.5">
            {c.openings} {c.openings === 1 ? 'vaga aberta' : 'vagas abertas'}
            {c.locations[0] ? ` • ${c.locations[0]}` : ''}
          </p>
        </div>
        <ChevronRight size={15} className="text-ms-gray flex-shrink-0" />
      </div>
      {big && c.categories.length > 0 && (
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {c.categories.slice(0, 3).map(cat => (
            <span key={cat} className="text-[10px] font-medium bg-ms-surface text-ms-gray px-2 py-0.5 rounded-full">{cat}</span>
          ))}
        </div>
      )}
    </Link>
  )

  return (
    <div className="min-h-screen bg-ms-surface">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 pt-5 pb-16">
        <div className="flex items-center gap-2.5 mb-1">
          <Building2 size={20} className="text-ms-blue" />
          <h1 className="text-xl font-bold text-ms-dark">Empresas</h1>
          {companies.length > 0 && <span className="text-xs font-bold bg-ms-blue/10 text-ms-blue px-2 py-0.5 rounded-full">{companies.length}</span>}
        </div>
        <p className="text-xs text-ms-gray mb-4">Empresas com vagas activas no MÔ SALO — toca para ver as vagas de cada uma.</p>

        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ms-gray" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Procurar empresa ou área..."
            className="w-full bg-white border border-ms-border rounded-full pl-10 pr-4 py-3 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:border-ms-blue shadow-sm"
          />
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-ms-border rounded-2xl p-10 text-center">
            <Building2 size={36} className="text-ms-gray mx-auto mb-3" />
            <p className="text-sm text-ms-dark font-medium">Nenhuma empresa encontrada</p>
            <p className="text-xs text-ms-gray mt-1">Tenta outro nome ou área.</p>
          </div>
        ) : (
          <>
            {!query && (
              <h2 className="text-sm font-bold text-ms-dark mb-2.5 flex items-center gap-1.5"><TrendingUp size={15} className="text-ms-blue" /> Em destaque</h2>
            )}
            <div className="grid sm:grid-cols-2 gap-2.5 mb-6">
              {featured.map(c => <CompanyCard key={c.name} c={c} big />)}
            </div>
            {rest.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-ms-dark mb-2.5 flex items-center gap-1.5"><Briefcase size={15} className="text-ms-blue" /> Todas as empresas</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {rest.map(c => <CompanyCard key={c.name} c={c} />)}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
