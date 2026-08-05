'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { askSupport } from '@/lib/ai'
import { X, Send, User } from 'lucide-react'
import ProfileAvatar from '@/components/ProfileAvatar'

const WELCOME = 'Olá! Sou o Mosalito, o assistente do MÔ SALO. Posso ajudar-te a encontrar emprego, melhorar o CV ou esclarecer dúvidas. Em que posso ajudar?'

const SUGGESTIONS = [
  'Como melhorar o meu CV?',
  'Quais vagas recomendas para mim?',
  'Como me preparar para uma entrevista?',
]

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; nome: string; avatar_url?: string | null } | null>(null)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([{ role: 'assistant', content: WELCOME }])
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) await loadProfile(session.user.email)
    })
  }, [])

  const loadProfile = async (email: string) => {
    try {
      const { data: user } = await supabase.from('users').select('id, nome, avatar_url').eq('email', email).single()
      if (user?.id) {
        setCurrentUser(user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
        if (prof) setProfile(prof)
      }
    } catch (e) {
      console.error('Erro ao carregar perfil do assistente:', e)
    }
  }

  const send = async (textOverride?: string) => {
    const text = (textOverride || message).trim()
    if (!text || loading) return
    const newMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(newMessages)
    setMessage('')
    setLoading(true)

    const context = profile
      ? {
          nome: profile.nome,
          area: profile.area,
          nivel_academico: profile.nivel_academico,
          competencias: profile.competencias,
          experiencias: profile.experiencias,
          bio: profile.bio,
          numCandidaturas: 0,
          numDocumentos: 0,
        }
      : {}

    const { answer } = await askSupport(text, context, newMessages.slice(-10))
    setLoading(false)
    setMessages((prev) => [...prev, { role: 'assistant', content: answer || 'Desculpa, não consegui responder. Tenta novamente.' }])
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-50 bottom-24 right-5 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full text-white flex items-center justify-center animate-float hover:scale-110 transition-all overflow-hidden bg-[#B3C3DA] shadow-ios"
          aria-label="Abrir assistente MÔ SALO"
        >
          <img src="/mosalito.png?v=2" alt="Mosalito" className="w-full h-full object-cover" />
        </button>
      )}

      {open && (
        <div className="fixed z-50 bottom-24 right-4 lg:bottom-24 lg:right-8 w-[calc(100%-2rem)] max-w-sm bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-ios-lg border border-white/50 overflow-hidden flex flex-col max-h-[70vh]">
          <div className="bg-white/80 backdrop-blur-xl p-3 flex items-center justify-between border-b border-ms-border/50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#B3C3DA]">
                <img src="/mosalito.png?v=2" alt="Mosalito" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-ms-dark">Mosalito</p>
                <p className="text-[10px] text-ms-gray">Assistente MÔ SALO</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-ms-gray hover:text-ms-dark w-8 h-8 rounded-full bg-ms-surface flex items-center justify-center transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-ms-surface/60 min-h-[260px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-ios-sm ${m.role === 'user' ? 'bg-ms-blue text-white' : 'bg-white'}`}>
                  {m.role === 'user' ? (
                    currentUser ? <ProfileAvatar url={currentUser.avatar_url} name={currentUser.nome} size={28} className="rounded-full" /> : <User size={14} />
                  ) : (
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#B3C3DA]">
                      <img src="/mosalito.png?v=2" alt="Mosalito" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className={`text-xs leading-relaxed p-3 rounded-3xl whitespace-pre-wrap shadow-ios-sm ${m.role === 'user' ? 'bg-ms-blue text-white rounded-br-2xl' : 'bg-white text-ms-dark rounded-bl-2xl'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-[#B3C3DA]">
                  <img src="/mosalito.png?v=2" alt="Mosalito" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs p-3 bg-white rounded-3xl rounded-bl-2xl animate-pulse shadow-ios-sm">A pensar...</div>
              </div>
            )}
            <div ref={endRef} />

            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[10px] bg-white text-ms-blue px-3 py-1.5 rounded-full hover:bg-ms-surface transition-colors shadow-ios-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-white/80 backdrop-blur-xl border-t border-ms-border/50">
            <div className="flex items-center gap-2 bg-ms-surface rounded-[24px] px-3 py-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Escreve uma mensagem..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-ms-gray"
              />
              <button
                onClick={() => send()}
                disabled={loading || !message.trim()}
                className="w-8 h-8 rounded-full bg-ms-blue text-white flex items-center justify-center disabled:opacity-50 hover:brightness-105 active:scale-95 transition-all shadow-ios-sm"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
