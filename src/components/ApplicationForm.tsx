'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Send, CheckCircle, LogIn, FileUp } from 'lucide-react'

interface ApplicationFormProps {
  vagaId: string
  vagaTitulo: string
}

export default function ApplicationForm({ vagaId, vagaTitulo }: ApplicationFormProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setIsLoggedIn(true)
        const { data: user } = await supabase
          .from('users')
          .select('id, nome, role')
          .eq('email', session.user.email)
          .single()
        
        if (user) {
          setUserId(user.id)
          setUserName(user.nome)

          // Check if already applied
          const { data: existing } = await supabase
            .from('candidaturas')
            .select('id')
            .eq('vaga_id', vagaId)
            .eq('candidato_id', user.id)
            .single()
          
          if (existing) {
            setAlreadyApplied(true)
          }
        }
      }
    } catch {
      // Not logged in
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSubmitting(true)
    setError('')

    const { error: insertError } = await supabase
      .from('candidaturas')
      .insert({
        vaga_id: vagaId,
        candidato_id: userId,
        status: 'enviada',
        mensagem: mensagem || null
      })

    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
        setError('Já te candidataste a esta vaga.')
        setAlreadyApplied(true)
      } else {
        setError('Erro ao enviar candidatura: ' + insertError.message)
      }
    } else {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="card p-5">
        <div className="w-6 h-6 border-2 border-k10-accent border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="card p-5 bg-green-50 border-green-200">
        <div className="flex flex-col items-center text-center gap-2">
          <CheckCircle size={32} className="text-green-600" />
          <h3 className="font-semibold text-green-800">Candidatura Enviada!</h3>
          <p className="text-sm text-green-700">A tua candidatura para &quot;{vagaTitulo}&quot; foi enviada ao recrutador.</p>
          <Link href="/dashboard/candidato/" className="text-sm text-k10-accent hover:underline mt-2">
            Ver minhas candidaturas →
          </Link>
        </div>
      </div>
    )
  }

  if (alreadyApplied) {
    return (
      <div className="card p-5 bg-blue-50 border-blue-200">
        <div className="flex flex-col items-center text-center gap-2">
          <CheckCircle size={24} className="text-blue-600" />
          <h3 className="font-semibold text-blue-800 text-sm">Já te candidataste</h3>
          <p className="text-xs text-blue-700">A tua candidatura está a ser analisada pelo recrutador.</p>
          <Link href="/dashboard/candidato/" className="text-xs text-k10-accent hover:underline mt-1">
            Ver status →
          </Link>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <Link href="/auth/registar/" className="btn-primary w-full flex items-center justify-center gap-2">
          <Send size={18} />
          Candidatar-me
        </Link>
        <p className="text-xs text-gray-500 text-center">
          Precisas de uma conta para te candidatares.
          <Link href="/auth/login/" className="text-k10-accent hover:underline ml-1">Entrar</Link>
        </p>
      </div>
    )
  }

  // Logged in - show application form
  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-sm text-gray-800">Candidatar-me</h3>
      <p className="text-xs text-gray-500">Olá, {userName}! Envia a tua candidatura.</p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Mensagem (opcional)</label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-k10-accent focus:border-transparent resize-none"
            rows={3}
            placeholder="Porque sou o candidato ideal para esta vaga..."
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {submitting ? 'A enviar...' : 'Enviar Candidatura'}
        </button>
      </form>

      <div className="border-t pt-3">
        <Link href="/dashboard/candidato/" className="text-xs text-gray-500 hover:text-k10-accent flex items-center gap-1">
          <FileUp size={12} />
          Carregar documentos no teu perfil →
        </Link>
      </div>
    </div>
  )
}
