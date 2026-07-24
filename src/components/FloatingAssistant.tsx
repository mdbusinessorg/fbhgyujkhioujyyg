'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { askSupport } from '@/lib/ai'
import { X, Send, Bot, User } from 'lucide-react'

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
      const { data: user } = await supabase.from('users').select('id').eq('email', email).single()
      if (user?.id) {
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
          className="fixed z-50 bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-gradient-to-r from-ms-blue to-ms-purple text-white shadow-2xl flex items-center justify-center animate-float hover:scale-110 hover:shadow-2xl transition-all"
          aria-label="Abrir assistente MÔ SALO"
        >
          <Bot size={28} />
        </button>
      )}

      {open && (
        <div className="fixed z-50 bottom-20 right-4 lg:bottom-24 lg:right-6 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-ms-border overflow-hidden flex flex-col max-h-[70vh]">
          <div className="bg-gradient-to-r from-ms-blue to-ms-purple p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Mosalito</p>
                <p className="text-[10px] text-white/80">Assistente MÔ SALO</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/90 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-ms-surface min-h-[260px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-ms-blue text-white' : 'bg-ms-purple-light text-ms-purple'}`}>
                  {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`text-xs leading-relaxed p-2.5 rounded-2xl whitespace-pre-wrap ${m.role === 'user' ? 'bg-ms-blue text-white rounded-br-none' : 'bg-white text-ms-dark border border-ms-border rounded-bl-none'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-ms-purple-light flex items-center justify-center">
                  <Bot size={14} className="text-ms-purple" />
                </div>
                <div className="text-xs p-2.5 bg-white border border-ms-border rounded-2xl rounded-bl-none animate-pulse">A pensar...</div>
              </div>
            )}
            <div ref={endRef} />

            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[10px] bg-white border border-ms-border text-ms-blue px-2.5 py-1.5 rounded-full hover:bg-ms-surface transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-ms-border">
            <div className="flex items-center gap-2 bg-ms-surface rounded-full px-3 py-2">
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
                className="w-8 h-8 rounded-full bg-ms-blue text-white flex items-center justify-center disabled:opacity-50 hover:bg-ms-purple transition-colors"
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
