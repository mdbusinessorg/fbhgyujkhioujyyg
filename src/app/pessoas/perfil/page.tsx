'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import Logo from '@/components/Logo'
import { ArrowLeft, MapPin, Briefcase, MessageSquare, Share2, Bookmark, Users } from 'lucide-react'

interface PersonProfile {
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

const getAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return null
  if (avatar.startsWith('http')) return avatar
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${avatar}`
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

function PerfilContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [person, setPerson] = useState<PersonProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: u } = await supabase.from('users').select('id, role').eq('email', session.user.email).single()
        if (u) setCurrentUser(u)
      }
      if (!id) { setLoading(false); return }
      const { data: u } = await supabase.from('users').select('id, nome, email, role, telefone, avatar_url, created_at').eq('id', id).single()
      if (!u) { setLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('area, localizacao, competencias, bio, nivel_academico, experiencias').eq('user_id', id).single()
      setPerson({ ...u, profile: p || undefined })
      setLoading(false)
    }
    init()
  }, [id])

  const startConversation = async () => {
    if (!currentUser || !person) return
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1_id.eq.${currentUser.id},participant_2_id.eq.${person.id}),and(participant_1_id.eq.${person.id},participant_2_id.eq.${currentUser.id})`)
      .maybeSingle()

    if (existing) { router.push(`/mensagens/?conv=${existing.id}`); return }

    const { data: conv, error } = await supabase.from('conversations').insert({
      participant_1_id: currentUser.id,
      participant_2_id: person.id,
    }).select('id').single()

    if (error) { alert('Erro ao criar conversa: ' + error.message); return }
    router.push(`/mensagens/?conv=${conv.id}`)
  }

  const shareProfile = async () => {
    if (!person) return
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      try { await navigator.share({ title: person.nome, text: `Veja o perfil de ${person.nome} no MÔ SALO`, url }) } catch {}
    } else if (navigator.clipboard) {
      try { await navigator.clipboard.writeText(url); alert('Link copiado') } catch {}
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ms-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-ms-surface flex flex-col items-center justify-center p-6 text-center">
        <Users size={40} className="text-ms-gray mx-auto mb-3" />
        <p className="text-ms-gray text-sm">Perfil não encontrado.</p>
        <Link href="/pessoas/" className="mt-4 text-ms-blue text-sm font-medium">Voltar às Pessoas</Link>
      </div>
    )
  }

  const src = getAvatarUrl(person.avatar_url)
  const initial = (person.nome || 'U').charAt(0).toUpperCase()
  const comps = parseCompetencias(person.profile?.competencias)

  return (
    <div className="min-h-screen bg-ms-surface">
      {/* Top header */}
      <header className="sticky top-0 bg-white z-50 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="p-1 -ml-2 text-ms-dark hover:text-ms-blue">
            <ArrowLeft size={22} />
          </button>
          <Link href="/" className="flex items-center">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>
          <button onClick={shareProfile} className="p-1 text-ms-dark hover:text-ms-blue">
            <Share2 size={22} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl p-6 border border-ms-border shadow-sm text-center mb-4">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full p-1" style={{ background: 'linear-gradient(135deg, #1A56FF 0%, #6C47FF 100%)' }}>
            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-ms-blue to-ms-purple flex items-center justify-center text-white text-2xl font-bold">
              {src ? <img src={src} alt={person.nome} className="w-full h-full object-cover" /> : initial}
            </div>
          </div>
          <h1 className="text-xl font-bold text-ms-dark mb-1">{person.nome}</h1>
          <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium mb-3 ${person.role === 'recrutador' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
            {person.role === 'recrutador' ? 'Recrutador' : 'Talento'}
          </span>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-ms-gray mb-5">
            {person.profile?.area && <span className="flex items-center gap-1"><Briefcase size={12} /> {person.profile.area}</span>}
            {person.profile?.localizacao && <span className="flex items-center gap-1"><MapPin size={12} /> {person.profile.localizacao}</span>}
            {person.telefone && <span className="flex items-center gap-1">{person.telefone}</span>}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button onClick={startConversation} className="flex-1 flex items-center justify-center gap-2 bg-ms-blue text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              <MessageSquare size={16} /> Mensagem
            </button>
            <button onClick={() => setSaved(v => !v)} className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-colors ${saved ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-gray border-ms-border hover:bg-ms-surface'}`}>
              <Bookmark size={18} className={saved ? 'fill-white' : ''} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-ms-border shadow-sm mb-4">
          {person.profile?.bio && (
            <div className="mb-4">
              <h2 className="text-sm font-bold text-ms-dark mb-1">Sobre</h2>
              <p className="text-sm text-ms-gray leading-relaxed">{person.profile.bio}</p>
            </div>
          )}
          {person.profile?.experiencias && (
            <div className="mb-4">
              <h2 className="text-sm font-bold text-ms-dark mb-1">Experiência</h2>
              <p className="text-sm text-ms-gray leading-relaxed">{person.profile.experiencias}</p>
            </div>
          )}
          {person.profile?.nivel_academico && (
            <div className="mb-4">
              <h2 className="text-sm font-bold text-ms-dark mb-1">Formação</h2>
              <p className="text-sm text-ms-gray">{person.profile.nivel_academico}</p>
            </div>
          )}
          {comps.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-ms-dark mb-2">Competências</h2>
              <div className="flex flex-wrap gap-2">
                {comps.map((c, i) => (
                  <span key={i} className="text-xs px-3 py-1 bg-ms-surface text-ms-dark rounded-full font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pb-8 text-center">
          <Link href="/pessoas/" className="text-ms-blue text-sm font-medium">Ver mais pessoas</Link>
        </div>
      </main>
    </div>
  )
}

export default function PerfilPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ms-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PerfilContent />
    </Suspense>
  )
}
