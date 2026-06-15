'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { Briefcase, FileText, Bell, TrendingUp, Clock, CheckCircle, XCircle, Eye, Send, LogOut, User, Star, Settings, Upload, Download, Trash2 } from 'lucide-react'

interface Candidatura {
  id: string
  status: string
  data_candidatura: string
  vagas?: { titulo: string; empresa_nome: string }
}

interface Vaga {
  id: string
  titulo: string
  empresa_nome: string
  localizacao: string
  prazo: string
  salario: string
  is_prioritaria: boolean
}

interface Profile {
  area: string
  nivel_academico: string
  experiencias: string
  competencias: string[]
  score_completude: number
}

interface UserData {
  id: string
  nome: string
  email: string
}

const statusConfig: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  enviada: { label: 'Enviada', class: 'badge-info', icon: Send },
  em_analise: { label: 'Em Análise', class: 'badge-warning', icon: Clock },
  aprovada: { label: 'Aprovada', class: 'badge-success', icon: CheckCircle },
  recusada: { label: 'Recusada', class: 'badge-danger', icon: XCircle },
}

export default function CandidatoDashboard() {
  const [activeTab, setActiveTab] = useState<'candidaturas' | 'vagas' | 'documentos' | 'perfil'>('candidaturas')
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([])
  const [vagasRecomendadas, setVagasRecomendadas] = useState<Vaga[]>([])
  const [profile, setProfile] = useState<Profile>({ area: '', nivel_academico: '', experiencias: '', competencias: [], score_completude: 0 })
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [documents, setDocuments] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      window.location.href = '/auth/login/'
      return
    }

    // Load user data
    const { data: user } = await supabase
      .from('users')
      .select('id, nome, email')
      .eq('email', session.user.email)
      .single()
    
    if (user) {
      setUserData(user)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (profileData) {
        setProfile(profileData)
      }

      // Load candidaturas with vaga details
      const { data: candidaturasData } = await supabase
        .from('candidaturas')
        .select('*, vagas(titulo, empresa_nome)')
        .eq('candidato_id', user.id)
        .order('data_candidatura', { ascending: false })
      setCandidaturas(candidaturasData || [])

      // Load recommended jobs (latest open jobs)
      const { data: vagas } = await supabase
        .from('vagas')
        .select('*')
        .eq('status', 'aberta')
        .order('is_prioritaria', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)
      setVagasRecomendadas(vagas || [])

      // Load documents
      const { data: docs } = await supabase.storage
        .from('documentos')
        .list(`candidatos/${user.id}`, { limit: 10 })
      if (docs) {
        setDocuments(docs.map(f => f.name).filter(n => n !== '.emptyFolderPlaceholder'))
      }
    }

    setLoading(false)
  }

  const saveProfile = async () => {
    if (!userData) return
    setSaving(true)
    setSaveMsg('')

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userData.id,
        area: profile.area,
        nivel_academico: profile.nivel_academico,
        experiencias: profile.experiencias,
        competencias: profile.competencias,
        score_completude: calculateScore()
      }, { onConflict: 'user_id' })
    
    if (error) {
      setSaveMsg('Erro ao guardar. Tenta novamente.')
    } else {
      setSaveMsg('Perfil guardado com sucesso!')
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const calculateScore = () => {
    let score = 0
    if (profile.area) score += 25
    if (profile.nivel_academico) score += 25
    if (profile.experiencias) score += 25
    if (profile.competencias.length > 0) score += 25
    return score
  }

  const candidatar = async (vagaId: string) => {
    if (!userData) return
    const { error } = await supabase
      .from('candidaturas')
      .insert({ vaga_id: vagaId, candidato_id: userData.id, status: 'enviada' })
    if (!error) {
      loadData()
    }
  }

  const loadDocuments = async () => {
    if (!userData) return
    const { data } = await supabase.storage
      .from('documentos')
      .list(`candidatos/${userData.id}`, { limit: 10 })
    if (data) {
      setDocuments(data.map(f => f.name))
    }
  }

  const uploadDocument = async (file: File) => {
    if (!userData) return
    if (documents.length >= 2) {
      alert('Máximo de 2 documentos permitido. Apaga um antes de carregar outro.')
      return
    }
    setUploading(true)
    const filePath = `candidatos/${userData.id}/${file.name}`
    const { error } = await supabase.storage
      .from('documentos')
      .upload(filePath, file, { upsert: true })
    if (!error) {
      await loadDocuments()
    } else {
      alert('Erro ao carregar documento: ' + error.message)
    }
    setUploading(false)
  }

  const deleteDocument = async (fileName: string) => {
    if (!userData) return
    const filePath = `candidatos/${userData.id}/${fileName}`
    await supabase.storage.from('documentos').remove([filePath])
    await loadDocuments()
  }

  const getDocumentUrl = (fileName: string) => {
    if (!userData) return ''
    const { data } = supabase.storage.from('documentos').getPublicUrl(`candidatos/${userData.id}/${fileName}`)
    return data.publicUrl
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
            <div className="w-8 h-8 border-2 border-k10-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">A carregar...</p>
          </div>
        </main>
      </>
    )
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
                  <div className="w-16 h-16 bg-k10-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User size={28} className="text-k10-accent" />
                  </div>
                  <h2 className="font-semibold text-gray-900">{userData?.nome || 'Candidato'}</h2>
                  <p className="text-gray-500 text-sm">{profile.area || 'Sem área definida'}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Perfil</span>
                      <span>{calculateScore()}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-k10-green rounded-full" style={{ width: `${calculateScore()}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <nav className="card overflow-hidden">
                {[
                  { key: 'candidaturas', label: 'Candidaturas', icon: Briefcase },
                  { key: 'vagas', label: 'Vagas Recomendadas', icon: Star },
                  { key: 'documentos', label: 'Documentos', icon: Upload },
                  { key: 'perfil', label: 'Meu Perfil', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key as typeof activeTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                        activeTab === item.key
                          ? 'bg-k10-accent/5 text-k10-accent border-k10-accent'
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
                  <Briefcase size={22} className="text-k10-accent mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">{candidaturas.length}</span>
                  <span className="text-xs text-gray-500">Candidaturas</span>
                </div>
                <div className="stat-card">
                  <CheckCircle size={22} className="text-k10-green mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">{candidaturas.filter(c => c.status === 'aprovada').length}</span>
                  <span className="text-xs text-gray-500">Aprovadas</span>
                </div>
                <div className="stat-card">
                  <Clock size={22} className="text-k10-gold mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">{candidaturas.filter(c => c.status === 'em_analise').length}</span>
                  <span className="text-xs text-gray-500">Em Análise</span>
                </div>
                <div className="stat-card">
                  <TrendingUp size={22} className="text-blue-500 mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">{calculateScore()}%</span>
                  <span className="text-xs text-gray-500">Score perfil</span>
                </div>
              </div>

              {activeTab === 'candidaturas' && (
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="font-heading font-semibold text-lg">As Minhas Candidaturas</h2>
                  </div>
                  {candidaturas.length === 0 ? (
                    <div className="p-8 text-center">
                      <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-700 mb-1">Sem candidaturas</h3>
                      <p className="text-gray-500 text-sm mb-4">Ainda não te candidataste a nenhuma vaga. Explora as vagas recomendadas!</p>
                      <button onClick={() => setActiveTab('vagas')} className="btn-primary text-sm">Ver Vagas</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {candidaturas.map((c) => {
                        const config = statusConfig[c.status] || statusConfig.enviada
                        const StatusIcon = config.icon
                        return (
                          <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-k10-primary/5 rounded-lg flex items-center justify-center">
                                <Briefcase size={18} className="text-k10-accent" />
                              </div>
                              <div>
                                <h3 className="font-medium text-sm text-gray-900">{(c as any).vagas?.titulo || 'Vaga'}</h3>
                                <p className="text-xs text-gray-500">{(c as any).vagas?.empresa_nome || ''} • {formatDate(c.data_candidatura)}</p>
                              </div>
                            </div>
                            <span className={config.class + ' flex items-center gap-1 text-xs'}>
                              <StatusIcon size={12} />
                              {config.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'vagas' && (
                <div className="space-y-4">
                  <div className="card p-5 bg-blue-50 border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={18} className="text-blue-600" />
                      <h3 className="font-semibold text-blue-800">Vagas Disponíveis</h3>
                    </div>
                    <p className="text-blue-600 text-sm">Vagas abertas na plataforma. Vagas prioritárias aparecem primeiro.</p>
                  </div>
                  {vagasRecomendadas.length === 0 ? (
                    <div className="card p-8 text-center">
                      <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Ainda não há vagas publicadas. Volta em breve!</p>
                    </div>
                  ) : (
                    vagasRecomendadas.map((v) => (
                      <div key={v.id} className="card p-4 hover:-translate-y-0.5 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{v.titulo}</h3>
                              {v.is_prioritaria && <span className="badge bg-k10-gold/10 text-k10-gold text-xs">Destaque</span>}
                            </div>
                            <p className="text-sm text-gray-500">{v.empresa_nome} • {v.localizacao}</p>
                            <div className="flex gap-3 mt-1">
                              {v.salario && <p className="text-xs text-k10-green font-medium">{v.salario}</p>}
                              <p className="text-xs text-gray-400">Prazo: {v.prazo}</p>
                            </div>
                          </div>
                          <button onClick={() => candidatar(v.id)} className="btn-primary !py-2 !px-4 text-sm whitespace-nowrap">Candidatar-me</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'documentos' && (
                <div className="card p-6">
                  <h2 className="font-heading font-semibold text-lg mb-2">Os Meus Documentos</h2>
                  <p className="text-gray-500 text-sm mb-6">Carrega até 2 documentos (CV e diploma) para os recrutadores poderem avaliar a tua candidatura.</p>
                  
                  {documents.length < 2 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-6 hover:border-k10-accent/50 transition-colors">
                      <Upload size={32} className="text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-1">Arrasta ou seleciona ficheiro</p>
                      <p className="text-gray-400 text-xs mb-4">PDF, DOC ou imagem (máx. 5MB)</p>
                      <label className="btn-primary text-sm cursor-pointer inline-block">
                        {uploading ? 'A carregar...' : 'Selecionar Ficheiro'}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          disabled={uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadDocument(file)
                            e.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {documents.length === 0 ? (
                    <div className="text-center py-4">
                      <FileText size={40} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Nenhum documento carregado ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-k10-accent/10 rounded-lg flex items-center justify-center">
                              <FileText size={18} className="text-k10-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900">{doc}</p>
                              <p className="text-xs text-gray-400">Documento carregado</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={getDocumentUrl(doc)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-k10-accent transition-colors"
                              title="Baixar"
                            >
                              <Download size={16} />
                            </a>
                            <button
                              onClick={() => deleteDocument(doc)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              title="Apagar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'perfil' && (
                <div className="card p-6">
                  <h2 className="font-heading font-semibold text-lg mb-4">Editar Perfil</h2>
                  {saveMsg && (
                    <div className={`text-sm p-3 rounded-xl mb-4 ${saveMsg.includes('sucesso') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {saveMsg}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                      <input type="text" value={userData?.nome || ''} className="input-field" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={userData?.email || ''} className="input-field" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Área de Formação</label>
                      <select className="input-field" value={profile.area} onChange={(e) => setProfile({ ...profile, area: e.target.value })}>
                        <option value="">Seleciona a tua área</option>
                        <option value="Economia e Finanças">Economia e Finanças</option>
                        <option value="Tecnologia da Informação">Tecnologia da Informação</option>
                        <option value="Engenharia">Engenharia</option>
                        <option value="Direito">Direito</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Administração">Administração</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Educação">Educação</option>
                        <option value="Comunicação">Comunicação</option>
                        <option value="Construção Civil">Construção Civil</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nível Académico</label>
                      <select className="input-field" value={profile.nivel_academico} onChange={(e) => setProfile({ ...profile, nivel_academico: e.target.value })}>
                        <option value="">Seleciona o nível</option>
                        <option value="Ensino Médio">Ensino Médio</option>
                        <option value="Técnico Profissional">Técnico Profissional</option>
                        <option value="Licenciatura">Licenciatura</option>
                        <option value="Mestrado">Mestrado</option>
                        <option value="Doutoramento">Doutoramento</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experiências</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        value={profile.experiencias}
                        onChange={(e) => setProfile({ ...profile, experiencias: e.target.value })}
                        placeholder="Descreve as tuas experiências profissionais..."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Competências (separadas por vírgula)</label>
                      <input
                        type="text"
                        className="input-field"
                        value={profile.competencias.join(', ')}
                        onChange={(e) => setProfile({ ...profile, competencias: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="Ex: Excel, Análise Financeira, SAP, Power BI"
                      />
                    </div>
                  </div>
                  <button onClick={saveProfile} disabled={saving} className="btn-primary mt-6">
                    {saving ? 'A guardar...' : 'Guardar Alterações'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
