'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { Search, Bell, Briefcase, Users, Plus, Eye, TrendingUp, Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
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
  const router = useRouter()

  // Form for new vaga
  const [novaVaga, setNovaVaga] = useState({
    titulo: '', area: AREAS[0], descricao: '', requisitos: '',
    localizacao: PROVINCIAS_ANGOLA[0], salario: '', prazo: '', is_prioritaria: false,
  })

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

      const { data: candsData } = await supabase
        .from('candidaturas')
        .select('*, users:candidato_id(nome, email), vagas(titulo)')
        .in('vaga_id', (vagasData || []).map(v => v.id))
        .order('data_candidatura', { ascending: false })
      setCandidatos(candsData || [])

      // Subscription
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).order('data_inicio', { ascending: false }).limit(1).single()
      if (sub) {
        const days = Math.ceil((new Date(sub.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        setDaysRemaining(days > 0 ? days : 0)
        setSubPlano(sub.plano || 'pro')
      }
    }

    setLoading(false)
  }

  const handlePublicarVaga = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: user } = await supabase.from('users').select('id').eq('email', session.user.email).single()
    if (!user) return

    await supabase.from('vagas').insert({
      ...novaVaga,
      recrutador_id: user.id,
      empresa_nome: userName,
      status: 'em_analise',
    })

    alert('Vaga submetida para aprovação!')
    setActiveTab('home')
    loadData()
  }

  const handleCandidatoAction = async (candidaturaId: string, status: string) => {
    await supabase.from('candidaturas').update({ status }).eq('id', candidaturaId)
    loadData()
  }

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
          <p className="text-sm text-ms-gray mb-4">A tua conta de recrutador está a aguardar aprovação pelo administrador. Receberás acesso ao painel assim que for aprovada.</p>
          <Link href="/" className="text-sm text-ms-blue font-medium">← Voltar ao início</Link>
        </div>
      </div>
    )
  }

  const vagasActivas = vagas.filter(v => v.status === 'aberta').length

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
          <p className="text-sm font-medium text-ms-dark">{userName}</p>
          <p className="text-xs text-ms-gray">Recrutador</p>
        </div>
        <nav className="flex-1 py-4 px-3">
          {[
            { key: 'home', icon: Briefcase, label: 'Início' },
            { key: 'vagas', icon: Eye, label: 'Minhas Vagas' },
            { key: 'candidatos', icon: Users, label: 'Candidatos' },
            { key: 'nova_vaga', icon: Plus, label: 'Publicar Vaga' },
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
      </aside>

      <main className="px-4 pt-6 max-w-3xl mx-auto lg:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ms-dark">Olá, {userName}!</h1>
            <p className="text-sm text-ms-gray">Painel do Recrutador</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-ms-surface rounded-full flex items-center justify-center">
              <Search size={16} className="text-ms-gray" />
            </button>
            <button className="w-9 h-9 bg-ms-surface rounded-full flex items-center justify-center relative">
              <Bell size={16} className="text-ms-gray" />
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
              <button onClick={() => setActiveTab('vagas')} className="flex-shrink-0 bg-white border border-ms-border rounded-xl px-5 py-4 min-w-[150px]">
                <TrendingUp size={20} className="text-ms-gray mb-2" />
                <p className="text-sm font-medium text-ms-dark">Relatórios</p>
                <p className="text-[11px] text-ms-gray">Estatísticas</p>
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
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        v.status === 'aberta' ? 'bg-green-100 text-green-700' :
                        v.status === 'em_analise' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {v.status === 'aberta' ? 'Activa' : v.status === 'em_analise' ? 'Em análise' : 'Encerrada'}
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
            {candidatos.length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <p className="text-sm text-ms-gray">Nenhum candidato recebido</p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidatos.map(c => (
                  <div key={c.id} className="bg-ms-surface rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-ms-border flex-shrink-0">
                        <Users size={16} className="text-ms-purple" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ms-dark">{c.users?.nome || 'Candidato'}</p>
                        <p className="text-xs text-ms-gray">{c.users?.email}</p>
                        <p className="text-xs text-ms-blue mt-1">Vaga: {c.vagas?.titulo}</p>
                        {c.status === 'enviada' && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleCandidatoAction(c.id, 'aprovada')} className="text-xs px-3 py-1 rounded-lg bg-green-100 text-green-700 font-medium">Aprovar</button>
                            <button onClick={() => handleCandidatoAction(c.id, 'rejeitada')} className="text-xs px-3 py-1 rounded-lg bg-red-100 text-red-700 font-medium">Rejeitar</button>
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
              <input value={novaVaga.salario} onChange={e => setNovaVaga({...novaVaga, salario: e.target.value})} placeholder="Salário (ex: 250.000 Kz)" className="input-field" />
              <input type="date" value={novaVaga.prazo} onChange={e => setNovaVaga({...novaVaga, prazo: e.target.value})} className="input-field" />
              <textarea value={novaVaga.descricao} onChange={e => setNovaVaga({...novaVaga, descricao: e.target.value})} placeholder="Descrição da vaga" className="input-field min-h-[100px]" required />
              <textarea value={novaVaga.requisitos} onChange={e => setNovaVaga({...novaVaga, requisitos: e.target.value})} placeholder="Requisitos (um por linha)" className="input-field min-h-[80px]" />
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

      <BottomNav active="home" userRole="recrutador" />
    </div>
  )
}
