'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AREAS, PROVINCIAS_ANGOLA } from '@/lib/types'
import Logo from '@/components/Logo'
import { Search, X, Plus, Check, ArrowRight, Briefcase, MapPin, GraduationCap, Award, Sparkles } from 'lucide-react'

const recommendedTitles = [
  'Técnico de Manutenção',
  'Engenheiro Civil',
  'Programador',
  'Analista Financeiro',
  'Enfermeiro',
  'Assistente Administrativo',
  'Gestor de Vendas',
  'Contabilista',
  'Recursos Humanos',
  'Electricista',
  'Mecânico',
  'Consultor de TI',
  'Designer Gráfico',
  'Operador de Máquinas',
  'Tradutor',
  'Professor',
]

const competenciasSugestoes = [
  'Comunicação',
  'Trabalho em equipa',
  'Microsoft Office',
  'Inglês',
  'Liderança',
  'Gestão de tempo',
  'Resolução de problemas',
  'Atendimento ao cliente',
  'Python',
  'Gestão de projectos',
  'Vendas',
  'Condução',
]

function OnboardingContent() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<'candidato' | 'recrutador' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Candidate fields
  const [search, setSearch] = useState('')
  const [jobTitles, setJobTitles] = useState<string[]>([])
  const [area, setArea] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [nivel, setNivel] = useState('')
  const [experiencia, setExperiencia] = useState('')
  const [competencias, setCompetencias] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [showMatchesModal, setShowMatchesModal] = useState(false)

  // Recruiter fields
  const [empresa, setEmpresa] = useState('')
  const [telefone, setTelefone] = useState('')
  const [recArea, setRecArea] = useState('')
  const [recLocal, setRecLocal] = useState('')
  const [recDesc, setRecDesc] = useState('')

  const NIVEIS = ['Ensino Médio', 'Técnico Médio', 'Licenciatura', 'Mestrado', 'Doutoramento']

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login/')
        return
      }
      const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      if (!user) {
        router.push('/auth/login/')
        return
      }
      setUserId(user.id)
      setRole(user.role)
      // Check if profile already filled
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (profile && (profile.area || profile.competencias?.length)) {
        router.push(user.role === 'candidato' ? '/dashboard/candidato/' : '/dashboard/recrutador/')
        return
      }
      setLoading(false)
    })
  }, [router])

  const filteredRecommended = useMemo(() => {
    const s = search.trim().toLowerCase()
    return s
      ? recommendedTitles.filter((t) => t.toLowerCase().includes(s))
      : recommendedTitles
  }, [search])

  const toggleTitle = (title: string) => {
    setJobTitles((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]))
  }

  const removeTitle = (title: string) => setJobTitles((prev) => prev.filter((t) => t !== title))

  const toggleCompetencia = (c: string) => {
    setCompetencias((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  const startScan = async () => {
    setStep(3)
    setScanning(true)
    setScanProgress(0)

    let jobs: any[] = []
    try {
      const res = await fetch('/external-jobs.json', { cache: 'no-store' })
      const j = await res.json()
      jobs = j.jobs || []
    } catch {
      jobs = []
    }

    const { data: vagas } = await supabase.from('vagas').select('*').eq('status', 'aberta')
    const all = [...(vagas || []), ...jobs]

    const matches = all.filter((job: any) => {
      const text = `${job.titulo || ''} ${job.area || ''} ${job.descricao || ''} ${job.category || ''}`.toLowerCase()
      return (
        jobTitles.some((t) => text.includes(t.toLowerCase())) ||
        (area && text.includes(area.toLowerCase())) ||
        competencias.some((c) => text.includes(c.toLowerCase()))
      )
    })

    setMatchCount(matches.length || all.length)

    // Animate progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 12
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setTimeout(() => {
          setScanning(false)
          setShowMatchesModal(true)
        }, 600)
      }
      setScanProgress(progress)
    }, 250)
  }

  const saveProfile = async () => {
    if (!userId) return
    setSaving(true)
    const updates: any = { telefone: role === 'recrutador' ? telefone : '' }
    if (role === 'candidato') {
      updates.area = area || jobTitles[0] || ''
      updates.localizacao = localizacao
      updates.nivel_academico = nivel
      updates.experiencias = experiencia
      updates.competencias = competencias.join(', ')
      updates.bio = bio
    }
    await supabase.from('users').update({ telefone: role === 'recrutador' ? telefone : '' }).eq('id', userId)
    await supabase.from('profiles').upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    setSaving(false)
  }

  const handleCandidateContinue = () => {
    if (step === 1) setStep(2)
    else if (step === 2) startScan()
    else if (step === 3 && showMatchesModal) {
      saveProfile().then(() => router.push('/vagas/'))
    }
  }

  const handleRecruiterContinue = async () => {
    await saveProfile()
    router.push('/dashboard/recrutador/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Welcome step
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#F0F6FF] px-4 py-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <Logo variant="full" className="h-14 w-auto mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {role === 'candidato'
                ? 'Pare de candidatar-se durante semanas. Comece a entrevistar em dias.'
                : 'Encontre os melhores talentos para a sua empresa'}
            </h1>
            <ul className="space-y-2 text-sm text-gray-600 text-left mt-6">
              {role === 'candidato' ? (
                <>
                  <li className="flex items-center gap-2"><Check size={18} className="text-ms-blue" /> Vagas inteligentes baseadas nas tuas competências</li>
                  <li className="flex items-center gap-2"><Check size={18} className="text-ms-blue" /> Candidatura rápida a centenas de vagas</li>
                  <li className="flex items-center gap-2"><Check size={18} className="text-ms-blue" /> Horas poupadas com filtragem automática</li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2"><Check size={18} className="text-ms-blue" /> Publicação simplificada de vagas</li>
                  <li className="flex items-center gap-2"><Check size={18} className="text-ms-blue" /> Candidatos pré-seleccionados por IA</li>
                  <li className="flex items-center gap-2"><Check size={18} className="text-ms-blue" /> Gestão centralizada de candidaturas</li>
                </>
              )}
            </ul>
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full bg-ms-blue text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            Começar agora <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  // Recruiter step 1
  if (role === 'recrutador') {
    return (
      <div className="min-h-screen bg-[#F0F6FF] px-4 py-8">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Configure o perfil da empresa</h1>
            <p className="text-sm text-gray-500 mt-1">Vamos personalizar a sua experiência</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><Briefcase size={14} /> Nome da empresa</label>
              <input className="input-field mt-1" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ex: Mota-Engil Angola" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><Award size={14} /> Área de actuação</label>
              <select className="input-field mt-1" value={recArea} onChange={(e) => setRecArea(e.target.value)}>
                <option value="">Selecciona uma área</option>
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><MapPin size={14} /> Localização</label>
              <select className="input-field mt-1" value={recLocal} onChange={(e) => setRecLocal(e.target.value)}>
                <option value="">Selecciona a província</option>
                {PROVINCIAS_ANGOLA.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">Contacto telefónico</label>
              <input className="input-field mt-1" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Ex: 923 456 789" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">Breve descrição</label>
              <textarea className="input-field mt-1 min-h-[80px]" value={recDesc} onChange={(e) => setRecDesc(e.target.value)} placeholder="Descreve a empresa em poucas linhas..." />
            </div>
            <button
              onClick={handleRecruiterContinue}
              disabled={saving || !empresa}
              className="w-full bg-ms-blue text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'A guardar...' : 'Continuar para o painel'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Candidate step 1: job titles
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#F0F6FF] px-4 py-8">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-6">
            <p className="text-xs text-ms-blue font-bold mb-1">1/3</p>
            <h1 className="text-xl font-bold text-gray-900">Quais cargos procuras?</h1>
            <p className="text-sm text-gray-500">Selecciona títulos ou pesquisa. Estes ajudam-nos a filtrar as vagas ideais.</p>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm mb-4">
            <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2.5">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar cargo..."
                className="bg-transparent flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400"
              />
            </div>
          </div>

          {jobTitles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {jobTitles.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-xs font-medium bg-ms-blue text-white px-3 py-1.5 rounded-full">
                  {t} <button onClick={() => removeTitle(t)}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}

          <h3 className="text-sm font-semibold text-gray-700 mb-3">Cargos recomendados</h3>
          <div className="flex flex-wrap gap-2 mb-8">
            {filteredRecommended.map((t) => (
              <button
                key={t}
                onClick={() => toggleTitle(t)}
                className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  jobTitles.includes(t)
                    ? 'bg-ms-blue text-white border-ms-blue'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-ms-blue'
                }`}
              >
                {jobTitles.includes(t) ? <X size={12} /> : <Plus size={12} />} {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={jobTitles.length === 0}
            className="w-full bg-ms-blue text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  // Candidate step 2: profile details
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#F0F6FF] px-4 py-8">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-6">
            <p className="text-xs text-ms-blue font-bold mb-1">2/3</p>
            <h1 className="text-xl font-bold text-gray-900">Completa o teu perfil</h1>
            <p className="text-sm text-gray-500">Quanto mais completo, melhores serão as vagas recomendadas.</p>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4 mb-6">
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><Briefcase size={14} /> Área principal</label>
              <select className="input-field mt-1" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Selecciona uma área</option>
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><MapPin size={14} /> Localização</label>
              <select className="input-field mt-1" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)}>
                <option value="">Selecciona a província</option>
                {PROVINCIAS_ANGOLA.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><GraduationCap size={14} /> Nível académico</label>
              <select className="input-field mt-1" value={nivel} onChange={(e) => setNivel(e.target.value)}>
                <option value="">Selecciona</option>
                {NIVEIS.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">Anos de experiência</label>
              <input className="input-field mt-1" value={experiencia} onChange={(e) => setExperiencia(e.target.value)} placeholder="Ex: 3 anos em contabilidade" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">Sobre ti</label>
              <textarea className="input-field mt-1 min-h-[80px]" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fala brevemente do teu perfil..." />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">Competências</h3>
          <div className="flex flex-wrap gap-2 mb-8">
            {competenciasSugestoes.map((c) => (
              <button
                key={c}
                onClick={() => toggleCompetencia(c)}
                className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  competencias.includes(c)
                    ? 'bg-ms-blue text-white border-ms-blue'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-ms-blue'
                }`}
              >
                {competencias.includes(c) ? <X size={12} /> : <Plus size={12} />} {c}
              </button>
            ))}
          </div>

          <button
            onClick={handleCandidateContinue}
            disabled={!area || !localizacao}
            className="w-full bg-ms-blue text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Encontrar as minhas vagas <Sparkles size={18} />
          </button>
        </div>
      </div>
    )
  }

  // Candidate step 3: scanning
  return (
    <div className="min-h-screen bg-[#F0F6FF] px-4 py-12 flex flex-col items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-ms-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles size={32} className="text-ms-blue animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">A procurar as tuas melhores vagas...</h1>
        <p className="text-sm text-gray-500 mb-6">Estamos a analisar {matchCount} oportunidades com base no teu perfil.</p>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-ms-blue rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
        </div>
        <p className="text-xs text-gray-500">{Math.round(scanProgress)}% concluído</p>
      </div>

      {showMatchesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-500 mb-1">{matchCount} vagas encontradas</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">As tuas vagas estão à tua espera</h2>
            <p className="text-xs text-gray-500 mb-6">Encontrámos {matchCount} oportunidades que combinam contigo.</p>
            <button
              onClick={handleCandidateContinue}
              disabled={saving}
              className="w-full bg-ms-blue text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'A guardar...' : 'Ver vagas'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <OnboardingContent />
    </Suspense>
  )
}
