'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Bell, Briefcase, Users, Plus, Eye, TrendingUp, Download, FileText, CheckCircle, XCircle, Clock, LogOut, Menu, X, Star, Filter, ChevronDown, Zap, Award, MessageSquare, HelpCircle, Trash2 } from 'lucide-react'
import { AREAS, PROVINCIAS_ANGOLA } from '@/lib/types'

export default function RecrutadorDashboard() {
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [aprovado, setAprovado] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [vagas, setVagas] = useState<any[]>([])
  const [candidatos, setCandidatos] = useState<any[]>([])
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [subPlano, setSubPlano] = useState('pro')
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [searchCandidato, setSearchCandidato] = useState('')
  const [filterVaga, setFilterVaga] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const router = useRouter()

  const NIVEIS_ACADEMICOS = ['Ensino Médio', 'Técnico Médio', 'Licenciatura', 'Mestrado', 'Doutoramento', 'Qualquer']
  const [novaVaga, setNovaVaga] = useState({
    titulo: '', area: AREAS[0], descricao: '', requisitos: '',
    localizacao: PROVINCIAS_ANGOLA[0], salario: '', prazo: '', is_prioritaria: false,
    tipo_emprego: 'formal' as string,
    nivel_minimo: 'Ensino Médio' as string,
    experiencia_requerida: '0' as string,
  })
  const [vagaPerguntas, setVagaPerguntas] = useState<string[]>([])
  const [novaPergunta, setNovaPergunta] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login/'); return }

    const { data: user } = await supabase.from('users').select('*').eq('email', session.user.email).single()
    if (!user || user.role !== 'recrutador') { router.push('/'); return }

    setUserName(user.nome || 'Recrutador')
    setAprovado(user.aprovado || false)

    if (user.aprovado) {
      const { data: vagasData } = await supabase.from('vagas').select('*').eq('recrutador_id', user.id).order('created_at', { ascending: false })
      setVagas(vagasData || [])

      const vagaIds = (vagasData || []).map(v => v.id)
      if (vagaIds.length > 0) {
        // Fetch candidaturas with simple join first
        const { data: candsData, error: candsError } = await supabase
          .from('candidaturas')
          .select('*')
          .in('vaga_id', vagaIds)
          .order('data_candidatura', { ascending: false })

        if (candsData && candsData.length > 0) {
          // Enrich with user info and profile data
          const candidatoIds = Array.from(new Set(candsData.map((c: any) => c.candidato_id)))
          const { data: usersData } = await supabase.from('users').select('id, nome, email, telefone').in('id', candidatoIds)
          const { data: profilesData } = await supabase.from('profiles').select('user_id, telefone, documentos').in('user_id', candidatoIds)

          const usersMap: Record<string, any> = {}
          ;(usersData || []).forEach((u: any) => { usersMap[u.id] = u })
          const profilesMap: Record<string, any> = {}
          ;(profilesData || []).forEach((p: any) => { profilesMap[p.user_id] = p })
          const vagasMap: Record<string, any> = {}
          ;(vagasData || []).forEach((v: any) => { vagasMap[v.id] = v })

          const enriched = candsData.map((c: any) => ({
            ...c,
            users: usersMap[c.candidato_id] || null,
            profiles: profilesMap[c.candidato_id] || null,
            vagas: vagasMap[c.vaga_id] || null,
          }))
          setCandidatos(enriched)
        } else {
          setCandidatos([])
        }
      }

      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).order('data_inicio', { ascending: false }).limit(1).single()
      if (sub) {
        const days = Math.ceil((new Date(sub.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        setDaysRemaining(days > 0 ? days : 0)
        setSubPlano(sub.plano || 'pro')
      }
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handlePublicarVaga = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single()
    if (!user) return

    const { error } = await supabase.from('vagas').insert({
      titulo: novaVaga.titulo,
      area: novaVaga.area,
      descricao: novaVaga.descricao + (novaVaga.requisitos ? '\n\nRequisitos:\n' + novaVaga.requisitos : ''),
      localizacao: novaVaga.localizacao,
      salario: novaVaga.salario,
      prazo: novaVaga.prazo,
      is_prioritaria: novaVaga.is_prioritaria,
      tipo_emprego: novaVaga.tipo_emprego,
      nivel_minimo: novaVaga.nivel_minimo,
      experiencia_requerida: novaVaga.experiencia_requerida,
      recrutador_id: user.id,
      empresa_nome: userName,
      status: 'em_analise',
      perguntas: vagaPerguntas.length > 0 ? vagaPerguntas : null,
    })

    if (error) {
      alert('Erro ao publicar vaga: ' + error.message)
      return
    }

    alert('Vaga submetida para aprovação!')
    setNovaVaga({ titulo: '', area: AREAS[0], descricao: '', requisitos: '', localizacao: PROVINCIAS_ANGOLA[0], salario: '', prazo: '', is_prioritaria: false, tipo_emprego: 'formal', nivel_minimo: 'Ensino Médio', experiencia_requerida: '0' })
    setVagaPerguntas([])
    setNovaPergunta('')
    setActiveTab('home')
    loadData()
  }

  const handleCandidatoAction = async (candidaturaId: string, status: string) => {
    await supabase.from('candidaturas').update({ status }).eq('id', candidaturaId)
    loadData()
  }

  const addPergunta = () => {
    if (novaPergunta.trim() && vagaPerguntas.length < 5) {
      setVagaPerguntas([...vagaPerguntas, novaPergunta.trim()])
      setNovaPergunta('')
    }
  }

  const removePergunta = (index: number) => {
    setVagaPerguntas(vagaPerguntas.filter((_, i) => i !== index))
  }

  // Candidate scoring
  const calcScore = (c: any) => {
    let score = 0
    if (c.profiles?.documentos?.length > 0) score += 30
    if (c.profiles?.documentos?.length >= 2) score += 10
    if (c.profiles?.telefone) score += 10
    if (c.mensagem && c.mensagem.length > 20) score += 15
    if (c.respostas && Object.keys(c.respostas).length > 0) score += 25
    if (c.users?.nome) score += 10
    return Math.min(score, 100)
  }

  const notifications = candidatos.filter(c => c.status === 'enviada').map(c => ({
    text: `${c.users?.nome || 'Candidato'} candidatou-se a "${c.vagas?.titulo}"`,
    time: 'Pendente'
  }))

  // Filtered candidates
  const filteredCandidatos = candidatos
    .filter(c => {
      if (searchCandidato) {
        const q = searchCandidato.toLowerCase()
        const matchName = c.users?.nome?.toLowerCase().includes(q)
        const matchEmail = c.users?.email?.toLowerCase().includes(q)
        if (!matchName && !matchEmail) return false
      }
      if (filterVaga !== 'all' && c.vaga_id !== filterVaga) return false
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      return true
    })
    .sort((a, b) => calcScore(b) - calcScore(a))

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!aprovado) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-ms-dark mb-2">Conta Pendente</h2>
          <p className="text-sm text-ms-gray mb-4">A tua conta de recrutador está a aguardar aprovação pelo administrador.</p>
          <button onClick={handleLogout} className="text-sm text-ms-red font-medium">Terminar Sessão</button>
          <br />
          <Link href="/" className="text-sm text-ms-blue font-medium mt-2 inline-block">← Voltar ao início</Link>
        </div>
      </div>
    )
  }

  const vagasActivas = vagas.filter(v => v.status === 'aberta').length

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0 lg:pl-60">
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
              <p className="text-xs text-ms-gray">Recrutador</p>
            </div>
            <nav className="space-y-1">
              {[
                { key: 'home', icon: Briefcase, label: 'Início' },
                { key: 'vagas', icon: Eye, label: 'Minhas Vagas' },
                { key: 'candidatos', icon: Users, label: 'Candidatos' },
                { key: 'selecao', icon: Zap, label: 'Selecção Inteligente' },
                { key: 'nova_vaga', icon: Plus, label: 'Publicar Vaga' },
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

      {/* Notifications */}
      {showNotifs && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifs(false)}>
          <div className="absolute right-4 top-16 w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-ms-border p-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-ms-dark mb-3">Notificações</h3>
            {notifications.length === 0 ? (
              <p className="text-xs text-ms-gray text-center py-4">Sem notificações</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n, i) => (
                  <div key={i} className="bg-ms-surface rounded-xl p-3">
                    <p className="text-xs text-ms-dark">{n.text}</p>
                    <p className="text-[10px] text-ms-gray mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            )}
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
          <p className="text-xs text-ms-gray">Recrutador</p>
        </div>
        <nav className="flex-1 py-4 px-3">
          {[
            { key: 'home', icon: Briefcase, label: 'Início' },
            { key: 'vagas', icon: Eye, label: 'Minhas Vagas' },
            { key: 'candidatos', icon: Users, label: 'Candidatos', badge: notifications.length },
            { key: 'selecao', icon: Zap, label: 'Selecção Inteligente' },
            { key: 'nova_vaga', icon: Plus, label: 'Publicar Vaga' },
          ].map(item => {
            const Icon = item.icon
            return (
              <button key={item.key} onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors relative ${
                  activeTab === item.key ? 'bg-ms-purple-light text-ms-purple' : 'text-ms-gray hover:bg-ms-surface'
                }`}>
                <Icon size={18} /> {item.label}
                {item.badge && item.badge > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-ms-purple text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>
                )}
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

      <main className="px-4 pt-6 max-w-3xl mx-auto lg:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setShowMenu(true)}>
              <Menu size={22} className="text-ms-dark" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-ms-dark">Olá, {userName}!</h1>
              <p className="text-sm text-ms-gray">Painel do Recrutador</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifs(!showNotifs)} className="w-9 h-9 bg-ms-surface rounded-full flex items-center justify-center relative">
              <Bell size={16} className="text-ms-gray" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-ms-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifications.length}</span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'home' && (
          <>
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-[#6C47FF] to-[#9B7BFF] rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <p className="text-xs text-white/70 mb-1">Vagas Publicadas</p>
              <p className="text-3xl font-bold mb-3">{vagasActivas}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                  {candidatos.filter(c => c.status === 'enviada').length} candidaturas pendentes
                </span>
                <button onClick={() => setActiveTab('nova_vaga')} className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Plus size={16} className="text-ms-purple" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
              <button onClick={() => setActiveTab('nova_vaga')} className="flex-shrink-0 bg-ms-purple text-white rounded-xl px-5 py-4 min-w-[150px]">
                <Plus size={20} className="mb-2" />
                <p className="text-sm font-medium">Publicar Vaga</p>
                <p className="text-[11px] text-white/70">Nova oportunidade</p>
              </button>
              <button onClick={() => setActiveTab('candidatos')} className="flex-shrink-0 bg-white border border-ms-purple/20 rounded-xl px-5 py-4 min-w-[150px]">
                <Users size={20} className="text-ms-purple mb-2" />
                <p className="text-sm font-medium text-ms-dark">Ver Candidatos</p>
                <p className="text-[11px] text-ms-gray">{candidatos.length} total</p>
              </button>
              <button onClick={() => setActiveTab('selecao')} className="flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl px-5 py-4 min-w-[150px]">
                <Zap size={20} className="mb-2" />
                <p className="text-sm font-medium">Selecção IA</p>
                <p className="text-[11px] text-white/80">Ranking automático</p>
              </button>
            </div>

            {/* Recent Candidatos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ms-dark">Candidatos Recentes</h3>
                <button onClick={() => setActiveTab('candidatos')} className="text-xs text-ms-blue font-medium">Ver todos</button>
              </div>
              {candidatos.length === 0 ? (
                <div className="bg-ms-surface rounded-xl p-6 text-center">
                  <p className="text-sm text-ms-gray">Nenhum candidato ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {candidatos.slice(0, 5).map((c) => (
                    <div key={c.id} className="bg-ms-surface rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-ms-border flex-shrink-0">
                        <Users size={16} className="text-ms-purple" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ms-dark truncate">{c.users?.nome || 'Candidato'}</p>
                        <p className="text-xs text-ms-gray truncate">{c.vagas?.titulo}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          calcScore(c) >= 70 ? 'bg-green-100 text-green-700' :
                          calcScore(c) >= 40 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>{calcScore(c)}%</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
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
          </>
        )}

        {activeTab === 'vagas' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">As Minhas Vagas</h2>
            {vagas.length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <p className="text-sm text-ms-gray">Nenhuma vaga publicada</p>
                <button onClick={() => setActiveTab('nova_vaga')} className="text-sm text-ms-blue font-medium mt-2">Publicar primeira vaga →</button>
              </div>
            ) : (
              <div className="space-y-3">
                {vagas.map(v => (
                  <div key={v.id} className="bg-ms-surface rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-ms-dark">{v.titulo}</p>
                        <p className="text-xs text-ms-gray">{v.area} • {v.localizacao}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {v.tipo_emprego && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${v.tipo_emprego === 'formal' ? 'bg-blue-100 text-blue-700' : v.tipo_emprego === 'informal' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                              {v.tipo_emprego === 'formal' ? 'Formal' : v.tipo_emprego === 'informal' ? 'Informal' : v.tipo_emprego === 'freelance' ? 'Freelance' : v.tipo_emprego === 'estagio' ? 'Estágio' : 'Temporário'}
                            </span>
                          )}
                          {v.perguntas && v.perguntas.length > 0 && (
                            <span className="text-[10px] text-ms-purple flex items-center gap-1"><MessageSquare size={10} /> {v.perguntas.length} pergunta{v.perguntas.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        v.status === 'aberta' ? 'bg-green-100 text-green-700' :
                        v.status === 'em_analise' ? 'bg-amber-100 text-amber-700' :
                        v.status === 'rejeitada' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {v.status === 'aberta' ? 'Activa' : v.status === 'em_analise' ? 'Em análise' : v.status === 'rejeitada' ? 'Rejeitada' : 'Encerrada'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'candidatos' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Candidatos</h2>

            {/* Search & Filters */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 bg-ms-surface rounded-xl px-3 py-2.5">
                <Search size={16} className="text-ms-gray flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou email..."
                  value={searchCandidato}
                  onChange={(e) => setSearchCandidato(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <select
                  value={filterVaga}
                  onChange={(e) => setFilterVaga(e.target.value)}
                  className="text-xs bg-white border border-ms-border rounded-lg px-3 py-2 text-ms-dark"
                >
                  <option value="all">Todas as vagas</option>
                  {vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs bg-white border border-ms-border rounded-lg px-3 py-2 text-ms-dark"
                >
                  <option value="all">Todos os estados</option>
                  <option value="enviada">Pendentes</option>
                  <option value="aprovada">Aprovados</option>
                  <option value="rejeitada">Rejeitados</option>
                </select>
              </div>
              <p className="text-[11px] text-ms-gray">{filteredCandidatos.length} candidato{filteredCandidatos.length !== 1 ? 's' : ''} encontrado{filteredCandidatos.length !== 1 ? 's' : ''}</p>
            </div>

            {filteredCandidatos.length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <p className="text-sm text-ms-gray">Nenhum candidato encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCandidatos.map(c => (
                  <div key={c.id} className="bg-ms-surface rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-ms-border flex-shrink-0">
                        <Users size={16} className="text-ms-purple" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ms-dark">{c.users?.nome || 'Candidato'}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            calcScore(c) >= 70 ? 'bg-green-100 text-green-700' :
                            calcScore(c) >= 40 ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{calcScore(c)}%</span>
                        </div>
                        <p className="text-xs text-ms-gray">{c.users?.email}</p>
                        {c.profiles?.telefone && <p className="text-xs text-ms-gray">Tel: {c.profiles.telefone}</p>}
                        <p className="text-xs text-ms-blue mt-1">Vaga: {c.vagas?.titulo}</p>
                        {c.mensagem && <p className="text-xs text-ms-gray mt-1 italic">&ldquo;{c.mensagem}&rdquo;</p>}

                        {/* Respostas às perguntas */}
                        {c.respostas && Object.keys(c.respostas).length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] font-semibold text-ms-purple flex items-center gap-1"><MessageSquare size={10} /> Respostas:</p>
                            {Object.entries(c.respostas).map(([q, a], i) => (
                              <div key={i} className="bg-white rounded-lg p-2">
                                <p className="text-[10px] text-ms-gray font-medium">{q}</p>
                                <p className="text-xs text-ms-dark">{String(a)}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Documents */}
                        {c.profiles?.documentos && c.profiles.documentos.length > 0 && (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {c.profiles.documentos.map((doc: string, i: number) => {
                              const fName = doc.split('/').pop()?.replace(/^\d+-/, '') || `Doc ${i + 1}`
                              return (
                                <a key={i} href={doc} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-ms-purple-light text-ms-purple font-medium hover:bg-ms-purple hover:text-white transition-colors">
                                  <Download size={12} /> {fName.length > 15 ? fName.substring(0, 12) + '...' : fName}
                                </a>
                              )
                            })}
                          </div>
                        )}

                        {c.status === 'enviada' && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleCandidatoAction(c.id, 'aprovada')} className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium">Aprovar</button>
                            <button onClick={() => handleCandidatoAction(c.id, 'rejeitada')} className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-medium">Rejeitar</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selecção Inteligente */}
        {activeTab === 'selecao' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ms-dark">Selecção Inteligente</h2>
                <p className="text-xs text-ms-gray">Ranking automático dos candidatos por compatibilidade</p>
              </div>
            </div>

            {/* How scoring works */}
            <div className="bg-ms-surface rounded-2xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-ms-dark mb-3 flex items-center gap-2"><Award size={16} className="text-ms-purple" /> Como funciona a pontuação</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'CV carregado', pts: '+30%' },
                  { label: '2 documentos', pts: '+10%' },
                  { label: 'Telefone no perfil', pts: '+10%' },
                  { label: 'Mensagem detalhada', pts: '+15%' },
                  { label: 'Respondeu perguntas', pts: '+25%' },
                  { label: 'Nome completo', pts: '+10%' },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-lg p-2 flex items-center justify-between">
                    <span className="text-[11px] text-ms-dark">{item.label}</span>
                    <span className="text-[10px] font-bold text-ms-purple">{item.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top ranked candidates per vaga */}
            {vagas.filter(v => v.status === 'aberta').map(vaga => {
              const vagaCands = candidatos
                .filter(c => c.vaga_id === vaga.id)
                .sort((a, b) => calcScore(b) - calcScore(a))

              if (vagaCands.length === 0) return null

              return (
                <div key={vaga.id} className="mb-6">
                  <h3 className="text-sm font-semibold text-ms-dark mb-3">{vaga.titulo}</h3>
                  <div className="space-y-2">
                    {vagaCands.map((c, rank) => (
                      <div key={c.id} className={`rounded-xl p-3 flex items-center gap-3 ${rank === 0 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200' : 'bg-ms-surface'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          rank === 0 ? 'bg-amber-400 text-white' :
                          rank === 1 ? 'bg-gray-300 text-white' :
                          rank === 2 ? 'bg-orange-300 text-white' :
                          'bg-ms-border text-ms-gray'
                        }`}>
                          {rank + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ms-dark truncate">
                            {c.users?.nome || 'Candidato'}
                            {rank === 0 && <Star size={12} className="inline ml-1 text-amber-500 fill-amber-500" />}
                          </p>
                          <p className="text-[11px] text-ms-gray">{c.users?.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${
                            calcScore(c) >= 70 ? 'text-green-600' :
                            calcScore(c) >= 40 ? 'text-amber-600' :
                            'text-gray-400'
                          }`}>{calcScore(c)}%</p>
                          <p className="text-[9px] text-ms-gray">compatível</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {candidatos.length === 0 && (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <Zap size={32} className="text-ms-gray mx-auto mb-3" />
                <p className="text-sm text-ms-gray">Ainda sem candidatos para analisar</p>
                <p className="text-xs text-ms-gray mt-1">Publique vagas e aguarde candidaturas</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nova_vaga' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Publicar Vaga</h2>
            <form onSubmit={handlePublicarVaga} className="space-y-4">
              <input value={novaVaga.titulo} onChange={e => setNovaVaga({...novaVaga, titulo: e.target.value})} placeholder="Título da vaga" className="input-field" required />
              <select value={novaVaga.area} onChange={e => setNovaVaga({...novaVaga, area: e.target.value})} className="input-field">
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={novaVaga.localizacao} onChange={e => setNovaVaga({...novaVaga, localizacao: e.target.value})} className="input-field">
                {PROVINCIAS_ANGOLA.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={novaVaga.nivel_minimo} onChange={e => setNovaVaga({...novaVaga, nivel_minimo: e.target.value})} className="input-field">
                {NIVEIS_ACADEMICOS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <input value={novaVaga.experiencia_requerida} onChange={e => setNovaVaga({...novaVaga, experiencia_requerida: e.target.value})} placeholder="Anos de experiência (ex: 2)" className="input-field" />
              <input value={novaVaga.salario} onChange={e => setNovaVaga({...novaVaga, salario: e.target.value})} placeholder="Salário (ex: 250.000 Kz)" className="input-field" />
              <select value={novaVaga.tipo_emprego} onChange={e => setNovaVaga({...novaVaga, tipo_emprego: e.target.value})} className="input-field">
                <option value="formal">Emprego Formal</option>
                <option value="informal">Emprego Informal</option>
                <option value="freelance">Freelance / Projecto</option>
                <option value="estagio">Estágio</option>
                <option value="temporario">Temporário</option>
              </select>
              <input type="date" value={novaVaga.prazo} onChange={e => setNovaVaga({...novaVaga, prazo: e.target.value})} className="input-field" />
              <textarea value={novaVaga.descricao} onChange={e => setNovaVaga({...novaVaga, descricao: e.target.value})} placeholder="Descrição da vaga" className="input-field min-h-[100px]" required />
              <textarea value={novaVaga.requisitos} onChange={e => setNovaVaga({...novaVaga, requisitos: e.target.value})} placeholder="Requisitos (um por linha)" className="input-field min-h-[80px]" />

              {/* Info box: dados que o candidato deve ter no perfil */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-blue-800 mb-2">Dados que o candidato deve ter no perfil:</h3>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-blue-700">
                  <span>• Nome completo</span>
                  <span>• Email</span>
                  <span>• Telefone de contacto</span>
                  <span>• CV (documento PDF)</span>
                  <span>• Área profissional</span>
                  <span>• Nível académico</span>
                </div>
                <p className="text-[10px] text-blue-600 mt-2">Estes dados facilitam a sua selecção. Candidatos com perfil completo aparecem melhor no ranking.</p>
              </div>

              {/* Custom Questions */}
              <div className="border border-ms-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-ms-dark mb-2 flex items-center gap-2">
                  <HelpCircle size={16} className="text-ms-purple" /> Perguntas para Candidatos
                </h3>
                <p className="text-xs text-ms-gray mb-3">Adicione até 5 perguntas que os candidatos devem responder ao candidatar-se.</p>

                {vagaPerguntas.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2 bg-ms-surface rounded-lg px-3 py-2">
                    <span className="text-xs text-ms-dark flex-1">{p}</span>
                    <button type="button" onClick={() => removePergunta(i)} className="text-ms-gray hover:text-ms-red">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {vagaPerguntas.length < 5 && (
                  <div className="flex gap-2">
                    <input
                      value={novaPergunta}
                      onChange={e => setNovaPergunta(e.target.value)}
                      placeholder="Ex: Quantos anos de experiência tem?"
                      className="input-field flex-1 !py-2"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPergunta() } }}
                    />
                    <button type="button" onClick={addPergunta} className="bg-ms-purple text-white text-xs px-3 rounded-lg font-medium hover:bg-purple-700">
                      Adicionar
                    </button>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={novaVaga.is_prioritaria} onChange={e => setNovaVaga({...novaVaga, is_prioritaria: e.target.checked})} className="w-4 h-4 rounded border-ms-border text-ms-blue" />
                <span className="text-sm text-ms-dark">Vaga em destaque (5.000 Kz)</span>
              </label>
              <button type="submit" className="w-full bg-ms-blue text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                Submeter Vaga
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {[
            { key: 'home', icon: Briefcase, label: 'Início' },
            { key: 'candidatos', icon: Users, label: 'Candidatos' },
            { key: 'selecao', icon: Zap, label: 'Selecção' },
            { key: 'nova_vaga', icon: Plus, label: 'Publicar' },
          ].map(item => {
            const Icon = item.icon
            return (
              <button key={item.key} onClick={() => setActiveTab(item.key)} className="flex flex-col items-center gap-0.5 py-1">
                <Icon size={22} className={activeTab === item.key ? 'text-ms-purple' : 'text-gray-400'} />
                <span className={`text-[10px] ${activeTab === item.key ? 'text-ms-purple font-medium' : 'text-gray-400'}`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
