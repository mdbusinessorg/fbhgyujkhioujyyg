'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, MapPin, Clock, Linkedin, Send, MessageCircle, LogIn, Mail, Sparkles, Share2, Check, Bookmark, Globe } from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'
import AppHeader from '@/components/AppHeader'
import ApplySuccess from '@/components/ApplySuccess'
import ApplyProgress, { ApplyPhase, APPLY_MIN_MS, APPLY_FLY_MS, wait } from '@/components/ApplyProgress'
import { recordExternalApply, hasAppliedTo } from '@/lib/candidacies'
import { toast } from '@/lib/toast'
import { useSavedJobs } from '@/lib/bookmarks'
import { recordView } from '@/lib/recents'

function ExternaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = searchParams.get('id')
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [candidate, setCandidate] = useState<any>(null)
  const [preparingEmail, setPreparingEmail] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [applyPhase, setApplyPhase] = useState<ApplyPhase>('idle')
  const [appliedVia, setAppliedVia] = useState<'site_oficial' | 'email'>('email')
  const { keys: savedKeys, toggle: toggleSaved } = useSavedJobs()
  const saved = !!jobId && savedKeys.has(`ext:${jobId}`)

  const markApplied = (via: 'site_oficial' | 'email') => {
    if (!job) return
    recordExternalApply({ job_id: job.id || jobId || '', title: job.title, company: job.company, logo_url: job.logo_url, location: job.location, via })
    setAlreadyApplied(true)
    setAppliedVia(via)
    setShowSuccess(true)
  }

  const shareJob = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: job?.title || 'Vaga', url }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {})
      toast('Link copiado para a área de transferência', 'success')
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  useEffect(() => {
    const load = async () => {
      if (!jobId) { setLoading(false); return }
      try {
        const res = await fetch(`/vagas-data/${encodeURIComponent(jobId)}.json`, { cache: 'no-store' })
        if (res.ok) {
          const j = await res.json()
          setJob(j)
          recordView({ kind: 'ext', id: jobId, title: j.title || 'Vaga', company: j.company || '' })
        }
        setAlreadyApplied(hasAppliedTo(jobId))
      } catch {
        // ignore — handled by not-found state below
      }
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
      if (session?.user?.email) {
        try {
          const { data: u } = await supabase.from('users').select('id, nome, email, telefone').eq('email', session.user.email).single()
          if (u) {
            const { data: prof } = await supabase.from('profiles').select('area, localizacao, competencias, experiencias, nivel_academico').eq('user_id', u.id).single()
            setCandidate({ ...u, ...(prof || {}) })
          }
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [jobId])

  const isMailtoApply = typeof job?.apply_url === 'string' && job.apply_url.toLowerCase().startsWith('mailto:')
  const mailtoAddr = isMailtoApply ? (job!.apply_url!.replace(/^mailto:/i, '').split('?')[0].trim().split(/[;\s,]+/)[0] || '') : ''
  const isValidMailto = /^[\w.+-]+@[\w-]+\.[\w.]+$/.test(mailtoAddr)

  const cleanAiText = (s: string) => s
    .replace(/[*_`#>]+/g, '')
    .replace(/\[[^\]]{1,40}\]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const buildFallbackEmail = () => {
    const nome = candidate?.nome || ''
    const area = candidate?.area ? ` da área de ${candidate.area}` : ''
    const comp = candidate?.competencias ? `\n\nPrincipais competências: ${candidate.competencias}.` : ''
    return {
      subject: `Candidatura — ${job.title}`,
      body: `Exmos. Senhores,\n\nO meu nome é ${nome}, sou profissional${area} e venho por este meio candidatar-me à posição de ${job.title}${job.company ? ` na ${job.company}` : ''}.${comp}\n\nO meu CV segue em anexo. Fico disponível para uma entrevista.\n\nCom os melhores cumprimentos,\n${nome}${candidate?.telefone ? `\n${candidate.telefone}` : ''}${candidate?.email ? `\n${candidate.email}` : ''}`,
    }
  }

  const handleEmailApply = async () => {
    if (!isLoggedIn) { router.push('/auth/login/'); return }
    setPreparingEmail(true)
    setApplyPhase('working')
    const startedAt = Date.now()
    let email = buildFallbackEmail()
    try {
      const res = await fetch('/api/ai-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: { title: job.title, company: job.company, location: job.location, description: job.description || job.excerpt },
          candidate,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.subject && data.body) email = data
      }
    } catch {}
    // Limpa e limita o texto da IA — markdown, placeholders e emails muito longos partem o mailto:
    email.subject = cleanAiText(String(email.subject || '')).split('\n')[0].replace(/^(assunto|subject)\s*:\s*/i, '').slice(0, 110) || `Candidatura — ${job.title}`
    email.body = cleanAiText(String(email.body || ''))
    if (email.body.length > 1500) {
      const cut = email.body.slice(0, 1500)
      email.body = cut.slice(0, Math.max(cut.lastIndexOf('\n'), 1200)).trim() || cut.trim()
    }
    await wait(APPLY_MIN_MS - (Date.now() - startedAt))
    setApplyPhase('flying')
    await wait(APPLY_FLY_MS)
    setApplyPhase('idle')
    setPreparingEmail(false)
    markApplied('email')
    window.location.href = `mailto:${mailtoAddr}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
  }

  const getTimeAgo = (date: string) => {
    if (!date) return ''
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days <= 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 30) return `Há ${days} dias`
    return new Date(date).toLocaleDateString('pt-PT')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-ms-gray mb-4">Vaga não encontrada</p>
          <Link href="/vagas/" className="text-ms-blue font-medium">← Voltar às vagas</Link>
        </div>
      </div>
    )
  }

  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title || '')}&location=Angola`

  return (
    <div className="min-h-screen bg-white pb-32 lg:pb-28">
      <AppHeader />

      <div className="max-w-3xl mx-auto px-4 pt-3">
        <Link href="/vagas/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ms-gray hover:text-ms-blue">
          <ArrowLeft size={14} /> Voltar às vagas
        </Link>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3">
            <CompanyLogo company={job.company} logoUrl={job.logo_url} size={56} rounded="rounded-2xl" className="border border-ms-border" />
          </div>
          <h1 className="text-xl font-bold text-ms-dark mb-1">{job.title}</h1>
          {job.company && <p className="text-sm text-ms-gray">{job.company}</p>}
          <div className="flex items-center justify-center gap-3 mt-2 flex-wrap text-sm text-ms-gray">
            {job.location && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {job.location}</span>}
            {job.posted_at && <span className="inline-flex items-center gap-1"><Clock size={14} /> {getTimeAgo(job.posted_at)}</span>}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {job.category && job.category !== 'Outro' && (
              <span className="text-[11px] px-3 py-1 rounded-full bg-ms-blue/10 text-ms-blue font-medium">{job.category}</span>
            )}
            {job.salary && (
              <span className="text-[11px] font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">{job.salary}</span>
            )}
          </div>
          <button
            onClick={shareJob}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-ms-gray border border-ms-border rounded-full px-3 py-1.5 hover:text-ms-blue hover:border-ms-blue"
          >
            {linkCopied ? <><Check size={13} className="text-green-600" /> Link copiado</> : <><Share2 size={13} /> Partilhar</>}
          </button>
        </div>

        {/* Grelha de especificações (estilo Mirantes) */}
        <div className="bg-ms-surface rounded-2xl p-4 mb-6 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          {job.location && (
            <div><p className="text-[10px] text-ms-gray uppercase tracking-wide">Localização</p><p className="text-xs font-medium text-ms-dark mt-0.5">{job.location}</p></div>
          )}
          {job.tipo_contrato && (
            <div><p className="text-[10px] text-ms-gray uppercase tracking-wide">Tipo de contrato</p><p className="text-xs font-medium text-ms-dark mt-0.5">{job.tipo_contrato}</p></div>
          )}
          {job.modalidade && (
            <div><p className="text-[10px] text-ms-gray uppercase tracking-wide">Modalidade</p><p className="text-xs font-medium text-ms-dark mt-0.5">{job.modalidade}</p></div>
          )}
          {job.category && job.category !== 'Outro' && (
            <div><p className="text-[10px] text-ms-gray uppercase tracking-wide">Categoria</p><p className="text-xs font-medium text-ms-dark mt-0.5">{job.category}</p></div>
          )}
          <div><p className="text-[10px] text-ms-gray uppercase tracking-wide">Salário</p><p className="text-xs font-medium text-ms-dark mt-0.5">{job.salary || 'Não especificado'}</p></div>
          <div><p className="text-[10px] text-ms-gray uppercase tracking-wide">Candidatura</p><p className="text-xs font-medium text-ms-dark mt-0.5">{isValidMailto ? 'E-mail' : job.apply_url && !isMailtoApply ? 'Site oficial' : 'LinkedIn / Google'}</p></div>
        </div>

        {job.description && (
          <div className="mb-6 relative">
            <h2 className="text-sm font-semibold text-ms-dark mb-2">Sobre a Vaga</h2>
            {!isLoggedIn ? (
              <>
                <div
                  className="external-job-desc text-sm text-ms-gray leading-relaxed line-clamp-6"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
                <div className="mt-3 bg-gradient-to-r from-ms-blue to-ms-purple rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-white/90">Entra ou regista-te para ver a descrição completa.</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href="/auth/login/" className="inline-flex items-center gap-1 bg-white text-ms-blue text-xs font-bold px-3 py-2 rounded-xl hover:bg-ms-surface">
                      <LogIn size={14} /> Entrar
                    </Link>
                    <a
                      href={`https://wa.me/244934859497?text=${encodeURIComponent(`Olá! Vi a vaga *${job.title}* no MÔ SALO e quero saber mais.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-600"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div
                className="external-job-desc text-sm text-ms-gray leading-relaxed"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            )}
          </div>
        )}

        <p className="inline-flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
          {isMailtoApply ? 'Vaga externa — a tua candidatura vai por e-mail directamente ao recrutador.' : 'Vaga externa — a tua candidatura é feita no site oficial da empresa / recrutador.'}
        </p>
      </main>

      {/* Sticky bottom apply bar */}
      <div className="ms-cta-bar ms-page-enter">
        {alreadyApplied && (
          <p className="max-w-3xl mx-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 mb-2">
            <Check size={12} /> Candidatura registada — vê em <Link href="/candidaturas/" className="underline">Minhas candidaturas</Link>
          </p>
        )}
        <div className="max-w-3xl mx-auto flex gap-2">
          {isValidMailto ? (
            <button
              onClick={handleEmailApply}
              disabled={preparingEmail}
              className="ms-btn-apply pulse flex-1 min-w-0 bg-ms-blue text-white text-sm font-bold py-3 rounded-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {preparingEmail ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> A preparar…</>
              ) : (
                <><Mail size={16} /> Candidatar por Email <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-md"><Sparkles size={10} /> IA</span></>
              )}
            </button>
          ) : job.apply_url && !isMailtoApply ? (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => markApplied('site_oficial')}
              className="ms-btn-apply flex-1 min-w-0 bg-ms-blue text-white text-sm font-bold py-3 rounded-full flex items-center justify-center gap-2"
            >
              <Send size={16} /> <span className="truncate">Candidatar no site oficial</span>
            </a>
          ) : (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-btn-apply flex-1 min-w-0 bg-ms-blue text-white text-sm font-bold py-3 rounded-full flex items-center justify-center gap-2"
            >
              <Linkedin size={16} /> <span className="truncate">Procurar no LinkedIn</span>
            </a>
          )}
          {!job.apply_url && job.company && (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${job.company} Angola contactos`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 border border-ms-border bg-white text-ms-dark text-sm font-semibold h-[46px] min-w-[46px] sm:px-4 rounded-full hover:bg-ms-surface transition-colors flex items-center justify-center gap-2 press"
            >
              <Globe size={16} /> <span className="hidden sm:inline">Site da empresa</span>
            </a>
          )}
          <button
            onClick={() => {
              if (!jobId || !job) return
              const nowSaved = toggleSaved({ key: `ext:${jobId}`, kind: 'ext', id: jobId, title: job.title || 'Vaga', company: job.company || '' })
              toast(nowSaved ? 'Vaga guardada — encontra-a no filtro Guardadas' : 'Vaga removida das guardadas', nowSaved ? 'success' : 'info')
            }}
            aria-label={saved ? 'Guardada' : 'Guardar'}
            className={`flex-shrink-0 inline-flex items-center justify-center gap-1.5 border text-sm font-semibold h-[46px] min-w-[46px] sm:px-4 rounded-full press ${saved ? 'border-ms-blue bg-ms-blue/10 text-ms-blue' : 'border-ms-border text-ms-dark hover:bg-ms-surface'}`}
          >
            <Bookmark size={16} className={saved ? 'fill-ms-blue' : ''} />
            <span className="hidden sm:inline">{saved ? 'Guardada' : 'Guardar'}</span>
          </button>
          {job.apply_url && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 border border-ms-border bg-white text-ms-dark text-sm font-semibold h-[46px] min-w-[46px] sm:px-4 rounded-full hover:bg-ms-surface transition-colors flex items-center justify-center gap-2 press"
            >
              <Linkedin size={16} className="text-[#0A66C2]" /> <span className="hidden sm:inline">Ver no LinkedIn</span>
            </a>
          )}
        </div>
        {!job.apply_url && (
          <p className="hidden sm:block text-[11px] text-ms-gray text-center mt-2">Esta vaga não indicou email nem site oficial — usa o LinkedIn ou procura a empresa para te candidatares.</p>
        )}
        {isValidMailto && (
          <p className="hidden sm:block text-[11px] text-ms-gray text-center mt-2">A IA escreve a mensagem com base no teu perfil (em inglês se a empresa for estrangeira) — revê e anexa o CV antes de enviar.</p>
        )}
      </div>

      <ApplyProgress
        phase={applyPhase}
        title="A preparar a tua candidatura"
        steps={['A ler o teu perfil…', 'A IA está a escrever o email…', 'A rever a mensagem…']}
        doneLabel="A abrir o teu email…"
      />

      <ApplySuccess
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={appliedVia === 'email' ? 'Email pronto a enviar!' : 'Candidatura Registada!'}
        message={appliedVia === 'email'
          ? `Abrimos o teu email com a mensagem para ${job.company || 'a empresa'} já escrita. Anexa o CV e carrega em enviar.`
          : `A tua candidatura para ${job.title} foi registada — fica atento às respostas de ${job.company || 'a empresa'}.`}
      />
    </div>
  )
}

export default function VagaExternaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <ExternaContent />
    </Suspense>
  )
}
