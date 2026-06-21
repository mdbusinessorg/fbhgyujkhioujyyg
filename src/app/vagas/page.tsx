'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, SlidersHorizontal, Heart, Briefcase, ArrowLeft, Home as HomeIcon, User } from 'lucide-react'

export default function VagasPage() {
  const [vagas, setVagas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todas')

  const filters = ['Todas', 'TI', 'Finanças', 'Engenharia', 'Saúde', 'Marketing']

  useEffect(() => {
    const loadVagas = async () => {
      const { data } = await supabase.from('vagas').select('*').eq('status', 'aberta').order('created_at', { ascending: false })
      if (data && data.length > 0) {
        setVagas(data)
      } else {
        setVagas([
          { id: '1', titulo: 'Analista Financeiro Sénior', empresa_nome: 'Banco BAI', area: 'Economia e Finanças', localizacao: 'Luanda', salario: '450.000 Kz', created_at: new Date().toISOString() },
          { id: '2', titulo: 'Desenvolvedor Full-Stack', empresa_nome: 'Unitel', area: 'Tecnologia da Informação', localizacao: 'Luanda', salario: '380.000 Kz', created_at: new Date().toISOString() },
          { id: '3', titulo: 'Engenheiro de Petróleo', empresa_nome: 'Sonangol', area: 'Engenharia', localizacao: 'Cabinda', salario: '600.000 Kz', created_at: new Date().toISOString() },
          { id: '4', titulo: 'Designer UI/UX', empresa_nome: 'Africell', area: 'Artes e Design', localizacao: 'Luanda', salario: '300.000 Kz', created_at: new Date().toISOString() },
          { id: '5', titulo: 'Gestor de Projectos', empresa_nome: 'Total Energies', area: 'Administração', localizacao: 'Luanda', salario: '500.000 Kz', created_at: new Date().toISOString() },
          { id: '6', titulo: 'Contabilista Sénior', empresa_nome: 'Ernst & Young', area: 'Contabilidade e Auditoria', localizacao: 'Luanda', salario: '350.000 Kz', created_at: new Date().toISOString() },
        ])
      }
    }
    loadVagas()
  }, [])

  const filteredVagas = vagas.filter(v => {
    const matchSearch = v.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || v.empresa_nome?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFilter = activeFilter === 'Todas' || v.area?.includes(activeFilter)
    return matchSearch && matchFilter
  })

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} min atrás`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h atrás`
    const days = Math.floor(hours / 24)
    return `${days} dia${days > 1 ? 's' : ''} atrás`
  }

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      {/* Top Nav */}
      <header className="sticky top-0 bg-white border-b border-ms-border z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={20} className="text-ms-dark" />
          </Link>
          <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
          <button>
            <Heart size={20} className="text-ms-gray" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-ms-surface rounded-full px-4 py-3 mb-4 border-2 border-ms-blue/10 focus-within:border-ms-blue">
          <Search size={18} className="text-ms-gray flex-shrink-0" />
          <input
            type="text"
            placeholder="título da vaga ou palavra-chave"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-ms-dark placeholder:text-ms-gray"
          />
          <button className="w-8 h-8 bg-ms-blue rounded-lg flex items-center justify-center flex-shrink-0">
            <SlidersHorizontal size={14} className="text-white" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-xs px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                activeFilter === f ? 'bg-ms-blue text-white' : 'bg-ms-surface text-ms-gray border border-ms-border'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Job list */}
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {filteredVagas.map(v => (
            <Link key={v.id} href={`/vagas/detalhe/?id=${v.id}`} className="block">
              <div className="bg-ms-surface rounded-xl p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-ms-border">
                  <Briefcase size={16} className="text-ms-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-ms-dark truncate">{v.titulo}</h3>
                  <p className="text-xs text-ms-gray">{v.empresa_nome}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-ms-gray">{getTimeAgo(v.created_at)}</span>
                    <span className="text-[11px] font-medium text-ms-blue bg-ms-blue/5 px-3 py-1 rounded-full">Candidatar</span>
                  </div>
                </div>
                <button className="flex-shrink-0 mt-1">
                  <Heart size={16} className="text-ms-gray" />
                </button>
              </div>
            </Link>
          ))}
        </div>

        {filteredVagas.length === 0 && (
          <div className="text-center py-12">
            <Briefcase size={32} className="text-ms-gray mx-auto mb-3" />
            <p className="text-sm text-ms-gray">Nenhuma vaga encontrada</p>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          <Link href="/" className="flex flex-col items-center gap-0.5 py-1">
            <HomeIcon size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Início</span>
          </Link>
          <Link href="/vagas/" className="flex flex-col items-center gap-0.5 py-1">
            <Search size={22} className="text-ms-blue" />
            <span className="text-[10px] text-ms-blue font-medium">Pesquisar</span>
          </Link>
          <Link href="/auth/login/" className="flex flex-col items-center gap-0.5 py-1">
            <Heart size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Guardados</span>
          </Link>
          <Link href="/auth/login/" className="flex flex-col items-center gap-0.5 py-1">
            <User size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
