'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, ArrowLeft, MapPin, Briefcase, MessageSquare, Eye, Filter, Users, User } from 'lucide-react'

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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login/'); return }
      setIsLoggedIn(true)
      const { data: u } = await supabase.from('users').select('id').eq('email', session.user.email).single()
      if (u) setCurrentUserId(u.id)
      loadPeople('')
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
      .filter(u => u.role !== 'admin') // admins never listed
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
    // Check if conversation exists
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
      // category only applies to candidates
      if (p.role !== 'candidato') return false
      if (p.profile?.area !== catFiltro) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-1"><ArrowLeft size={20} className="text-gray-700" /></Link>
          <h1 className="font-semibold text-gray-900">Pessoas</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 mb-4 border border-gray-100">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, competência ou cidade..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          {FILTROS.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${filtro === f ? 'bg-[#1A56FF] text-white' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Category filter (candidates) */}
        {filtro !== 'Recrutadores' && categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {['Todas', ...categorias].map(c => (
              <button
                key={c}
                onClick={() => setCatFiltro(c)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${catFiltro === c ? 'bg-[#6C47FF] text-white' : 'bg-white text-gray-500 border border-gray-100'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#1A56FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhuma pessoa encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(person => (
              <div key={person.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold ${person.role === 'recrutador' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-[#1A56FF] to-[#6C47FF]'}`}>
                    {(person.nome || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{person.nome || 'Utilizador'}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${person.role === 'recrutador' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {person.role === 'recrutador' ? 'Recrutador' : 'Talento'}
                      </span>
                    </div>

                    {person.role === 'recrutador' ? (
                      /* Limited recruiter card — no personal/competence details */
                      <p className="text-xs text-gray-400 mt-1">Perfil de recrutador · contacta por mensagem</p>
                    ) : (
                      <>
                        {person.profile?.area && (
                          <p className="text-xs text-gray-600 mt-0.5 font-medium flex items-center gap-1">
                            <Briefcase size={11} /> {person.profile.area}
                          </p>
                        )}
                        {person.profile?.localizacao && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin size={11} /> {person.profile.localizacao}
                          </p>
                        )}
                        {person.profile?.bio && (
                          <p className="text-xs text-gray-500 mt-1.5"><span className="font-medium text-gray-700">Sobre:</span> {person.profile.bio}</p>
                        )}
                        {person.profile?.experiencias && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2"><span className="font-medium text-gray-700">Experiência:</span> {person.profile.experiencias}</p>
                        )}
                        {parseCompetencias(person.profile?.competencias).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {parseCompetencias(person.profile?.competencias).slice(0, 6).map((c, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 bg-[#EEF0FF] text-[#6C47FF] rounded-full font-medium">{c}</span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { recordView(person.id); startConversation(person.id) }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1A56FF] text-white text-xs font-medium rounded-lg hover:bg-[#1445DD] transition-colors"
                  >
                    <MessageSquare size={12} /> Mensagem
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
