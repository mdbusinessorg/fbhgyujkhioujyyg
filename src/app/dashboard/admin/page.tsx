'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { Users, Briefcase, TrendingUp, Shield, CheckCircle, XCircle, Clock, Eye, CreditCard, BarChart3, Settings, LogOut, UserCheck, UserX, AlertTriangle, DollarSign, Star, Bell } from 'lucide-react'

const mockRecrutadoresPendentes = [
  { id: '1', nome: 'TechAngola Lda', email: 'rh@techangola.ao', data_registo: '12 Jun 2025', telefone: '+244 923 456 789' },
  { id: '2', nome: 'Construções ABC', email: 'admin@construcoesabc.ao', data_registo: '11 Jun 2025', telefone: '+244 912 345 678' },
  { id: '3', nome: 'Clínica Saúde Plus', email: 'contacto@saudeplus.ao', data_registo: '10 Jun 2025', telefone: '+244 945 678 901' },
]

const mockSubscricoes = [
  { id: '1', user: 'Maria Santos', email: 'maria@email.com', plano: 'Premium', valor: '1.000 Kz', status: 'ativa', data_inicio: '01 Jun 2025', data_fim: '01 Jul 2025' },
  { id: '2', user: 'Pedro Neto', email: 'pedro@email.com', plano: 'Premium', valor: '1.000 Kz', status: 'ativa', data_inicio: '05 Jun 2025', data_fim: '05 Jul 2025' },
  { id: '3', user: 'Ana Luísa', email: 'ana@email.com', plano: 'Trial', valor: '0 Kz', status: 'expirada', data_inicio: '08 Jun 2025', data_fim: '10 Jun 2025' },
  { id: '4', user: 'Banco BAI', email: 'rh@bai.ao', plano: 'Recrutador', valor: '25.000 Kz', status: 'ativa', data_inicio: '01 Mai 2025', data_fim: '01 Ago 2025' },
  { id: '5', user: 'Carlos Alberto', email: 'carlos@email.com', plano: 'Premium', valor: '1.000 Kz', status: 'pendente', data_inicio: '14 Jun 2025', data_fim: '14 Jul 2025' },
]

const mockUtilizadores = [
  { id: '1', nome: 'Maria Santos', email: 'maria@email.com', role: 'candidato', area: 'Economia e Finanças', status: 'activo', criado: '01 Jun 2025' },
  { id: '2', nome: 'Pedro Neto', email: 'pedro@email.com', role: 'candidato', area: 'Economia e Finanças', status: 'activo', criado: '05 Jun 2025' },
  { id: '3', nome: 'Banco BAI', email: 'rh@bai.ao', role: 'recrutador', area: '-', status: 'activo', criado: '15 Mai 2025' },
  { id: '4', nome: 'Ana Luísa', email: 'ana@email.com', role: 'candidato', area: 'Contabilidade', status: 'trial expirado', criado: '08 Jun 2025' },
  { id: '5', nome: 'Unitel', email: 'rh@unitel.ao', role: 'recrutador', area: '-', status: 'activo', criado: '10 Mai 2025' },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'recrutadores' | 'subscricoes' | 'utilizadores' | 'config'>('overview')
  const [pendentes, setPendentes] = useState(mockRecrutadoresPendentes)

  const aprovarRecrutador = (id: string) => {
    setPendentes(pendentes.filter((r) => r.id !== id))
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">

            <aside className="lg:w-64 flex-shrink-0">
              <div className="card p-5 mb-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-k10-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield size={28} className="text-white" />
                  </div>
                  <h2 className="font-semibold text-gray-900">Administrador</h2>
                  <p className="text-gray-500 text-xs">matiasdomingos158@gmail.com</p>
                  <span className="badge bg-k10-primary/10 text-k10-primary mt-2">Super Admin</span>
                </div>
              </div>

              <nav className="card overflow-hidden">
                {[
                  { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
                  { key: 'recrutadores', label: 'Aprovar Recrutadores', icon: UserCheck, badge: pendentes.length },
                  { key: 'subscricoes', label: 'Subscrições', icon: CreditCard },
                  { key: 'utilizadores', label: 'Utilizadores', icon: Users },
                  { key: 'config', label: 'Configurações', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key as typeof activeTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 relative ${
                        activeTab === item.key
                          ? 'bg-k10-primary/5 text-k10-primary border-k10-primary'
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

              {activeTab === 'overview' && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="stat-card">
                      <Users size={22} className="text-blue-500 mb-2" />
                      <span className="text-2xl font-bold text-k10-primary">2.156</span>
                      <span className="text-xs text-gray-500">Total Utilizadores</span>
                    </div>
                    <div className="stat-card">
                      <Briefcase size={22} className="text-k10-green mb-2" />
                      <span className="text-2xl font-bold text-k10-primary">487</span>
                      <span className="text-xs text-gray-500">Vagas Activas</span>
                    </div>
                    <div className="stat-card">
                      <TrendingUp size={22} className="text-k10-accent mb-2" />
                      <span className="text-2xl font-bold text-k10-primary">1.340</span>
                      <span className="text-xs text-gray-500">Candidaturas</span>
                    </div>
                    <div className="stat-card">
                      <DollarSign size={22} className="text-k10-gold mb-2" />
                      <span className="text-2xl font-bold text-k10-primary">892k Kz</span>
                      <span className="text-xs text-gray-500">Receita Mensal</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="card p-6">
                      <h3 className="font-heading font-semibold mb-4">Distribuição de Utilizadores</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Candidatos</span>
                            <span className="font-medium">1.890</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '87%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Recrutadores</span>
                            <span className="font-medium">156</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-k10-green rounded-full" style={{ width: '7%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Recrutadores Pendentes</span>
                            <span className="font-medium text-k10-accent">{pendentes.length}</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-k10-accent rounded-full" style={{ width: '2%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card p-6">
                      <h3 className="font-heading font-semibold mb-4">Subscrições Activas</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Candidato Premium (1.000 Kz)</span>
                            <span className="font-medium">342</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-k10-gold rounded-full" style={{ width: '65%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Recrutador Empresarial</span>
                            <span className="font-medium">89</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '17%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Trial Gratuito</span>
                            <span className="font-medium">98</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400 rounded-full" style={{ width: '18%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 bg-green-50 rounded-xl p-3">
                        <p className="text-green-700 text-sm font-medium">Receita este mês: 892.000 Kz</p>
                        <p className="text-green-600 text-xs">+12% vs mês anterior</p>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-k10-accent" />
                      Alertas e Acções Pendentes
                    </h3>
                    <div className="space-y-3">
                      {pendentes.length > 0 && (
                        <div className="flex items-center justify-between bg-yellow-50 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <UserCheck size={18} className="text-yellow-600" />
                            <span className="text-sm text-yellow-700">{pendentes.length} recrutador(es) aguardando aprovação</span>
                          </div>
                          <button onClick={() => setActiveTab('recrutadores')} className="text-sm font-medium text-yellow-600 hover:underline">Ver</button>
                        </div>
                      )}
                      <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <CreditCard size={18} className="text-blue-600" />
                          <span className="text-sm text-blue-700">5 subscrições a expirar nos próximos 3 dias</span>
                        </div>
                        <button onClick={() => setActiveTab('subscricoes')} className="text-sm font-medium text-blue-600 hover:underline">Ver</button>
                      </div>
                      <div className="flex items-center justify-between bg-green-50 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Star size={18} className="text-green-600" />
                          <span className="text-sm text-green-700">12 novas vagas prioritárias publicadas esta semana</span>
                        </div>
                        <span className="text-sm text-green-500">60.000 Kz gerados</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'recrutadores' && (
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                      <UserCheck size={22} className="text-k10-accent" />
                      Recrutadores Pendentes de Aprovação
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Aprova ou rejeita perfis de recrutadores para publicarem vagas na plataforma.</p>
                  </div>
                  
                  {pendentes.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle size={40} className="text-k10-green mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-700 mb-1">Tudo em dia!</h3>
                      <p className="text-gray-500 text-sm">Não há recrutadores pendentes de aprovação.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {pendentes.map((r) => (
                        <div key={r.id} className="p-5 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Briefcase size={22} className="text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{r.nome}</h3>
                                <p className="text-xs text-gray-500">{r.email}</p>
                                <p className="text-xs text-gray-400">Telefone: {r.telefone} • Registado: {r.data_registo}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => aprovarRecrutador(r.id)}
                                className="flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                              >
                                <CheckCircle size={16} />
                                Aprovar
                              </button>
                              <button
                                onClick={() => aprovarRecrutador(r.id)}
                                className="flex items-center gap-1 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                              >
                                <XCircle size={16} />
                                Rejeitar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'subscricoes' && (
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                      <CreditCard size={22} className="text-k10-gold" />
                      Gestão de Subscrições
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Utilizador</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Plano</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Valor</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Período</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Acções</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {mockSubscricoes.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-sm text-gray-900">{s.user}</p>
                              <p className="text-xs text-gray-500">{s.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${
                                s.plano === 'Premium' ? 'bg-k10-gold/10 text-k10-gold' :
                                s.plano === 'Recrutador' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>{s.plano}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{s.valor}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{s.data_inicio} — {s.data_fim}</td>
                            <td className="px-4 py-3">
                              <span className={
                                s.status === 'ativa' ? 'badge-success' :
                                s.status === 'expirada' ? 'badge-danger' :
                                'badge-warning'
                              }>{s.status}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {s.status === 'pendente' && (
                                  <button className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Aprovar">
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                <button className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Ver detalhes">
                                  <Eye size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'utilizadores' && (
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                      <Users size={22} className="text-blue-500" />
                      Todos os Utilizadores
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Nome</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Tipo</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Área</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Registado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {mockUtilizadores.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-sm text-gray-900">{u.nome}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${
                                u.role === 'candidato' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>{u.role === 'candidato' ? 'Candidato' : 'Recrutador'}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{u.area}</td>
                            <td className="px-4 py-3">
                              <span className={u.status === 'activo' ? 'badge-success' : 'badge-warning'}>{u.status}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{u.criado}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="space-y-4">
                  <div className="card p-6">
                    <h2 className="font-heading font-semibold text-lg mb-4">Configurações da Plataforma</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email do Administrador</label>
                        <input type="email" className="input-field" defaultValue="matiasdomingos158@gmail.com" disabled />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contacto</label>
                        <input type="text" className="input-field" defaultValue="+244 934 859 240" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço Candidato Premium (Kz)</label>
                        <input type="number" className="input-field" defaultValue="1000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço Vaga Prioritária (Kz)</label>
                        <input type="number" className="input-field" defaultValue="5000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dias de Trial Gratuito</label>
                        <input type="number" className="input-field" defaultValue="2" />
                      </div>
                    </div>
                    <button className="btn-primary mt-6">Guardar Configurações</button>
                  </div>

                  <div className="card p-6 border-l-4 border-k10-accent">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Bell size={18} className="text-k10-accent" />
                      Notificações do Admin
                    </h3>
                    <p className="text-gray-500 text-sm mb-3">Recebes notificações em matiasdomingos158@gmail.com quando:</p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2"><CheckCircle size={14} className="text-k10-green" /> Um novo recrutador se regista</li>
                      <li className="flex items-center gap-2"><CheckCircle size={14} className="text-k10-green" /> Uma subscrição é criada ou expira</li>
                      <li className="flex items-center gap-2"><CheckCircle size={14} className="text-k10-green" /> Uma vaga prioritária é publicada</li>
                      <li className="flex items-center gap-2"><CheckCircle size={14} className="text-k10-green" /> Relatório semanal de métricas</li>
                    </ul>
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
