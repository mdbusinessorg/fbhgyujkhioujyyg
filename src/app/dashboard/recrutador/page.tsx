'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Briefcase, Users, TrendingUp, Eye, Plus, Star, Clock, CheckCircle, XCircle, LogOut, FileText, BarChart3, MessageSquare, Settings } from 'lucide-react'
import { AREAS, NIVEIS_ACADEMICOS, PROVINCIAS_ANGOLA } from '@/lib/types'

const mockVagas = [
  { id: '1', titulo: 'Analista Financeiro Sénior', area: 'Economia e Finanças', status: 'aberta', candidaturas: 12, visualizacoes: 89, is_prioritaria: true, prazo: '30 Jun 2025' },
  { id: '2', titulo: 'Contador Júnior', area: 'Contabilidade e Auditoria', status: 'aberta', candidaturas: 8, visualizacoes: 45, is_prioritaria: false, prazo: '15 Jul 2025' },
  { id: '3', titulo: 'Assistente Administrativo', area: 'Administração', status: 'encerrada', candidaturas: 25, visualizacoes: 120, is_prioritaria: false, prazo: '01 Jun 2025' },
]

const mockCandidatos = [
  { id: '1', nome: 'Maria Santos', area: 'Economia e Finanças', nivel: 'Licenciatura', score: 92, vaga: 'Analista Financeiro Sénior', status: 'em_analise' },
  { id: '2', nome: 'Pedro Neto', area: 'Economia e Finanças', nivel: 'Mestrado', score: 88, vaga: 'Analista Financeiro Sénior', status: 'enviada' },
  { id: '3', nome: 'Ana Luísa', area: 'Contabilidade e Auditoria', nivel: 'Licenciatura', score: 85, vaga: 'Contador Júnior', status: 'aprovada' },
  { id: '4', nome: 'Carlos Alberto', area: 'Economia e Finanças', nivel: 'Licenciatura', score: 78, vaga: 'Analista Financeiro Sénior', status: 'enviada' },
  { id: '5', nome: 'Fernanda Costa', area: 'Administração', nivel: 'Técnico Profissional', score: 72, vaga: 'Assistente Administrativo', status: 'recusada' },
]

export default function RecrutadorDashboard() {
  const [activeTab, setActiveTab] = useState<'vagas' | 'candidatos' | 'nova_vaga' | 'analytics'>('vagas')
  const [novaVaga, setNovaVaga] = useState({ titulo: '', area: '', nivel_minimo: '', localizacao: '', salario: '', prazo: '', descricao: '', experiencia_requerida: '' })

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
                  <h2 className="font-semibold text-gray-900">Banco BAI</h2>
                  <p className="text-gray-500 text-sm">Recrutador Verificado</p>
                  <span className="badge-success mt-2">Conta Activa</span>
                </div>
              </div>

              <nav className="card overflow-hidden">
                {[
                  { key: 'vagas', label: 'Minhas Vagas', icon: Briefcase },
                  { key: 'candidatos', label: 'Candidatos', icon: Users },
                  { key: 'nova_vaga', label: 'Publicar Vaga', icon: Plus },
                  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key as typeof activeTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                        activeTab === item.key
                          ? 'bg-blue-50 text-blue-600 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 border-transparent'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
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
                  <span className="text-2xl font-bold text-k10-primary">3</span>
                  <span className="text-xs text-gray-500">Vagas Activas</span>
                </div>
                <div className="stat-card">
                  <Users size={22} className="text-k10-green mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">45</span>
                  <span className="text-xs text-gray-500">Candidaturas</span>
                </div>
                <div className="stat-card">
                  <Eye size={22} className="text-k10-gold mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">254</span>
                  <span className="text-xs text-gray-500">Visualizações</span>
                </div>
                <div className="stat-card">
                  <TrendingUp size={22} className="text-k10-accent mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">85</span>
                  <span className="text-xs text-gray-500">Score Médio</span>
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
                  <div className="divide-y divide-gray-100">
                    {mockVagas.map((v) => (
                      <div key={v.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
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
                          <span className="flex items-center gap-1"><Users size={12} /> {v.candidaturas} candidaturas</span>
                          <span className="flex items-center gap-1"><Eye size={12} /> {v.visualizacoes} visualizações</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'candidatos' && (
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="font-heading font-semibold text-lg">Candidatos Recebidos</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {mockCandidatos.map((c) => (
                      <div key={c.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-k10-accent/10 rounded-full flex items-center justify-center">
                            <span className="font-bold text-k10-accent text-sm">{c.nome.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-sm text-gray-900">{c.nome}</h3>
                            <p className="text-xs text-gray-500">{c.area} • {c.nivel} • Vaga: {c.vaga}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <span className="text-lg font-bold text-k10-primary">{c.score}</span>
                            <span className="text-xs text-gray-400 block">Score</span>
                          </div>
                          <div className="flex gap-1">
                            <button className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Aprovar">
                              <CheckCircle size={16} />
                            </button>
                            <button className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Recusar">
                              <XCircle size={16} />
                            </button>
                            <button className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Mensagem">
                              <MessageSquare size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'nova_vaga' && (
                <div className="card p-6">
                  <h2 className="font-heading font-semibold text-lg mb-4">Publicar Nova Vaga</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título da Vaga</label>
                      <input type="text" className="input-field" placeholder="Ex: Analista Financeiro Sénior" value={novaVaga.titulo} onChange={(e) => setNovaVaga({...novaVaga, titulo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                      <select className="input-field" value={novaVaga.area} onChange={(e) => setNovaVaga({...novaVaga, area: e.target.value})}>
                        <option value="">Seleccionar área</option>
                        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nível Mínimo</label>
                      <select className="input-field" value={novaVaga.nivel_minimo} onChange={(e) => setNovaVaga({...novaVaga, nivel_minimo: e.target.value})}>
                        <option value="">Seleccionar nível</option>
                        {NIVEIS_ACADEMICOS.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Candidatura</label>
                      <input type="date" className="input-field" value={novaVaga.prazo} onChange={(e) => setNovaVaga({...novaVaga, prazo: e.target.value})} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da Vaga</label>
                      <textarea className="input-field" rows={5} placeholder="Descreve a vaga, responsabilidades e requisitos..." value={novaVaga.descricao} onChange={(e) => setNovaVaga({...novaVaga, descricao: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button className="btn-primary flex items-center gap-2">
                      <Plus size={18} />
                      Publicar Vaga
                    </button>
                    <button className="btn-outline flex items-center gap-2 text-sm">
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
                        <span className="text-2xl font-bold text-blue-600">45</span>
                        <p className="text-xs text-blue-500 mt-1">Total de Candidaturas</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-green-600">254</span>
                        <p className="text-xs text-green-500 mt-1">Total de Visualizações</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-purple-600">17.7%</span>
                        <p className="text-xs text-purple-500 mt-1">Taxa de Candidatura</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-amber-600">85</span>
                        <p className="text-xs text-amber-500 mt-1">Score Médio Candidatos</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-red-600">3</span>
                        <p className="text-xs text-red-500 mt-1">Vagas Publicadas</p>
                      </div>
                      <div className="bg-teal-50 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-teal-600">1</span>
                        <p className="text-xs text-teal-500 mt-1">Vagas em Destaque</p>
                      </div>
                    </div>
                  </div>
                  <div className="card p-6">
                    <h3 className="font-semibold mb-3">Candidaturas por Vaga</h3>
                    {mockVagas.map((v) => (
                      <div key={v.id} className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{v.titulo}</span>
                          <span className="text-gray-500">{v.candidaturas}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(v.candidaturas / 25) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
