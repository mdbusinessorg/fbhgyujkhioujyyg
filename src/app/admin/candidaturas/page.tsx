'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import { Send, User, FileText, Settings, History, Upload, Save, Loader2, Eye, CheckCircle, XCircle, AlertTriangle, Mail, Search, ChevronDown, ChevronUp } from 'lucide-react'

const MATIAS_EMAIL = 'matiasdomingos158@gmail.com'

export default function AutoApplyAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'perfil' | 'cvs' | 'config' | 'historico'>('perfil')
  const [isAdmin, setIsAdmin] = useState(false)

  const [profile, setProfile] = useState<any>(null)
  const [cvs, setCvs] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [jobs, setJobs] = useState<Record<string, any>>({})
  const [logFilter, setLogFilter] = useState('all')
  const [logSearch, setLogSearch] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login/'); return }

    const { data: user } = await supabase.from('users').select('*').eq('email', session.user.email).single()
    if (!user || user.role !== 'admin') {
      router.push('/')
      return
    }
    setIsAdmin(true)

    await Promise.all([loadProfile(), loadCVs(), loadSettings(), loadLogs()])
    setLoading(false)
  }

  async function getMatiasUserId() {
    const { data } = await supabase.from('users').select('id').eq('email', MATIAS_EMAIL).single()
    return data?.id
  }

  async function loadProfile() {
    const userId = await getMatiasUserId()
    if (!userId) { setLoading(false); return }
    const { data } = await supabase.from('candidate_profile').select('*').eq('user_id', userId).maybeSingle()
    if (data) setProfile(data)
    else {
      const empty = {
        user_id: userId,
        full_name: 'Matias Domingos',
        bio_longa: '',
        formacao: '',
        certificacoes: [],
        skills: [],
        referencias: [],
      }
      const { data: inserted } = await supabase.from('candidate_profile').insert(empty).select().single()
      if (inserted) setProfile(inserted)
      else setProfile(empty)
    }
  }

  async function loadCVs() {
    const userId = await getMatiasUserId()
    if (!userId) { setCvs([]); return }
    const { data } = await supabase.from('candidate_cvs').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setCvs(data || [])
  }

  async function loadSettings() {
    const { data } = await supabase.from('auto_apply_settings').select('*').limit(1).maybeSingle()
    if (data) setSettings(data)
    else {
      const def = { ativo: true, score_minimo: 55, limite_diario: 15, email_remetente: 'suporte@mosalo.eu.cc' }
      const { data: inserted } = await supabase.from('auto_apply_settings').insert(def).select().single()
      setSettings(inserted || def)
    }
  }

  async function loadLogs() {
    const { data } = await supabase.from('job_applications_log').select('*').order('created_at', { ascending: false }).limit(200)
    setLogs(data || [])

    const ids = (data || []).map(l => l.external_job_id).filter(Boolean)
    if (ids.length === 0) return
    const { data: extJobs } = await supabase.from('external_jobs').select('id,title,company,location').in('id', ids)
    const map: Record<string, any> = {}
    ;(extJobs || []).forEach((j: any) => { map[j.id] = j })
    setJobs(map)
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    const { id, ...rest } = profile
    const userId = await getMatiasUserId()
    const payload = { ...rest, user_id: userId, updated_at: new Date().toISOString() }
    if (id) {
      await supabase.from('candidate_profile').update(payload).eq('id', id)
    } else if (userId) {
      await supabase.from('candidate_profile').insert(payload)
    }
    await loadProfile()
    setSaving(false)
    alert('Perfil guardado')
  }

  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    const { id, ...rest } = settings
    const payload = { ...rest, updated_at: new Date().toISOString() }
    if (id) {
      await supabase.from('auto_apply_settings').update(payload).eq('id', id)
    } else {
      await supabase.from('auto_apply_settings').insert(payload)
    }
    await loadSettings()
    setSaving(false)
    alert('Configurações guardadas')
  }

  async function uploadCV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Apenas PDFs'); return }

    setSaving(true)
    const userId = await getMatiasUserId()
    if (!userId) { setSaving(false); return }

    const ext = file.name.split('.').pop()
    const path = `cvs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })
    if (upError) { alert('Erro ao carregar CV: ' + upError.message); setSaving(false); return }

    const arquivoUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
    const { data: inserted } = await supabase.from('candidate_cvs').insert({
      user_id: userId,
      titulo: file.name.replace(/\.pdf$/i, ''),
      cargo_alvo: '',
      arquivo_url: arquivoUrl,
      skills_cobertas: [],
      ativo: true,
    }).select().single()

    if (inserted) setCvs([inserted, ...cvs])
    setSaving(false)
  }

  async function updateCV(id: string, updates: any) {
    await supabase.from('candidate_cvs').update(updates).eq('id', id)
    await loadCVs()
  }

  async function deleteCV(id: string, arquivoUrl: string) {
    if (!confirm('Remover este CV?')) return
    const path = arquivoUrl.replace(`${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/`, '')
    if (path && path !== arquivoUrl) await supabase.storage.from(STORAGE_BUCKET).remove([path])
    await supabase.from('candidate_cvs').delete().eq('id', id)
    await loadCVs()
  }

  function parseList(value: string) {
    return value.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (logFilter !== 'all' && l.status !== logFilter) return false
      const job = jobs[l.external_job_id]
      const q = logSearch.toLowerCase()
      if (!q) return true
      return (
        (job?.title || '').toLowerCase().includes(q) ||
        (job?.company || '').toLowerCase().includes(q) ||
        (l.email_destino || '').toLowerCase().includes(q) ||
        (l.status || '').toLowerCase().includes(q)
      )
    })
  }, [logs, logFilter, logSearch, jobs])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F6FF]">
        <Loader2 className="animate-spin text-ms-blue" size={32} />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-[#F0F6FF] pb-20">
      <header className="bg-white border-b border-ms-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ms-blue to-ms-purple flex items-center justify-center text-white">
            <Send size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ms-dark">Candidatura Automática</h1>
            <p className="text-xs text-ms-gray">Módulo privado — {MATIAS_EMAIL}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6">
        <nav className="flex gap-2 overflow-x-auto pb-4 mb-2">
          {[
            { key: 'perfil', label: 'Perfil', icon: User },
            { key: 'cvs', label: 'CVs', icon: FileText },
            { key: 'config', label: 'Configurações', icon: Settings },
            { key: 'historico', label: 'Histórico', icon: History },
          ].map((t: any) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.key ? 'bg-ms-blue text-white' : 'bg-white text-ms-gray hover:bg-ms-surface'}`}>
                <Icon size={16} /> {t.label}
              </button>
            )
          })}
        </nav>

        {activeTab === 'perfil' && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-ms-border space-y-4">
            <h2 className="text-base font-bold text-ms-dark flex items-center gap-2"><User size={18} className="text-ms-purple" /> Perfil do Candidato</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-medium text-ms-gray mb-1">Nome completo</label>
                <input className="input-field" value={profile?.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-gray mb-1">Bio / percurso profissional</label>
                <textarea className="input-field min-h-[120px]" value={profile?.bio_longa || ''} onChange={e => setProfile({ ...profile, bio_longa: e.target.value })} placeholder="INP, SLB (ESSO/NGC), experiências, funções..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-gray mb-1">Formação</label>
                <input className="input-field" value={profile?.formacao || ''} onChange={e => setProfile({ ...profile, formacao: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-gray mb-1">Certificações (separadas por vírgula ou nova linha)</label>
                <textarea className="input-field min-h-[80px]" value={Array.isArray(profile?.certificacoes) ? profile.certificacoes.join('\n') : profile?.certificacoes || ''} onChange={e => setProfile({ ...profile, certificacoes: parseList(e.target.value) })} placeholder="IWCF, BST, HUET, Banksman & Slinger, First Aid, SIPP 1&2, NEST, CTA, Fire Watcher, Rigging and Slinging, MyPCP QHSE (GIN)" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-gray mb-1">Skills (separadas por vírgula ou nova linha)</label>
                <textarea className="input-field min-h-[80px]" value={Array.isArray(profile?.skills) ? profile.skills.join('\n') : profile?.skills || ''} onChange={e => setProfile({ ...profile, skills: parseList(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-gray mb-1">Referências (uso interno, nunca enviadas)</label>
                <textarea className="input-field min-h-[80px]" value={Array.isArray(profile?.referencias) ? profile.referencias.join('\n') : profile?.referencias || ''} onChange={e => setProfile({ ...profile, referencias: parseList(e.target.value) })} />
              </div>
            </div>
            <div className="pt-2">
              <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Guardar Perfil
              </button>
            </div>
          </section>
        )}

        {activeTab === 'cvs' && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-ms-border">
            <h2 className="text-base font-bold text-ms-dark flex items-center gap-2 mb-4"><FileText size={18} className="text-ms-purple" /> Currículos</h2>
            <div className="mb-6">
              <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-ms-blue text-ms-blue text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                <Upload size={18} />
                {saving ? 'A carregar…' : 'Carregar novo PDF'}
                <input type="file" accept="application/pdf" className="hidden" onChange={uploadCV} disabled={saving} />
              </label>
            </div>
            <div className="space-y-3">
              {cvs.length === 0 && <p className="text-sm text-ms-gray text-center py-8">Nenhum CV carregado.</p>}
              {cvs.map((cv: any) => (
                <div key={cv.id} className="bg-ms-surface rounded-xl p-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-medium text-ms-gray uppercase mb-1">Título</label>
                      <input className="input-field py-2" value={cv.titulo} onChange={e => updateCV(cv.id, { titulo: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-ms-gray uppercase mb-1">Cargo alvo</label>
                      <input className="input-field py-2" value={cv.cargo_alvo} onChange={e => updateCV(cv.id, { cargo_alvo: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-ms-gray uppercase mb-1">Skills cobertas (separadas por vírgula)</label>
                    <input className="input-field py-2" value={Array.isArray(cv.skills_cobertas) ? cv.skills_cobertas.join(', ') : cv.skills_cobertas || ''} onChange={e => updateCV(cv.id, { skills_cobertas: parseList(e.target.value) })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-ms-dark">
                      <input type="checkbox" checked={cv.ativo} onChange={e => updateCV(cv.id, { ativo: e.target.checked })} className="rounded border-ms-border" />
                      Ativo
                    </label>
                    <div className="flex gap-2">
                      <a href={cv.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-ms-blue hover:underline">Ver PDF</a>
                      <button onClick={() => deleteCV(cv.id, cv.arquivo_url)} className="text-xs text-ms-red hover:underline">Remover</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'config' && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-ms-border space-y-4">
            <h2 className="text-base font-bold text-ms-dark flex items-center gap-2"><Settings size={18} className="text-ms-purple" /> Configurações do Módulo</h2>
            <div className="grid gap-4">
              <label className="flex items-center gap-3 p-4 rounded-xl bg-ms-surface cursor-pointer">
                <input type="checkbox" checked={settings?.ativo || false} onChange={e => setSettings({ ...settings, ativo: e.target.checked })} className="w-5 h-5 rounded border-ms-border text-ms-blue" />
                <span className="text-sm font-medium text-ms-dark">Módulo ativo</span>
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ms-gray mb-1">Score mínimo (0-100)</label>
                  <input type="number" min={0} max={100} className="input-field" value={settings?.score_minimo ?? 55} onChange={e => setSettings({ ...settings, score_minimo: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ms-gray mb-1">Limite diário de envios</label>
                  <input type="number" min={1} className="input-field" value={settings?.limite_diario ?? 15} onChange={e => setSettings({ ...settings, limite_diario: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-gray mb-1">Email remetente</label>
                <input type="email" className="input-field" value={settings?.email_remetente || ''} onChange={e => setSettings({ ...settings, email_remetente: e.target.value })} />
              </div>
            </div>
            <div className="pt-2">
              <button onClick={saveSettings} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Guardar Configurações
              </button>
            </div>
          </section>
        )}

        {activeTab === 'historico' && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-ms-border">
            <h2 className="text-base font-bold text-ms-dark flex items-center gap-2 mb-4"><History size={18} className="text-ms-purple" /> Histórico de Candidaturas</h2>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-ms-surface rounded-xl px-4 py-2.5">
                <Search size={16} className="text-ms-gray" />
                <input type="text" placeholder="Pesquisar vaga, empresa, email ou status..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray" />
              </div>
              <select value={logFilter} onChange={e => setLogFilter(e.target.value)} className="bg-ms-surface rounded-xl px-4 py-2.5 text-sm outline-none text-ms-dark">
                <option value="all">Todos os status</option>
                <option value="enviado">Enviado</option>
                <option value="sem_email">Sem email</option>
                <option value="sem_match">Score baixo</option>
                <option value="erro">Erro</option>
                <option value="duplicado">Duplicado</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredLogs.length === 0 && <p className="text-sm text-ms-gray text-center py-8">Nenhum registo.</p>}
              {filteredLogs.map((log: any) => {
                const job = jobs[log.external_job_id]
                const open = expandedLog === log.id
                const statusIcon = ({
                  enviado: <CheckCircle size={16} className="text-green-600" />,
                  sem_email: <Mail size={16} className="text-amber-600" />,
                  sem_match: <XCircle size={16} className="text-ms-gray" />,
                  erro: <AlertTriangle size={16} className="text-ms-red" />,
                  duplicado: <AlertTriangle size={16} className="text-ms-gray" />,
                } as Record<string, ReactNode>)[log.status] || <AlertTriangle size={16} className="text-ms-gray" />

                return (
                  <div key={log.id} className="bg-ms-surface rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpandedLog(open ? null : log.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {statusIcon}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${log.status === 'enviado' ? 'bg-green-100 text-green-700' : log.status === 'sem_email' ? 'bg-amber-100 text-amber-700' : log.status === 'erro' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{log.status}</span>
                          <span className="text-xs text-ms-gray">{new Date(log.created_at).toLocaleString('pt-AO')}</span>
                          {log.score_match != null && <span className="text-xs font-medium text-ms-blue">score {log.score_match}</span>}
                        </div>
                        <p className="text-sm font-medium text-ms-dark truncate">{job?.title || 'Vaga desconhecida'}</p>
                        <p className="text-xs text-ms-gray truncate">{job?.company || ''} {job?.location ? `• ${job.location}` : ''} {log.email_destino ? `• ${log.email_destino}` : ''}</p>
                      </div>
                      {open ? <ChevronUp size={18} className="text-ms-gray" /> : <ChevronDown size={18} className="text-ms-gray" />}
                    </div>
                    {open && (
                      <div className="mt-3 pt-3 border-t border-ms-border space-y-3">
                        {log.assunto_email && (
                          <div>
                            <p className="text-[10px] font-medium text-ms-gray uppercase mb-1">Assunto</p>
                            <p className="text-sm text-ms-dark">{log.assunto_email}</p>
                          </div>
                        )}
                        {log.corpo_email && (
                          <div>
                            <p className="text-[10px] font-medium text-ms-gray uppercase mb-1">Corpo do email</p>
                            <pre className="text-xs text-ms-dark whitespace-pre-wrap bg-white p-3 rounded-xl border border-ms-border">{log.corpo_email}</pre>
                          </div>
                        )}
                        {Array.isArray(log.skills_destacadas) && log.skills_destacadas.length > 0 && (
                          <div>
                            <p className="text-[10px] font-medium text-ms-gray uppercase mb-1">Skills destacadas</p>
                            <p className="text-xs text-ms-dark">{log.skills_destacadas.join(', ')}</p>
                          </div>
                        )}
                        {log.erro_detalhe && (
                          <div>
                            <p className="text-[10px] font-medium text-ms-red uppercase mb-1">Erro</p>
                            <p className="text-xs text-ms-red">{log.erro_detalhe}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
