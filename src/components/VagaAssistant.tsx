'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Send, Sparkles } from 'lucide-react'
import { chatWithAssistant } from '@/lib/ai'

type ChatRole = 'user' | 'assistant'

interface VagaAssistantProps {
  titulo?: string
  empresa?: string
  localizacao?: string
  area?: string
  descricao?: string
  requisitos?: string[]
}

interface ChatMessage {
  role: ChatRole
  content: string
}

const QUICK_ACTIONS = [
  'Preparar candidatura',
  'Competências a destacar',
  'Simular entrevista',
  'Explicar a vaga em simples',
]

const cleanText = (value?: string) =>
  String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const trimText = (value: string, max = 1500) =>
  value.length > max ? `${value.slice(0, max).trim()}…` : value

export default function VagaAssistant({
  titulo,
  empresa,
  localizacao,
  area,
  descricao,
  requisitos = [],
}: VagaAssistantProps) {
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Posso ajudar-te a preparar esta candidatura e a perceber melhor a vaga.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const contextPreamble = useMemo(() => {
    const cleanedDescription = trimText(cleanText(descricao))
    const requirementsText = requisitos.filter(Boolean).map((item) => `- ${item}`).join('\n')

    return [
      'Contexto da vaga para preparar a resposta.',
      `Título: ${titulo || 'não indicado'}`,
      `Empresa: ${empresa || 'não indicada'}`,
      `Localização: ${localizacao || 'não indicada'}`,
      `Área: ${area || 'não indicada'}`,
      cleanedDescription ? `Descrição: ${cleanedDescription}` : '',
      requirementsText ? `Requisitos:\n${requirementsText}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }, [area, descricao, empresa, localizacao, requisitos, titulo])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, expanded])

  const sendMessage = async (prompt?: string) => {
    const content = (prompt ?? input).trim()
    if (!content || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError('')

    const payload = [
      { role: 'user' as const, content: contextPreamble },
      ...nextMessages,
    ].slice(-10)

    const { reply, error: apiError } = await chatWithAssistant(payload)

    if (apiError || !reply.trim()) {
      setError('Não consegui responder agora. Tenta outra vez.')
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.trim() }])
    }

    setLoading(false)
  }

  if (!expanded) {
    return (
      <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ms-blue/10 text-ms-blue">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ms-dark">Preparar com IA — MÔ SALO</h3>
            <p className="mt-1 text-sm leading-relaxed text-ms-gray">
              Tira dúvidas e prepara a tua candidatura a esta vaga.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 w-full rounded-2xl bg-ms-blue px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Ajustar com IA
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ms-blue/10 text-ms-blue">
          <Sparkles size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ms-dark">Preparar com IA — MÔ SALO</h3>
          <p className="mt-1 text-sm leading-relaxed text-ms-gray">
            Tira dúvidas e prepara a tua candidatura a esta vaga.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => sendMessage(action)}
            disabled={loading}
            className="rounded-full border border-ms-border bg-ms-surface px-4 py-2 text-xs font-medium text-ms-gray transition-colors hover:border-ms-blue hover:text-ms-blue disabled:opacity-60"
          >
            {action}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-ms-border bg-ms-surface/40 p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                message.role === 'user'
                  ? 'bg-ms-blue text-white'
                  : 'border border-ms-border bg-white text-ms-dark'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-[88%] items-center gap-2 rounded-2xl border border-ms-border bg-white px-4 py-3 text-sm text-ms-gray shadow-sm">
              <Loader2 size={16} className="animate-spin text-ms-blue" />
              A pensar na melhor resposta...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="mt-4 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Pergunta algo sobre esta vaga..."
          rows={1}
          className="min-h-[48px] flex-1 resize-none rounded-2xl border border-ms-border bg-white px-4 py-3 text-sm text-ms-dark outline-none placeholder:text-ms-gray focus:border-ms-blue focus:bg-white"
        />
        <button
          type="button"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ms-blue text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
