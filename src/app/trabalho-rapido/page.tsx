'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, MapPin, Clock, Phone, DollarSign, Zap, X, Filter, MessageSquare, Search } from 'lucide-react'

const CATEGORIAS = [
  { key: 'all', label: 'Todos' },
  { key: 'cantina', label: 'Cantina' },
  { key: 'cyber', label: 'Cyber Café' },
  { key: 'entregas', label: 'Entregas' },
  { key: 'limpeza', label: 'Limpeza' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'construcao', label: 'Construção' },
  { key: 'comercio', label: 'Comércio' },
  { key: 'outro', label: 'Outro' },
]

const TIPOS_PAGAMENTO = ['diário', 'por hora', 'por tarefa', 'semanal']
const DURACOES = ['1 dia', '2-3 dias', '1 semana', '2 semanas', 'tempo inteiro']

interface QuickJob {
  id: string
  titulo: string
  descricao: string
  categoria: string
  localizacao: string
  tipo_pagamento: string
  valor_kz: number
  duracao_estimada: string
  contacto_telefone: string
  contacto_whatsapp?: string
  publicado_por: string
  status: string
  created_at: string
  publisher_name?: string
}

export default function TrabalhoRapidoPage() {
  const [jobs, setJobs] = useState<QuickJob[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    titulo: '', descricao: '', categoria: 'outro',
    localizacao: '', tipo_pagamento: 'diário',
    valor_kz: '', duracao_estimada: '1 dia',
    contacto_telefone: '', contacto_whatsapp: '',
  })
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsLoggedIn(true)
        const { data: u } = await supabase.from('users').select('id, telefone').eq('email', session.user.email).single()
        if (u) {
          setCurrentUserId(u.id)
          if (u.telefone) setForm(f => ({ ...f, contacto_telefone: u.telefone }))
        }
      }
      loadJobs()
    }
    init()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('quick_jobs')
      .select('*')
      .eq('status', 'aberto')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      const publisherIds = Array.from(new Set(data.filter(j => j.publicado_por).map(j => j.publicado_por)))
      const { data: users } = await supabase.from('users').select('id, nome').in('id', publisherIds)
      const usersMap: Record<string, string> = {}
      ;(users || []).forEach(u => { usersMap[u.id] = u.nome })
      setJobs(data.map(j => ({ ...j, publisher_name: usersMap[j.publicado_por] || '' })))
    } else {
      setJobs([])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo || !form.contacto_telefone || !form.localizacao) {
      alert('Preenche título, localização e telefone')
      return
    }
    if (!isLoggedIn) {
      alert('Faz login primeiro')
      router.push('/auth/login/')
      return
    }
    const { error } = await supabase.from('quick_jobs').insert({
      titulo: form.titulo,
      descricao: form.descricao,
      categoria: form.categoria,
      localizacao: form.localizacao,
      tipo_pagamento: form.tipo_pagamento,
      valor_kz: parseInt(form.valor_kz) || 0,
      duracao_estimada: form.duracao_estimada,
      contacto_telefone: form.contacto_telefone,
      contacto_whatsapp: form.contacto_whatsapp || null,
      publicado_por: currentUserId,
      status: 'aberto',
    })
    if (error) { alert('Erro: ' + error.message); return }
    setShowForm(false)
    setForm({ titulo: '', descricao: '', categoria: 'outro', localizacao: '', tipo_pagamento: 'diário', valor_kz: '', duracao_estimada: '1 dia', contacto_telefone: form.contacto_telefone, contacto_whatsapp: '' })
    loadJobs()
  }

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Agora'
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  const filtered = jobs.filter(j => {
    if (filtroCategoria !== 'all' && j.categoria !== filtroCategoria) return false
    if (searchQuery && !j.titulo.toLowerCase().includes(searchQuery.toLowerCase()) && !j.localizacao?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1"><ArrowLeft size={20} className="text-gray-700" /></Link>
            <div className="flex items-center gap-1.5">
              <Zap size={18} className="text-orange-500" />
              <h1 className="font-semibold text-gray-900">Trabalho Rápido</h1>
            </div>
          </div>
          <button
            onClick={() => { isLoggedIn ? setShowForm(true) : router.push('/auth/login/') }}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={14} /> Publicar
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 mb-4 border border-gray-100">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar trabalhos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {CATEGORIAS.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFiltroCategoria(cat.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroCategoria === cat.key ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-100'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Zap size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum trabalho rápido disponível</p>
            <p className="text-xs text-gray-400 mt-1">Sê o primeiro a publicar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(job => (
              <div key={job.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-orange-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
                        {CATEGORIAS.find(c => c.key === job.categoria)?.label || job.categoria}
                      </span>
                      <span className="text-[10px] text-gray-400">{getTimeAgo(job.created_at)}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{job.titulo}</h3>
                    {job.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{job.descricao}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-orange-600">{job.valor_kz?.toLocaleString()} Kz</p>
                    <p className="text-[10px] text-gray-400">{job.tipo_pagamento}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-500">
                  {job.localizacao && <span className="flex items-center gap-0.5"><MapPin size={10} /> {job.localizacao}</span>}
                  <span className="flex items-center gap-0.5"><Clock size={10} /> {job.duracao_estimada}</span>
                  {job.publisher_name && <span className="text-gray-400">por {job.publisher_name}</span>}
                </div>

                <div className="flex gap-2 mt-3">
                  <a
                    href={`tel:${job.contacto_telefone}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Phone size={12} /> Ligar
                  </a>
                  {job.contacto_whatsapp && (
                    <a
                      href={`https://wa.me/244${job.contacto_whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <MessageSquare size={12} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl lg:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Publicar Trabalho Rápido</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Título *</label>
                <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Ajudante de cantina" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descreve o trabalho..." rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none">
                    {CATEGORIAS.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Localização *</label>
                  <input type="text" value={form.localizacao} onChange={e => setForm({ ...form, localizacao: e.target.value })} placeholder="Bairro, cidade" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Valor (Kz)</label>
                  <input type="number" value={form.valor_kz} onChange={e => setForm({ ...form, valor_kz: e.target.value })} placeholder="5000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Pagamento</label>
                  <select value={form.tipo_pagamento} onChange={e => setForm({ ...form, tipo_pagamento: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none">
                    {TIPOS_PAGAMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Duração</label>
                  <select value={form.duracao_estimada} onChange={e => setForm({ ...form, duracao_estimada: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none">
                    {DURACOES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Telefone *</label>
                  <input type="tel" value={form.contacto_telefone} onChange={e => setForm({ ...form, contacto_telefone: e.target.value })} placeholder="923..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">WhatsApp</label>
                  <input type="tel" value={form.contacto_whatsapp} onChange={e => setForm({ ...form, contacto_whatsapp: e.target.value })} placeholder="Opcional" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
              </div>
              <button type="submit" className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium text-sm hover:bg-orange-600 transition-colors mt-2">
                Publicar Trabalho
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
