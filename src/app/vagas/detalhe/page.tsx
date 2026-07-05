'use client'

import { useState, useEffect, Suspense, type MouseEvent } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import { ArrowLeft, Heart, Briefcase, MapPin, Building2, Send, Upload, MessageSquare } from 'lucide-react'
import { useFavorites } from '@/lib/favorites'

function VagaDetalheContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const vagaId = searchParams.get('id')
  const [vaga, setVaga] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [userId, setUserId] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const { isFavorite, toggle } = useFavorites()

  useEffect(() => {
    const load = async () => {
      if (!vagaId) { setLoading(false); return }

      const { data } = await supabase.from('vagas').select('*').eq('id', vagaId).single()
      if (data) setVaga(data)

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsLoggedIn(true)
        const { data: user } = await supabase.from('users').select('id, role').eq('email', session.user.email).single()
        if (user) {
          setUserRole(user.role)
          setUserId(user.id)
        }
      }
      setLoading(false)
    }
    load()
  }, [vagaId])

  const handleCandidatar = async () => {
    if (!isLoggedIn) { router.push('/auth/registar/'); return }
    if (!userId || !vagaId) return

    setSending(true)

    // Check if already applied
    const { data: existing } = await supabase
      .from('candidaturas')
      .select('id')
      .eq('vaga_id', vagaId)
      .eq('candidato_id', userId)
      .maybeSingle()

    if (existing) {
      alert('Já te candidataste a esta vaga!')
      setSending(false)
      setSent(true)
      return
    }

    // Upload CV if provided
    if (cvFile) {
      setUploading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const path = `${session.user.id}/${Date.now()}-${cvFile.name}`
        const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, cvFile)
        if (!uploadError) {
          const url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
          // Save to profile
          const { data: prof } = await supabase.from('profiles').select('documentos').eq('user_id', session.user.id).single()
          const existingDocs = prof?.documentos || []
          if (existingDocs.length < 2) {
            await supabase.from('profiles').upsert({
              user_id: session.user.id,
              documentos: [...existingDocs, url],
            }, { onConflict: 'user_id' })
          }
        }
      }
      setUploading(false)
    }

    const { error } = await supabase.from('candidaturas').insert({
      vaga_id: vagaId,
      candidato_id: userId,
      mensagem,
      status: 'enviada',
      data_candidatura: new Date().toISOString(),
      respostas: Object.keys(respostas).length > 0 ? respostas : null,
    })

    if (error) {
      alert('Erro ao enviar candidatura: ' + error.message)
    } else {
      setSent(true)
    }
    setSending(false)
  }

  const favoriteKey = vaga ? `int:${vaga.id}` : ''
  const favorite = favoriteKey ? isFavorite(favoriteKey) : false
  const handleFavoriteToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (favoriteKey) toggle(favoriteKey)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!vaga) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-ms-gray mb-4">Vaga não encontrada</p>
          <Link href="/vagas/" className="text-ms-blue font-medium">← Voltar às vagas</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top Nav */}
      <header className="sticky top-0 bg-white border-b border-ms-border z-50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()}>
            <ArrowLeft size={20} className="text-ms-dark" />
          </button>
          <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
          <button
            type="button"
            onClick={handleFavoriteToggle}
            disabled={!favoriteKey}
            className="disabled:opacity-50"
            aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar vaga'}
          >
            <Heart
              size={20}
              fill={favorite ? 'currentColor' : 'none'}
              className={favorite ? 'text-red-500' : 'text-ms-gray'}
            />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        {/* Company & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-ms-surface rounded-full flex items-center justify-center mx-auto mb-3 border border-ms-border">
            <Briefcase size={24} className="text-ms-blue" />
          </div>
          <h1 className="text-xl font-bold text-ms-dark mb-1">{vaga.titulo}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-ms-gray">
            <MapPin size={14} /> {vaga.localizacao || 'Angola'}
          </div>
          <p className="text-sm text-ms-gray mt-1">{vaga.empresa_nome}</p>
          {vaga.salario && (
            <p className="text-sm font-semibold text-ms-blue mt-2">{vaga.salario}</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            {vaga.tipo_emprego && (
              <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${vaga.tipo_emprego === 'formal' ? 'bg-blue-100 text-blue-700' : vaga.tipo_emprego === 'informal' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                {vaga.tipo_emprego === 'formal' ? 'Formal' : vaga.tipo_emprego === 'informal' ? 'Informal' : vaga.tipo_emprego === 'freelance' ? 'Freelance' : vaga.tipo_emprego === 'estagio' ? 'Estágio' : 'Temporário'}
              </span>
            )}
            <span className="text-[11px] px-3 py-1 rounded-full bg-ms-surface text-ms-gray">{vaga.area}</span>
          </div>
        </div>

        {/* About */}
        {vaga.descricao && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-ms-dark mb-2">Sobre a Vaga</h2>
            <p className="text-sm text-ms-gray leading-relaxed whitespace-pre-line">{vaga.descricao}</p>
          </div>
        )}

        {/* Requirements - extracted from descricao if present */}
        {vaga.descricao && vaga.descricao.includes('Requisitos:') && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-ms-dark mb-2">Requisitos</h2>
            <ul className="space-y-1">
              {vaga.descricao.split('Requisitos:')[1]?.split('\n').filter(Boolean).map((req: string, i: number) => (
                <li key={i} className="text-sm text-ms-gray flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-ms-purple rounded-full mt-1.5 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Application form */}
        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-green-700">Candidatura enviada com sucesso!</p>
            <Link href="/dashboard/candidato/" className="text-xs text-ms-blue mt-2 inline-block">Ver as minhas candidaturas →</Link>
          </div>
        ) : isLoggedIn && userRole === 'candidato' ? (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-ms-dark mb-2">Candidatar-se</h2>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Porquê queres esta vaga? (opcional)"
              className="input-field min-h-[80px] mb-3"
            />
            {/* Custom Questions from Recruiter */}
            {vaga.perguntas && vaga.perguntas.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-ms-dark mb-2 flex items-center gap-1">
                  <MessageSquare size={14} className="text-ms-purple" /> Perguntas do Recrutador
                </h3>
                <div className="space-y-3">
                  {vaga.perguntas.map((pergunta: string, i: number) => (
                    <div key={i}>
                      <label className="text-xs text-ms-gray mb-1 block">{pergunta}</label>
                      <input
                        type="text"
                        value={respostas[pergunta] || ''}
                        onChange={(e) => setRespostas({...respostas, [pergunta]: e.target.value})}
                        placeholder="A sua resposta..."
                        className="input-field !py-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Upload */}
            <div className="mb-3">
              <label className="block">
                <div className="bg-ms-surface border border-dashed border-ms-border rounded-xl p-4 text-center cursor-pointer hover:border-ms-blue transition-colors">
                  <Upload size={20} className="text-ms-gray mx-auto mb-1" />
                  <p className="text-xs text-ms-gray">{cvFile ? cvFile.name : 'Anexar CV (PDF, opcional)'}</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>
        ) : !isLoggedIn ? (
          <div className="bg-ms-surface rounded-xl p-4 text-center mb-4">
            <p className="text-sm text-ms-gray mb-2">Regista-te para te candidatar a esta vaga</p>
            <Link href="/auth/registar/" className="text-sm text-ms-blue font-medium">Criar conta →</Link>
          </div>
        ) : null}
      </main>

      {/* Sticky bottom bar */}
      {!sent && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border p-4 z-50">
          <div className="max-w-3xl mx-auto flex gap-3">
            <button className="flex-shrink-0 border border-ms-border px-4 py-3 rounded-xl text-sm font-medium text-ms-dark hover:bg-ms-surface">
              Guardar
            </button>
            <button
              onClick={handleCandidatar}
              disabled={sending}
              className="flex-1 bg-ms-blue text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {sending ? 'A enviar...' : isLoggedIn ? 'Candidatar Agora' : 'Registar para Candidatar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VagaDetalhePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-ms-purple border-t-transparent rounded-full animate-spin" /></div>}>
      <VagaDetalheContent />
    </Suspense>
  )
}
