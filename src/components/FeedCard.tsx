'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { social, type Post, type PostAuthor, type PostComment } from '@/lib/social'
import ProfileAvatar from '@/components/ProfileAvatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import ShareMenu from '@/components/ShareMenu'
import { timeAgo } from '@/lib/date'
import { ThumbsUp, Smile, HeartHandshake, Heart, MessageCircle, Share2, Bookmark, Send, MapPin, Briefcase, Trash2, X, MoreHorizontal } from 'lucide-react'

interface FeedCardProps {
  post: Post
  currentUser?: { id: string; nome: string; role: string; avatar_url?: string | null } | null
  onDelete?: (id: string) => void
  onUpdate?: (post: Post) => void
}

const REACTIONS = [
  { type: 'gosto', label: 'Gosto', icon: ThumbsUp, color: 'text-ms-blue', bg: 'bg-blue-50', fill: 'fill-ms-blue/20', emoji: '👍' },
  { type: 'mood', label: 'Mood', icon: Smile, color: 'text-amber-500', bg: 'bg-amber-50', fill: 'fill-amber-500/20', emoji: '😄' },
  { type: 'suporte', label: 'Suporte', icon: HeartHandshake, color: 'text-green-600', bg: 'bg-green-50', fill: 'fill-green-600/20', emoji: '🤝' },
  { type: 'adoro', label: 'Adoro', icon: Heart, color: 'text-purple-500', bg: 'bg-purple-50', fill: 'fill-purple-500/20', emoji: '❤️' },
]

function AuthorLine({ author, isVerified, timestamp }: { author: PostAuthor; isVerified?: boolean; timestamp: string }) {
  return (
    <div className="flex items-center gap-2">
      <div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-ms-dark leading-tight">{author.nome || 'Utilizador'}</span>
          {isVerified && <VerifiedBadge size={14} />}
        </div>
        <p className="text-[11px] text-ms-gray leading-tight truncate">
          {author.role === 'recrutador' ? 'Recrutador' : 'Talento'}
          {author.area ? ` • ${author.area}` : ''}
          {author.localizacao ? ` • ${author.localizacao}` : ''}
        </p>
        <p className="text-[10px] text-ms-gray/80">{timeAgo(timestamp)}</p>
      </div>
    </div>
  )
}

function ReactionButton({
  type,
  label,
  icon: Icon,
  color,
  bg,
  fill,
  emoji,
  count,
  active,
  onClick,
}: typeof REACTIONS[0] & { count: number; active: boolean; onClick: () => void }) {
  const [particles, setParticles] = useState<{ id: number }[]>([])

  const handleClick = () => {
    onClick()
    const id = Date.now()
    setParticles(p => [...p, { id }])
    setTimeout(() => setParticles(p => p.filter(x => x.id !== id)), 900)
  }

  return (
    <button
      onClick={handleClick}
      className={`relative flex items-center gap-1 text-xs font-medium transition-all px-2 py-1.5 rounded-full ${active ? `${color} ${bg}` : 'text-ms-gray hover:text-ms-dark hover:bg-ms-surface'}`}
    >
      <span className="relative">
        <Icon size={18} className={active ? fill : ''} />
        {particles.map(p => (
          <span
            key={p.id}
            className="absolute -top-5 left-1/2 -translate-x-1/2 text-base pointer-events-none"
            style={{ animation: 'floatUp 0.8s ease-out forwards' }}
          >
            {emoji}
          </span>
        ))}
      </span>
      <span>{count || 0}</span>
      <span className="sr-only">{label}</span>
    </button>
  )
}

export default function FeedCard({ post, currentUser, onDelete, onUpdate }: FeedCardProps) {
  const router = useRouter()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<PostComment[]>(post.comments || [])
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [saved, setSaved] = useState(false)
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(post.reaction_counts || {})
  const [myReaction, setMyReaction] = useState<string | null>(post.my_reaction || null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setComments(post.comments || [])
    setReactionCounts(post.reaction_counts || {})
    setMyReaction(post.my_reaction || null)
  }, [post])

  const openComments = async () => {
    setCommentsOpen(true)
    try {
      const data = await social.getComments(post.id)
      setComments(data.comments)
      if (onUpdate) onUpdate({ ...post, comments: data.comments, comments_count: data.comments.length })
    } catch {}
  }

  const handleReaction = async (type: string) => {
    if (!currentUser) { router.push('/auth/login/'); return }
    const isActive = myReaction === type
    try {
      if (isActive) {
        await social.unreactPost(post.id, currentUser.id)
        setReactionCounts(prev => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }))
        setMyReaction(null)
      } else {
        await social.reactPost(post.id, currentUser.id, type)
        setReactionCounts(prev => {
          const next = { ...prev, [type]: (prev[type] || 0) + 1 }
          if (myReaction) next[myReaction] = Math.max(0, (next[myReaction] || 0) - 1)
          return next
        })
        setMyReaction(type)
      }
    } catch {}
  }

  const handleComment = async () => {
    if (!currentUser || !commentText.trim()) return
    setPostingComment(true)
    try {
      const data = await social.createComment({
        post_id: post.id,
        user_id: currentUser.id,
        content: commentText.trim(),
        author: { id: currentUser.id, nome: currentUser.nome, avatar_url: currentUser.avatar_url, role: currentUser.role },
      })
      setComments(data.comments)
      setCommentText('')
      if (onUpdate) onUpdate({ ...post, comments: data.comments, comments_count: data.comments.length })
    } catch {}
    setPostingComment(false)
  }

  const vaga = post.vaga

  return (
    <article className="card shadow-ios-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/pessoas/perfil/?id=${post.user_id}`} className="flex items-center gap-3 min-w-0">
            <ProfileAvatar url={post.author.avatar_url} name={post.author.nome} size={48} />
            <AuthorLine author={post.author} isVerified={post.is_verified} timestamp={post.created_at} />
          </Link>
          {currentUser?.id === post.user_id && onDelete && (
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)} className="text-ms-gray hover:text-ms-dark w-8 h-8 rounded-full bg-ms-surface flex items-center justify-center transition-colors"><MoreHorizontal size={18} /></button>
              {menuOpen && (
                <div className="absolute right-0 top-9 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-ios p-1.5 z-10 min-w-[160px]">
                  <button onClick={() => { setMenuOpen(false); if (confirm('Apagar publicação?')) onDelete(post.id) }} className="w-full text-left text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-xl flex items-center gap-2">
                    <Trash2 size={14} /> Apagar publicação
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {post.content && (
          <p className="text-sm text-ms-dark whitespace-pre-wrap mt-3 leading-relaxed">{post.content}</p>
        )}

        {post.is_featured_job && (
          <span className="inline-block mt-2 text-[10px] px-3 py-1 bg-ms-blue/10 text-ms-blue rounded-full font-semibold">Vaga em destaque</span>
        )}
      </div>

      {post.media_url && (
        <div className="px-4 pb-4">
          <img src={post.media_url} alt="" className="w-full max-h-[420px] object-cover rounded-2xl select-none" draggable={false} />
        </div>
      )}

      {vaga && (
        <div className="mx-4 mb-4 p-3 rounded-2xl bg-ms-surface/70 border border-white/60 shadow-ios-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-ms-dark">{vaga.titulo || vaga.title || 'Vaga'}</h4>
              <p className="text-[11px] text-ms-gray flex items-center gap-2 mt-0.5 flex-wrap">
                {vaga.empresa_nome || vaga.company ? <span className="flex items-center gap-1"><Briefcase size={11} /> {vaga.empresa_nome || vaga.company}</span> : null}
                {vaga.localizacao || vaga.location ? <span className="flex items-center gap-1"><MapPin size={11} /> {vaga.localizacao || vaga.location}</span> : null}
                {vaga.area ? <span>{vaga.area}</span> : null}
              </p>
            </div>
            <Link href={`/vagas/detalhe/?id=${vaga.id}`} className="flex-shrink-0 text-xs font-semibold px-4 py-2 bg-ms-blue text-white rounded-full hover:brightness-105 transition-all">Ver vaga</Link>
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-ms-border/50 flex items-center justify-between text-ms-gray">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {REACTIONS.map(r => (
            <ReactionButton
              key={r.type}
              {...r}
              count={reactionCounts[r.type] || 0}
              active={myReaction === r.type}
              onClick={() => handleReaction(r.type)}
            />
          ))}
          <button onClick={openComments} className="flex items-center gap-1.5 text-xs font-medium hover:text-ms-dark px-2 py-1.5 rounded-full hover:bg-ms-surface transition-colors">
            <MessageCircle size={18} /> {comments.length || post.comments_count || 0}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <ShareMenu url={`${typeof window !== 'undefined' ? window.location.origin : ''}/pessoas/?post=${post.id}`} text={`Publicação de ${post.author.nome} no MÔ SALO`} size={18} className="text-ms-gray hover:text-ms-dark" />
          <button onClick={() => setSaved(v => !v)} className={`transition-colors ${saved ? 'text-ms-blue' : 'text-ms-gray hover:text-ms-dark'}`}>
            <Bookmark size={18} className={saved ? 'fill-ms-blue/20' : ''} />
          </button>
        </div>
      </div>

      {commentsOpen && (
        <div className="px-4 pb-4 border-t border-ms-border/50">
          <div className="flex items-center justify-between py-2">
            <h4 className="text-xs font-bold text-ms-dark">Comentários</h4>
            <button onClick={() => setCommentsOpen(false)} className="text-ms-gray hover:text-ms-dark"><X size={16} /></button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
            {comments.length === 0 ? <p className="text-xs text-ms-gray">Sem comentários ainda.</p> : comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <ProfileAvatar url={c.author.avatar_url} name={c.author.nome} size={28} />
                <div className="flex-1 bg-ms-surface rounded-xl rounded-tl-none px-3 py-2">
                  <p className="text-xs font-bold text-ms-dark">{c.author.nome}</p>
                  <p className="text-xs text-ms-dark mt-0.5">{c.content}</p>
                  <p className="text-[10px] text-ms-gray mt-1">{timeAgo(c.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
          {currentUser ? (
            <div className="flex items-center gap-2">
              <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} placeholder="Escreve um comentário..." className="flex-1 bg-ms-surface rounded-[20px] px-4 py-2.5 text-xs text-ms-dark placeholder:text-ms-gray/70 outline-none focus:ring-2 focus:ring-ms-blue/20" />
              <button onClick={handleComment} disabled={postingComment || !commentText.trim()} className="p-2 bg-ms-blue text-white rounded-full disabled:opacity-50 hover:brightness-105 active:scale-95 transition-all"><Send size={14} /></button>
            </div>
          ) : (
            <button onClick={() => router.push('/auth/login/')} className="text-xs text-ms-blue font-medium">Inicia sessão para comentar</button>
          )}
        </div>
      )}
    </article>
  )
}
