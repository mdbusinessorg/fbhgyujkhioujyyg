'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import { startOrRequestConversation } from '@/lib/messaging'
import { social } from '@/lib/social'
import Logo from '@/components/Logo'
import ShareMenu from '@/components/ShareMenu'
import {
  Search, MessageSquare, Users, User, MapPin, Briefcase,
  Bookmark, Heart, MessageCircle, Home, FileText, Plus,
  MoreHorizontal, Send, Trash2, Eye
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

interface PostAuthor {
  id: string
  nome: string
  avatar_url?: string | null
  role: string
}

interface Post {
  id: string
  user_id: string
  content: string
  created_at: string
  author: PostAuthor
  likes_count: number
  liked_by_me: boolean
}

interface Liker {
  id: string
  nome: string
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
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = new URLSearchParams(window.location.search).get('post')
    if (id) setHighlightPostId(id)
  }, [])

  const [activeTab, setActiveTab] = useState<'feed' | 'pessoas'>('feed')
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filtro, setFiltro] = useState('Todos')
  const [catFiltro, setCatFiltro] = useState('Todas')
  const [showAllAreas, setShowAllAreas] = useState(false)
  const [results, setResults] = useState<PersonResult[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; nome: string; role: string; avatar_url?: string | null } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [postContent, setPostContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [postedToday, setPostedToday] = useState(false)
  const [likersModal, setLikersModal] = useState<{ open: boolean; postId: string | null; likers: Liker[] }>({ open: false, postId: null, likers: [] })

  const loadPeople = useCallback(async (search: string, currentUserId?: string) => {
    setLoadingPeople(true)
    let usersQuery = supabase
      .from('users')
      .select('id, nome, email, role, telefone, avatar_url, created_at')

    if (search.trim()) {
      usersQuery = usersQuery.or(`nome.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
    }

    const { data: users } = await usersQuery.order('created_at', { ascending: false }).limit(50)
    if (!users) { setLoadingPeople(false); return }

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
    setLoadingPeople(false)
  }, [])

  const loadPosts = useCallback(async (currentUserId?: string) => {
    setLoadingPosts(true)
    try {
      const postsData = await social.getPosts()

      const likesByPost: Record<string, string[]> = {}
      await Promise.all(postsData.map(async p => {
        try {
          const { likes } = await social.getLikes(p.id)
          likesByPost[p.id] = likes
        } catch { likesByPost[p.id] = [] }
      }))

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let hasPostedToday = false

      const enriched: Post[] = postsData.map(p => {
        const author = p.author || { id: p.user_id, nome: 'Utilizador', role: 'candidato' }
        const likesUsers = likesByPost[p.id] || []
        if (currentUserId && p.user_id === currentUserId && new Date(p.created_at) >= today) {
          hasPostedToday = true
        }
        return {
          ...p,
          author,
          likes_count: likesUsers.length,
          liked_by_me: currentUserId ? likesUsers.includes(currentUserId) : false,
        }
      })

      setPosts(enriched)
      if (currentUserId) setPostedToday(hasPostedToday)
    } catch {
      setPosts([])
    }
    setLoadingPosts(false)
  }, [])

  const checkPostedToday = useCallback(async (userId?: string) => {
    if (!userId) return
    try {
      const posts = await social.getPosts()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const found = posts.some(p => p.user_id === userId && new Date(p.created_at) >= today)
      if (found) setPostedToday(true)
    } catch {}
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
      if (u) {
        setCurrentUser(u)
        loadPeople('', u.id)
        loadPosts(u.id)
        checkPostedToday(u.id)
      } else {
        loadPeople('')
        loadPosts()
      }
    }
    init()
  }, [router, loadPeople, loadPosts, checkPostedToday])

  useEffect(() => {
    if (highlightPostId && posts.length > 0) {
      const el = document.getElementById(`post-${highlightPostId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-ms-blue')
        setTimeout(() => el.classList.remove('ring-2', 'ring-ms-blue'), 2000)
      }
    }
  }, [highlightPostId, posts])

  const handleSearch = (val: string) => {
    setQuery(val)
    loadPeople(val, currentUser?.id)
  }

  const handlePublish = async () => {
    if (!currentUser || !postContent.trim()) return
    if (postedToday) { alert('Só podes publicar uma vez por dia.'); return }
    setPosting(true)
    try {
      await social.createPost({
        user_id: currentUser.id,
        content: postContent.trim(),
        author: { id: currentUser.id, nome: currentUser.nome, avatar_url: currentUser.avatar_url, role: currentUser.role },
      })
      setPostContent('')
      setPostedToday(true)
      loadPosts(currentUser.id)
    } catch (err: any) {
      alert('Erro ao publicar: ' + (err.message || 'tenta de novo'))
    }
    setPosting(false)
  }

  const toggleLike = async (post: Post) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    const newLiked = !post.liked_by_me
    try {
      const { likes } = newLiked
        ? await social.likePost(post.id, currentUser.id)
        : await social.unlikePost(post.id, currentUser.id)
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked_by_me: likes.includes(currentUser.id), likes_count: likes.length } : p))
    } catch {}
  }

  const deletePost = async (postId: string) => {
    if (!currentUser) return
    if (!confirm('Apagar publicação?')) return
    try {
      await social.deletePost(postId, currentUser.id)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch {}
  }

  const openLikers = async (postId: string) => {
    try {
      const { likes } = await social.getLikes(postId)
      const { data: users } = await supabase.from('users').select('id, nome').in('id', likes)
      const usersMap: Record<string, string> = {}
      ;(users || []).forEach((u: any) => { usersMap[u.id] = u.nome })
      const likers: Liker[] = likes.map(id => ({ id, nome: usersMap[id] || 'Utilizador' }))
      setLikersModal({ open: true, postId, likers })
    } catch { setLikersModal({ open: true, postId: '', likers: [] }) }
  }

  const recordView = async (viewedId: string) => {
    if (!currentUser || currentUser.id === viewedId) return
    try {
      await supabase.from('profile_views').insert({ viewer_id: currentUser.id, viewed_id: viewedId })
    } catch {}
  }

  const handleMessage = (otherId: string) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    startOrRequestConversation(currentUser.id, otherId, router)
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
        } catch {}
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

  const renderComposer = () => (
    <div className="bg-white rounded-2xl p-4 border border-ms-border mb-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar url={currentUser?.avatar_url} name={currentUser?.nome} size={44} />
        <div className="flex-1">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={currentUser ? "Partilha uma ideia, uma oportunidade ou uma conquista profissional..." : "Inicia sessão para publicares"}
            disabled={!currentUser || postedToday || posting}
            className="w-full bg-ms-surface rounded-xl px-4 py-3 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20 resize-none disabled:opacity-60"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-ms-gray">{postContent.length}/500</span>
            {postedToday ? (
              <span className="text-xs text-ms-gray">Já publicaste hoje</span>
            ) : (
              <button
                onClick={handlePublish}
                disabled={!currentUser || !postContent.trim() || posting}
                className="flex items-center gap-1.5 px-4 py-2 bg-ms-blue text-white rounded-xl text-xs font-medium disabled:opacity-50 hover:bg-ms-blue-dark transition-colors"
              >
                <Send size={14} /> Publicar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderFeed = () => (
    <div className="space-y-4">
      {renderComposer()}
      {loadingPosts ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-ms-border">
          <MessageSquare size={40} className="text-ms-gray mx-auto mb-3" />
          <p className="text-sm text-ms-gray">Ainda não há publicações.</p>
          <p className="text-xs text-ms-gray mt-1">Sê o primeiro a partilhar.</p>
        </div>
      ) : (
        posts.map(post => (
          <article
            key={post.id}
            id={`post-${post.id}`}
            className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-3 mb-3">
              <button onClick={() => { recordView(post.user_id); router.push(`/pessoas/perfil/?id=${post.user_id}`) }}>
                <Avatar url={post.author.avatar_url} name={post.author.nome} size={48} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className="text-sm font-bold text-ms-dark truncate cursor-pointer"
                      onClick={() => { recordView(post.user_id); router.push(`/pessoas/perfil/?id=${post.user_id}`) }}
                    >
                      {post.author.nome || 'Utilizador'}
                    </h3>
                    <p className="text-xs text-ms-gray">{getTimeAgo(post.created_at)}</p>
                  </div>
                  {currentUser?.id === post.user_id && (
                    <button onClick={() => deletePost(post.id)} className="text-ms-gray hover:text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${post.author.role === 'recrutador' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                  {post.author.role === 'recrutador' ? 'Recrutador' : 'Talento'}
                </span>
              </div>
            </div>

            <p className="text-sm text-ms-dark whitespace-pre-wrap mb-4">{post.content}</p>

            <div className="flex items-center justify-between pt-3 border-t border-ms-border">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike(post)}
                  className={`flex items-center gap-1.5 text-xs font-medium ${post.liked_by_me ? 'text-red-500' : 'text-ms-gray hover:text-ms-dark'}`}
                >
                  <Heart size={18} className={post.liked_by_me ? 'fill-red-500' : ''} /> {post.likes_count}
                </button>
                {currentUser?.id === post.user_id && post.likes_count > 0 && (
                  <button onClick={() => openLikers(post.id)} className="flex items-center gap-1 text-xs text-ms-gray hover:text-ms-blue">
                    <Eye size={14} /> Quem reagiu
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {currentUser && currentUser.id !== post.user_id && (
                  <button onClick={() => handleMessage(post.user_id)} className="flex items-center gap-1.5 text-xs font-medium text-ms-gray hover:text-ms-blue">
                    <MessageCircle size={18} /> Mensagem
                  </button>
                )}
                <ShareMenu
                  url={`${typeof window !== 'undefined' ? window.location.origin : ''}/pessoas/?post=${post.id}`}
                  text={`Publicação de ${post.author.nome} no MÔ SALO`}
                />
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  )

  const renderPeople = () => (
    <>
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

      {loadingPeople ? (
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
                  <button onClick={() => { recordView(person.id); handleMessage(person.id) }} className="flex items-center gap-1.5 text-xs font-medium text-ms-gray hover:text-ms-dark">
                    <MessageCircle size={18} /> Mensagem
                  </button>
                  <ShareMenu
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/pessoas/perfil/?id=${person.id}`}
                    text={`Perfil de ${person.nome} no MÔ SALO`}
                  />
                  <button onClick={() => setSaved(p => ({ ...p, [person.id]: !p[person.id] }))} className={`flex items-center gap-1.5 text-xs font-medium ${isSaved ? 'text-ms-blue' : 'text-ms-gray hover:text-ms-dark'}`}>
                    <Bookmark size={18} className={isSaved ? 'fill-ms-blue' : ''} /> Guardar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-ms-surface pb-24 lg:pb-0">
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
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'feed' ? 'bg-ms-blue text-white' : 'bg-white text-ms-dark border border-ms-border hover:bg-ms-surface'}`}
          >
            Publicações
          </button>
          <button
            onClick={() => setActiveTab('pessoas')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'pessoas' ? 'bg-ms-blue text-white' : 'bg-white text-ms-dark border border-ms-border hover:bg-ms-surface'}`}
          >
            Pessoas
          </button>
        </div>

        {activeTab === 'feed' ? renderFeed() : renderPeople()}
      </main>

      {likersModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={() => setLikersModal({ open: false, postId: null, likers: [] })}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-ms-dark mb-3">Reacções</h3>
            {likersModal.likers.length === 0 ? (
              <p className="text-sm text-ms-gray">Sem reacções.</p>
            ) : (
              <ul className="space-y-3">
                {likersModal.likers.map(l => (
                  <li key={l.id} className="flex items-center gap-3">
                    <Avatar url={null} name={l.nome} size={32} />
                    <span className="text-sm text-ms-dark">{l.nome}</span>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setLikersModal({ open: false, postId: null, likers: [] })} className="w-full mt-4 py-2.5 bg-ms-surface rounded-xl text-sm text-ms-dark font-medium">Fechar</button>
          </div>
        </div>
      )}

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
