'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, ArrowLeft, MapPin, Briefcase, MessageSquare, Users, BadgeCheck, ChevronRight } from 'lucide-react'
import UserAvatar from '@/components/UserAvatar'

interface PersonResult {
  id: string
  nome: string
  email: string
  role: string
  telefone?: string
  profile?: {
    area?: string
    localizacao?: string
    competencias?: string
    bio?: string
    nivel_academico?: string
    experiencias?: string
  }
}

const FILTROS = ['Todos', 'Talentos', 'Recrutadores']

export default function PessoasPage() {
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState('Todos')
  const [catFiltro, setCatFiltro] = useState('Todas')
  const [results, setResults] = useState<PersonResult[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login/'); return }
      const { data: u } = await supabase.from('users').select('id').eq('email', session.user.email).single()
      if (u) setCurrentUserId(u.id)
      await loadPeople('')
    }
    init()
  }, [router])

  const loadPeople = async (search: string) => {
    setLoading(true)
    let usersQuery = supabase.from('users').select('id, nome, email, role, telefone')

    if (search.trim()) {
      usersQuery = usersQuery.or(`nome.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users } = await usersQuery.limit(50)
    if (!users) { setLoading(false); return }

    const userIds = users.map(u => u.id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, area, localizacao, competencias, bio, nivel_academico, experiencias')
      .in('user_id', userIds)

    const profilesMap: Record<string, any> = {}
    ;(profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p })

    const enriched: PersonResult[] = users
      .filter(u => u.id !== currentUserId)
      .filter(u => u.role !== 'admin')
      .map(u => ({
        ...u,
        profile: profilesMap[u.id] || undefined,
      }))

    setResults(enriched)
    setLoading(false)
  }

  const handleSearch = (val: string) => {
    setQuery(val)
    loadPeople(val)
  }

  const recordView = async (viewedId: string) => {
    if (!currentUserId || currentUserId === viewedId) return
    await supabase.from('profile_views').insert({
      viewer_id: currentUserId,
      viewed_id: viewedId,
    }).then(() => {})
  }

  const startConversation = async (otherId: string) => {
    if (!currentUserId) return
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1_id.eq.${currentUserId},participant_2_id.eq.${otherId}),and(participant_1_id.eq.${otherId},participant_2_id.eq.${currentUserId})`)
      .maybeSingle()

    if (existing) {
      router.push(`/mensagens/?conv=${existing.id}`)
      return
    }

    const { data: conv, error } = await supabase.from('conversations').insert({
      participant_1_id: currentUserId,
      participant_2_id: otherId,
    }).select('id').single()

    if (error) { alert('Erro ao criar conversa: ' + error.message); return }
    router.push(`/mensagens/?conv=${conv.id}`)
  }

  const parseCompetencias = (comp: any): string[] => {
    if (!comp) return []
    if (Array.isArray(comp)) return comp.map(c => String(c).trim()).filter(Boolean)
    if (typeof comp === 'string') {
      const trimmed = comp.trim()
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed)
          if (Array.isArray(parsed)) return parsed.map(c => String(c).trim()).filter(Boolean)
        } catch { /* fall through */ }
      }
      return trimmed.split(',').map(c => c.trim()).filter(Boolean)
    }
    return []
  }

  const categorias = Array.from(new Set(
    results.filter(p => p.role === 'candidato' && p.profile?.area).map(p => p.profile!.area as string)
  )).sort()

  const filtered = results.filter(p => {
    if (filtro === 'Talentos' && p.role !== 'candidato') return false
    if (filtro === 'Recrutadores' && p.role !== 'recrutador') return false
    if (catFiltro !== 'Todas') {
      if (p.role !== 'candidato') return false
      if (p.profile?.area !== catFiltro) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-ms-surface">
      <header className="sticky top-0 z-50 border-b border-ms-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-ms-surface text-ms-dark">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs text-ms-gray">Diretório de talentos</p>
            <h1 className="text-base font-semibold text-ms-dark">Pessoas</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-8 pt-4">
        <div className="mb-4 flex items-center gap-3 rounded-full border border-ms-border bg-white px-4 py-3 shadow-sm focus-within:border-ms-blue">
          <Search size={18} className="flex-shrink-0 text-ms-gray" />
          <input
            type="text"
            placeholder="Pesquisar por nome, competência ou cidade..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-ms-dark outline-none placeholder:text-ms-gray"
          />
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTROS.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${filtro === f ? 'border-ms-blue bg-ms-blue text-white' : 'border-ms-border bg-white text-ms-gray'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtro !== 'Recrutadores' && categorias.length > 0 && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['Todas', ...categorias].map(c => (
              <button
                key={c}
                onClick={() => setCatFiltro(c)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${catFiltro === c ? 'border-ms-blue bg-ms-blue text-white' : 'border-ms-border bg-white text-ms-gray'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ms-blue border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-ms-gray/30" />
            <p className="text-sm text-ms-gray">Nenhuma pessoa encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(person => {
              const competencias = parseCompetencias(person.profile?.competencias)
              return (
                <article key={person.id} className="overflow-hidden rounded-2xl border border-ms-border bg-white shadow-sm transition-shadow hover:shadow-md">
                  <Link href={`/pessoas/detalhe/?id=${person.id}`} onClick={() => recordView(person.id)} className="block p-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar userId={person.id} name={person.nome} size={56} className="shrink-0 border border-ms-border" imageClassName="object-cover" fallbackClassName="bg-ms-blue/10 text-ms-blue" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-ms-dark">{person.nome || 'Utilizador'}</h3>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${person.role === 'recrutador' ? 'bg-ms-blue/10 text-ms-blue' : 'bg-ms-purple-light text-ms-purple'}`}>
                            <BadgeCheck size={10} /> {person.role === 'recrutador' ? 'Recrutador' : 'Talento'}
                          </span>
                        </div>

                        {person.role === 'recrutador' ? (
                          <p className="mt-1 text-xs text-ms-gray">Perfil de recrutador · contacta por mensagem</p>
                        ) : (
                          <div className="mt-1 space-y-1">
                            {person.profile?.area && (
                              <p className="flex items-center gap-1 text-xs font-medium text-ms-dark">
                                <Briefcase size={11} className="text-ms-blue" /> {person.profile.area}
                              </p>
                            )}
                            {person.profile?.localizacao && (
                              <p className="flex items-center gap-1 text-xs text-ms-gray">
                                <MapPin size={11} className="text-ms-gray" /> {person.profile.localizacao}
                              </p>
                            )}
                            {person.profile?.bio && (
                              <p className="line-clamp-2 text-xs text-ms-gray"><span className="font-medium text-ms-dark">Sobre:</span> {person.profile.bio}</p>
                            )}
                            {person.profile?.experiencias && (
                              <p className="line-clamp-2 text-xs text-ms-gray"><span className="font-medium text-ms-dark">Experiência:</span> {person.profile.experiencias}</p>
                            )}
                            {competencias.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {competencias.slice(0, 6).map((c, i) => (
                                  <span key={i} className="rounded-full bg-ms-surface px-2 py-1 text-[10px] font-medium text-ms-gray">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between gap-2 border-t border-ms-border px-4 py-3">
                    <button
                      onClick={() => { recordView(person.id); startConversation(person.id) }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-ms-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <MessageSquare size={14} /> Mensagem
                    </button>
                    <Link href={`/pessoas/detalhe/?id=${person.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-ms-blue">
                      Ver perfil <ChevronRight size={14} />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
