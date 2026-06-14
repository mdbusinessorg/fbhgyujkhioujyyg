'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { Briefcase, FileText, Users, Bell, TrendingUp, Clock, CheckCircle, XCircle, Eye, Send, LogOut, User, Star, Settings } from 'lucide-react'

const mockCandidaturas = [
  { id: '1', vaga: 'Analista Financeiro Sénior', empresa: 'Banco BAI', status: 'em_analise', data: '10 Jun 2025' },
  { id: '2', vaga: 'Contador Certificado', empresa: 'Ernst & Young Angola', status: 'enviada', data: '08 Jun 2025' },
  { id: '3', vaga: 'Gestor Financeiro', empresa: 'BFA', status: 'aprovada', data: '01 Jun 2025' },
  { id: '4', vaga: 'Auditor Interno', empresa: 'KPMG Angola', status: 'recusada', data: '25 Mai 2025' },
]

const mockVagasRecomendadas = [
  { id: '5', titulo: 'Analista de Crédito', empresa: 'Banco Económico', localizacao: 'Luanda', prazo: '20 Jul 2025' },
  { id: '6', titulo: 'Controller Financeiro', empresa: 'Sonangol', localizacao: 'Luanda', prazo: '15 Jul 2025' },
  { id: '7', titulo: 'Gestor de Tesouraria', empresa: 'Standard Bank', localizacao: 'Luanda', prazo: '25 Jul 2025' },
]

const statusConfig: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  enviada: { label: 'Enviada', class: 'badge-info', icon: Send },
  em_analise: { label: 'Em Análise', class: 'badge-warning', icon: Clock },
  aprovada: { label: 'Aprovada', class: 'badge-success', icon: CheckCircle },
  recusada: { label: 'Recusada', class: 'badge-danger', icon: XCircle },
}

export default function CandidatoDashboard() {
  const [activeTab, setActiveTab] = useState<'candidaturas' | 'vagas' | 'perfil'>('candidaturas')

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
                  <h2 className="font-semibold text-gray-900">João Silva</h2>
                  <p className="text-gray-500 text-sm">Economia e Finanças</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Perfil</span>
                      <span>75%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-k10-green rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <span className="badge-warning mt-3">Trial — 1 dia restante</span>
                </div>
              </div>

              <nav className="card overflow-hidden">
                {[
                  { key: 'candidaturas', label: 'Candidaturas', icon: Briefcase },
                  { key: 'vagas', label: 'Vagas Recomendadas', icon: Star },
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
                  <span className="text-2xl font-bold text-k10-primary">4</span>
                  <span className="text-xs text-gray-500">Candidaturas</span>
                </div>
                <div className="stat-card">
                  <Eye size={22} className="text-blue-500 mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">12</span>
                  <span className="text-xs text-gray-500">Perfil visto</span>
                </div>
                <div className="stat-card">
                  <Bell size={22} className="text-k10-gold mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">3</span>
                  <span className="text-xs text-gray-500">Novas vagas</span>
                </div>
                <div className="stat-card">
                  <TrendingUp size={22} className="text-k10-green mb-2" />
                  <span className="text-2xl font-bold text-k10-primary">75%</span>
                  <span className="text-xs text-gray-500">Score perfil</span>
                </div>
              </div>

              {activeTab === 'candidaturas' && (
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="font-heading font-semibold text-lg">As Minhas Candidaturas</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {mockCandidaturas.map((c) => {
                      const config = statusConfig[c.status]
                      const StatusIcon = config.icon
                      return (
                        <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-k10-primary/5 rounded-lg flex items-center justify-center">
                              <Briefcase size={18} className="text-k10-accent" />
                            </div>
                            <div>
                              <h3 className="font-medium text-sm text-gray-900">{c.vaga}</h3>
                              <p className="text-xs text-gray-500">{c.empresa} • {c.data}</p>
                            </div>
                          </div>
                          <span className={config.class + ' flex items-center gap-1'}>
                            <StatusIcon size={12} />
                            {config.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'vagas' && (
                <div className="space-y-4">
                  <div className="card p-5 bg-blue-50 border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={18} className="text-blue-600" />
                      <h3 className="font-semibold text-blue-800">Vagas Recomendadas para Ti</h3>
                    </div>
                    <p className="text-blue-600 text-sm">Com base na tua área (Economia e Finanças) e nível académico.</p>
                  </div>
                  {mockVagasRecomendadas.map((v) => (
                    <div key={v.id} className="card p-4 hover:-translate-y-0.5 transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{v.titulo}</h3>
                          <p className="text-sm text-gray-500">{v.empresa} • {v.localizacao}</p>
                          <p className="text-xs text-gray-400 mt-1">Prazo: {v.prazo}</p>
                        </div>
                        <button className="btn-primary !py-2 !px-4 text-sm">Candidatar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'perfil' && (
                <div className="card p-6">
                  <h2 className="font-heading font-semibold text-lg mb-4">Editar Perfil</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                      <input type="text" defaultValue="João Silva" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" defaultValue="joao@email.com" className="input-field" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Área de Formação</label>
                      <select className="input-field" defaultValue="Economia e Finanças">
                        <option>Economia e Finanças</option>
                        <option>Tecnologia da Informação</option>
                        <option>Engenharia</option>
                        <option>Direito</option>
                        <option>Saúde</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nível Académico</label>
                      <select className="input-field" defaultValue="Licenciatura">
                        <option>Ensino Médio</option>
                        <option>Técnico Profissional</option>
                        <option>Licenciatura</option>
                        <option>Mestrado</option>
                        <option>Doutoramento</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experiências</label>
                      <textarea className="input-field" rows={3} defaultValue="2 anos como assistente financeiro no BFA. Estágio na PwC Angola." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Competências</label>
                      <input type="text" className="input-field" defaultValue="Excel, Análise Financeira, SAP, Power BI" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documentos</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                        <FileText size={28} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Arrasta ficheiros ou clica para fazer upload</p>
                        <p className="text-xs text-gray-400 mt-1">Diploma, certificados, portfólio (PDF, JPG, PNG)</p>
                      </div>
                    </div>
                  </div>
                  <button className="btn-primary mt-6">Guardar Alterações</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
