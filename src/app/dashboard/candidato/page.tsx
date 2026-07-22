'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import SubscriptionModal from '@/components/SubscriptionModal'
import { Search, Bell, Briefcase, FileText, User, Upload, ArrowRight, Clock, CheckCircle, XCircle, Plus, Eye, Sparkles, Lightbulb, Target, Award, AlertCircle, ChevronRight, Zap, LogOut, Menu, X, CreditCard, Wallet, Home as HomeIcon } from 'lucide-react'
import { improveCV, getTips } from '@/lib/ai'

export default function CandidatoDashboardPage() {
  return <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-ms-purple border-t-transparent rounded-full animate-spin" /></div>}><CandidatoDashboard /></Suspense>
}

function CandidatoDashboard() {
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [subPlano, setSubPlano] = useState('trial')
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [candidaturas, setCandidaturas] = useState<any[]>([])
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'home'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [documentos, setDocumentos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [editNome, setEditNome] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editLocalizacao, setEditLocalizacao] = useState('')
  const [editNivel, setEditNivel] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editExperiencias, setEditExperiencias] = useState('')
  const [editCompetencias, setEditCompetencias] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTips, setAiTips] = useState<string[]>([])
  const [cvScore, setCvScore] = useState(0)
  const [aiImproveText, setAiImproveText] = useState('')
  const [aiImproveResult, setAiImproveResult] = useState('')
  const [aiImproveLoading, setAiImproveLoading] = useState(false)
  const [aiVagaContext, setAiVagaContext] = useState('')
  const [aiError, setAiError] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login/'); return }

    const { data: user } = await supabase.from('users').select('*').eq('email', session.user.email).single()
    if (!user || user.role !== 'candidato') { router.push('/'); return }

    setUserId(user.id)
    setUserName(user.nome || 'Candidato')
    setEditNome(user.nome || '')

    // Subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('data_inicio', { ascending: false })
      .limit(1)
      .single()

    if (sub) {
      const endDate = new Date(sub.data_fim)
      const now = new Date()
      const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      setDaysRemaining(days > 0 ? days : 0)
      setSubPlano(sub.plano || 'trial')
      if (days <= 0 && sub.status !== 'ativa') {
        setShowExpiredModal(true)
      }
    }

    // Candidaturas
    const { data: candsRaw } = await supabase
      .from('candidaturas')
      .select('*')
      .eq('candidato_id', user.id)
      .order('data_candidatura', { ascending: false })

    if (candsRaw && candsRaw.length > 0) {
      const vagaIds = Array.from(new Set(candsRaw.map((c: any) => c.vaga_id)))
      const { data: vagasInfo } = await supabase.from('vagas').select('id, titulo, empresa_nome').in('id', vagaIds)
      const vagasMap: Record<string, any> = {}
      ;(vagasInfo || []).forEach((v: any) => { vagasMap[v.id] = v })
      setCandidaturas(candsRaw.map((c: any) => ({ ...c, vagas: vagasMap[c.vaga_id] || null })))
    } else {
      setCandidaturas(candsRaw || [])
    }

    // Profile
    const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    setEditTelefone(user.telefone || '')
    if (prof) {
      setProfile(prof)
      if (prof.documentos) setDocumentos(prof.documentos)
      setEditArea(prof.area || '')
      setEditLocalizacao(prof.localizacao || '')
      setEditNivel(prof.nivel_academico || '')
      setEditBio(prof.bio || '')
      setEditExperiencias(prof.experiencias || '')
      setEditCompetencias(typeof prof.competencias === 'string' ? prof.competencias : Array.isArray(prof.competencias) ? prof.competencias.join(', ') : '')
    }

    // Calculate CV score
    let score = 0
    if (user.nome) score += 20
    if (user.telefone) score += 15
    if (prof?.documentos && prof.documentos.length > 0) score += 30
    if (prof?.documentos && prof.documentos.length >= 2) score += 15
    if ((candsRaw || []).length > 0) score += 20
    setCvScore(score)

    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (documentos.length >= 2) { alert('Máximo 2 documentos'); return }

    setUploading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const file = files[0]
    const path = `${session.user.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file)

    if (!error) {
      const url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
      const newDocs = [...documentos, url]
      setDocumentos(newDocs)

      if (userId) {
        await supabase.from('profiles').upsert({
          user_id: userId,
          documentos: newDocs,
        }, { onConflict: 'user_id' })
        // Save telefone to users table
        await supabase.from('users').update({ telefone: editTelefone }).eq('id', userId)
      }
    }
    setUploading(false)
  }

  const handleSaveProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    if (!userId) return
    await supabase.from('users').update({ nome: editNome, telefone: editTelefone }).eq('id', userId)
    const { error } = await supabase.from('profiles').upsert({
      user_id: userId,
      documentos,
      area: editArea || null,
      localizacao: editLocalizacao || null,
      nivel_academico: editNivel || null,
      bio: editBio || null,
      experiencias: editExperiencias || null,
      competencias: editCompetencias || null,
    }, { onConflict: 'user_id' })
    if (error) { alert('Erro ao guardar: ' + error.message); return }
    setProfile((p: any) => ({ ...(p || {}), area: editArea, localizacao: editLocalizacao, nivel_academico: editNivel, bio: editBio, experiencias: editExperiencias, competencias: editCompetencias }))
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  const buildVagaContext = () => {
    if (!aiVagaContext.trim()) return undefined
    return { titulo: '', area: profile?.area || '', descricao: aiVagaContext.trim() }
  }

  const generateAiTips = async () => {
    setAiLoading(true)
    setAiError('')
    const { tips, error } = await getTips({
      nome: editNome,
      telefone: editTelefone,
      area: profile?.area,
      nivel_academico: profile?.nivel_academico,
      competencias: profile?.competencias,
      bio: profile?.bio,
      numDocumentos: documentos.length,
      numCandidaturas: candidaturas.length,
    }, buildVagaContext())

    if (error || tips.length === 0) {
      setAiError('A IA está temporariamente indisponível. Tenta novamente em instantes.')
    } else {
      setAiTips(tips)
    }
    setAiLoading(false)
  }

  const handleImproveText = async () => {
    if (!aiImproveText.trim()) return
    setAiImproveLoading(true)
    setAiError('')
    const { result, error } = await improveCV(aiImproveText.trim(), buildVagaContext())
    if (error || !result) {
      setAiError('A IA está temporariamente indisponível. Tenta novamente em instantes.')
    } else {
      setAiImproveResult(result)
    }
    setAiImproveLoading(false)
  }

  const notifications = candidaturas.filter(c => c.status === 'aprovada').map(c => ({
    text: `A tua candidatura a "${c.vagas?.titulo || 'vaga'}" foi aprovada`,
    vaga: c.vagas?.titulo || '',
  }))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0 lg:pl-60">
      <SubscriptionModal show={showExpiredModal} onDismiss={() => setShowExpiredModal(false)} />
      {daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
        <SubscriptionBanner daysRemaining={daysRemaining} />
      )}

      {/* Mobile Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
              <button onClick={() => setShowMenu(false)}><X size={22} className="text-ms-dark" /></button>
            </div>
            <div className="mb-6 pb-4 border-b border-ms-border">
              <p className="text-sm font-medium text-ms-dark">{userName}</p>
              <p className="text-xs text-ms-gray">Candidato</p>
            </div>
            <nav className="space-y-1">
              <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-dark bg-ms-surface" onClick={() => setShowMenu(false)}>
                <HomeIcon size={18} /> Início
              </Link>
              {[
                { key: 'home', icon: Briefcase, label: 'Painel' },
                { key: 'ia', icon: Sparkles, label: 'IA & Dicas CV' },
                { key: 'candidaturas', icon: FileText, label: 'Candidaturas' },
                { key: 'documentos', icon: Upload, label: 'Documentos' },
                { key: 'perfil', icon: User, label: 'Perfil' },
                { key: 'subscricao', icon: CreditCard, label: 'Subscrição' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <button key={item.key} onClick={() => { setActiveTab(item.key); setShowMenu(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === item.key ? 'bg-ms-purple-light text-ms-purple' : 'text-ms-gray hover:bg-ms-surface'}`}>
                    <Icon size={18} /> {item.label}
                  </button>
                )
              })}
            </nav>
            <div className="absolute bottom-8 left-6 right-6">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-red hover:bg-red-50">
                <LogOut size={18} /> Terminar Sessão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 h-screen fixed left-0 top-0 bg-white border-r border-ms-border z-40">
        <div className="p-6 border-b border-ms-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ms-blue rounded-lg flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
          </Link>
        </div>
        <div className="px-6 py-4 border-b border-ms-border">
          <p className="text-sm font-medium text-ms-dark">{userName}</p>
          <p className="text-xs text-ms-gray">Candidato</p>
        </div>
        <nav className="flex-1 py-4 px-3">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium mb-1 text-ms-dark bg-ms-surface">
            <HomeIcon size={18} /> Início
          </Link>
          {[
            { key: 'home', icon: Briefcase, label: 'Painel' },
            { key: 'ia', icon: Sparkles, label: 'IA & Dicas CV' },
            { key: 'candidaturas', icon: FileText, label: 'Candidaturas' },
            { key: 'documentos', icon: Upload, label: 'Documentos' },
            { key: 'perfil', icon: User, label: 'Perfil' },
            { key: 'subscricao', icon: CreditCard, label: 'Subscrição' },
          ].map(item => {
            const Icon = item.icon
            return (
              <button key={item.key} onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
                  activeTab === item.key ? 'bg-ms-purple-light text-ms-purple' : 'text-ms-gray hover:bg-ms-surface'
                }`}>
                <Icon size={18} /> {item.label}
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-ms-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-red hover:bg-red-50 transition-colors">
            <LogOut size={18} /> Terminar Sessão
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="px-4 pt-6 max-w-3xl mx-auto lg:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setShowMenu(true)}>
              <Menu size={22} className="text-ms-dark" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-ms-dark">Olá, {userName}!</h1>
              <p className="text-sm text-ms-gray">Bem-vindo de volta</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifs(!showNotifs)} className="w-9 h-9 bg-ms-surface rounded-full flex items-center justify-center relative">
              <Bell size={16} className="text-ms-gray" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-ms-green text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifications.length}</span>
              )}
            </button>
          </div>
        </div>

        {showNotifs && (
          <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifs(false)}>
            <div className="absolute right-4 top-20 w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-ms-border p-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-ms-dark mb-3">Notificações</h3>
              {notifications.length === 0 ? (
                <p className="text-xs text-ms-gray text-center py-4">Sem notificações novas</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map((n, i) => (
                    <button key={i} onClick={() => { setActiveTab('candidaturas'); setShowNotifs(false) }} className="w-full text-left bg-ms-surface rounded-xl p-3 hover:bg-ms-purple-light/30 transition-colors">
                      <p className="text-xs text-ms-dark">{n.text}</p>
                      <p className="text-[10px] text-ms-gray mt-1">Ver candidaturas</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <>
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-[#6C47FF] to-[#9B7BFF] rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <p className="text-xs text-white/70 mb-1">Candidaturas Enviadas</p>
              <p className="text-3xl font-bold mb-3">{candidaturas.length}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                  {subPlano === 'trial' ? 'Trial' : 'PRO'} — {daysRemaining !== null ? (
                    <span className={daysRemaining <= 7 ? 'text-amber-200' : ''}>{daysRemaining} dias restantes</span>
                  ) : '—'}
                </span>
                <Link href="/vagas/" className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Plus size={16} className="text-ms-purple" />
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
              <Link href="/vagas/" className="flex-shrink-0 bg-ms-purple text-white rounded-xl px-5 py-4 min-w-[150px]">
                <Eye size={20} className="mb-2" />
                <p className="text-sm font-medium">Ver Vagas</p>
                <p className="text-[11px] text-white/70">Explorar oportunidades</p>
              </Link>
              <button onClick={() => setActiveTab('ia')} className="flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl px-5 py-4 min-w-[150px]">
                <Sparkles size={20} className="mb-2" />
                <p className="text-sm font-medium">IA & Dicas</p>
                <p className="text-[11px] text-white/80">Melhorar o meu CV</p>
              </button>
              <button onClick={() => setActiveTab('documentos')} className="flex-shrink-0 bg-white border border-ms-purple/20 rounded-xl px-5 py-4 min-w-[150px]">
                <FileText size={20} className="text-ms-purple mb-2" />
                <p className="text-sm font-medium text-ms-dark">O meu CV</p>
                <p className="text-[11px] text-ms-gray">Actualizar CV</p>
              </button>
            </div>

            {/* Actividade Recente */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ms-dark">Actividade Recente</h3>
                <button onClick={() => setActiveTab('candidaturas')} className="text-xs text-ms-blue font-medium">Ver tudo</button>
              </div>
              {candidaturas.length === 0 ? (
                <div className="bg-ms-surface rounded-xl p-6 text-center">
                  <p className="text-sm text-ms-gray">Nenhuma candidatura ainda</p>
                  <Link href="/vagas/" className="text-sm text-ms-blue font-medium mt-2 inline-block">Explorar vagas →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {candidaturas.slice(0, 5).map((c) => (
                    <div key={c.id} className="bg-ms-surface rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-ms-border flex-shrink-0">
                        <Briefcase size={16} className="text-ms-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ms-dark truncate">{c.vagas?.titulo || 'Vaga'}</p>
                        <p className="text-xs text-ms-gray">{c.vagas?.empresa_nome || 'Empresa'}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        c.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                        c.status === 'rejeitada' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {c.status === 'aprovada' ? 'Aceite' : c.status === 'rejeitada' ? 'Rejeitado' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* IA & DICAS TAB */}
        {activeTab === 'ia' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ms-dark">IA & Dicas de CV</h2>
                <p className="text-xs text-ms-gray">Melhore o seu perfil com inteligência artificial</p>
              </div>
            </div>

            {/* CV Score */}
            <div className="bg-ms-surface rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-ms-dark">Pontuação do Perfil</p>
                <span className={`text-lg font-bold ${cvScore >= 80 ? 'text-ms-green' : cvScore >= 50 ? 'text-ms-amber' : 'text-ms-red'}`}>{cvScore}%</span>
              </div>
              <div className="w-full h-2 bg-ms-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${cvScore >= 80 ? 'bg-ms-green' : cvScore >= 50 ? 'bg-ms-amber' : 'bg-ms-red'}`}
                  style={{ width: `${cvScore}%` }}
                />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  {userName ? <CheckCircle size={14} className="text-ms-green" /> : <AlertCircle size={14} className="text-ms-red" />}
                  <span className={userName ? 'text-ms-dark' : 'text-ms-red'}>Nome completo</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {profile?.telefone ? <CheckCircle size={14} className="text-ms-green" /> : <AlertCircle size={14} className="text-ms-red" />}
                  <span className={profile?.telefone ? 'text-ms-dark' : 'text-ms-red'}>Telefone de contacto</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {documentos.length > 0 ? <CheckCircle size={14} className="text-ms-green" /> : <AlertCircle size={14} className="text-ms-red" />}
                  <span className={documentos.length > 0 ? 'text-ms-dark' : 'text-ms-red'}>CV carregado</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {documentos.length >= 2 ? <CheckCircle size={14} className="text-ms-green" /> : <AlertCircle size={14} className="text-ms-amber" />}
                  <span className={documentos.length >= 2 ? 'text-ms-dark' : 'text-ms-gray'}>Segundo documento (carta/diploma)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {candidaturas.length > 0 ? <CheckCircle size={14} className="text-ms-green" /> : <AlertCircle size={14} className="text-ms-amber" />}
                  <span className={candidaturas.length > 0 ? 'text-ms-dark' : 'text-ms-gray'}>Pelo menos 1 candidatura enviada</span>
                </div>
              </div>
            </div>

            {/* Vaga context for tailored AI */}
            <div className="bg-ms-purple-light/40 border border-ms-purple/20 rounded-2xl p-4 mb-4">
              <label className="text-xs font-semibold text-ms-dark mb-2 flex items-center gap-1">
                <Target size={14} className="text-ms-purple" /> Cole a vaga para dicas à medida (opcional)
              </label>
              <textarea
                value={aiVagaContext}
                onChange={(e) => setAiVagaContext(e.target.value)}
                placeholder="Cola aqui a descrição da vaga a que te queres candidatar. A IA adapta as dicas e o CV a ESTA vaga."
                className="input-field min-h-[64px] text-sm"
              />
            </div>

            {aiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-ms-red flex-shrink-0" />
                <p className="text-xs text-ms-red">{aiError}</p>
              </div>
            )}

            {/* Generate Tips */}
            <div className="mb-6">
              <button
                onClick={generateAiTips}
                disabled={aiLoading}
                className="w-full bg-gradient-to-r from-ms-purple to-[#9B7BFF] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Zap size={18} />
                {aiLoading ? 'A analisar com IA (Groq)...' : 'Gerar Dicas Personalizadas com IA'}
              </button>
            </div>

            {aiTips.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-semibold text-ms-dark flex items-center gap-2">
                  <Lightbulb size={16} className="text-ms-amber" /> Dicas Personalizadas
                </h3>
                {aiTips.map((tip, i) => (
                  <div key={i} className="bg-ms-surface rounded-xl p-3 flex items-start gap-3">
                    <div className="w-6 h-6 bg-ms-purple-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-ms-purple">{i + 1}</span>
                    </div>
                    <p className="text-sm text-ms-dark leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Improve Text */}
            <div className="border border-ms-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-ms-dark flex items-center gap-2 mb-3">
                <Target size={16} className="text-ms-purple" /> Melhorar Texto do CV
              </h3>
              <p className="text-xs text-ms-gray mb-3">Cole um trecho do seu CV e a IA sugere melhorias profissionais.</p>
              <textarea
                value={aiImproveText}
                onChange={(e) => setAiImproveText(e.target.value)}
                placeholder="Ex: Responsável por gestão de equipa de vendas e fiz relatórios mensais..."
                className="input-field min-h-[80px] mb-3"
              />
              <button
                onClick={handleImproveText}
                disabled={aiImproveLoading || !aiImproveText.trim()}
                className="w-full bg-ms-blue text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Sparkles size={16} />
                {aiImproveLoading ? 'A melhorar...' : 'Melhorar com IA'}
              </button>

              {aiImproveResult && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <Award size={14} /> Resultado:
                  </p>
                  <p className="text-sm text-ms-dark whitespace-pre-line leading-relaxed">{aiImproveResult}</p>
                </div>
              )}
            </div>

            {/* General Tips Section */}
            <div className="mt-6 mb-6">
              <h3 className="text-sm font-semibold text-ms-dark mb-3">Dicas Gerais para o Mercado Angolano</h3>
              <div className="space-y-2">
                {[
                  { icon: Target, tip: 'Adapte o CV a cada vaga — use palavras-chave do anúncio' },
                  { icon: Award, tip: 'Destaque formações e certificações internacionais' },
                  { icon: Lightbulb, tip: 'Inclua domínio de línguas (Português, Inglês, Francês)' },
                  { icon: Zap, tip: 'Formato PDF é o mais aceite — evite Word ou imagens' },
                  { icon: CheckCircle, tip: 'Foto profissional aumenta 40% as visualizações do perfil' },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-start gap-3 bg-ms-surface rounded-xl p-3">
                      <Icon size={16} className="text-ms-purple flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-ms-dark">{item.tip}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidaturas' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">As Minhas Candidaturas</h2>
            {candidaturas.length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <Briefcase size={32} className="text-ms-gray mx-auto mb-3" />
                <p className="text-ms-gray">Ainda não te candidataste a nenhuma vaga</p>
                <Link href="/vagas/" className="text-sm text-ms-blue font-medium mt-2 inline-block">Explorar vagas →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {candidaturas.map((c) => (
                  <div key={c.id} className="bg-ms-surface rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-ms-dark">{c.vagas?.titulo || 'Vaga'}</p>
                        <p className="text-xs text-ms-gray">{c.vagas?.empresa_nome || 'Empresa'}</p>
                        <p className="text-[11px] text-ms-gray mt-1">{new Date(c.data_candidatura).toLocaleDateString('pt-AO')}</p>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                        c.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                        c.status === 'rejeitada' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {c.status === 'aprovada' ? 'Aceite' : c.status === 'rejeitada' ? 'Rejeitado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documentos' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Os Meus Documentos</h2>
            <p className="text-sm text-ms-gray mb-4">Carregue até 2 documentos (CV, diplomas)</p>

            {documentos.map((doc, i) => {
              const fileName = doc.split('/').pop()?.replace(/^\d+-/, '') || `Documento ${i + 1}`
              return (
                <div key={i} className="bg-ms-surface rounded-xl p-3 flex items-center gap-3 mb-2">
                  <FileText size={18} className="text-ms-purple" />
                  <span className="text-sm text-ms-dark truncate flex-1">{fileName}</span>
                  <a href={doc} target="_blank" rel="noopener noreferrer" className="text-xs text-ms-blue font-medium hover:underline flex-shrink-0">
                    Abrir
                  </a>
                </div>
              )
            })}

            {documentos.length < 2 && (
              <label className="block mt-4">
                <div className="bg-ms-surface border-2 border-dashed border-ms-border rounded-xl p-6 text-center cursor-pointer hover:border-ms-blue transition-colors">
                  <Upload size={24} className="text-ms-gray mx-auto mb-2" />
                  <p className="text-sm text-ms-gray">{uploading ? 'A carregar...' : 'Clique para carregar'}</p>
                  <p className="text-xs text-ms-gray mt-1">PDF, DOC, PNG (max 5MB)</p>
                </div>
                <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.png,.jpg" />
              </label>
            )}
          </div>
        )}

        {activeTab === 'perfil' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-1">O Meu Perfil</h2>
            <p className="text-xs text-ms-gray mb-4">Um perfil completo aparece primeiro nas pesquisas dos recrutadores.</p>

            {/* Profile header preview */}
            <div className="bg-gradient-to-br from-ms-blue to-ms-purple rounded-2xl p-5 mb-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                  {(editNome || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate">{editNome || 'O teu nome'}</p>
                  <p className="text-sm text-white/80 truncate">{editArea || 'A tua área profissional'}</p>
                  {editLocalizacao && <p className="text-xs text-white/70 truncate">{editLocalizacao}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-ms-gray mb-1 block">Nome completo</label>
                  <input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ms-gray mb-1 block">Telefone</label>
                  <input value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} className="input-field" placeholder="+244 9XX XXX XXX" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-ms-gray mb-1 block">Área / Cargo (título)</label>
                  <input value={editArea} onChange={(e) => setEditArea(e.target.value)} className="input-field" placeholder="Ex: Contabilista, Engenheiro Civil" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ms-gray mb-1 block">Localização</label>
                  <input value={editLocalizacao} onChange={(e) => setEditLocalizacao(e.target.value)} className="input-field" placeholder="Ex: Luanda" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-ms-gray mb-1 block">Nível académico</label>
                <select value={editNivel} onChange={(e) => setEditNivel(e.target.value)} className="input-field">
                  <option value="">Seleccionar...</option>
                  <option value="Ensino Médio">Ensino Médio</option>
                  <option value="Técnico Médio">Técnico Médio</option>
                  <option value="Licenciatura">Licenciatura</option>
                  <option value="Mestrado">Mestrado</option>
                  <option value="Doutoramento">Doutoramento</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-ms-gray mb-1 block">Sobre mim</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="input-field min-h-[90px]" placeholder="Um resumo profissional sobre ti, os teus objectivos e o que te diferencia." />
              </div>

              <div>
                <label className="text-xs font-medium text-ms-gray mb-1 block">Experiência profissional</label>
                <textarea value={editExperiencias} onChange={(e) => setEditExperiencias(e.target.value)} className="input-field min-h-[90px]" placeholder="Ex: Contabilista na Empresa X (2020-2023) — gestão de folha salarial e relatórios fiscais." />
              </div>

              <div>
                <label className="text-xs font-medium text-ms-gray mb-1 block">Competências (separadas por vírgula)</label>
                <input value={editCompetencias} onChange={(e) => setEditCompetencias(e.target.value)} className="input-field" placeholder="Ex: Excel, Liderança, SAP, Inglês" />
                {editCompetencias.trim() && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editCompetencias.split(',').map(c => c.trim()).filter(Boolean).map((c, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 bg-ms-purple-light text-ms-purple rounded-full font-medium">{c}</span>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleSaveProfile} className="w-full bg-ms-blue text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                {profileSaved ? 'Guardado ✓' : 'Guardar Alterações'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'subscricao' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Subscrição</h2>

            <div className="bg-gradient-to-br from-[#6C47FF] to-[#9B7BFF] rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={20} />
                <p className="text-sm font-semibold">Plano {subPlano === 'trial' ? 'Trial Gratuito' : 'PRO'}</p>
              </div>
              <p className="text-3xl font-bold mb-1">{daysRemaining !== null ? daysRemaining : '—'}</p>
              <p className="text-xs text-white/70">dias restantes</p>
            </div>

            <div className="bg-ms-surface rounded-2xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-ms-dark mb-3">Dados de Pagamento</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white rounded-xl p-3">
                  <Wallet size={18} className="text-ms-purple" />
                  <div>
                    <p className="text-xs text-ms-gray">Multicaixa Express</p>
                    <p className="text-sm font-bold text-ms-dark">926 115 429</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-xl p-3">
                  <CreditCard size={18} className="text-ms-purple" />
                  <div>
                    <p className="text-xs text-ms-gray">IBAN</p>
                    <p className="text-sm font-bold text-ms-dark">0005.0000.0626.9321.1011.5</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-xl p-3">
                  <Briefcase size={18} className="text-ms-purple" />
                  <div>
                    <p className="text-xs text-ms-gray">Valor Mensal</p>
                    <p className="text-sm font-bold text-ms-dark">1.000 Kz/mês</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800">Após o pagamento, envie o comprovativo para <strong>matiasdomingos70@gmail.com</strong> com o seu email de registo. O acesso será activado em até 24h.</p>
            </div>
          </div>
        )}
      </main>

      <BottomNav active={activeTab} userRole="candidato" onTabChange={setActiveTab} />
    </div>
  )
}
