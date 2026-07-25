'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'
import { social } from '@/lib/social'
import ProfileAvatar from '@/components/ProfileAvatar'
import { ImagePlus, Send, X, Briefcase, Sparkles } from 'lucide-react'

interface VagaOption {
  id: string
  titulo: string
  empresa_nome: string
  localizacao?: string
  area?: string
}

export default function PostComposer({
  currentUser,
  postedToday,
  onPosted,
}: {
  currentUser: { id: string; nome: string; role: string; avatar_url?: string | null; area?: string } | null
  postedToday: boolean
  onPosted: () => void
}) {
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isJobFeature, setIsJobFeature] = useState(false)
  const [vagas, setVagas] = useState<VagaOption[]>([])
  const [selectedVaga, setSelectedVaga] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentUser?.role === 'recrutador') {
      supabase.from('vagas').select('id, titulo, empresa_nome, localizacao, area').eq('recrutador_id', currentUser.id).order('created_at', { ascending: false }).then(({ data }) => {
        setVagas(data || [])
      })
    }
  }, [currentUser])

  useEffect(() => {
    if (!isJobFeature) setSelectedVaga('')
  }, [isJobFeature])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Só podes carregar imagens.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Imagem demasiado grande. Máx. 5 MB.'); return }
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImage(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handlePublish = async () => {
    if (!currentUser || (!content.trim() && !image)) return
    if (postedToday) { alert('Só podes publicar uma vez por dia.'); return }
    setPosting(true)
    try {
      let media_url: string | undefined
      if (image) {
        const ext = image.name.split('.').pop() || 'jpg'
        const path = `post-images/${currentUser.id}/${Date.now()}.${ext}`
        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, image, { upsert: true })
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
        media_url = publicUrl
      }
      const vaga_id = isJobFeature && selectedVaga ? selectedVaga : undefined
      await social.createPost({
        user_id: currentUser.id,
        content: content.trim() || (media_url ? '' : '...'),
        media_url,
        author: { id: currentUser.id, nome: currentUser.nome, avatar_url: currentUser.avatar_url, role: currentUser.role, area: currentUser.area },
        type: vaga_id ? 'job' : 'post',
        vaga_id,
        is_featured_job: isJobFeature,
      })
      setContent('')
      clearImage()
      setIsJobFeature(false)
      setSelectedVaga('')
      onPosted()
    } catch (err: any) {
      alert('Erro ao publicar: ' + (err.message || 'tenta de novo'))
    }
    setPosting(false)
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm">
      <div className="flex gap-3">
        <ProfileAvatar url={currentUser?.avatar_url} name={currentUser?.nome} size={44} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={currentUser ? "Partilha uma conquista, vaga ou novidade profissional..." : "Inicia sessão para publicares"}
            disabled={!currentUser || postedToday || posting}
            className="w-full bg-ms-surface rounded-xl px-4 py-3 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20 resize-none disabled:opacity-60"
          />
          {currentUser?.role === 'recrutador' && (
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => setIsJobFeature(v => !v)} className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${isJobFeature ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-blue border-ms-blue/30'}`}>
                <Sparkles size={12} /> Vaga em destaque
              </button>
              {isJobFeature && (
                <select value={selectedVaga} onChange={e => setSelectedVaga(e.target.value)} className="text-xs bg-ms-surface text-ms-dark rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-ms-blue/20">
                  <option value="">Seleciona uma vaga</option>
                  {vagas.map(v => <option key={v.id} value={v.id}>{v.titulo} — {v.empresa_nome}</option>)}
                </select>
              )}
            </div>
          )}
          {preview && (
            <div className="relative mt-2 inline-block">
              <img src={preview} alt="Pré-visualização" className="h-28 w-auto rounded-xl object-cover" />
              <button onClick={clearImage} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={!currentUser || postedToday || posting} className="flex items-center gap-1.5 px-3 py-2 bg-ms-surface text-ms-gray rounded-xl text-xs font-medium hover:text-ms-blue disabled:opacity-50">
                <ImagePlus size={14} /> Foto
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <span className="text-[10px] text-ms-gray">{content.length}/500</span>
            </div>
            {postedToday ? (
              <span className="text-xs text-ms-gray">Já publicaste hoje</span>
            ) : (
              <button onClick={handlePublish} disabled={!currentUser || (!content.trim() && !image) || posting} className="flex items-center gap-1.5 px-4 py-2 bg-ms-blue text-white rounded-xl text-xs font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors">
                {posting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />} Publicar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
