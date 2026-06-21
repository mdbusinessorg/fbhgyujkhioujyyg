'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { Users, Briefcase, TrendingUp, Shield, CheckCircle, XCircle, Clock, Eye, CreditCard, BarChart3, Settings, LogOut, UserCheck, AlertTriangle, DollarSign, Star, Bell } from 'lucide-react'

interface Recrutador {
  id: string
  nome: string
  email: string
  telefone: string
  created_at: string
}

interface Subscricao {
  id: string
  plano: string
  valor: number
  status: string
  data_inicio: string
  data_fim: string
  user_id: string
  users?: { nome: string; email: string }
}

interface Utilizador {
  id: string
  nome: string
  email: string
  role: string
  aprovado: boolean
  created_at: string
}

interface VagaPendente {
  id: string
  titulo: string
  empresa_nome: string
  area: string
  localizacao: string
  salario: string
  is_prioritaria: boolean
  created_at: string
  recrutador_id: string
  users?: { nome: string; email: string }
}

interface Stats {
  totalUsers: number
  totalVagas: number
  totalCandidaturas: number
  totalCandidatos: number
  totalRecrutadores: number
  subsAtivas: number
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'recrutadores' | 'vagas' | 'subscricoes' | 'utilizadores' | 'config'>('overview')
  const [vagasPendentes, setVagasPendentes] = useState<VagaPendente[]>([])
  const [pendentes, setPendentes] = useState<Recrutador[]>([])
  const [subscricoes, setSubscricoes] = useState<Subscricao[]>([])
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([])
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalVagas: 0, totalCandidaturas: 0, totalCandidatos: 0, totalRecrutadores: 0, subsAtivas: 0 })
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      window.location.href = '/auth/login/'
      return
    }
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()
    if (userData?.role === 'admin') {
      setIsAdmin(true)
    } else {
      window.location.href = '/'
    }
    setAuthChecked(true)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load pending recruiters
      const { data: recrutadoresPendentes } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'recrutador')
        .eq('aprovado', false)
        .order('created_at', { ascending: false })
      setPendentes(recrutadoresPendentes || [])

      // Load all users
      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      setUtilizadores(allUsers || [])

      // Load subscriptions (join with users)
      const { data: allSubs } = await supabase
        .from('subscriptions')
        .select('*, users(nome, email)')
        .order('data_inicio', { ascending: false })
      setSubscricoes(allSubs || [])

      // Load pending vagas
      const { data: pendingVagas } = await supabase
        .from('vagas')
        .select('*, users:recrutador_id(nome, email)')
        .eq('status', 'em_analise')
        .order('created_at', { ascending: false })
      setVagasPendentes(pendingVagas || [])

      // Stats
      const candidatos = (allUsers || []).filter(u => u.role === 'candidato').length
      const recrutadores = (allUsers || []).filter(u => u.role === 'recrutador').length

      const { count: vagasCount } = await supabase
        .from('vagas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aberta')

      const { count: candidaturasCount } = await supabase
        .from('candidaturas')
        .select('*', { count: 'exact', head: true })

      const subsAtivas = (allSubs || []).filter(s => s.status === 'ativa').length

      setStats({
        totalUsers: (allUsers || []).length,
        totalVagas: vagasCount || 0,
        totalCandidaturas: candidaturasCount || 0,
        totalCandidatos: candidatos,
        totalRecrutadores: recrutadores,
        subsAtivas
      })
    } catch (err) {
      console.error('Error loading admin data:', err)
    }
    setLoading(false)
  }

  const aprovarRecrutador = async (id: string) => {
    const { error } = await supabase
      .from('users')
      .update({ aprovado: true })
      .eq('id', id)
    if (!error) {
      setPendentes(pendentes.filter(r => r.id !== id))
      setUtilizadores(utilizadores.map(u => u.id === id ? { ...u, aprovado: true } : u))
    }
  }

  const rejeitarRecrutador = async (id: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    if (!error) {
      setPendentes(pendentes.filter(r => r.id !== id))
      setUtilizadores(utilizadores.filter(u => u.id !== id))
    }
  }

  const aprovarVaga = async (id: string) => {
    const { error } = await supabase
      .from('vagas')
      .update({ status: 'aberta' })
      .eq('id', id)
    if (!error) {
      setVagasPendentes(vagasPendentes.filter(v => v.id !== id))
    }
  }

  const rejeitarVaga = async (id: string) => {
    const { error } = await supabase
      .from('vagas')
      .update({ status: 'encerrada' })
      .eq('id', id)
    if (!error) {
      setVagasPendentes(vagasPendentes.filter(v => v.id !== id))
    }
  }

  const aprovarSubscricao = async (id: string) => {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'ativa' })
      .eq('id', id)
    if (!error) {
      setSubscricoes(subscricoes.map(s => s.id === id ? { ...s, status: 'ativa' } : s))
    }
  }

  if (!authChecked || (!isAdmin && !loading)) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-k10-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">A verificar acesso...</p>
          </div>
        </main>
      </>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })
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
                  { key: 'vagas', label: 'Aprovar Vagas', icon: Briefcase, badge: vagasPendentes.length },
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
              {loading ? (
                <div className="card p-12 text-center">
                  <div className="w-8 h-8 border-2 border-k10-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">A carregar dados...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="stat-card">
                          <Users size={22} className="text-blue-500 mb-2" />
                          <span className="text-2xl font-bold text-k10-primary">{stats.totalUsers}</span>
                          <span className="text-xs text-gray-500">Total Utilizadores</span>
                        </div>
                        <div className="stat-card">
                          <Briefcase size={22} className="text-k10-green mb-2" />
                          <span className="text-2xl font-bold text-k10-primary">{stats.totalVagas}</span>
                          <span className="text-xs text-gray-500">Vagas Activas</span>
                        </div>
                        <div className="stat-card">
                          <TrendingUp size={22} className="text-k10-accent mb-2" />
                          <span className="text-2xl font-bold text-k10-primary">{stats.totalCandidaturas}</span>
                          <span className="text-xs text-gray-500">Candidaturas</span>
                        </div>
                        <div className="stat-card">
                          <DollarSign size={22} className="text-k10-gold mb-2" />
                          <span className="text-2xl font-bold text-k10-primary">{stats.subsAtivas}</span>
                          <span className="text-xs text-gray-500">Subscrições Activas</span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="card p-6">
                          <h3 className="font-heading font-semibold mb-4">Distribuição de Utilizadores</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Candidatos</span>
                                <span className="font-medium">{stats.totalCandidatos}</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.totalUsers > 0 ? (stats.totalCandidatos / stats.totalUsers * 100) : 0}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Recrutadores</span>
                                <span className="font-medium">{stats.totalRecrutadores}</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-k10-green rounded-full" style={{ width: `${stats.totalUsers > 0 ? (stats.totalRecrutadores / stats.totalUsers * 100) : 0}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Pendentes</span>
                                <span className="font-medium text-k10-accent">{pendentes.length}</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-k10-accent rounded-full" style={{ width: `${stats.totalUsers > 0 ? (pendentes.length / stats.totalUsers * 100) : 0}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="card p-6">
                          <h3 className="font-heading font-semibold mb-4">Subscrições</h3>
                          <div className="space-y-4">
                            {['trial', 'premium', 'recrutador'].map(plano => {
                              const count = subscricoes.filter(s => s.plano === plano && s.status === 'ativa').length
                              return (
                                <div key={plano}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 capitalize">{plano === 'premium' ? 'Candidato Premium' : plano === 'recrutador' ? 'Recrutador' : 'Trial Gratuito'}</span>
                                    <span className="font-medium">{count}</span>
                                  </div>
                                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${plano === 'premium' ? 'bg-k10-gold' : plano === 'recrutador' ? 'bg-purple-500' : 'bg-gray-400'}`} style={{ width: `${subscricoes.length > 0 ? (count / Math.max(subscricoes.length, 1) * 100) : 0}%` }} />
                                  </div>
                                </div>
                              )
                            })}
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
                          {vagasPendentes.length > 0 && (
                            <div className="flex items-center justify-between bg-orange-50 rounded-xl p-3">
                              <div className="flex items-center gap-2">
                                <Briefcase size={18} className="text-orange-600" />
                                <span className="text-sm text-orange-700">{vagasPendentes.length} vaga(s) aguardando aprovação</span>
                              </div>
                              <button onClick={() => setActiveTab('vagas')} className="text-sm font-medium text-orange-600 hover:underline">Ver</button>
                            </div>
                          )}
                          {subscricoes.filter(s => s.status === 'pendente').length > 0 && (
                            <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
                              <div className="flex items-center gap-2">
                                <CreditCard size={18} className="text-blue-600" />
                                <span className="text-sm text-blue-700">{subscricoes.filter(s => s.status === 'pendente').length} subscrição(ões) pendentes</span>
                              </div>
                              <button onClick={() => setActiveTab('subscricoes')} className="text-sm font-medium text-blue-600 hover:underline">Ver</button>
                            </div>
                          )}
                          {pendentes.length === 0 && vagasPendentes.length === 0 && subscricoes.filter(s => s.status === 'pendente').length === 0 && (
                            <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                              <Star size={18} className="text-green-600" />
                              <span className="text-sm text-green-700">Tudo em dia! Nenhuma acção pendente.</span>
                            </div>
                          )}
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
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Briefcase size={22} className="text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-gray-900">{r.nome}</h3>
                                    <p className="text-xs text-gray-500">{r.email}</p>
                                    <p className="text-xs text-gray-400">{r.telefone && `Tel: ${r.telefone} • `}Registado: {formatDate(r.created_at)}</p>
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
                                    onClick={() => rejeitarRecrutador(r.id)}
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

                  {activeTab === 'vagas' && (
                    <div className="card overflow-hidden">
                      <div className="p-5 border-b border-gray-100">
                        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                          <Briefcase size={22} className="text-k10-accent" />
                          Vagas Pendentes de Aprovação
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Vagas criadas por recrutadores que aguardam aprovação antes de ficarem visíveis.</p>
                      </div>

                      {vagasPendentes.length === 0 ? (
                        <div className="p-8 text-center">
                          <CheckCircle size={40} className="text-k10-green mx-auto mb-3" />
                          <h3 className="font-semibold text-gray-700 mb-1">Nenhuma vaga pendente</h3>
                          <p className="text-gray-500 text-sm">Todas as vagas foram aprovadas ou rejeitadas.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {vagasPendentes.map((v) => (
                            <div key={v.id} className="p-5 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <h3 className="font-medium text-gray-900">{v.titulo}</h3>
                                  <p className="text-sm text-gray-600">{v.empresa_nome} • {v.area}</p>
                                  <p className="text-xs text-gray-400">{v.localizacao} • {v.salario || 'Salário não definido'} • {formatDate(v.created_at)}</p>
                                  {v.users && <p className="text-xs text-blue-600 mt-1">Recrutador: {(v.users as any).nome} ({(v.users as any).email})</p>}
                                  {v.is_prioritaria && <span className="badge bg-k10-gold/10 text-k10-gold text-xs mt-1">Destaque</span>}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => aprovarVaga(v.id)}
                                    className="flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                                  >
                                    <CheckCircle size={16} />
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => rejeitarVaga(v.id)}
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
                      {subscricoes.length === 0 ? (
                        <div className="p-8 text-center">
                          <CreditCard size={40} className="text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">Ainda não há subscrições registadas.</p>
                        </div>
                      ) : (
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
                              {subscricoes.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-sm text-gray-900">{(s as any).users?.nome || 'N/A'}</p>
                                    <p className="text-xs text-gray-500">{(s as any).users?.email || ''}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`badge ${
                                      s.plano === 'premium' ? 'bg-k10-gold/10 text-k10-gold' :
                                      s.plano === 'recrutador' ? 'bg-purple-100 text-purple-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>{s.plano}</span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{s.valor.toLocaleString()} Kz</td>
                                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.data_inicio)} — {formatDate(s.data_fim)}</td>
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
                                        <button onClick={() => aprovarSubscricao(s.id)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Aprovar">
                                          <CheckCircle size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'utilizadores' && (
                    <div className="card overflow-hidden">
                      <div className="p-5 border-b border-gray-100">
                        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                          <Users size={22} className="text-blue-500" />
                          Todos os Utilizadores ({utilizadores.length})
                        </h2>
                      </div>
                      {utilizadores.length === 0 ? (
                        <div className="p-8 text-center">
                          <Users size={40} className="text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">Ainda não há utilizadores registados.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Nome</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Tipo</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Registado</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Acções</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {utilizadores.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-sm text-gray-900">{u.nome}</p>
                                    <p className="text-xs text-gray-500">{u.email}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`badge ${
                                      u.role === 'admin' ? 'bg-k10-primary/10 text-k10-primary' :
                                      u.role === 'candidato' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                    }`}>{u.role === 'candidato' ? 'Candidato' : u.role === 'recrutador' ? 'Recrutador' : 'Admin'}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={u.aprovado ? 'badge-success' : 'badge-warning'}>{u.aprovado ? 'Aprovado' : 'Pendente'}</span>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(u.created_at)}</td>
                                  <td className="px-4 py-3">
                                    {u.role !== 'admin' && (
                                      <button
                                        onClick={async () => {
                                          const newStatus = !u.aprovado
                                          const { error } = await supabase.from('users').update({ aprovado: newStatus }).eq('id', u.id)
                                          if (!error) {
                                            setUtilizadores(utilizadores.map(x => x.id === u.id ? { ...x, aprovado: newStatus } : x))
                                          }
                                        }}
                                        className={`text-xs px-3 py-1 rounded-lg font-medium ${
                                          u.aprovado
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                      >
                                        {u.aprovado ? 'Remover Acesso' : 'Dar Acesso'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
