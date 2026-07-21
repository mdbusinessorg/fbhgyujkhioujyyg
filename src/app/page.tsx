'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, SlidersHorizontal, Heart, Bell, Menu, X, Briefcase, Home as HomeIcon, User, LogOut, Settings, FileText, Star, MapPin, Monitor, Banknote, Stethoscope, Megaphone, Scale, GraduationCap, HardHat, Wrench, Linkedin, ExternalLink, MessageSquare, Zap, Users } from 'lucide-react'
import InstallPWA from '@/components/InstallPWA'

const CATEGORIAS_HOME = [
  { key: 'TI', label: 'Tecnologia', icon: Monitor, match: 'Tecnologia' },
  { key: 'Financas', label: 'Finan\u00e7as', icon: Banknote, match: 'Finan\u00e7as' },
  { key: 'Engenharia', label: 'Engenharia', icon: HardHat, match: 'Engenharia' },
  { key: 'Saude', label: 'Sa\u00fade', icon: Stethoscope, match: 'Sa\u00fade' },
  { key: 'Marketing', label: 'Marketing', icon: Megaphone, match: 'Marketing' },
  { key: 'Direito', label: 'Direito', icon: Scale, match: 'Direito' },
  { key: 'Educacao', label: 'Educa\u00e7\u00e3o', icon: GraduationCap, match: 'Educa\u00e7\u00e3o' },
  { key: 'Petroleo', label: 'Petr\u00f3leo', icon: Wrench, match: 'Petr\u00f3leo' },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [userName, setUserName] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [vagas, setVagas] = useState<any[]>([])
  const [linkedinJobs, setLinkedinJobs] = useState<any[]>([])
  const [linkedinCat, setLinkedinCat] = useState('all')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()

  const loadUserFromSession = async (session: any) => {
    if (!session?.user?.email) return { role: 'candidato', nome: '' }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, nome')
        .eq('email', session.user.email)
        .single()
      if (error || !data) {
        return { role: 'candidato', nome: session.user.email?.split('@')[0] || '' }
      }
      return { role: data.role || 'candidato', nome: data.nome || session.user.email?.split('@')[0] || '' }
    } catch {
      return { role: 'candidato', nome: session.user.email?.split('@')[0] || '' }
    }
  }

  const loadVagas = async () => {
    const { data: vagasData } = await supabase.from('vagas').select('*').eq('status', 'aberta').order('created_at', { ascending: false }).limit(10)
    if (vagasData && vagasData.length > 0) {
      setVagas(vagasData)
    }
  }

  const loadLinkedInJobs = async () => {
    const { data: ljobs } = await supabase.from('linkedin_jobs').select('*').order('created_at', { ascending: false })
    if (ljobs) setLinkedinJobs(ljobs)
  }

  useEffect(() => {
    const syncAuth = async (session: any) => {
      if (session) {
        const user = await loadUserFromSession(session)
        setIsLoggedIn(true)
        setUserRole(user.role)
        setUserName(user.nome)
      } else {
        setIsLoggedIn(false)
        setUserRole('')
        setUserName('')
      }
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await syncAuth(session)
      await loadVagas()
      await loadLinkedInJobs()
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncAuth(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUserRole('')
    setUserName('')
    setShowMenu(false)
    router.push('/')
  }

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Agora'
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0 lg:pl-60">
      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-ms-blue rounded-lg flex items-center justify-center">
                  <Briefcase size={16} className="text-white" />
                </div>
                <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
              </div>
              <button onClick={() => setShowMenu(false)}>
                <X size={22} className="text-ms-dark" />
              </button>
            </div>

            {isLoggedIn && (
              <div className="mb-6 pb-4 border-b border-ms-border">
                <p className="text-sm font-medium text-ms-dark">{userName || 'Utilizador'}</p>
                <p className="text-xs text-ms-gray capitalize">{userRole}</p>
              </div>
            )}

            <nav className="space-y-1">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-dark bg-ms-surface" onClick={() => setShowMenu(false)}>
                <HomeIcon size={18} /> Início
              </Link>
              <Link href="/vagas/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}>
                <Search size={18} /> Pesquisar Vagas
              </Link>
              {isLoggedIn ? (
                <>
                  <Link href={`/dashboard/${userRole}/`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}>
                    <Briefcase size={18} /> Dashboard
                  </Link>
                  <Link href={`/dashboard/${userRole}/?tab=perfil`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}>
                    <User size={18} /> Perfil
                  </Link>
                  <Link href="/pessoas/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}>
                    <Users size={18} /> Pessoas
                  </Link>
                  <Link href="/mensagens/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface" onClick={() => setShowMenu(false)}>
                    <MessageSquare size={18} /> Mensagens
                  </Link>
                  <Link href="/trabalho-rapido/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-500 hover:bg-orange-50" onClick={() => setShowMenu(false)}>
                    <Zap size={18} /> Trabalho Rápido
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-red hover:bg-red-50">
                    <LogOut size={18} /> Terminar Sessão
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-blue hover:bg-ms-surface" onClick={() => setShowMenu(false)}>
                    <User size={18} /> Entrar
                  </Link>
                  <Link href="/auth/registar/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ms-blue hover:bg-ms-surface" onClick={() => setShowMenu(false)}>
                    <FileText size={18} /> Criar Conta
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Top Nav — professional */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-ms-border z-50 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button className="lg:hidden" onClick={() => setShowMenu(true)}>
              <Menu size={22} className="text-ms-dark" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-ms-blue to-ms-purple rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-sm">MS</span>
              </div>
              <span className="font-bold text-lg text-ms-dark hidden sm:block">MÔ SALO</span>
            </Link>
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-1">
              <Link href="/mensagens/" className="w-10 h-10 rounded-xl flex items-center justify-center text-ms-gray hover:bg-ms-surface transition-colors" title="Mensagens">
                <MessageSquare size={20} />
              </Link>
              <Link href="/pessoas/" className="w-10 h-10 rounded-xl flex items-center justify-center text-ms-gray hover:bg-ms-surface transition-colors" title="Pessoas">
                <Users size={20} />
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-ms-surface transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-ms-blue to-ms-purple rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">{(userName || 'U').charAt(0).toUpperCase()}</span>
                  </div>
                </button>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-ms-border z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-ms-border">
                        <p className="text-sm font-semibold text-ms-dark truncate">{userName || 'Utilizador'}</p>
                        <p className="text-xs text-ms-gray capitalize">{userRole}</p>
                      </div>
                      <div className="py-1">
                        <Link href={`/dashboard/${userRole}/`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ms-dark hover:bg-ms-surface" onClick={() => setShowProfileMenu(false)}>
                          <HomeIcon size={16} className="text-ms-gray" /> Minha conta
                        </Link>
                        <Link href={`/dashboard/${userRole}/?tab=perfil`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ms-dark hover:bg-ms-surface" onClick={() => setShowProfileMenu(false)}>
                          <User size={16} className="text-ms-gray" /> Meu perfil
                        </Link>
                        <Link href="/pessoas/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ms-dark hover:bg-ms-surface" onClick={() => setShowProfileMenu(false)}>
                          <Users size={16} className="text-ms-gray" /> Pessoas
                        </Link>
                        <Link href="/trabalho-rapido/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ms-dark hover:bg-ms-surface" onClick={() => setShowProfileMenu(false)}>
                          <Zap size={16} className="text-orange-500" /> Trabalho Rápido
                        </Link>
                      </div>
                      <div className="border-t border-ms-border py-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ms-red hover:bg-red-50">
                          <LogOut size={16} /> Terminar Sessão
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login/" className="text-sm font-medium text-ms-dark hover:text-ms-blue px-3 py-2">Entrar</Link>
              <Link href="/auth/registar/" className="text-sm bg-ms-blue text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors">Criar conta</Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8">
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
            <Link href="/vagas/" className="w-8 h-8 bg-ms-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <SlidersHorizontal size={14} className="text-white" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            {isLoggedIn ? (
              <Link href={`/dashboard/${userRole}/`} className="bg-ms-surface rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
                <User size={24} className="text-ms-blue mx-auto mb-2" />
                <p className="text-xs font-medium text-ms-dark">Meu Perfil</p>
              </Link>
            ) : (
              <Link href="/auth/login/" className="bg-ms-surface rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
                <User size={24} className="text-ms-blue mx-auto mb-2" />
                <p className="text-xs font-medium text-ms-dark">Entrar</p>
              </Link>
            )}
            <Link href="/vagas/" className="bg-ms-surface rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
              <Briefcase size={24} className="text-ms-blue mx-auto mb-2" />
              <p className="text-xs font-medium text-ms-dark">Ver Vagas</p>
            </Link>
            {isLoggedIn ? (
              <Link href="/pessoas/" className="bg-ms-surface rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
                <Search size={24} className="text-ms-blue mx-auto mb-2" />
                <p className="text-xs font-medium text-ms-dark">Pessoas</p>
              </Link>
            ) : (
              <Link href="/auth/registar/" className="bg-ms-surface rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
                <FileText size={24} className="text-ms-blue mx-auto mb-2" />
                <p className="text-xs font-medium text-ms-dark">Registar</p>
              </Link>
            )}
          </div>
        </section>

        {/* Categories */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ms-dark">Categorias</h2>
            <Link href="/vagas/" className="text-xs text-ms-blue font-medium">Ver todas</Link>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {CATEGORIAS_HOME.map(cat => {
              const Icon = cat.icon
              return (
                <Link key={cat.key} href={`/vagas/`} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-ms-surface transition-colors">
                  <div className="w-10 h-10 bg-ms-purple-light rounded-full flex items-center justify-center">
                    <Icon size={18} className="text-ms-purple" />
                  </div>
                  <span className="text-[10px] text-ms-dark font-medium text-center leading-tight">{cat.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Vagas em Destaque */}
        {vagas.filter(v => v.is_prioritaria).length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <h2 className="text-sm font-semibold text-ms-dark">Vagas em Destaque</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {vagas.filter(v => v.is_prioritaria).map(job => (
                <Link key={job.id} href={`/vagas/detalhe/?id=${job.id}`} className="flex-shrink-0 w-64">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 h-full hover:shadow-md transition-shadow relative">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-2">
                      <Star size={8} className="fill-amber-500 text-amber-500" /> DESTAQUE
                    </span>
                    <h3 className="text-sm font-semibold text-ms-dark truncate">{job.titulo}</h3>
                    <p className="text-xs text-ms-gray mt-0.5">{job.empresa_nome}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {job.localizacao && <span className="inline-flex items-center gap-0.5 text-[10px] text-ms-gray"><MapPin size={9} />{job.localizacao}</span>}
                      {job.salario && <span className="text-[10px] font-medium text-green-700">{job.salario}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Vagas Disponíveis (real from Supabase) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ms-dark">Vagas Disponíveis</h2>
            <Link href="/vagas/" className="text-xs text-ms-blue font-medium">Ver todas</Link>
          </div>

          {vagas.length === 0 ? (
            <div className="bg-ms-surface rounded-xl p-8 text-center">
              <Briefcase size={32} className="text-ms-gray mx-auto mb-3" />
              <p className="text-sm text-ms-gray">Nenhuma vaga disponível de momento</p>
              <p className="text-xs text-ms-gray mt-1">As vagas aparecem aqui depois de serem aprovadas pelo admin</p>
            </div>
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
              {vagas.filter(v => !v.is_prioritaria && (v.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery)).map((job) => (
                <Link key={job.id} href={`/vagas/detalhe/?id=${job.id}`} className="block">
                  <div className="bg-ms-surface rounded-xl p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-ms-border">
                      <Briefcase size={16} className="text-ms-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-ms-dark truncate">{job.titulo}</h3>
                      <p className="text-xs text-ms-gray">{job.empresa_nome} • {job.localizacao}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-ms-gray bg-white px-2 py-0.5 rounded-full">{getTimeAgo(job.created_at)}</span>
                        <span className="text-[11px] font-medium text-ms-blue bg-ms-blue/5 px-3 py-1 rounded-full">Candidatar</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* LinkedIn Jobs Section */}
        {linkedinJobs.length > 0 && (
          <section className="mb-8 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Linkedin size={20} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-ms-dark">Vagas LinkedIn</h2>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              <button onClick={() => setLinkedinCat('all')} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${linkedinCat === 'all' ? 'bg-blue-600 text-white' : 'bg-ms-surface text-ms-gray hover:bg-blue-50'}`}>Todas</button>
              {Array.from(new Set(linkedinJobs.map(j => j.categoria))).map(cat => (
                <button key={cat} onClick={() => setLinkedinCat(cat)} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${linkedinCat === cat ? 'bg-blue-600 text-white' : 'bg-ms-surface text-ms-gray hover:bg-blue-50'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Jobs grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {linkedinJobs
                .filter(j => linkedinCat === 'all' || j.categoria === linkedinCat)
                .map(job => (
                <a key={job.id} href={job.link} target="_blank" rel="noopener noreferrer" className="bg-white border border-blue-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <Linkedin size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ms-dark group-hover:text-blue-600 transition-colors truncate">{job.titulo}</p>
                      <p className="text-xs text-ms-gray">{job.empresa} {job.localizacao ? '• ' + job.localizacao : ''}</p>
                      {job.descricao && <p className="text-xs text-ms-gray mt-1 line-clamp-2">{job.descricao}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{job.categoria}</span>
                        <span className="text-[10px] text-blue-500 flex items-center gap-0.5"><ExternalLink size={9} /> Candidatar-se</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Como Funciona — only for visitors */}
        {!isLoggedIn && (
        <section className="mb-8 mt-8">
          <h2 className="text-sm font-semibold text-ms-dark mb-4 text-center">Como Funciona</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { step: '1', title: 'Cria a Conta', desc: 'Regista-te como candidato ou recrutador', color: 'from-blue-500 to-blue-600' },
              { step: '2', title: 'Completa o Perfil', desc: 'Adiciona o CV e documentos ao teu perfil', color: 'from-purple-500 to-purple-600' },
              { step: '3', title: 'Candidata-te', desc: 'Explora vagas e envia candidaturas', color: 'from-amber-500 to-orange-500' },
              { step: '4', title: 'Conquista!', desc: 'Recebe respostas dos recrutadores', color: 'from-green-500 to-emerald-500' },
            ].map(item => (
              <div key={item.step} className="text-center p-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-sm`}>
                  {item.step}
                </div>
                <p className="text-xs font-semibold text-ms-dark">{item.title}</p>
                <p className="text-[10px] text-ms-gray mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Stats */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-[#1A56FF] to-[#6C47FF] rounded-2xl p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
            <h3 className="text-sm font-semibold mb-4 text-white/90">A Plataforma de Emprego #1 em Angola</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold">{vagas.length > 0 ? vagas.length + '+' : '50+'}</p>
                <p className="text-[10px] text-white/70">Vagas Activas</p>
              </div>
              <div>
                <p className="text-2xl font-bold">500+</p>
                <p className="text-[10px] text-white/70">Candidatos</p>
              </div>
              <div>
                <p className="text-2xl font-bold">100+</p>
                <p className="text-[10px] text-white/70">Empresas</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA — visitors get "Criar Conta", members get quick links */}
        <section className="mb-8">
          {!isLoggedIn ? (
            <div className="bg-ms-surface rounded-2xl p-6 text-center">
              <h3 className="text-sm font-bold text-ms-dark mb-2">Pronto para encontrar o emprego ideal?</h3>
              <p className="text-xs text-ms-gray mb-4">Cria a tua conta gratuita e começa a candidatar-te hoje.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/registar/" className="bg-ms-blue text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                  Criar Conta Grátis
                </Link>
                <Link href="/vagas/" className="border border-ms-blue text-ms-blue text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-ms-blue/5 transition-colors">
                  Ver Vagas
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-ms-surface rounded-2xl p-5">
              <h3 className="text-sm font-bold text-ms-dark mb-3">Acesso rápido</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link href={`/dashboard/${userRole}/`} className="flex flex-col items-center gap-1.5 bg-white rounded-xl p-3 border border-ms-border hover:border-ms-blue/30 transition-colors">
                  <User size={20} className="text-ms-blue" /><span className="text-[11px] font-medium text-ms-dark">Meu Perfil</span>
                </Link>
                <Link href="/mensagens/" className="flex flex-col items-center gap-1.5 bg-white rounded-xl p-3 border border-ms-border hover:border-ms-blue/30 transition-colors">
                  <MessageSquare size={20} className="text-ms-blue" /><span className="text-[11px] font-medium text-ms-dark">Mensagens</span>
                </Link>
                <Link href="/pessoas/" className="flex flex-col items-center gap-1.5 bg-white rounded-xl p-3 border border-ms-border hover:border-ms-blue/30 transition-colors">
                  <Users size={20} className="text-ms-blue" /><span className="text-[11px] font-medium text-ms-dark">Pessoas</span>
                </Link>
                <Link href="/trabalho-rapido/" className="flex flex-col items-center gap-1.5 bg-white rounded-xl p-3 border border-ms-border hover:border-ms-blue/30 transition-colors">
                  <Zap size={20} className="text-orange-500" /><span className="text-[11px] font-medium text-ms-dark">Trabalho Rápido</span>
                </Link>
              </div>
            </div>
          )}
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
            <Briefcase size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Dashboard</span>
          </Link>
          <Link href={isLoggedIn ? `/dashboard/${userRole}/?tab=perfil` : '/auth/login/'} className="flex flex-col items-center gap-0.5 py-1">
            <User size={22} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Perfil</span>
          </Link>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 h-screen fixed left-0 top-0 bg-white border-r border-ms-border z-40">
        <div className="p-6 border-b border-ms-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ms-blue rounded-lg flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
          </Link>
        </div>

        {isLoggedIn && (
          <div className="px-6 py-4 border-b border-ms-border">
            <p className="text-sm font-medium text-ms-dark">{userName || 'Utilizador'}</p>
            <p className="text-xs text-ms-gray capitalize">{userRole}</p>
          </div>
        )}

        <nav className="flex-1 py-4 px-3">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium bg-ms-purple-light text-ms-purple mb-1">
            <HomeIcon size={18} /> Início
          </Link>
          <Link href="/vagas/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1">
            <Search size={18} /> Pesquisar
          </Link>
          <Link href="/trabalho-rapido/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-orange-500 hover:bg-orange-50 mb-1">
            <Zap size={18} /> Trabalho Rápido
          </Link>
          {isLoggedIn ? (
            <>
              <Link href={`/dashboard/${userRole}/`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1">
                <Briefcase size={18} /> Dashboard
              </Link>
              <Link href={`/dashboard/${userRole}/?tab=perfil`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1">
                <User size={18} /> Perfil
              </Link>
              <Link href="/pessoas/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1">
                <Users size={18} /> Pessoas
              </Link>
              <Link href="/mensagens/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1">
                <MessageSquare size={18} /> Mensagens
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1">
                <User size={18} /> Entrar
              </Link>
              <Link href="/auth/registar/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:bg-ms-surface mb-1">
                <FileText size={18} /> Registar
              </Link>
            </>
          )}
        </nav>

        {isLoggedIn && (
          <div className="p-4 border-t border-ms-border">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-red hover:bg-red-50 transition-colors">
              <LogOut size={18} /> Terminar Sessão
            </button>
          </div>
        )}
      </aside>
      <InstallPWA />
    </div>
  )
}
