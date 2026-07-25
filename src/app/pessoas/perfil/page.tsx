'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { startOrRequestConversation } from '@/lib/messaging'
import { social, type Post, type Connection } from '@/lib/social'
import Logo from '@/components/Logo'
import ShareMenu from '@/components/ShareMenu'
import ProfileAvatar from '@/components/ProfileAvatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import FeedCard from '@/components/FeedCard'
import {
  ArrowLeft, MapPin, MessageSquare, Bookmark, Users, UserPlus, UserCheck,
  Check, X, ShieldCheck, Briefcase, Building2, Camera
} from 'lucide-react'
import { AreaIcon } from '@/lib/area-icons'
import { STORAGE_BUCKET } from '@/lib/supabase'

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
  const [currentUser, setCurrentUser] = useState<{ id: string; nome: string; role: string; avatar_url?: string | null } | null>(null)
  const [saved, setSaved] = useState(false)
  const [relationship, setRelationship] = useState<'none' | 'connected' | 'sent' | 'received' | 'rejected' | 'self'>('none')
  const [request, setRequest] = useState<Connection | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  const [verifyMode, setVerifyMode] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCompany, setVerifyCompany] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyRequested, setVerifyRequested] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)

  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadType, setUploadType] = useState<'avatar' | 'cover' | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      let loggedUserId: string | undefined
      let loggedUser: any
      if (session) {
        const { data: u } = await supabase.from('users').select('id, nome, role, avatar_url').eq('email', session.user.email).single()
        if (u) { setCurrentUser(u); loggedUserId = u.id; loggedUser = u }
      }
      if (!id) { setLoading(false); return }
      const { data: u } = await supabase.from('users').select('id, nome, email, role, telefone, avatar_url, created_at').eq('id', id).single()
      if (!u) { setLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('area, localizacao, competencias, bio, nivel_academico, experiencias').eq('user_id', id).single()
      let personData: PersonProfile = { ...u, profile: p || undefined }
      try {
        const photos = await social.getUserPhotos(id)
        if (photos.avatar_url) personData = { ...personData, avatar_url: photos.avatar_url }
        if (photos.cover_url) setCoverUrl(photos.cover_url)
      } catch {}
      setPerson(personData)

      if (loggedUserId) {
        if (loggedUserId === id) {
          setRelationship('self')
        } else {
          try {
            const req = await social.getConnectionBetween(loggedUserId, id)
            if (!req || !req.id) {
              setRequest(null)
              setRelationship('none')
            } else if (req.status === 'accepted') {
              setRequest(req)
              setRelationship('connected')
            } else if (req.status === 'rejected') {
              setRequest(req)
              setRelationship('rejected')
            } else {
              setRequest(req)
              setRelationship(req.requester_id === loggedUserId ? 'sent' : 'received')
            }
          } catch { setRelationship('none') }

          try {
            const follows = await social.getFollows(loggedUserId)
            setIsFollowing(follows.some(f => f.following_id === id))
          } catch { setIsFollowing(false) }
        }
      } else {
        setRelationship('none')
      }

      if (u.role === 'recrutador' || u.role === 'admin') {
        try {
          const status = await social.getRecruiterVerification(id)
          setIsVerified(!!status.verified)
        } catch { setIsVerified(false) }
      }

      setLoadingPosts(true)
      try {
        const feed = await social.getFeed('para-ti', loggedUserId, 50, 0, id)
        setPosts(feed.posts)
      } catch { setPosts([]) }
      setLoadingPosts(false)

      setLoading(false)
    }
    init()
  }, [id])

  const handleConnect = async () => {
    if (!currentUser || !person) { router.push('/auth/login/'); return }
    try {
      const { data: u } = await supabase.from('users').select('id, nome, avatar_url, role').eq('id', currentUser.id).single()
      const req = await social.createConnection({
        requester_id: currentUser.id,
        recipient_id: person.id,
        requester: u || { id: currentUser.id, nome: currentUser.nome, role: currentUser.role },
      })
      setRequest(req)
      setRelationship('sent')
    } catch (err: any) {
      alert('Erro ao enviar pedido: ' + (err.message || 'tenta de novo'))
    }
  }

  const handleMessage = async () => {
    if (!currentUser || !person) { router.push('/auth/login/'); return }
    if (relationship !== 'connected') { alert('Só podes enviar mensagem após conexão aceite.'); return }
    const { data: existing } = await supabase.from('conversations').select('id').or(`and(participant_1_id.eq.${currentUser.id},participant_2_id.eq.${person.id}),and(participant_1_id.eq.${person.id},participant_2_id.eq.${currentUser.id})`).maybeSingle()
    if (existing) router.push(`/mensagens/?conv=${existing.id}`)
    else await startOrRequestConversation(currentUser.id, person.id, router)
  }

  const acceptRequest = async () => {
    if (!currentUser || !person || !request) return
    try {
      const result = await social.updateConnection(request.id, 'accepted')
      setRelationship('connected')
      setRequest(prev => prev ? { ...prev, status: 'accepted' } : prev)
      if (result.conversation_id) router.push(`/mensagens/?conv=${result.conversation_id}`)
    } catch (err: any) {
      alert('Erro ao aceitar: ' + (err.message || 'tenta de novo'))
    }
  }

  const rejectRequest = async () => {
    if (!request) return
    try {
      await social.updateConnection(request.id, 'rejected')
      setRelationship('rejected')
      setRequest(prev => prev ? { ...prev, status: 'rejected' } : prev)
    } catch (err: any) {
      alert('Erro ao rejeitar: ' + (err.message || 'tenta de novo'))
    }
  }

  const handleFollow = async () => {
    if (!currentUser || !person) { router.push('/auth/login/'); return }
    try {
      await social.follow(currentUser.id, person.id)
      setIsFollowing(true)
    } catch {}
  }

  const handleUnfollow = async () => {
    if (!currentUser || !person) return
    try {
      await social.unfollow(currentUser.id, person.id)
      setIsFollowing(false)
    } catch {}
  }

  const triggerUpload = (type: 'avatar' | 'cover') => {
    setUploadType(type)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser || !person || !uploadType) return
    if (file.size > 5 * 1024 * 1024) { alert('Imagem demasiado grande. Máx. 5 MB.'); return }
    setUploading(uploadType)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${uploadType}s/${currentUser.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      await social.setUserPhoto({ user_id: currentUser.id, type: uploadType, url: publicUrl })
      if (uploadType === 'avatar') {
        await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', currentUser.id)
        setPerson(prev => prev ? { ...prev, avatar_url: publicUrl } : prev)
        setCurrentUser(prev => prev ? { ...prev, avatar_url: publicUrl } : prev)
      } else {
        setCoverUrl(publicUrl)
      }
    } catch (err: any) {
      alert('Erro ao carregar foto: ' + (err.message || 'tenta de novo'))
    } finally {
      setUploading(null)
      setUploadType(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const requestVerification = async () => {
    if (!currentUser || !person) return
    setVerifyLoading(true)
    try {
      const result = await social.requestRecruiterVerification({ user_id: currentUser.id, email: verifyEmail, company_name: verifyCompany })
      setVerifyRequested(true)
      if (result.code) {
        alert(`Código de verificação (modo de demonstração): ${result.code}`)
      } else if (result.email_sent) {
        alert('Código enviado para o email corporativo. Verifica a caixa de entrada.')
      } else {
        alert('Não foi possível enviar o email automaticamente. Configura RESEND_API_KEY no ambiente.')
      }
    } catch (err: any) {
      alert('Erro: ' + (err.message || 'tenta de novo'))
    }
    setVerifyLoading(false)
  }

  const confirmVerification = async () => {
    if (!currentUser || !verifyCode) return
    setVerifyLoading(true)
    try {
      const result = await social.verifyRecruiter(currentUser.id, verifyCode)
      if (result.verified) {
        setIsVerified(true)
        setVerifyMode(false)
        setVerifyRequested(false)
        alert('Verificação concluída com sucesso.')
      } else {
        alert('Código inválido.')
      }
    } catch (err: any) {
      alert('Erro: ' + (err.message || 'tenta de novo'))
    }
    setVerifyLoading(false)
  }

  const profileUrl = typeof window !== 'undefined' && person ? `${window.location.origin}/pessoas/perfil/?id=${person.id}` : ''

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

  const comps = parseCompetencias(person.profile?.competencias)
  const isMe = currentUser?.id === person.id

  return (
    <div className="min-h-screen bg-ms-surface">
      <header className="sticky top-0 bg-white z-50 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="p-1 -ml-2 text-ms-dark hover:text-ms-blue"><ArrowLeft size={22} /></button>
          <Link href="/" className="flex items-center"><Logo variant="full" className="h-8 w-auto" /></Link>
          {person && <ShareMenu url={profileUrl} title={person.nome} text={`Perfil de ${person.nome} no MÔ SALO`} size={22} className="p-1 text-ms-dark hover:text-ms-blue" />}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 pb-24">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="relative z-0 h-32 sm:h-40 rounded-t-2xl overflow-hidden group">
          {coverUrl ? (
            <img src={coverUrl} alt="Capa" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-ms-blue to-ms-purple" />
          )}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
          {isMe && (
            <button onClick={() => triggerUpload('cover')} disabled={uploading === 'cover'} className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5 transition backdrop-blur-sm">
              <Camera size={12} /> {uploading === 'cover' ? 'A carregar...' : 'Alterar capa'}
            </button>
          )}
        </div>
        <div className="relative z-10 bg-white rounded-b-2xl border-x border-b border-ms-border shadow-sm p-6 -mt-10 text-center mb-4">
          <div className="relative z-20 w-24 h-24 mx-auto -mt-14 rounded-full p-[3px] bg-gradient-to-br from-ms-blue to-ms-purple shadow-xl ring-4 ring-white">
            <div className="relative">
              <ProfileAvatar url={person.avatar_url} name={person.nome} size={86} className="rounded-full border-2 border-white" />
              {isMe && (
                <button onClick={() => triggerUpload('avatar')} disabled={uploading === 'avatar'} className="absolute bottom-0 right-0 bg-ms-blue text-white p-1.5 rounded-full border-2 border-white shadow hover:bg-blue-700 transition">
                  <Camera size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1">
            <h1 className="text-xl font-bold text-ms-dark">{person.nome}</h1>
            {isVerified && <VerifiedBadge size={18} />}
          </div>
          <p className="text-sm text-ms-gray mt-1">{person.role === 'recrutador' ? 'Recrutador' : 'Talento'}{person.profile?.area ? ` • ${person.profile.area}` : ''}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-ms-gray mt-4">
            {person.profile?.area && <span className="flex items-center gap-1"><AreaIcon area={person.profile.area} size={14} className="text-ms-blue" /> {person.profile.area}</span>}
            {person.profile?.localizacao && <span className="flex items-center gap-1"><MapPin size={12} /> {person.profile.localizacao}</span>}
            {person.telefone && <span className="flex items-center gap-1">{person.telefone}</span>}
            {isVerified && <span className="flex items-center gap-1 text-ms-blue font-medium"><ShieldCheck size={12} /> Verificado</span>}
          </div>

          <div className="flex flex-col gap-3 mt-5">
            {!isMe && relationship === 'received' && request && (
              <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
                <p className="text-sm font-semibold text-ms-dark mb-3 flex items-center justify-center gap-2"><UserPlus size={16} className="text-ms-blue" /> {person.nome} quer conectar contigo</p>
                <div className="flex gap-3">
                  <button onClick={acceptRequest} className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white text-sm font-bold py-3 rounded-xl hover:bg-green-600 active:scale-[0.98] shadow-md transition-all"><Check size={18} /> Aceitar</button>
                  <button onClick={rejectRequest} className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-500 text-sm font-bold py-3 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all"><X size={18} /> Rejeitar</button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              {!isMe && relationship === 'none' && (
                <button onClick={handleConnect} className="flex-1 flex items-center justify-center gap-2 bg-ms-blue text-white text-sm font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] shadow-md transition-all"><UserPlus size={18} /> Conectar</button>
              )}
              {!isMe && relationship === 'sent' && (
                <span className="flex-1 flex items-center justify-center gap-2 text-center text-sm py-3 bg-ms-surface text-ms-gray rounded-xl font-semibold"><UserCheck size={18} /> Pedido enviado</span>
              )}
              {!isMe && relationship === 'connected' && (
                <button onClick={handleMessage} className="flex-1 flex items-center justify-center gap-2 bg-ms-purple text-white text-sm font-bold py-3 rounded-xl hover:bg-purple-700 active:scale-[0.98] shadow-md transition-all"><MessageSquare size={18} /> Mensagem</button>
              )}
              {!isMe && relationship === 'rejected' && (
                <span className="flex-1 text-center text-sm py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold">Pedido rejeitado</span>
              )}
              {!isMe && (
                <button onClick={isFollowing ? handleUnfollow : handleFollow} className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl border transition-all ${isFollowing ? 'bg-ms-surface text-ms-dark border-ms-border' : 'bg-white text-ms-blue border-ms-blue/30 hover:bg-blue-50'}`}>
                  {isFollowing ? <Check size={18} /> : <Building2 size={18} />} {isFollowing ? 'Seguindo' : 'Seguir'}
                </button>
              )}
              {!isMe && (
                <button onClick={() => setSaved(v => !v)} className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all shadow-sm ${saved ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-gray border-ms-border hover:bg-ms-surface'}`}>
                  <Bookmark size={20} className={saved ? 'fill-white' : ''} />
                </button>
              )}
            </div>
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
                {comps.map((c, i) => <span key={i} className="text-xs px-3 py-1 bg-ms-surface text-ms-dark rounded-full font-medium">{c}</span>)}
              </div>
            </div>
          )}
        </div>

        {isMe && person.role === 'recrutador' && (
          <div className="bg-white rounded-2xl p-5 border border-ms-border shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ms-dark flex items-center gap-2"><ShieldCheck size={16} className="text-ms-blue" /> Verificação de Recrutador</h2>
              {isVerified ? (
                <span className="text-xs font-semibold text-ms-blue bg-blue-50 px-2 py-1 rounded-full">Verificado</span>
              ) : (
                <button onClick={() => setVerifyMode(v => !v)} className="text-xs font-semibold text-ms-blue hover:underline">{verifyMode ? 'Cancelar' : 'Verificar'}</button>
              )}
            </div>
            {isVerified ? (
              <p className="text-xs text-ms-gray">O teu perfil de recrutador está verificado. O selo azul é visível para todos os candidatos.</p>
            ) : verifyMode ? (
              <div className="space-y-3">
                {!verifyRequested ? (
                  <>
                    <p className="text-xs text-ms-gray">Insere o teu email corporativo. Vamos enviar um código de confirmação.</p>
                    <input type="email" value={verifyEmail} onChange={e => setVerifyEmail(e.target.value)} placeholder="email@empresa.ao" className="w-full bg-ms-surface rounded-xl px-4 py-2.5 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20" />
                    <input type="text" value={verifyCompany} onChange={e => setVerifyCompany(e.target.value)} placeholder="Nome da empresa" className="w-full bg-ms-surface rounded-xl px-4 py-2.5 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20" />
                    <button onClick={requestVerification} disabled={verifyLoading || !verifyEmail.includes('@')} className="w-full py-2.5 bg-ms-blue text-white rounded-xl text-sm font-bold disabled:opacity-50">{verifyLoading ? 'A enviar...' : 'Enviar código'}</button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-ms-gray">Insere o código de 6 dígitos recebido no email.</p>
                    <input type="text" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6} placeholder="000000" className="w-full bg-ms-surface rounded-xl px-4 py-2.5 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20 tracking-[0.5em] text-center" />
                    <button onClick={confirmVerification} disabled={verifyLoading || verifyCode.length !== 6} className="w-full py-2.5 bg-ms-purple text-white rounded-xl text-sm font-bold disabled:opacity-50">{verifyLoading ? 'A verificar...' : 'Confirmar'}</button>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-ms-gray">O selo de recrutador verificado aumenta a confiança dos candidatos.</p>
            )}
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-sm font-bold text-ms-dark mb-3">Mural de publicações</h2>
          {loadingPosts ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-ms-border text-center">
              <Briefcase size={40} className="text-ms-gray mx-auto mb-3" />
              <p className="text-sm text-ms-gray">Ainda não há publicações.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => <FeedCard key={post.id} post={post} currentUser={currentUser} />)}
            </div>
          )}
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
