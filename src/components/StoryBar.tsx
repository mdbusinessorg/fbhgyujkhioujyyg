'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'
import { social } from '@/lib/social'
import ProfileAvatar from '@/components/ProfileAvatar'
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Camera } from 'lucide-react'

interface StoryUser {
  id: string
  nome: string
  role?: string
  avatar_url?: string | null
}

interface Status {
  id: string
  user_id: string
  content?: string
  media_url?: string | null
  created_at: string
  expires_at: string
  views: { user_id: string; nome?: string; avatar_url?: string | null; created_at?: string }[]
  author?: { nome?: string; avatar_url?: string | null; role?: string }
}

export default function StoryBar({ currentUser, people }: { currentUser?: StoryUser | null; people: StoryUser[] }) {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [composerOpen, setComposerOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [activeStatus, setActiveStatus] = useState<Status | null>(null)
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const loadStatuses = useCallback(async () => {
    try {
      const data = await social.getStatuses()
      setStatuses(Array.isArray(data) ? data : [])
    } catch {
      setStatuses([])
    }
  }, [])

  useEffect(() => { loadStatuses() }, [loadStatuses])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('Imagem demasiado grande. Máx. 5 MB.'); return }
    setMedia(f)
    setMediaPreview(URL.createObjectURL(f))
    setError('')
  }

  const resetComposer = () => {
    setContent('')
    setMedia(null)
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaPreview(null)
    setError('')
    setComposerOpen(false)
  }

  const createStatus = async () => {
    if (!currentUser) { window.location.href = '/auth/login/'; return }
    if (!content.trim() && !media) { setError('Escreve algo ou adiciona uma imagem.'); return }
    setPosting(true)
    try {
      let media_url = null
      if (media) {
        const ext = media.name.split('.').pop() || 'jpg'
        const path = `statuses/${currentUser.id}/${Date.now()}.${ext}`
        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, media, { upsert: true })
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
        media_url = publicUrl
      }
      await social.createStatus({
        user_id: currentUser.id,
        content: content.trim(),
        media_url,
        author: { nome: currentUser.nome, avatar_url: currentUser.avatar_url, role: currentUser.role || 'candidato' },
      })
      resetComposer()
      await loadStatuses()
    } catch (err: any) {
      setError(err.message || 'Erro ao publicar estado')
    } finally {
      setPosting(false)
    }
  }

  const openStatus = (status: Status) => {
    setActiveStatus(status)
    setViewerOpen(true)
    if (currentUser && status.user_id !== currentUser.id) {
      social.viewStatus({ status_id: status.id, user_id: currentUser.id, nome: currentUser.nome, avatar_url: currentUser.avatar_url }).catch(() => {})
    }
  }

  const deleteActiveStatus = async () => {
    if (!activeStatus || !currentUser) return
    try {
      await social.deleteStatus(activeStatus.id, currentUser.id)
      setViewerOpen(false)
      setActiveStatus(null)
      await loadStatuses()
    } catch {}
  }

  const myStatus = statuses.find(s => s.user_id === currentUser?.id)
  const others = statuses.filter(s => s.user_id !== currentUser?.id)

  const UserRing = ({ user, hasStatus, isMe, onClick, plus }: { user?: StoryUser; hasStatus: boolean; isMe?: boolean; onClick?: () => void; plus?: boolean }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 w-16 flex-shrink-0">
      <div className={`relative w-16 h-16 rounded-full p-[3px] ${hasStatus ? 'bg-gradient-to-tr from-ms-blue to-ms-purple' : 'bg-ms-border'}`}>
        <div className="w-full h-full rounded-full p-[2px] bg-white">
          <ProfileAvatar url={user?.avatar_url} name={user?.nome} size={56} className="rounded-full" />
        </div>
        {isMe && plus && (
          <div className="absolute bottom-0 right-0 bg-ms-blue text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
            <Plus size={12} />
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium text-ms-dark text-center leading-tight max-w-[64px] truncate">{isMe ? (myStatus ? 'O meu estado' : 'Adicionar') : (user?.nome || '').split(' ')[0]}</span>
    </button>
  )

  return (
    <>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 pt-1">
        {currentUser && (
          <UserRing
            isMe
            user={currentUser}
            hasStatus={!!myStatus}
            plus={!myStatus}
            onClick={() => myStatus ? openStatus(myStatus) : setComposerOpen(true)}
          />
        )}
        {others.map(s => {
          const user = people.find(p => p.id === s.user_id) || { id: s.user_id, nome: s.author?.nome || 'Utilizador', avatar_url: s.author?.avatar_url }
          return <UserRing key={s.id} user={user} hasStatus onClick={() => openStatus(s)} />
        })}
        {statuses.length === 0 && !currentUser && (
          <p className="text-xs text-ms-gray pl-2">Ainda não há estados.</p>
        )}
      </div>

      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !posting && resetComposer()}>
          <div className="bg-white/95 backdrop-blur-xl rounded-[32px] w-full max-w-sm p-4 shadow-ios-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ms-dark">Novo estado</h3>
              <button onClick={() => !posting && resetComposer()} className="text-ms-gray hover:text-ms-dark"><X size={18} /></button>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="O que está a acontecer?"
              maxLength={200}
              className="w-full bg-ms-surface rounded-xl px-3 py-2 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20 min-h-[80px] resize-none"
            />
            <div className="text-right text-[10px] text-ms-gray mt-1">{content.length}/200</div>
            {mediaPreview ? (
              <div className="relative mt-3 rounded-xl overflow-hidden h-40">
                <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />
                <button onClick={() => { setMedia(null); setMediaPreview(null) }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X size={14} /></button>
              </div>
            ) : (
              <label className="mt-3 flex items-center gap-2 text-xs text-ms-blue font-medium cursor-pointer w-fit">
                <Camera size={16} /> Adicionar foto
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            )}
            {error && <p className="text-[11px] text-red-500 mt-2">{error}</p>}
            <button onClick={createStatus} disabled={posting} className="w-full mt-4 bg-ms-blue text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50">{posting ? 'A publicar...' : 'Publicar estado'}</button>
            {myStatus && <p className="text-[10px] text-ms-gray mt-2 text-center">Já tens um estado ativo. Publicar um novo apaga o anterior.</p>}
          </div>
        </div>
      )}

      {viewerOpen && activeStatus && (
        <StatusViewer
          status={activeStatus}
          isMine={currentUser?.id === activeStatus.user_id}
          currentUser={currentUser}
          onClose={() => setViewerOpen(false)}
          onDelete={deleteActiveStatus}
        />
      )}
    </>
  )
}

function StatusViewer({ status, isMine, currentUser, onClose, onDelete }: { status: Status; isMine: boolean; currentUser?: StoryUser | null; onClose: () => void; onDelete: () => void | Promise<void> }) {
  const [views, setViews] = useState(status.views || [])
  useEffect(() => {
    if (!isMine && currentUser && !views.find(v => v.user_id === currentUser.id)) {
      setViews(prev => [...prev, { user_id: currentUser.id, nome: currentUser.nome, avatar_url: currentUser.avatar_url, created_at: new Date().toISOString() }])
    }
  }, [isMine, currentUser, views])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden bg-black relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10" />
          <div className="absolute top-3 left-3 right-12 flex items-center gap-2 z-10">
            <ProfileAvatar url={status.author?.avatar_url} name={status.author?.nome} size={32} className="rounded-full border border-white/50" />
            <div>
              <p className="text-xs font-bold text-white drop-shadow">{status.author?.nome || 'Utilizador'}</p>
              <p className="text-[10px] text-white/80 drop-shadow">{timeAgo(status.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-2 right-2 text-white z-10 p-1"><X size={20} /></button>
          {status.media_url ? (
            <img src={status.media_url} alt="estado" className="w-full max-h-[70vh] object-contain" />
          ) : null}
          {status.content && (
            <div className={`${status.media_url ? 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4' : 'bg-black p-8 min-h-[50vh] flex items-center justify-center'}`}>
              <p className={`text-sm text-white text-center whitespace-pre-wrap ${!status.media_url ? 'text-lg font-semibold' : ''}`}>{status.content}</p>
            </div>
          )}
        </div>
      </div>
      {isMine && (
        <div className="bg-white rounded-t-2xl p-4 max-h-[35vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-ms-dark">Visto por {views.length} pessoa{views.length !== 1 ? 's' : ''}</h4>
            <button onClick={onDelete} className="text-red-500 text-xs font-medium flex items-center gap-1"><Trash2 size={12} /> Apagar</button>
          </div>
          {views.length === 0 ? (
            <p className="text-xs text-ms-gray">Ainda ninguém viu o teu estado.</p>
          ) : (
            <div className="space-y-2">
              {views.map(v => (
                <div key={v.user_id} className="flex items-center gap-2">
                  <ProfileAvatar url={v.avatar_url} name={v.nome} size={24} className="rounded-full" />
                  <span className="text-xs text-ms-dark">{v.nome || 'Utilizador'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'agora'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(hours / 24)}d`
}
