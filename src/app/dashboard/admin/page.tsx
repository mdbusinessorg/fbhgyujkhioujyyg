'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Bell, Briefcase, Users, UserCheck, Shield, Settings, CreditCard, CheckCircle, XCircle, Eye, TrendingUp, Plus, AlertTriangle } from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [stats, setStats] = useState({ totalUsers: 0, totalVagas: 0, totalCandidaturas: 0, totalRecrutadores: 0 })
  const [pendentes, setPendentes] = useState<any[]>([])
  const [vagasPendentes, setVagasPendentes] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login/'); return }

    const { data: user } = await supabase.from('users').select('*').eq('email', session.user.email).single()
    if (!user || user.role !== 'admin') { router.push('/'); return }

    const { data: users } = await supabase.from('users').select('*')
    const { data: vagas } = await supabase.from('vagas').select('*')
    const { data: cands } = await supabase.from('candidaturas').select('*')
    const { data: subs } = await supabase.from('subscriptions').select('*, users:user_id(nome, email)')

    setAllUsers(users || [])
    setSubscriptions(subs || [])
    setPendentes((users || []).filter(u => u.role === 'recrutador' && !u.aprovado))
    setVagasPendentes((vagas || []).filter(v => v.status === 'em_analise'))

    setStats({
      totalUsers: (users || []).length,
      totalVagas: (vagas || []).filter(v => v.status === 'aberta').length,
      totalCandidaturas: (cands || []).length,
      totalRecrutadores: (users || []).filter(u => u.role === 'recrutador' && u.aprovado).length,
    })

    setLoading(false)
  }

  const aprovarRecrutador = async (userId: string) => {
    await supabase.from('users').update({ aprovado: true }).eq('id', userId)
    loadData()
  }

  const aprovarVaga = async (vagaId: string) => {
    await supabase.from('vagas').update({ status: 'aberta' }).eq('id', vagaId)
    loadData()
  }

  const rejeitarVaga = async (vagaId: string) => {
    await supabase.from('vagas').update({ status: 'rejeitada' }).eq('id', vagaId)
    loadData()
  }

  const toggleAccess = async (userId: string, currentAccess: boolean) => {
    await supabase.from('users').update({ aprovado: !currentAccess }).eq('id', userId)
    loadData()
  }

  const sendPaymentReminder = (email: string) => {
    alert(`Lembrete de pagamento enviado para ${email}:\n\nMulticaixa Express: 926 115 429\nIBAN: 0005.0000.0626.9321.1011.5\nValor: 1.000 Kz/mês`)
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
          <p className="text-sm font-medium text-ms-dark">Administrador</p>
          <p className="text-xs text-ms-gray">Super Admin</p>
        </div>
        <nav className="flex-1 py-4 px-3">
          {[
            { key: 'home', icon: Shield, label: 'Início' },
            { key: 'recrutadores', icon: UserCheck, label: 'Aprovar Recrutadores', badge: pendentes.length },
            { key: 'vagas', icon: Briefcase, label: 'Aprovar Vagas', badge: vagasPendentes.length },
            { key: 'utilizadores', icon: Users, label: 'Utilizadores' },
            { key: 'subscricoes', icon: CreditCard, label: 'Subscrições' },
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
      </aside>

      <main className="px-4 pt-6 max-w-4xl mx-auto lg:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ms-dark">Olá, Admin!</h1>
            <p className="text-sm text-ms-gray">Painel de Administração</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-ms-surface rounded-full flex items-center justify-center">
              <Search size={16} className="text-ms-gray" />
            </button>
            <button className="w-9 h-9 bg-ms-surface rounded-full flex items-center justify-center relative">
              <Bell size={16} className="text-ms-gray" />
              {(pendentes.length + vagasPendentes.length) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-ms-red rounded-full" />
              )}
            </button>
          </div>
        </div>

        {activeTab === 'home' && (
          <>
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-[#6C47FF] to-[#9B7BFF] rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <p className="text-xs text-white/70 mb-1">Utilizadores Activos</p>
              <p className="text-3xl font-bold mb-3">{stats.totalUsers}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{stats.totalVagas} vagas activas</span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{stats.totalCandidaturas} candidaturas</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-ms-purple-light rounded-xl p-4 text-center">
                <Users size={20} className="text-ms-purple mx-auto mb-1" />
                <p className="text-lg font-bold text-ms-dark">{stats.totalUsers}</p>
                <p className="text-[11px] text-ms-gray">Utilizadores</p>
              </div>
              <div className="bg-ms-purple-light rounded-xl p-4 text-center">
                <Briefcase size={20} className="text-ms-purple mx-auto mb-1" />
                <p className="text-lg font-bold text-ms-dark">{stats.totalVagas}</p>
                <p className="text-[11px] text-ms-gray">Vagas</p>
              </div>
              <div className="bg-ms-purple-light rounded-xl p-4 text-center">
                <TrendingUp size={20} className="text-ms-purple mx-auto mb-1" />
                <p className="text-lg font-bold text-ms-dark">{stats.totalCandidaturas}</p>
                <p className="text-[11px] text-ms-gray">Candidaturas</p>
              </div>
              <div className="bg-ms-purple-light rounded-xl p-4 text-center">
                <UserCheck size={20} className="text-ms-purple mx-auto mb-1" />
                <p className="text-lg font-bold text-ms-dark">{stats.totalRecrutadores}</p>
                <p className="text-[11px] text-ms-gray">Recrutadores</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
              <button onClick={() => setActiveTab('recrutadores')} className="flex-shrink-0 bg-ms-purple text-white rounded-xl px-5 py-4 min-w-[150px]">
                <UserCheck size={20} className="mb-2" />
                <p className="text-sm font-medium">Gerir Utilizadores</p>
                <p className="text-[11px] text-white/70">{pendentes.length} pendentes</p>
              </button>
              <button onClick={() => setActiveTab('vagas')} className="flex-shrink-0 bg-white border border-ms-purple/20 rounded-xl px-5 py-4 min-w-[150px]">
                <Briefcase size={20} className="text-ms-purple mb-2" />
                <p className="text-sm font-medium text-ms-dark">Aprovar Vagas</p>
                <p className="text-[11px] text-ms-gray">{vagasPendentes.length} pendentes</p>
              </button>
              <button onClick={() => setActiveTab('subscricoes')} className="flex-shrink-0 bg-white border border-ms-border rounded-xl px-5 py-4 min-w-[150px]">
                <CreditCard size={20} className="text-ms-gray mb-2" />
                <p className="text-sm font-medium text-ms-dark">Ver Relatórios</p>
                <p className="text-[11px] text-ms-gray">Subscrições</p>
              </button>
            </div>

            {/* Pending approvals */}
            {pendentes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-ms-dark mb-3">Recrutadores Pendentes</h3>
                <div className="space-y-2">
                  {pendentes.map(u => (
                    <div key={u.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                      <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ms-dark">{u.nome}</p>
                        <p className="text-xs text-ms-gray">{u.email}</p>
                      </div>
                      <button onClick={() => aprovarRecrutador(u.id)} className="text-xs px-3 py-1 rounded-lg bg-green-100 text-green-700 font-medium">Aprovar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'recrutadores' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Aprovar Recrutadores</h2>
            {pendentes.length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <CheckCircle size={32} className="text-ms-green mx-auto mb-3" />
                <p className="text-sm text-ms-gray">Todos os recrutadores estão aprovados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendentes.map(u => (
                  <div key={u.id} className="bg-ms-surface rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ms-dark">{u.nome}</p>
                      <p className="text-xs text-ms-gray">{u.email}</p>
                    </div>
                    <button onClick={() => aprovarRecrutador(u.id)} className="text-xs px-4 py-2 rounded-lg bg-ms-blue text-white font-medium">Aprovar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'vagas' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Aprovar Vagas</h2>
            {vagasPendentes.length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <CheckCircle size={32} className="text-ms-green mx-auto mb-3" />
                <p className="text-sm text-ms-gray">Nenhuma vaga pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vagasPendentes.map(v => (
                  <div key={v.id} className="bg-ms-surface rounded-xl p-4">
                    <p className="text-sm font-medium text-ms-dark">{v.titulo}</p>
                    <p className="text-xs text-ms-gray">{v.area} • {v.localizacao} • {v.empresa_nome}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => aprovarVaga(v.id)} className="text-xs px-4 py-2 rounded-lg bg-green-100 text-green-700 font-medium">Aprovar</button>
                      <button onClick={() => rejeitarVaga(v.id)} className="text-xs px-4 py-2 rounded-lg bg-red-100 text-red-700 font-medium">Rejeitar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'utilizadores' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Todos os Utilizadores</h2>
            <div className="space-y-2">
              {allUsers.map(u => (
                <div key={u.id} className="bg-ms-surface rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-ms-border flex-shrink-0">
                    <Users size={14} className="text-ms-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ms-dark truncate">{u.nome || u.email}</p>
                    <p className="text-[11px] text-ms-gray capitalize">{u.role}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {u.role === 'candidato' && (
                      <>
                        <button onClick={() => sendPaymentReminder(u.email)} className="text-[10px] px-2 py-1 rounded-lg bg-ms-purple-light text-ms-purple font-medium">Lembrete</button>
                        <button onClick={() => toggleAccess(u.id, u.aprovado)} className={`text-[10px] px-2 py-1 rounded-lg font-medium ${u.aprovado ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.aprovado ? 'Remover' : 'Dar Acesso'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subscricoes' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Subscrições</h2>
            {subscriptions.length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <p className="text-sm text-ms-gray">Nenhuma subscrição registada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subscriptions.map((s, i) => (
                  <div key={i} className="bg-ms-surface rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-ms-purple-light rounded-full flex items-center justify-center flex-shrink-0">
                      <CreditCard size={14} className="text-ms-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ms-dark truncate">{s.users?.nome || s.users?.email || '—'}</p>
                      <p className="text-[11px] text-ms-gray">Plano: {s.plano} • Até: {new Date(s.data_fim).toLocaleDateString('pt-AO')}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.status === 'ativa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {[
            { key: 'home', icon: Shield, label: 'Início' },
            { key: 'recrutadores', icon: UserCheck, label: 'Aprovar' },
            { key: 'vagas', icon: Briefcase, label: 'Vagas' },
            { key: 'utilizadores', icon: Users, label: 'Users' },
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
