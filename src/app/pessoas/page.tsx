'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import Logo from '@/components/Logo'
import {
  Search, MessageSquare, Bell, Users, User, MapPin, Briefcase,
  Bookmark, Heart, MessageCircle, Share2, Home, FileText, Plus,
  Image as ImageIcon, Film, Paperclip, MoreHorizontal
} from 'lucide-react'

interface PersonResult {
  id: string
  nome: string
  email: string
  role: string
  telefone?: string
  avatar_url?: string | null
  created_at?: string
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

const getTimeAgo = (date?: string) => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}m`
}

const getAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return null
  if (avatar.startsWith('http')) return avatar
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${avatar}`
}

const Avatar = ({ url, name, size = 40, className = '' }: { url?: string | null; name?: string; size?: number; className?: string }) => {
  const src = getAvatarUrl(url)
  const initial = (name || 'U').charAt(0).toUpperCase()
  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-gradient-to-br from-ms-blue to-ms-purple text-white font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        <img src={src} alt={name || ''} className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  )
}

export default function PessoasPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filtro, setFiltro] = useState('Todos')
  const [catFiltro, setCatFiltro] = useState('Todas')
  const [showAllAreas, setShowAllAreas] = useState(false)
  const [results, setResults] = useState<PersonResult[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; nome: string; role: string; avatar_url?: string | null } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const loadPeople = useCallback(async (search: string, currentUserId?: string) => {
    setLoading(true)
    let usersQuery = supabase
      .from('users')
      .select('id, nome, email, role, telefone, avatar_url, created_at')

    if (search.trim()) {
      usersQuery = usersQuery.or(`nome.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
    }

    const { data: users } = await usersQuery.order('created_at', { ascending: false }).limit(50)
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
      .map(u => ({ ...u, profile: profilesMap[u.id] || undefined }))

    setResults(enriched)
    setLoading(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login/'); return }
      setIsLoggedIn(true)
      const { data: u } = await supabase
        .from('users')
        .select('id, nome, role, avatar_url, created_at')
        .eq('email', session.user.email)
        .single()
      if (u) setCurrentUser(u)
      loadPeople('', u?.id)
    }
    init()
  }, [router, loadPeople])

  const handleSearch = (val: string) => {
    setQuery(val)
    loadPeople(val, currentUser?.id)
  }

  const recordView = async (viewedId: string) => {
    if (!currentUser || currentUser.id === viewedId) return
    try {
      await supabase.from('profile_views').insert({ viewer_id: currentUser.id, viewed_id: viewedId })
    } catch {}
  }

  const startConversation = async (otherId: string) => {
    if (!currentUser) return
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1_id.eq.${currentUser.id},participant_2_id.eq.${otherId}),and(participant_1_id.eq.${otherId},participant_2_id.eq.${currentUser.id})`)
      .maybeSingle()

    if (existing) {
      router.push(`/mensagens/?conv=${existing.id}`)
      return
    }

    const { data: conv, error } = await supabase.from('conversations').insert({
      participant_1_id: currentUser.id,
      participant_2_id: otherId,
    }).select('id').single()

    if (error) { alert('Erro ao criar conversa: ' + error.message); return }
    router.push(`/mensagens/?conv=${conv.id}`)
  }

  const shareProfile = async (person: PersonResult) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/pessoas/`
    if (navigator.share) {
      try { await navigator.share({ title: person.nome, text: `Veja o perfil de ${person.nome} no MÔ SALO`, url }) } catch {}
    } else if (navigator.clipboard) {
      try { await navigator.clipboard.writeText(url); alert('Link copiado para a área de transferência') } catch {}
    }
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

  const areaCounts = categorias
    .map(area => ({ area, count: results.filter(p => p.role === 'candidato' && p.profile?.area === area).length }))
    .sort((a, b) => b.count - a.count)

  const filtered = results.filter(p => {
    if (filtro === 'Talentos' && p.role !== 'candidato') return false
    if (filtro === 'Recrutadores' && p.role !== 'recrutador') return false
    if (catFiltro !== 'Todas') {
      if (p.role !== 'candidato') return false
      if (p.profile?.area !== catFiltro) return false
    }
    return true
  })

  const highlights = results.slice(0, 12)

  const bottomNav = [
    { key: 'home', label: 'Início', href: '/', icon: Home },
    { key: 'vagas', label: 'Vagas', href: '/vagas/', icon: Search },
    { key: 'candidaturas', label: 'Candidaturas', href: isLoggedIn && currentUser ? `/dashboard/${currentUser.role}/?tab=candidaturas` : '/auth/login/', icon: FileText },
    { key: 'pessoas', label: 'Pessoas', href: '/pessoas/', icon: Users },
    { key: 'perfil', label: 'Perfil', href: isLoggedIn && currentUser ? `/dashboard/${currentUser.role}/?tab=perfil` : '/auth/login/', icon: User },
  ]

  return (
    <div className="min-h-screen bg-ms-surface pb-24 lg:pb-0">
      {/* Top header */}
      <header className="sticky top-0 bg-white z-50 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSearch(v => !v)} className="p-1 text-ms-dark hover:text-ms-blue transition-colors">
              <Search size={22} />
            </button>
            <Link href="/mensagens/" className="p-1 text-ms-dark hover:text-ms-blue transition-colors">
              <MessageSquare size={22} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4">
        {/* Search card */}
        {showSearch && (
          <div className="bg-white rounded-2xl p-3 border border-ms-border mb-4 shadow-sm">
            <div className="flex items-center gap-2 bg-ms-surface rounded-xl px-3 py-2.5">
              <Search size={18} className="text-ms-gray" />
              <input
                type="text"
                placeholder="Pesquisar pessoas, competências ou cidades..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray"
              />
            </div>
          </div>
        )}

        {/* Composer card */}
        <div className="bg-white rounded-2xl p-4 border border-ms-border mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Avatar url={currentUser?.avatar_url} name={currentUser?.nome} size={44} />
            <Link
              href={currentUser ? `/dashboard/${currentUser.role}/?tab=perfil` : '/auth/login/'}
              className="flex-1 bg-ms-surface rounded-xl px-4 py-2.5 text-sm text-ms-gray hover:bg-blue-50 transition-colors"
            >
              Partilha a tua experiência profissional...
            </Link>
          </div>
          <div className="flex items-center justify-between px-2">
            <button className="flex items-center gap-1.5 text-xs font-medium text-ms-gray hover:text-ms-blue transition-colors">
              <ImageIcon size={16} /> Foto
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium text-ms-gray hover:text-ms-blue transition-colors">
              <Film size={16} /> Vídeo
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium text-ms-gray hover:text-ms-blue transition-colors">
              <Paperclip size={16} /> Anexo
            </button>
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {FILTROS.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${filtro === f ? 'bg-ms-blue text-white' : 'bg-white text-ms-dark border border-ms-border hover:bg-ms-surface'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Areas */}
        {filtro !== 'Recrutadores' && areaCounts.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ms-dark">Áreas Populares</h2>
              <button onClick={() => setShowAllAreas(v => !v)} className="text-xs text-ms-blue font-medium">
                {showAllAreas ? 'Ver menos' : 'Ver todas'}
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => setCatFiltro('Todas')}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 ${catFiltro === 'Todas' ? 'opacity-100' : 'opacity-80'}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg ${catFiltro === 'Todas' ? 'ring-2 ring-ms-blue ring-offset-2' : ''}`} style={{ background: 'linear-gradient(135deg, #1A56FF 0%, #6C47FF 100%)' }}>
                  <Briefcase size={20} />
                </div>
                <span className="text-[10px] font-medium text-ms-dark">Todas</span>
              </button>
              {(showAllAreas ? areaCounts : areaCounts.slice(0, 6)).map(({ area }) => {
                const active = catFiltro === area
                return (
                  <button
                    key={area}
                    onClick={() => setCatFiltro(active ? 'Todas' : area)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg transition-transform ${active ? 'ring-2 ring-ms-blue ring-offset-2' : 'hover:scale-105'}`} style={{ background: 'linear-gradient(135deg, #1A56FF 0%, #6C47FF 100%)' }}>
                      {(area || 'T').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-medium text-ms-dark text-center leading-tight max-w-[70px] truncate">{area}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Highlights stories */}
        {highlights.length > 0 && (
          <section className="mb-5">
            <h2 className="text-sm font-bold text-ms-dark mb-3">Pessoas em destaque</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              <Link href={currentUser ? `/dashboard/${currentUser.role}/?tab=perfil` : '/auth/login/'} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className="relative">
                  <Avatar url={currentUser?.avatar_url} name={currentUser?.nome} size={64} />
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-ms-blue text-white rounded-full flex items-center justify-center border-2 border-white">
                    <Plus size={12} />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-ms-dark">Eu</span>
              </Link>
              {highlights.map(person => (
                <button
                  key={person.id}
                  onClick={() => { recordView(person.id); router.push(`/pessoas/perfil/?id=${person.id}`) }}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5"
                >
                  <div className="w-16 h-16 rounded-full p-0.5" style={{ background: 'linear-gradient(135deg, #1A56FF 0%, #6C47FF 100%)' }}>
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                      <Avatar url={person.avatar_url} name={person.nome} size={60} className="w-full h-full rounded-none" />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-ms-dark text-center leading-tight max-w-[70px] truncate">{person.nome.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-ms-border">
            <Users size={40} className="text-ms-gray mx-auto mb-3" />
            <p className="text-sm text-ms-gray">Nenhuma pessoa encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(person => {
              const comps = parseCompetencias(person.profile?.competencias)
              const isLiked = !!liked[person.id]
              const isSaved = !!saved[person.id]
              return (
                <div key={person.id} className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar url={person.avatar_url} name={person.nome} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-ms-dark truncate">{person.nome || 'Utilizador'}</h3>
                          <p className="text-xs text-ms-gray">{getTimeAgo(person.created_at)}</p>
                        </div>
                        <button className="text-ms-gray hover:text-ms-dark"><MoreHorizontal size={18} /></button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${person.role === 'recrutador' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {person.role === 'recrutador' ? 'Recrutador' : 'Talento'}
                        </span>
                        {person.profile?.area && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-ms-purple-light text-ms-purple">
                            {person.profile.area}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    {person.profile?.bio && (
                      <p className="text-sm text-ms-dark mb-2">{person.profile.bio}</p>
                    )}
                    {person.profile?.experiencias && (
                      <p className="text-xs text-ms-gray line-clamp-2 mb-2"><span className="font-medium text-ms-dark">Experiência:</span> {person.profile.experiencias}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-ms-gray">
                      {person.profile?.localizacao && (
                        <span className="flex items-center gap-1"><MapPin size={12} /> {person.profile.localizacao}</span>
                      )}
                      {person.profile?.nivel_academico && (
                        <span className="flex items-center gap-1"><Briefcase size={12} /> {person.profile.nivel_academico}</span>
                      )}
                    </div>
                    {comps.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {comps.slice(0, 6).map((c, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-ms-surface text-ms-dark rounded-full font-medium">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-ms-border">
                    <button onClick={() => setLiked(p => ({ ...p, [person.id]: !p[person.id] }))} className={`flex items-center gap-1.5 text-xs font-medium ${isLiked ? 'text-red-500' : 'text-ms-gray hover:text-ms-dark'}`}>
                      <Heart size={18} className={isLiked ? 'fill-red-500' : ''} /> Gosto
                    </button>
                    <button onClick={() => { recordView(person.id); startConversation(person.id) }} className="flex items-center gap-1.5 text-xs font-medium text-ms-gray hover:text-ms-dark">
                      <MessageCircle size={18} /> Mensagem
                    </button>
                    <button onClick={() => shareProfile(person)} className="flex items-center gap-1.5 text-xs font-medium text-ms-gray hover:text-ms-dark">
                      <Share2 size={18} /> Partilhar
                    </button>
                    <button onClick={() => setSaved(p => ({ ...p, [person.id]: !p[person.id] }))} className={`flex items-center gap-1.5 text-xs font-medium ${isSaved ? 'text-ms-blue' : 'text-ms-gray hover:text-ms-dark'}`}>
                      <Bookmark size={18} className={isSaved ? 'fill-ms-blue' : ''} /> Guardar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
        <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
          {bottomNav.map(item => {
            const Icon = item.icon
            const active = item.key === 'pessoas'
            return (
              <Link key={item.key} href={item.href} className="flex flex-col items-center gap-0.5 py-1">
                <Icon size={22} className={active ? 'text-ms-blue' : 'text-ms-gray'} />
                <span className={`text-[10px] ${active ? 'text-ms-blue font-medium' : 'text-ms-gray'}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
