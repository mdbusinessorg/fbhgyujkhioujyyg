'use client'

import { useState, useEffect, Suspense, type MouseEvent, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import {
  ArrowLeft,
  Heart,
  Briefcase,
  MapPin,
  Building2,
  Send,
  Upload,
  MessageSquare,
  Share2,
  BadgeCheck,
  Users,
  Clock3,
  Building,
  ChevronRight,
} from 'lucide-react'
import { useFavorites } from '@/lib/favorites'
import VagaAssistant from '@/components/VagaAssistant'

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
  const [activeTab, setActiveTab] = useState<'descricao' | 'requisitos' | 'empresa'>('descricao')
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

    if (cvFile) {
      setUploading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const path = `${session.user.id}/${Date.now()}-${cvFile.name}`
        const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, cvFile)
        if (!uploadError) {
          const url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
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

  const shareJob = async () => {
    if (!vagaId) return
    const url = window.location.href
    const title = vaga?.titulo ? `${vaga.titulo} — MÔ SALO` : 'Vaga — MÔ SALO'
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // ignore
      }
    }
    await navigator.clipboard.writeText(url)
    alert('Link da vaga copiado!')
  }

  const companyLabel = vaga?.empresa_nome || 'Empresa'
  const initials = useMemo(() => {
    const base = companyLabel || vaga?.titulo || 'MS'
    const parts = base.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'MS'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }, [companyLabel, vaga?.titulo])

  const requirements = useMemo(() => {
    const text = String(vaga?.descricao || '')
    const idx = text.toLowerCase().indexOf('requisitos')
    if (idx === -1) return []
    return text
      .slice(idx)
      .split('\n')
      .map((line: string) => line.replace(/^[-•\d.)\s]+/, '').trim())
      .filter((line: string) => line && !/^requisitos[:]?$/i.test(line))
  }, [vaga?.descricao])

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

  const stats = [
    vaga.area ? { icon: Building, value: vaga.area, label: 'Categoria' } : null,
    vaga.localizacao ? { icon: MapPin, value: vaga.localizacao, label: 'Localização' } : null,
    vaga.tipo_emprego ? { icon: Users, value: vaga.tipo_emprego === 'formal' ? 'Formal' : vaga.tipo_emprego === 'informal' ? 'Informal' : vaga.tipo_emprego === 'freelance' ? 'Freelance' : vaga.tipo_emprego === 'estagio' ? 'Estágio' : 'Temporário', label: 'Regime' } : null,
    vaga.created_at ? { icon: Clock3, value: new Date(vaga.created_at).toLocaleDateString('pt-PT'), label: 'Publicado' } : null,
  ].filter(Boolean) as Array<{ icon: typeof Building; value: string; label: string }>

  const applyLabel = sent ? 'Candidatura enviada' : sending ? 'A candidatar...' : 'Candidatar-me'

  return (
    <div className="min-h-screen bg-ms-surface pb-36">
      <main className="mx-auto max-w-4xl pb-6">
        <section className="relative overflow-hidden bg-gradient-to-br from-ms-blue to-ms-purple px-4 pb-10 pt-5 text-white">
          <div className="absolute inset-0 opacity-15">
            <div className="absolute -left-8 top-6 h-24 w-24 rounded-full border border-white/40" />
            <div className="absolute right-6 top-12 h-16 w-16 rounded-full border border-white/30" />
            <div className="absolute bottom-0 left-1/2 h-28 w-28 -translate-x-1/2 translate-y-1/2 rounded-full border border-white/20" />
          </div>

          <div className="relative mx-auto flex max-w-4xl items-center justify-between">
            <button onClick={() => router.back()} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ms-dark shadow-lg shadow-black/10" aria-label="Voltar">
              <ArrowLeft size={20} />
            </button>
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/15 text-3xl font-black text-white shadow-lg shadow-black/10">
              {initials}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={shareJob} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ms-dark shadow-lg shadow-black/10" aria-label="Partilhar vaga">
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={handleFavoriteToggle}
                disabled={!favoriteKey}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ms-dark shadow-lg shadow-black/10 disabled:opacity-50"
                aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar vaga'}
              >
                <Heart size={18} fill={favorite ? 'currentColor' : 'none'} className={favorite ? 'text-red-500' : 'text-ms-gray'} />
              </button>
            </div>
          </div>

          <div className="relative mx-auto mt-8 max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">MÔ SALO</p>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{vaga.titulo}</h1>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-white/85">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                <BadgeCheck size={14} /> {companyLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                <MapPin size={14} /> {vaga.localizacao || 'Angola'}
              </span>
            </div>
          </div>
        </section>

        <section className="relative -mt-8 rounded-t-[28px] bg-white px-4 pb-6 pt-6 shadow-[0_-18px_40px_rgba(17,24,39,0.08)] sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-2 rounded-full border border-ms-border bg-ms-surface px-3 py-2 text-xs font-medium text-ms-gray">
              <BadgeCheck size={14} className="text-ms-blue" /> Vaga verificada
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ms-gray">
              <MapPin size={14} /> {vaga.localizacao || 'Angola'}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ms-surface text-ms-blue">
                <Briefcase size={22} />
              </div>
              <div className="min-w-0 text-center">
                <p className="text-sm font-semibold text-ms-dark">{companyLabel}</p>
                <p className="text-xs text-ms-gray">{vaga.area || 'Oportunidade profissional'}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
              <button type="button" onClick={() => setActiveTab('empresa')} className="flex flex-col items-center gap-2 rounded-2xl border border-ms-border bg-white px-2 py-3 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue"><Building2 size={18} /></span>
                <span className="text-[11px] font-medium text-ms-gray">Empresa</span>
              </button>
              <button type="button" onClick={handleFavoriteToggle} className="flex flex-col items-center gap-2 rounded-2xl border border-ms-border bg-white px-2 py-3 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue"><Heart size={18} fill={favorite ? 'currentColor' : 'none'} className={favorite ? 'text-red-500' : 'text-ms-blue'} /></span>
                <span className="text-[11px] font-medium text-ms-gray">Guardar</span>
              </button>
              <button type="button" onClick={shareJob} className="flex flex-col items-center gap-2 rounded-2xl border border-ms-border bg-white px-2 py-3 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue"><Share2 size={18} /></span>
                <span className="text-[11px] font-medium text-ms-gray">Partilhar</span>
              </button>
              <a href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(vaga.titulo || '')}&location=Angola`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 rounded-2xl border border-ms-border bg-white px-2 py-3 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue">in</span>
                <span className="text-[11px] font-medium text-ms-gray">LinkedIn</span>
              </a>
            </div>

            {stats.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={index} className="rounded-2xl border border-ms-border bg-ms-surface p-4">
                      <div className="flex items-center gap-2 text-ms-blue">
                        <Icon size={16} />
                        <span className="text-[11px] font-medium text-ms-gray">{stat.label}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-snug text-ms-dark">{stat.value}</p>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-6 border-b border-ms-border">
              <div className="flex gap-6 overflow-x-auto text-sm font-semibold scrollbar-hide">
                {[
                  { key: 'descricao', label: 'Descrição' },
                  { key: 'requisitos', label: 'Requisitos' },
                  { key: 'empresa', label: 'Empresa' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`pb-3 transition-colors ${activeTab === tab.key ? 'border-b-2 border-ms-blue text-ms-blue' : 'text-ms-gray'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {activeTab === 'descricao' && (
                <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-ms-dark">Descrição da vaga</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ms-gray">{vaga.descricao}</p>
                </div>
              )}

              {activeTab === 'requisitos' && (
                <div className="space-y-3">
                  {requirements.length > 0 ? requirements.map((req: string, i: number) => (
                    <div key={i} className="flex items-start justify-between gap-4 rounded-2xl border border-ms-border bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue">
                          <ChevronRight size={14} />
                        </div>
                        <p className="text-sm leading-relaxed text-ms-dark">{req}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-ms-border bg-white p-5 text-sm text-ms-gray shadow-sm">
                      A descrição desta vaga não separa requisitos em lista. Consulta a descrição para ver todos os detalhes.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'empresa' && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-ms-dark">{companyLabel}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ms-gray">
                      {vaga.area ? `Área: ${vaga.area}` : 'Empresa anunciante'}
                      {vaga.tipo_emprego ? ` • ${vaga.tipo_emprego}` : ''}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-ms-dark">Como candidatar</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ms-gray">
                      Usa o botão fixo no fundo da página para enviar a tua candidatura e anexar o teu CV.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <VagaAssistant
                titulo={vaga.titulo}
                empresa={companyLabel}
                localizacao={vaga.localizacao}
                area={vaga.area}
                descricao={vaga.descricao}
                requisitos={requirements}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-ms-dark mb-2">Candidatar-se</h2>
              {sent ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
                  <p className="text-sm font-medium text-green-700">Candidatura enviada com sucesso!</p>
                  <Link href="/dashboard/candidato/" className="mt-2 inline-block text-xs text-ms-blue">Ver as minhas candidaturas →</Link>
                </div>
              ) : isLoggedIn && userRole === 'candidato' ? (
                <div>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Porquê queres esta vaga? (opcional)"
                    className="mb-3 min-h-[100px] w-full rounded-2xl border border-ms-border bg-ms-surface px-4 py-3.5 text-sm text-ms-dark outline-none placeholder:text-ms-gray focus:border-ms-blue focus:bg-white"
                  />

                  {vaga.perguntas && vaga.perguntas.length > 0 && (
                    <div className="mb-4 space-y-3">
                      <h3 className="flex items-center gap-1 text-xs font-semibold text-ms-dark">
                        <MessageSquare size={14} className="text-ms-blue" /> Perguntas do Recrutador
                      </h3>
                      {vaga.perguntas.map((pergunta: string, i: number) => (
                        <div key={i} className="rounded-2xl border border-ms-border bg-ms-surface p-4">
                          <label className="mb-2 block text-xs font-medium text-ms-gray">{pergunta}</label>
                          <input
                            type="text"
                            value={respostas[pergunta] || ''}
                            onChange={(e) => setRespostas({ ...respostas, [pergunta]: e.target.value })}
                            placeholder="A tua resposta..."
                            className="w-full rounded-2xl border border-ms-border bg-white px-4 py-3 text-sm text-ms-dark outline-none placeholder:text-ms-gray focus:border-ms-blue"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="block">
                    <div className="rounded-2xl border border-dashed border-ms-border bg-ms-surface p-4 text-center transition-colors hover:border-ms-blue">
                      <Upload size={20} className="mx-auto mb-1 text-ms-gray" />
                      <p className="text-xs text-ms-gray">{cvFile ? cvFile.name : 'Anexar CV (PDF, opcional)'}</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              ) : !isLoggedIn ? (
                <div className="rounded-2xl border border-ms-border bg-ms-surface p-4 text-center">
                  <p className="text-sm text-ms-gray mb-2">Regista-te para te candidatar a esta vaga</p>
                  <Link href="/auth/registar/" className="text-sm font-medium text-ms-blue">Criar conta →</Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ms-border bg-white p-4 shadow-[0_-10px_30px_rgba(17,24,39,0.08)]">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={handleCandidatar}
            disabled={sending || uploading || sent || !isLoggedIn || userRole !== 'candidato'}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ms-blue px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={16} /> {applyLabel}
          </button>
        </div>
      </div>
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
