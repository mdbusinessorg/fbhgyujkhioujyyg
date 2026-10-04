'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getExternalApplies, type ExternalCandidacy } from '@/lib/candidacies'
import AppHeader from '@/components/AppHeader'
import { CompanyLogo } from '@/components/CompanyLogo'
import { Briefcase, MapPin, Clock, Globe, Mail, CheckCircle, XCircle, Hourglass, ChevronRight, ClipboardList } from 'lucide-react'

type Status = 'enviada' | 'aprovada' | 'rejeitada' | 'externa'

interface CandidacyRow {
  key: string
  title: string
  company: string
  logo_url?: string | null
  location?: string | null
  date: string
  status: Status
  href: string
  via?: string
}

const STATUS_META: Record<Status, { label: string; cls: string; icon: typeof CheckCircle }> = {
  aprovada: { label: 'Aceite', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejeitada: { label: 'Rejeitada', cls: 'bg-red-100 text-red-700', icon: XCircle },
  enviada: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700', icon: Hourglass },
  externa: { label: 'Candidatura externa', cls: 'bg-blue-100 text-ms-blue', icon: Globe },
}

export default function CandidaturasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<CandidacyRow[]>([])
  const [filter, setFilter] = useState<'todas' | Status>('todas')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { router.push('/auth/login/'); return }

      const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single()
      const internal: CandidacyRow[] = []

      if (user) {
        const { data: cands } = await supabase
          .from('candidaturas')
          .select('*')
          .eq('candidato_id', user.id)
          .order('data_candidatura', { ascending: false })
        if (cands && cands.length > 0) {
          const vagaIds = Array.from(new Set(cands.map((c: any) => c.vaga_id)))
          const { data: vagasInfo } = await supabase.from('vagas').select('id, titulo, empresa_nome, localizacao, logo_url').in('id', vagaIds)
          const vagasMap: Record<string, any> = {}
          ;(vagasInfo || []).forEach((v: any) => { vagasMap[v.id] = v })
          cands.forEach((c: any) => {
            const v = vagasMap[c.vaga_id]
            internal.push({
              key: `int-${c.id}`,
              title: v?.titulo || 'Vaga',
              company: v?.empresa_nome || 'Empresa',
              logo_url: v?.logo_url || null,
              location: v?.localizacao || null,
              date: c.data_candidatura,
              status: c.status === 'aprovada' ? 'aprovada' : c.status === 'rejeitada' ? 'rejeitada' : 'enviada',
              href: `/vagas/detalhe/?id=${c.vaga_id}`,
            })
          })
        }
      }

      const external: CandidacyRow[] = getExternalApplies().map((a: ExternalCandidacy) => ({
        key: `ext-${a.job_id}`,
        title: a.title,
        company: a.company,
        logo_url: a.logo_url,
        location: a.location,
        date: a.applied_at,
        status: 'externa',
        href: `/vagas/externa/?id=${a.job_id}`,
        via: a.via === 'email' ? 'por e-mail' : 'no site oficial',
      }))

      setRows([...internal, ...external].sort((a, b) => b.date.localeCompare(a.date)))
      setLoading(false)
    }
    load()
  }, [router])

  const counts = {
    todas: rows.length,
    enviada: rows.filter(r => r.status === 'enviada').length,
    aprovada: rows.filter(r => r.status === 'aprovada').length,
    rejeitada: rows.filter(r => r.status === 'rejeitada').length,
    externa: rows.filter(r => r.status === 'externa').length,
  }
  const filtered = filter === 'todas' ? rows : rows.filter(r => r.status === filter)

  const formatDate = (d: string) => {
    if (!d) return ''
    const diff = Date.now() - new Date(d).getTime()
    const days = Math.floor(diff / 86400000)
    if (days <= 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 30) return `Há ${days} dias`
    return new Date(d).toLocaleDateString('pt-PT')
  }

  const FILTERS: { key: 'todas' | Status; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'enviada', label: 'Pendentes' },
    { key: 'aprovada', label: 'Aceites' },
    { key: 'rejeitada', label: 'Rejeitadas' },
    { key: 'externa', label: 'Externas' },
  ]

  return (
    <div className="min-h-screen bg-ms-surface">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 pt-5 pb-16">
        <div className="flex items-center gap-2.5 mb-1">
          <ClipboardList size={20} className="text-ms-blue" />
          <h1 className="text-xl font-bold text-ms-dark">Minhas candidaturas</h1>
          {rows.length > 0 && <span className="text-xs font-bold bg-ms-blue/10 text-ms-blue px-2 py-0.5 rounded-full">{rows.length}</span>}
        </div>
        <p className="text-xs text-ms-gray mb-4">Acompanha o estado das tuas candidaturas MÔ SALO e externas.</p>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-all ${filter === f.key ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-dark border-ms-border'}`}
            >
              {f.label}{counts[f.key] > 0 && ` (${counts[f.key]})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-ms-border rounded-2xl p-10 text-center">
            <Briefcase size={36} className="text-ms-gray mx-auto mb-3" />
            <p className="text-sm text-ms-dark font-medium mb-1">{filter === 'todas' ? 'Ainda não te candidataste a nenhuma vaga' : 'Nenhuma candidatura neste estado'}</p>
            <p className="text-xs text-ms-gray mb-4">As vagas a que te candidatares vão aparecer aqui.</p>
            <Link href="/vagas/" className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-ms-blue rounded-xl px-4 py-2.5 hover:bg-blue-700">Explorar vagas <ChevronRight size={14} /></Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(c => {
              const meta = STATUS_META[c.status]
              const Icon = meta.icon
              return (
                <Link key={c.key} href={c.href} className="block bg-white border border-ms-border rounded-2xl p-4 hover:border-ms-blue/40 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <CompanyLogo company={c.company} logoUrl={c.logo_url ?? undefined} size={44} rounded="rounded-xl" className="border border-ms-border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-ms-dark leading-snug line-clamp-2">{c.title}</p>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${meta.cls}`}>
                          <Icon size={11} /> {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-ms-gray mt-0.5 truncate">{c.company}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-ms-gray">
                        {c.location && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {c.location}</span>}
                        <span className="inline-flex items-center gap-1"><Clock size={11} /> {formatDate(c.date)}</span>
                        {c.via && <span className="inline-flex items-center gap-1"><Mail size={11} /> {c.via}</span>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-ms-gray flex-shrink-0 self-center" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
