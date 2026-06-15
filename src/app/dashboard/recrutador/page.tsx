'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { Briefcase, Users, TrendingUp, Eye, Plus, Star, Clock, CheckCircle, XCircle, LogOut, BarChart3, MessageSquare } from 'lucide-react'
import { AREAS, NIVEIS_ACADEMICOS, PROVINCIAS_ANGOLA } from '@/lib/types'

interface VagaData {
  id: string
  titulo: string
  area: string
  status: string
  is_prioritaria: boolean
  prazo: string
  visualizacoes: number
  created_at: string
}

interface CandidatoData {
  id: string
  status: string
  data_candidatura: string
  vaga_id: string
  users?: { nome: string; email: string }
  vagas?: { titulo: string }
}

export default function RecrutadorDashboard() {
  const [activeTab, setActiveTab] = useState<'vagas' | 'candidatos' | 'nova_vaga' | 'analytics'>('vagas')
  const [novaVaga, setNovaVaga] = useState({ titulo: '', area: '', nivel_minimo: '', localizacao: '', salario: '', prazo: '', descricao: '', experiencia_requerida: '', empresa_nome: '' })
  const [vagas, setVagas] = useState<VagaData[]>([])
  const [candidatos, setCandidatos] = useState<CandidatoData[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')
  const [vagaCandCounts, setVagaCandCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      window.location.href = '/auth/login/'
      return
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, nome, aprovado')
      .eq('email', session.user.email)
      .single()
    
    if (!user || !user.aprovado) {
      window.location.href = '/'
      return
    }

    setUserId(user.id)
    setUserName(user.nome)

    // Load vagas
    const { data: vagasData } = await supabase
      .from('vagas')
      .select('*')
      .eq('recrutador_id', user.id)
      .order('created_at', { ascending: false })
    setVagas(vagasData || [])

    // Load candidaturas for this recruiter's vagas
    const vagaIds = (vagasData || []).map(v => v.id)
    if (vagaIds.length > 0) {
      const { data: candidaturasData } = await supabase
        .from('candidaturas')
        .select('*, users:candidato_id(nome, email), vagas:vaga_id(titulo)')
        .in('vaga_id', vagaIds)
        .order('data_candidatura', { ascending: false })
      setCandidatos(candidaturasData || [])

      // Count candidaturas per vaga
      const counts: Record<string, number> = {}
      for (const c of (candidaturasData || [])) {
        counts[c.vaga_id] = (counts[c.vaga_id] || 0) + 1
      }
      setVagaCandCounts(counts)
    }

    setLoading(false)
  }

  const publicarVaga = async (isPrioritaria: boolean) => {
    if (!userId) return
    if (!novaVaga.titulo || !novaVaga.area || !novaVaga.nivel_minimo || !novaVaga.localizacao || !novaVaga.prazo || !novaVaga.descricao) {
      setPublishMsg('Preenche todos os campos obrigatórios.')
      return
    }
    setPublishing(true)
    setPublishMsg('')

    const { error } = await supabase.from('vagas').insert({
      recrutador_id: userId,
      empresa_nome: novaVaga.empresa_nome || userName,
      titulo: novaVaga.titulo,
      descricao: novaVaga.descricao,
      area: novaVaga.area,
      nivel_minimo: novaVaga.nivel_minimo,
      experiencia_requerida: novaVaga.experiencia_requerida,
      salario: novaVaga.salario,
      localizacao: novaVaga.localizacao,
      prazo: novaVaga.prazo,
      is_prioritaria: isPrioritaria,
      status: 'aberta'
    })

    if (error) {
      setPublishMsg('Erro ao publicar vaga: ' + error.message)
    } else {
      setPublishMsg(isPrioritaria ? 'Vaga prioritária publicada com sucesso!' : 'Vaga publicada com sucesso!')
      setNovaVaga({ titulo: '', area: '', nivel_minimo: '', localizacao: '', salario: '', prazo: '', descricao: '', experiencia_requerida: '', empresa_nome: '' })
      loadData()
      setTimeout(() => { setActiveTab('vagas'); setPublishMsg('') }, 2000)
    }
    setPublishing(false)
  }

  const atualizarCandidatura = async (candidaturaId: string, newStatus: string) => {
    const { error } = await supabase
      .from('candidaturas')
      .update({ status: newStatus })
      .eq('id', candidaturaId)
    if (!error) {
      setCandidatos(candidatos.map(c => c.id === candidaturaId ? { ...c, status: newStatus } : c))
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">A carregar...</p>
          </div>
        </main>
      </>
    )
  }

  const totalVisualizacoes = vagas.reduce((acc, v) => acc + (v.visualizacoes || 0), 0)

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">

            <aside className="lg:w-64 flex-shrink-0">
              <div className="card p-5 mb-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Briefcase size={28} className="text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-gray-900">{userName}</h2>
                  <p className="text-gray-500 text-sm">Recrutador Verificado</p>
                  <span className="badge-success mt-2">Conta Activa</span>
                </div>
              </div>

              <nav className="card overflow-hidden">
                {[
                  { key: 'vagas', label: 'Minhas Vagas', icon: Briefcase },
                  { key: 'candidatos', label: 'Candidatos', icon: Users, badge: candidatos.filter(c => c.status === 'enviada').length },
                  { key: 'nova_vaga', label: 'Publicar Vaga', icon: Plus },
                  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key as typeof activeTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 relative ${
                        activeTab === item.key
                          ? 'bg-blue-50 text-blue-600 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 border-transparent'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                      {item.badge && item.badge > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-k10-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
                <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 border-l-4 border-transparent">
                  <LogOut size={18} />
                  Sair
                </Link>
              </nav>
            </aside>

            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="stat-card">
                  <Briefcase size={22} className="text-blue-500 mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">{vagas.filter(v => v.status === 'aberta').length}</span>
                  <span className="text-xs text-gray-500">Vagas Activas</span>
                </div>
                <div className="stat-card">
                  <Users size={22} className="text-k10-green mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">{candidatos.length}</span>
                  <span className="text-xs text-gray-500">Candidaturas</span>
                </div>
                <div className="stat-card">
                  <Eye size={22} className="text-k10-gold mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">{totalVisualizacoes}</span>
                  <span className="text-xs text-gray-500">Visualizações</span>
                </div>
                <div className="stat-card">
                  <TrendingUp size={22} className="text-k10-accent mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">{vagas.filter(v => v.is_prioritaria).length}</span>
                  <span className="text-xs text-gray-500">Em Destaque</span>
                </div>
              </div>

              {activeTab === 'vagas' && (
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-heading font-semibold text-lg">Minhas Vagas</h2>
                    <button onClick={() => setActiveTab('nova_vaga')} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
                      <Plus size={16} /> Nova Vaga
                    </button>
                  </div>
                  {vagas.length === 0 ? (
                    <div className="p-8 text-center">
                      <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-700 mb-1">Sem vagas</h3>
                      <p className="text-gray-500 text-sm mb-4">Ainda não publicaste nenhuma vaga.</p>
                      <button onClick={() => setActiveTab('nova_vaga')} className="btn-primary text-sm">Publicar Vaga</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {vagas.map((v) => (
                        <div key={v.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900">{v.titulo}</h3>
                                {v.is_prioritaria && <Star size={14} className="text-k10-gold" fill="currentColor" />}
                              </div>
                              <p className="text-xs text-gray-500">{v.area} • Prazo: {v.prazo}</p>
                            </div>
                            <span className={v.status === 'aberta' ? 'badge-success' : 'badge-danger'}>
                              {v.status === 'aberta' ? 'Aberta' : 'Encerrada'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Users size={12} /> {vagaCandCounts[v.id] || 0} candidaturas</span>
                            <span className="flex items-center gap-1"><Eye size={12} /> {v.visualizacoes || 0} visualizações</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'candidatos' && (
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="font-heading font-semibold text-lg">Candidatos Recebidos</h2>
                  </div>
                  {candidatos.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Ainda não recebeste candidaturas.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {candidatos.map((c) => (
                        <div key={c.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-k10-accent/10 rounded-full flex items-center justify-center">
                              <span className="font-bold text-k10-accent text-sm">{((c as any).users?.nome || 'C').charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="font-medium text-sm text-gray-900">{(c as any).users?.nome || 'Candidato'}</h3>
                              <p className="text-xs text-gray-500">{(c as any).users?.email || ''} • Vaga: {(c as any).vagas?.titulo || ''}</p>
                              <p className="text-xs text-gray-400">{formatDate(c.data_candidatura)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              c.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                              c.status === 'recusada' ? 'bg-red-100 text-red-700' :
                              c.status === 'em_analise' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>{c.status}</span>
                            {c.status === 'enviada' && (
                              <div className="flex gap-1">
                                <button onClick={() => atualizarCandidatura(c.id, 'aprovada')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Aprovar">
                                  <CheckCircle size={16} />
                                </button>
                                <button onClick={() => atualizarCandidatura(c.id, 'recusada')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Recusar">
                                  <XCircle size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'nova_vaga' && (
                <div className="card p-6">
                  <h2 className="font-heading font-semibold text-lg mb-4">Publicar Nova Vaga</h2>
                  {publishMsg && (
                    <div className={`text-sm p-3 rounded-xl mb-4 ${publishMsg.includes('sucesso') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {publishMsg}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                      <input type="text" className="input-field" placeholder="Ex: Banco BAI" value={novaVaga.empresa_nome} onChange={(e) => setNovaVaga({...novaVaga, empresa_nome: e.target.value})} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título da Vaga *</label>
                      <input type="text" className="input-field" placeholder="Ex: Analista Financeiro Sénior" value={novaVaga.titulo} onChange={(e) => setNovaVaga({...novaVaga, titulo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                      <select className="input-field" value={novaVaga.area} onChange={(e) => setNovaVaga({...novaVaga, area: e.target.value})}>
                        <option value="">Seleccionar área</option>
                        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nível Mínimo *</label>
                      <select className="input-field" value={novaVaga.nivel_minimo} onChange={(e) => setNovaVaga({...novaVaga, nivel_minimo: e.target.value})}>
                        <option value="">Seleccionar nível</option>
                        {NIVEIS_ACADEMICOS.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Localização *</label>
                      <select className="input-field" value={novaVaga.localizacao} onChange={(e) => setNovaVaga({...novaVaga, localizacao: e.target.value})}>
                        <option value="">Seleccionar província</option>
                        {PROVINCIAS_ANGOLA.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salário (Kz)</label>
                      <input type="text" className="input-field" placeholder="Ex: 450.000 Kz" value={novaVaga.salario} onChange={(e) => setNovaVaga({...novaVaga, salario: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experiência Requerida</label>
                      <input type="text" className="input-field" placeholder="Ex: 3-5 anos" value={novaVaga.experiencia_requerida} onChange={(e) => setNovaVaga({...novaVaga, experiencia_requerida: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Candidatura *</label>
                      <input type="date" className="input-field" value={novaVaga.prazo} onChange={(e) => setNovaVaga({...novaVaga, prazo: e.target.value})} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da Vaga *</label>
                      <textarea className="input-field" rows={5} placeholder="Descreve a vaga, responsabilidades e requisitos..." value={novaVaga.descricao} onChange={(e) => setNovaVaga({...novaVaga, descricao: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button onClick={() => publicarVaga(false)} disabled={publishing} className="btn-primary flex items-center gap-2">
                      <Plus size={18} />
                      {publishing ? 'A publicar...' : 'Publicar Vaga'}
                    </button>
                    <button onClick={() => publicarVaga(true)} disabled={publishing} className="btn-outline flex items-center gap-2 text-sm">
                      <Star size={16} />
                      Publicar como Destaque (5.000 Kz)
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="card p-6">
                    <h2 className="font-heading font-semibold text-lg mb-4">Resumo de Performance</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-blue-600">{candidatos.length}</span>
                        <p className="text-xs text-blue-500 mt-1">Total de Candidaturas</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-green-600">{totalVisualizacoes}</span>
                        <p className="text-xs text-green-500 mt-1">Total de Visualizações</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-purple-600">{totalVisualizacoes > 0 ? ((candidatos.length / totalVisualizacoes) * 100).toFixed(1) : 0}%</span>
                        <p className="text-xs text-purple-500 mt-1">Taxa de Candidatura</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-amber-600">{candidatos.filter(c => c.status === 'aprovada').length}</span>
                        <p className="text-xs text-amber-500 mt-1">Aprovados</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-red-600">{vagas.length}</span>
                        <p className="text-xs text-red-500 mt-1">Vagas Publicadas</p>
                      </div>
                      <div className="bg-teal-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-teal-600">{vagas.filter(v => v.is_prioritaria).length}</span>
                        <p className="text-xs text-teal-500 mt-1">Vagas em Destaque</p>
                      </div>
                    </div>
                  </div>
                  {vagas.length > 0 && (
                    <div className="card p-6">
                      <h3 className="font-semibold mb-3">Candidaturas por Vaga</h3>
                      {vagas.map((v) => (
                        <div key={v.id} className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{v.titulo}</span>
                            <span className="text-gray-500">{vagaCandCounts[v.id] || 0}</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(((vagaCandCounts[v.id] || 0) / Math.max(candidatos.length, 1)) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
