'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, SlidersHorizontal, Heart, Bell, Menu, MessageCircle, Briefcase, Home as HomeIcon, User } from 'lucide-react'

const topCompanies = [
  { name: 'Sonangol', vagas: 12, color: 'bg-yellow-100', letter: 'S' },
  { name: 'Saipem', vagas: 8, color: 'bg-blue-100', letter: 'Sa' },
  { name: 'SLB', vagas: 6, color: 'bg-green-100', letter: 'SL' },
  { name: 'Total', vagas: 15, color: 'bg-red-100', letter: 'T' },
  { name: 'Eni', vagas: 5, color: 'bg-orange-100', letter: 'E' },
  { name: 'BAI', vagas: 9, color: 'bg-purple-100', letter: 'B' },
  { name: 'Unitel', vagas: 7, color: 'bg-cyan-100', letter: 'U' },
]

const demoJobs = [
  { id: '1', titulo: 'Analista Financeiro Sénior', empresa: 'Banco BAI', date: 'Hoje', area: 'Finanças' },
  { id: '2', titulo: 'Desenvolvedor Full-Stack', empresa: 'Unitel', date: 'Hoje', area: 'TI' },
  { id: '3', titulo: 'Engenheiro de Petróleo', empresa: 'Sonangol', date: '2 dias', area: 'Petróleo' },
  { id: '4', titulo: 'Designer UI/UX', empresa: 'Africell', date: '3 dias', area: 'Design' },
  { id: '5', titulo: 'Gestor de Projectos', empresa: 'Total Energies', date: 'Hoje', area: 'Gestão' },
  { id: '6', titulo: 'Contabilista Sénior', empresa: 'Ernst & Young', date: '1 dia', area: 'Contabilidade' },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsLoggedIn(true)
        const { data } = await supabase.from('users').select('role').eq('email', session.user.email).single()
        if (data) setUserRole(data.role)
      }
    }
    checkAuth()
  }, [])

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      {/* Top Nav */}
      <header className="sticky top-0 bg-white border-b border-ms-border z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button className="lg:hidden">
            <Menu size={22} className="text-ms-dark" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ms-blue rounded-lg flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href={`/dashboard/${userRole}/`} className="w-8 h-8 bg-ms-surface rounded-full flex items-center justify-center">
                <User size={16} className="text-ms-gray" />
              </Link>
            ) : (
              <>
                <Link href="/auth/login/" className="hidden sm:block text-sm font-medium text-ms-blue hover:underline">Entrar</Link>
                <Link href="/auth/registar/" className="hidden sm:block text-sm bg-ms-blue text-white px-4 py-2 rounded-lg font-medium">Registar</Link>
              </>
            )}
            <button className="relative">
              <Bell size={20} className="text-ms-gray" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-ms-red rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {/* Search Bar */}
        <div className="mt-4 mb-6">
          <div className="flex items-center gap-2 bg-ms-surface rounded-full px-4 py-3">
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
        </div>

        {/* Empresas de Topo */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-ms-dark mb-3">Empresas de Topo</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {topCompanies.map((company) => (
              <div key={company.name} className="flex flex-col items-center min-w-[64px]">
                <div className={`w-12 h-12 ${company.color} rounded-xl flex items-center justify-center mb-1.5`}>
                  <span className="text-sm font-bold text-ms-dark">{company.letter}</span>
                </div>
                <span className="text-[11px] text-ms-gray text-center">{company.name}</span>
                <span className="text-[11px] text-ms-blue font-medium">{company.vagas} vagas</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recomendado para si */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ms-dark">Recomendado para si</h2>
            <Link href="/vagas/" className="text-xs text-ms-blue font-medium">Ver todas</Link>
          </div>
          <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
            {demoJobs.map((job) => (
              <Link key={job.id} href={`/vagas/detalhe/?id=${job.id}`} className="block">
                <div className="bg-ms-surface rounded-xl p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-ms-border">
                    <Briefcase size={16} className="text-ms-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-ms-dark truncate">{job.titulo}</h3>
                    <p className="text-xs text-ms-gray">{job.empresa}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-ms-gray bg-white px-2 py-0.5 rounded-full">{job.date}</span>
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
        </section>
      </main>

      {/* Bottom Nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          <Link href="/" className="flex flex-col items-center gap-0.5 py-1">
            <HomeIcon size={22} className="text-ms-blue" />
            <span className="text-[10px] text-ms-blue font-medium">Início</span>
          </Link>
          <Link href="/vagas/" className="flex flex-col items-center gap-0.5 py-1">
            <Search size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Pesquisar</span>
          </Link>
          <Link href={isLoggedIn ? `/dashboard/${userRole}/` : '/auth/login/'} className="flex flex-col items-center gap-0.5 py-1">
            <Heart size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Guardados</span>
          </Link>
          <Link href={isLoggedIn ? `/dashboard/${userRole}/` : '/auth/login/'} className="flex flex-col items-center gap-0.5 py-1">
            <User size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Perfil</span>
          </Link>
        </div>
      </nav>

      {/* Desktop sidebar (hidden on mobile) */}
      <aside className="hidden lg:block fixed left-0 top-0 w-60 h-screen bg-white border-r border-ms-border z-40 pt-16">
        <nav className="p-4 space-y-1 mt-4">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium bg-ms-purple-light text-ms-purple">
            <HomeIcon size={18} /> Início
          </Link>
          <Link href="/vagas/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface">
            <Search size={18} /> Pesquisar
          </Link>
          {isLoggedIn ? (
            <>
              <Link href={`/dashboard/${userRole}/`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface">
                <Briefcase size={18} /> Dashboard
              </Link>
              <Link href={`/dashboard/${userRole}/?tab=perfil`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface">
                <User size={18} /> Perfil
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface">
                <User size={18} /> Entrar
              </Link>
              <Link href="/auth/registar/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface">
                <Briefcase size={18} /> Registar
              </Link>
            </>
          )}
        </nav>
      </aside>
    </div>
  )
}
