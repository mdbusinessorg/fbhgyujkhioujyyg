'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { askSupport } from '@/lib/ai'
import Logo from '@/components/Logo'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, Send, Bot, User, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function SuportePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Record<string, unknown>>({})
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o assistente MÔ SALO. Posso ajudar-te a melhorar o CV, preparar uma entrevista, escolher uma vaga ou candidatar-te. O que precisas?' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      const [{ data: user }, { data: prof }] = await Promise.all([
        supabase.from('users').select('id, nome, email, telefone, role').eq('email', session.user.email).single(),
        supabase.from('profiles').select('*').eq('user_id', session.user.id).single(),
      ])
      const cands = await supabase.from('candidaturas').select('id', { count: 'exact' }).eq('candidato_id', user?.id)
      setProfile({
        nome: user?.nome,
        email: user?.email,
        area: prof?.area,
        nivel_academico: prof?.nivel_academico,
        competencias: Array.isArray(prof?.competencias) ? prof.competencias.join(', ') : prof?.competencias,
        experiencias: prof?.experiencias,
        bio: prof?.bio,
        numDocumentos: (prof?.documentos || []).length,
        numCandidaturas: cands.count || 0,
      })
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || sending) return
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setInput('')
    setSending(true)
    const { answer } = await askSupport(msg, profile, messages.slice(-10))
    setMessages([...newMessages, { role: 'assistant', content: answer || 'Não consegui responder. Tenta outra vez.' }])
    setSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ms-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ms-surface pb-20">
      <header className="sticky top-0 bg-white z-40 border-b border-ms-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 text-ms-dark hover:text-ms-purple"><ArrowLeft size={22} /></button>
          <Link href="/" className="flex items-center"><Logo variant="full" className="h-7 w-auto" /></Link>
          <div className="ml-auto flex items-center gap-1 text-sm font-semibold text-ms-dark">
            <Sparkles size={16} className="text-ms-purple" /> Assistente IA
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4">
        <div className="bg-gradient-to-br from-ms-purple to-[#9B7BFF] rounded-2xl p-4 text-white mb-4">
          <h1 className="text-base font-bold">Suporte aos Candidatos</h1>
          <p className="text-xs text-white/80">Pergunta-me tudo sobre CV, entrevistas, vagas ou carreira em Angola.</p>
        </div>

        <div className="space-y-3 mb-24">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-ms-blue text-white' : 'bg-white border border-ms-border text-ms-purple'}`}>
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-ms-blue text-white rounded-tr-none' : 'bg-white text-ms-dark border border-ms-border rounded-tl-none'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-white border border-ms-border text-ms-purple flex items-center justify-center"><Bot size={14} /></div>
              <div className="bg-white text-ms-dark border border-ms-border rounded-2xl rounded-tl-none px-4 py-2.5 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ms-purple rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-ms-purple rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-ms-purple rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </main>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-ms-border p-3 z-40">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
            {['Como melhorar o meu CV?', 'Dicas para entrevista', 'Como escolher uma vaga?', 'Quais documentos preciso?'].map((q) => (
              <button key={q} onClick={() => handleSend(q)} className="flex-shrink-0 text-xs px-3 py-1.5 bg-ms-purple-light text-ms-purple rounded-full font-medium whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escreve a tua pergunta..."
              className="flex-1 bg-ms-surface rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ms-purple/50"
            />
            <button onClick={() => handleSend()} disabled={sending || !input.trim()} className="w-11 h-11 bg-ms-purple text-white rounded-xl flex items-center justify-center disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav active="suporte" />
    </div>
  )
}
