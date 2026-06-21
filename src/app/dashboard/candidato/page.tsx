'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import SubscriptionModal from '@/components/SubscriptionModal'
import { Search, Bell, Briefcase, FileText, User, Upload, ArrowRight, Clock, CheckCircle, XCircle, Plus, Eye } from 'lucide-react'

export default function CandidatoDashboard() {
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [subPlano, setSubPlano] = useState('trial')
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [candidaturas, setCandidaturas] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('home')
  const [documentos, setDocumentos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [editNome, setEditNome] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login/'); return }

    const { data: user } = await supabase.from('users').select('*').eq('email', session.user.email).single()
    if (!user || user.role !== 'candidato') { router.push('/'); return }

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
    const { data: cands } = await supabase
      .from('candidaturas')
      .select('*, vagas(titulo, empresa_nome)')
      .eq('candidato_id', user.id)
      .order('data_candidatura', { ascending: false })

    setCandidaturas(cands || [])

    // Profile
    const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (prof) {
      setProfile(prof)
      setEditTelefone(prof.telefone || '')
      if (prof.documentos) setDocumentos(prof.documentos)
    }

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
    const { error } = await supabase.storage.from('documentos').upload(path, file)

    if (!error) {
      const url = `https://gwnjigmsuqasvotsksmk.supabase.co/storage/v1/object/public/documentos/${path}`
      const newDocs = [...documentos, url]
      setDocumentos(newDocs)

      await supabase.from('profiles').upsert({
        user_id: session.user.id,
        documentos: newDocs,
        telefone: editTelefone,
      }, { onConflict: 'user_id' })
    }
    setUploading(false)
  }

  const handleSaveProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('users').update({ nome: editNome }).eq('email', session.user.email)
    await supabase.from('profiles').upsert({
      user_id: session.user.id,
      telefone: editTelefone,
      documentos,
    }, { onConflict: 'user_id' })
    alert('Perfil guardado!')
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
          {[
            { key: 'home', icon: Briefcase, label: 'Início' },
            { key: 'candidaturas', icon: FileText, label: 'Candidaturas' },
            { key: 'documentos', icon: Upload, label: 'Documentos' },
            { key: 'perfil', icon: User, label: 'Perfil' },
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

      {/* Main */}
      <main className="px-4 pt-6 max-w-3xl mx-auto lg:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ms-dark">Olá, {userName}!</h1>
            <p className="text-sm text-ms-gray">Bem-vindo de volta</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-ms-surface rounded-full flex items-center justify-center">
              <Search size={16} className="text-ms-gray" />
            </button>
            <button className="w-9 h-9 bg-ms-surface rounded-full flex items-center justify-center relative">
              <Bell size={16} className="text-ms-gray" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-ms-red rounded-full" />
            </button>
          </div>
        </div>

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
              <button onClick={() => setActiveTab('documentos')} className="flex-shrink-0 bg-white border border-ms-purple/20 rounded-xl px-5 py-4 min-w-[150px]">
                <FileText size={20} className="text-ms-purple mb-2" />
                <p className="text-sm font-medium text-ms-dark">O meu CV</p>
                <p className="text-[11px] text-ms-gray">Actualizar CV</p>
              </button>
              <button onClick={() => setActiveTab('perfil')} className="flex-shrink-0 bg-white border border-ms-border rounded-xl px-5 py-4 min-w-[150px]">
                <User size={20} className="text-ms-gray mb-2" />
                <p className="text-sm font-medium text-ms-dark">Perfil</p>
                <p className="text-[11px] text-ms-gray">Editar dados</p>
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

            {documentos.map((doc, i) => (
              <div key={i} className="bg-ms-surface rounded-xl p-3 flex items-center gap-3 mb-2">
                <FileText size={18} className="text-ms-purple" />
                <a href={doc} target="_blank" className="text-sm text-ms-blue hover:underline truncate flex-1">
                  Documento {i + 1}
                </a>
              </div>
            ))}

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
            <h2 className="text-lg font-bold text-ms-dark mb-4">O Meu Perfil</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-ms-gray mb-1 block">Nome</label>
                <input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-ms-gray mb-1 block">Telefone</label>
                <input value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} className="input-field" placeholder="+244 9XX XXX XXX" />
              </div>
              <button onClick={handleSaveProfile} className="w-full bg-ms-blue text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                Guardar Alterações
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav active="home" userRole="candidato" />
    </div>
  )
}
