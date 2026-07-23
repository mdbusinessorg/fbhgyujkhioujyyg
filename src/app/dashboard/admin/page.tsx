'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import BottomNav from '@/components/BottomNav'
import { DashboardOverview, type AdminData } from '@/components/dashboard'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Bell, Briefcase, Users, UserCheck, Shield, Settings, CreditCard, CheckCircle, XCircle, Eye, TrendingUp, Plus, AlertTriangle, LogOut, Menu, X, Download, Linkedin, ExternalLink, Trash2, Edit2, Wallet, Zap, Home as HomeIcon, Globe } from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [stats, setStats] = useState({ totalUsers: 0, totalVagas: 0, totalCandidaturas: 0, totalRecrutadores: 0 })
  const [pendentes, setPendentes] = useState<any[]>([])
  const [vagasPendentes, setVagasPendentes] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allVagas, setAllVagas] = useState<any[]>([])
  const [allCandidaturas, setAllCandidaturas] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [linkedinJobs, setLinkedinJobs] = useState<any[]>([])
  const [linkedinForm, setLinkedinForm] = useState({ titulo: '', descricao: '', categoria: 'Tecnologia', link: '', empresa: '', localizacao: 'Luanda' })
  const [editingLinkedinId, setEditingLinkedinId] = useState<string | null>(null)
  const [linkedinFilterCat, setLinkedinFilterCat] = useState('all')
  const [paymentRequests, setPaymentRequests] = useState<any[]>([])
  const [quickJobs, setQuickJobs] = useState<any[]>([])
  const [externalJobs, setExternalJobs] = useState<any[]>([])
  const [externalFilter, setExternalFilter] = useState('all')
  const [externalSearch, setExternalSearch] = useState('')
  const router = useRouter()

  const LINKEDIN_CATEGORIAS = ['Tecnologia', 'Finanças', 'Engenharia', 'Saúde', 'Marketing', 'Direito', 'Petróleo & Gás', 'Educação', 'Administração', 'Logística', 'Hotelaria', 'Construção', 'RH', 'Design', 'Outro']

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login/'); return }

    const { data: user } = await supabase.from('users').select('*').eq('email', session.user.email).single()
    if (!user || user.role !== 'admin') { router.push('/'); return }

    const { data: users } = await supabase.from('users').select('*')
    const { data: vagas } = await supabase.from('vagas').select('*')
    const { data: cands } = await supabase.from('candidaturas').select('*')

    const vagasMap: Record<string, any> = {}
    ;(vagas || []).forEach((v: any) => { vagasMap[v.id] = v })
    const usersMap: Record<string, any> = {}
    ;(users || []).forEach((u: any) => { usersMap[u.id] = u })

    setAllVagas(vagas || [])
    setAllCandidaturas((cands || []).map((c: any) => ({ ...c, vagas: vagasMap[c.vaga_id] || null, users: usersMap[c.candidato_id] || null })))

    const { data: subsRaw } = await supabase.from('subscriptions').select('*')
    const { data: ljobs } = await supabase.from('linkedin_jobs').select('*').order('created_at', { ascending: false })
    const { data: payReqs } = await supabase.from('payment_requests').select('*').order('created_at', { ascending: false })
    const { data: qjobs } = await supabase.from('quick_jobs').select('*').order('created_at', { ascending: false })

    // External scraped jobs
    try {
      const extRes = await fetch('/external-jobs.json')
      const extData = extRes.ok ? await extRes.json() : { jobs: [] }
      setExternalJobs(extData.jobs || [])
    } catch {
      setExternalJobs([])
    }

    // Enrich payment requests
    const enrichedPayReqs = (payReqs || []).map((p: any) => {
      const u = (users || []).find((u: any) => u.id === p.user_id)
      return { ...p, user: u ? { nome: u.nome, email: u.email } : null }
    })
    setPaymentRequests(enrichedPayReqs)
    setQuickJobs(qjobs || [])

    setAllUsers(users || [])
    // Enrich subscriptions with user data
    const usersArr = users || []
    const subs = (subsRaw || []).map((s: any) => {
      const u = usersArr.find((u: any) => u.id === s.user_id)
      return { ...s, users: u ? { nome: u.nome, email: u.email } : null }
    })
    setSubscriptions(subs)
    setLinkedinJobs(ljobs || [])
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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

  const approvePayment = async (req: any) => {
    const planName = (req.plan || req.plano || '').toString().toLowerCase()
    const isQuickJob = planName === 'trabalho_rapido' || planName.includes('trabalho') || planName.includes('rapido')
    const reviewedAt = new Date().toISOString()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (isQuickJob ? 30 : 3))
    const expiresIso = expiresAt.toISOString()

    await supabase.from('payment_requests').update({
      status: 'approved',
      reviewed_at: reviewedAt,
      premium_expires_at: expiresIso,
    }).eq('id', req.id)

    if (isQuickJob) {
      // Cria subscrição mensal (fallback: premium_expires_at fica no payment_request)
      const { error: subError } = await supabase.from('subscriptions').insert({
        user_id: req.user_id,
        plano: 'trabalho_rapido',
        valor: req.amount || 1000,
        status: 'ativa',
        data_fim: expiresIso,
      })
      if (subError) console.error('Erro ao criar subscrição trabalho_rapido:', subError)
    } else {
      await supabase.from('users').update({ premium: true }).eq('id', req.user_id)
    }
    loadData()
  }

  const rejectPayment = async (reqId: string) => {
    const motivo = prompt('Motivo da rejeição (opcional):')
    await supabase.from('payment_requests').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    }).eq('id', reqId)
    loadData()
  }

  const deleteQuickJob = async (id: string) => {
    if (!confirm('Remover este trabalho rápido?')) return
    await supabase.from('quick_jobs').delete().eq('id', id)
    loadData()
  }

  const handleLinkedinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkedinForm.titulo || !linkedinForm.link) { alert('Título e link são obrigatórios'); return }

    if (editingLinkedinId) {
      const { error } = await supabase.from('linkedin_jobs').update(linkedinForm).eq('id', editingLinkedinId)
      if (error) { alert('Erro: ' + error.message); return }
      setEditingLinkedinId(null)
    } else {
      const { error } = await supabase.from('linkedin_jobs').insert(linkedinForm)
      if (error) { alert('Erro ao adicionar: ' + error.message); return }
    }

    setLinkedinForm({ titulo: '', descricao: '', categoria: 'Tecnologia', link: '', empresa: '', localizacao: 'Luanda' })
    loadData()
  }

  const editLinkedinJob = (job: any) => {
    setLinkedinForm({ titulo: job.titulo, descricao: job.descricao || '', categoria: job.categoria, link: job.link, empresa: job.empresa || '', localizacao: job.localizacao || '' })
    setEditingLinkedinId(job.id)
  }

  const deleteLinkedinJob = async (id: string) => {
    if (!confirm('Apagar esta vaga LinkedIn?')) return
    await supabase.from('linkedin_jobs').delete().eq('id', id)
    loadData()
  }

  const notifications = [
    ...pendentes.map(u => ({ type: 'recrutador', tab: 'recrutadores', text: `${u.nome || u.email} quer ser recrutador`, time: 'Pendente' })),
    ...vagasPendentes.map(v => ({ type: 'vaga', tab: 'vagas', text: `Vaga "${v.titulo}" aguarda aprovação`, time: 'Pendente' })),
    ...paymentRequests.filter(p => p.status === 'pending').map(p => ({ type: 'pagamento', tab: 'pagamentos', text: `Pagamento ${p.plano || 'Premium'} pendente`, time: 'Pendente' })),
  ]

  const filteredUsers = allUsers.filter(u =>
    (u.nome || '').toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F6FF] pb-20 lg:pb-0 lg:pl-60">
      {/* Mobile Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-8">
              <Logo variant="full" className="h-8 w-auto" />
              <button onClick={() => setShowMenu(false)}><X size={22} className="text-ms-dark" /></button>
            </div>
            <div className="mb-6 pb-4 border-b border-ms-border">
              <p className="text-sm font-medium text-ms-dark">Administrador</p>
              <p className="text-xs text-ms-gray">Super Admin</p>
            </div>
            <nav className="space-y-1">
              <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-dark bg-ms-surface" onClick={() => setShowMenu(false)}>
                <HomeIcon size={18} /> Início
              </Link>
              {[
                { key: 'home', icon: Shield, label: 'Painel' },
                { key: 'recrutadores', icon: UserCheck, label: 'Aprovar Recrutadores' },
                { key: 'vagas', icon: Briefcase, label: 'Aprovar Vagas' },
                { key: 'pagamentos', icon: Wallet, label: 'Pagamentos' },
                { key: 'linkedin', icon: Linkedin, label: 'LinkedIn Jobs' },
                { key: 'externas', icon: Globe, label: 'Vagas Externas' },
                { key: 'trabalho_rapido', icon: Zap, label: 'Trabalho Rápido' },
                { key: 'utilizadores', icon: Users, label: 'Utilizadores' },
                { key: 'subscricoes', icon: CreditCard, label: 'Subscrições' },
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

      {/* Notifications Panel */}
      {showNotifs && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifs(false)}>
          <div className="absolute right-4 top-16 w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-ms-border p-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-ms-dark mb-3">Notificações</h3>
            {notifications.length === 0 ? (
              <p className="text-xs text-ms-gray text-center py-4">Nenhuma notificação pendente</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n, i) => (
                  <button key={i} onClick={() => { setActiveTab(n.tab); setShowNotifs(false) }} className="w-full text-left bg-ms-surface rounded-xl p-3 hover:bg-ms-purple-light/30 transition-colors">
                    <p className="text-xs text-ms-dark">{n.text}</p>
                    <p className="text-[10px] text-ms-gray mt-1">{n.time}</p>
                  </button>
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
            <Logo iconClassName="h-8 w-8" textClassName="text-ms-blue" />
          </Link>
        </div>
        <div className="px-6 py-4 border-b border-ms-border">
          <p className="text-sm font-medium text-ms-dark">Administrador</p>
          <p className="text-xs text-ms-gray">Super Admin</p>
        </div>
        <nav className="flex-1 py-4 px-3">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium mb-1 text-ms-dark bg-ms-surface">
            <HomeIcon size={18} /> Início
          </Link>
          {[
            { key: 'home', icon: Shield, label: 'Painel' },
            { key: 'recrutadores', icon: UserCheck, label: 'Aprovar Recrutadores', badge: pendentes.length },
            { key: 'vagas', icon: Briefcase, label: 'Aprovar Vagas', badge: vagasPendentes.length },
            { key: 'pagamentos', icon: Wallet, label: 'Pagamentos', badge: paymentRequests.filter(p => p.status === 'pending').length },
            { key: 'linkedin', icon: Linkedin, label: 'LinkedIn Jobs', badge: linkedinJobs.length },
            { key: 'externas', icon: Globe, label: 'Vagas Externas', badge: externalJobs.length },
            { key: 'trabalho_rapido', icon: Zap, label: 'Trabalho Rápido', badge: 0 },
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
        <div className="p-4 border-t border-ms-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-red hover:bg-red-50 transition-colors">
            <LogOut size={18} /> Terminar Sessão
          </button>
        </div>
      </aside>

      <main className="px-4 pt-6 max-w-4xl mx-auto lg:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setShowMenu(true)}>
              <Menu size={22} className="text-ms-dark" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-ms-dark">Olá, Admin!</h1>
              <p className="text-sm text-ms-gray">Painel de Administração</p>
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
          <DashboardOverview
            role="admin"
            data={{
              users: allUsers,
              vagas: allVagas,
              candidaturas: allCandidaturas,
              subscriptions,
              paymentRequests,
              externalJobs,
              linkedinJobs,
              quickJobs,
              pendentes,
              vagasPendentes,
            } as AdminData}
            onTabChange={setActiveTab}
          />
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ms-dark truncate">{u.nome}</p>
                      <p className="text-xs text-ms-gray truncate">{u.email}</p>
                    </div>
                    <button onClick={() => aprovarRecrutador(u.id)} className="text-xs px-4 py-2 rounded-lg bg-ms-blue text-white font-medium flex-shrink-0">Aprovar</button>
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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {v.salario && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{v.salario}</span>}
                      {v.tipo_emprego && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${v.tipo_emprego === 'formal' ? 'bg-blue-100 text-blue-700' : v.tipo_emprego === 'informal' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                          {v.tipo_emprego === 'formal' ? 'Formal' : v.tipo_emprego === 'informal' ? 'Informal' : v.tipo_emprego === 'freelance' ? 'Freelance' : v.tipo_emprego === 'estagio' ? 'Estágio' : 'Temporário'}
                        </span>
                      )}
                      {v.is_prioritaria && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Destaque</span>}
                      {v.perguntas && v.perguntas.length > 0 && <span className="text-[10px] text-ms-purple">{v.perguntas.length} perguntas</span>}
                    </div>
                    {v.descricao && <p className="text-xs text-ms-gray mt-2 line-clamp-2">{v.descricao}</p>}
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
            {/* Search */}
            <div className="mb-4">
              <div className="flex items-center gap-2 bg-ms-surface rounded-xl px-4 py-2.5">
                <Search size={16} className="text-ms-gray" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray"
                />
              </div>
            </div>
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="bg-ms-surface rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-ms-border flex-shrink-0">
                    <Users size={14} className="text-ms-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ms-dark truncate">{u.nome || u.email}</p>
                    <p className="text-[11px] text-ms-gray capitalize">{u.role} {u.aprovado === false ? '• ❌ Sem acesso' : ''}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                    {u.role !== 'admin' && (
                      <>
                        <button onClick={() => sendPaymentReminder(u.email)} className="text-[10px] px-2 py-1 rounded-lg bg-ms-purple-light text-ms-purple font-medium">Lembrete</button>
                        <button onClick={() => toggleAccess(u.id, u.aprovado)} className={`text-[10px] px-2 py-1 rounded-lg font-medium ${u.aprovado !== false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.aprovado !== false ? 'Remover' : 'Dar Acesso'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'linkedin' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">LinkedIn Jobs</h2>
            <p className="text-xs text-ms-gray mb-4">Adicione vagas externas do LinkedIn. Os utilizadores serão redirecionados para o link ao clicar.</p>

            {/* Add/Edit Form */}
            <form onSubmit={handleLinkedinSubmit} className="bg-ms-surface rounded-2xl p-4 mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-ms-dark">{editingLinkedinId ? 'Editar Vaga' : 'Adicionar Nova Vaga'}</h3>
              <input value={linkedinForm.titulo} onChange={e => setLinkedinForm({...linkedinForm, titulo: e.target.value})} placeholder="Título da posição *" className="input-field" required />
              <input value={linkedinForm.empresa} onChange={e => setLinkedinForm({...linkedinForm, empresa: e.target.value})} placeholder="Nome da empresa" className="input-field" />
              <select value={linkedinForm.categoria} onChange={e => setLinkedinForm({...linkedinForm, categoria: e.target.value})} className="input-field">
                {LINKEDIN_CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={linkedinForm.localizacao} onChange={e => setLinkedinForm({...linkedinForm, localizacao: e.target.value})} placeholder="Localização" className="input-field" />
              <textarea value={linkedinForm.descricao} onChange={e => setLinkedinForm({...linkedinForm, descricao: e.target.value})} placeholder="Descrição da posição" className="input-field min-h-[80px]" />
              <input value={linkedinForm.link} onChange={e => setLinkedinForm({...linkedinForm, link: e.target.value})} placeholder="Link de candidatura (ex: https://linkedin.com/jobs/...) *" className="input-field" required />
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                  {editingLinkedinId ? 'Guardar Alterações' : 'Adicionar Vaga'}
                </button>
                {editingLinkedinId && (
                  <button type="button" onClick={() => { setEditingLinkedinId(null); setLinkedinForm({ titulo: '', descricao: '', categoria: 'Tecnologia', link: '', empresa: '', localizacao: 'Luanda' }) }} className="bg-ms-surface border border-ms-border text-sm font-medium px-6 py-2.5 rounded-xl text-ms-gray">
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* Filter by category */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              <button onClick={() => setLinkedinFilterCat('all')} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${linkedinFilterCat === 'all' ? 'bg-blue-600 text-white' : 'bg-ms-surface text-ms-gray'}`}>Todas</button>
              {LINKEDIN_CATEGORIAS.map(c => {
                const count = linkedinJobs.filter(j => j.categoria === c).length
                if (count === 0) return null
                return (
                  <button key={c} onClick={() => setLinkedinFilterCat(c)} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${linkedinFilterCat === c ? 'bg-blue-600 text-white' : 'bg-ms-surface text-ms-gray'}`}>
                    {c} ({count})
                  </button>
                )
              })}
            </div>

            {/* Jobs List */}
            {linkedinJobs.filter(j => linkedinFilterCat === 'all' || j.categoria === linkedinFilterCat).length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <Linkedin size={32} className="text-blue-300 mx-auto mb-3" />
                <p className="text-sm text-ms-gray">Nenhuma vaga LinkedIn adicionada</p>
                <p className="text-xs text-ms-gray mt-1">Use o formulário acima para adicionar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedinJobs.filter(j => linkedinFilterCat === 'all' || j.categoria === linkedinFilterCat).map(job => (
                  <div key={job.id} className="bg-white border border-ms-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ms-dark">{job.titulo}</p>
                        <p className="text-xs text-ms-gray">{job.empresa} {job.localizacao ? '• ' + job.localizacao : ''}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{job.categoria}</span>
                        </div>
                        {job.descricao && <p className="text-xs text-ms-gray mt-2 line-clamp-2">{job.descricao}</p>}
                        <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
                          <ExternalLink size={10} /> {job.link.substring(0, 50)}...
                        </a>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => editLinkedinJob(job)} className="w-8 h-8 rounded-lg bg-ms-surface flex items-center justify-center text-ms-gray hover:text-ms-blue">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteLinkedinJob(job.id)} className="w-8 h-8 rounded-lg bg-ms-surface flex items-center justify-center text-ms-gray hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pagamentos' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Pedidos de Pagamento</h2>
            <p className="text-xs text-ms-gray mb-4">{paymentRequests.filter(p => p.status === 'pending').length} pendentes</p>
            {paymentRequests.length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <p className="text-sm text-ms-gray">Nenhum pedido de pagamento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentRequests.map((req: any) => (
                  <div key={req.id} className="bg-ms-surface rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-ms-dark">{req.user?.nome || req.user?.email || 'Utilizador'}</p>
                        <p className="text-xs text-ms-gray">{req.user?.email} • {new Date(req.created_at).toLocaleDateString('pt-AO')}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ms-gray mb-2">
                      <span>Valor: <strong>{req.amount} Kz</strong></span>
                      <span>Plano: {req.plan}</span>
                      {req.transaction_reference && <span>Ref: {req.transaction_reference}</span>}
                    </div>
                    {req.proof_file_url && (
                      <a href={req.proof_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-ms-blue hover:underline mb-2 block">Ver comprovativo</a>
                    )}
                    {req.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => approvePayment(req)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"><CheckCircle size={12} /> Aprovar</button>
                        <button onClick={() => rejectPayment(req.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600"><XCircle size={12} /> Rejeitar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trabalho_rapido' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Moderação — Trabalho Rápido</h2>
            <p className="text-xs text-ms-gray mb-4">{quickJobs.length} publicações</p>
            {quickJobs.length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <p className="text-sm text-ms-gray">Nenhum trabalho rápido publicado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quickJobs.map((job: any) => (
                  <div key={job.id} className="bg-ms-surface rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">{job.categoria}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${job.status === 'aberto' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{job.status}</span>
                        </div>
                        <p className="text-sm font-medium text-ms-dark">{job.titulo}</p>
                        <p className="text-xs text-ms-gray">{job.localizacao} • {job.valor_kz} Kz/{job.tipo_pagamento} • {job.duracao_estimada}</p>
                        <p className="text-xs text-ms-gray">Tel: {job.contacto_telefone}</p>
                      </div>
                      <button onClick={() => deleteQuickJob(job.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        {activeTab === 'externas' && (
          <div>
            <h2 className="text-lg font-bold text-ms-dark mb-4">Vagas Externas</h2>
            <p className="text-xs text-ms-gray mb-4">{externalJobs.length} vagas scrappadas (AngolaEmprego e outras fontes).</p>

            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-ms-surface rounded-xl px-4 py-2.5">
                <Search size={16} className="text-ms-gray" />
                <input
                  type="text"
                  placeholder="Pesquisar título, empresa ou local..."
                  value={externalSearch}
                  onChange={(e) => setExternalSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray"
                />
              </div>
              <select value={externalFilter} onChange={(e) => setExternalFilter(e.target.value)} className="bg-ms-surface rounded-xl px-4 py-2.5 text-sm outline-none">
                <option value="all">Todas as categorias</option>
                {Array.from(new Set(externalJobs.map(j => j.category).filter(Boolean))).sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {externalJobs.filter(j => {
              const matchesSearch = (j.title + ' ' + j.company + ' ' + j.location).toLowerCase().includes(externalSearch.toLowerCase())
              const matchesFilter = externalFilter === 'all' || j.category === externalFilter
              return matchesSearch && matchesFilter
            }).length === 0 ? (
              <div className="bg-ms-surface rounded-xl p-8 text-center">
                <Globe size={32} className="text-ms-purple mx-auto mb-3" />
                <p className="text-sm text-ms-gray">Nenhuma vaga externa encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {externalJobs.filter(j => {
                  const matchesSearch = (j.title + ' ' + j.company + ' ' + j.location).toLowerCase().includes(externalSearch.toLowerCase())
                  const matchesFilter = externalFilter === 'all' || j.category === externalFilter
                  return matchesSearch && matchesFilter
                }).map(job => (
                  <div key={job.id} className="bg-white border border-ms-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ms-dark">{job.title}</p>
                        <p className="text-xs text-ms-gray">{job.company} {job.location ? '• ' + job.location : ''}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-ms-purple-light text-ms-purple font-medium">{job.category}</span>
                          {job.salary && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{job.salary}</span>}
                          {job.is_enriched && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">IA</span>}
                          {job.score >= 50 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Destaque</span>}
                          <span className="text-[10px] text-ms-gray">{new Date(job.first_seen_at || job.posted_at).toLocaleDateString('pt-AO')}</span>
                        </div>
                        {job.excerpt && <p className="text-xs text-ms-gray mt-2 line-clamp-2">{job.excerpt}</p>}
                        {job.requisitos && <p className="text-[11px] text-ms-gray mt-1"><strong>Requisitos:</strong> {job.requisitos}</p>}
                        {job.beneficios && <p className="text-[11px] text-ms-gray mt-1"><strong>Benefícios:</strong> {job.beneficios}</p>}
                      </div>
                      <a href={`/vagas/externa/?id=${job.id}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-ms-blue text-white rounded-lg flex-shrink-0">
                        Ver
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav active={activeTab} userRole="admin" onTabChange={setActiveTab} />
    </div>
  )
}
