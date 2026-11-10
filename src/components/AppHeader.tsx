'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search, Home as HomeIcon, Briefcase, Users, MessageSquare, Zap, Megaphone, FileText,
  LogIn, LogOut, LayoutDashboard, ChevronDown, ClipboardList, Building2, LayoutGrid, UsersRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import NotificationsBell from '@/components/NotificationsBell'
import ProfileAvatar from '@/components/ProfileAvatar'

type NavKey = 'home' | 'vagas' | 'empresas' | 'comunidades' | 'rapido' | 'anuncios' | 'pessoas' | 'mensagens' | 'candidaturas' | 'dashboard' | 'perfil' | 'entrar' | 'conta'

interface HeaderUser {
  id: string
  nome: string
  role: string
  avatar_url?: string | null
}

interface NavItem {
  key: NavKey
  label: string
  href: string
  icon: typeof HomeIcon
  accent?: boolean
  match?: (path: string) => boolean
}

// Topo estilo LinkedIn: poucos separadores principais; o resto vive no menu da conta.
const MAIN_NAV: NavItem[] = [
  { key: 'home', label: 'Início', href: '/', icon: HomeIcon, match: (p) => p === '/' },
  { key: 'vagas', label: 'Vagas', href: '/vagas/', icon: Briefcase, match: (p) => p.startsWith('/vagas') },
  { key: 'pessoas', label: 'Rede', href: '/pessoas/', icon: Users, match: (p) => p.startsWith('/pessoas') },
  { key: 'mensagens', label: 'Mensagens', href: '/mensagens/', icon: MessageSquare, match: (p) => p.startsWith('/mensagens') },
  { key: 'rapido', label: 'Rápido', href: '/trabalho-rapido/', icon: Zap, match: (p) => p.startsWith('/trabalho-rapido') },
]

const MORE_NAV: NavItem[] = [
  { key: 'empresas', label: 'Empresas', href: '/empresas/', icon: Building2 },
  { key: 'comunidades', label: 'Comunidades', href: '/comunidades/', icon: UsersRound },
  { key: 'pessoas', label: 'Rede de pessoas', href: '/pessoas/', icon: Users },
  { key: 'mensagens', label: 'Mensagens', href: '/mensagens/', icon: MessageSquare },
  { key: 'anuncios', label: 'Anunciar', href: '/anuncios/', icon: Megaphone },
]

export default function AppHeader({ searchDefault = '' }: { searchDefault?: string }) {
  const pathname = usePathname() || '/'
  const router = useRouter()
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState(searchDefault)
  const menuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async (email?: string | null, fallbackId?: string) => {
      if (!email) { setUser(null); setReady(true); return }
      const { data } = await supabase.from('users').select('id, nome, role, avatar_url').eq('email', email).single()
      setUser({
        id: data?.id || fallbackId || '',
        nome: data?.nome || email.split('@')[0],
        role: data?.role || 'candidato',
        avatar_url: data?.avatar_url || null,
      })
      setReady(true)
    }
    supabase.auth.getSession().then(({ data: { session } }) => load(session?.user?.email, session?.user?.id))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => load(session?.user?.email, session?.user?.id))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => { const t = e.target as Node; if (!menuRef.current?.contains(t) && !mobileMenuRef.current?.contains(t)) setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMenuOpen(false)
    window.location.href = '/'
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/vagas/?q=${encodeURIComponent(q)}` : '/vagas/')
  }

  const dashboardHref = `/dashboard/${user?.role || 'candidato'}/`
  const profileHref = user?.role === 'candidato' ? `/pessoas/perfil/?id=${user.id}` : `${dashboardHref}?tab=perfil`
  const isActive = (item: NavItem) => (item.match ? item.match(pathname) : false)
  const close = () => setMenuOpen(false)

  const NavTab = ({ item }: { item: NavItem }) => {
    const Icon = item.icon
    const active = isActive(item)
    return (
      <Link
        href={item.href}
        className={`group relative flex flex-col items-center justify-center gap-0.5 min-w-[72px] px-2 pt-2 pb-1.5 transition-colors ${active ? 'text-ms-dark' : 'text-ms-gray hover:text-ms-dark'}`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={21} strokeWidth={active ? 2.4 : 1.9} className={active ? 'text-ms-blue' : ''} />
        <span className="text-[11px] font-medium whitespace-nowrap">{item.label}</span>
        <span className={`absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-ms-dark transition-transform duration-200 origin-center ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`} />
      </Link>
    )
  }

  const menuRow = 'flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-ms-dark hover:bg-ms-blue/5 active:bg-ms-blue/10 transition-colors'

  const menuPanel = (
    <div className="ms-menu-in absolute right-0 top-[46px] w-[272px] max-h-[78vh] overflow-y-auto rounded-3xl bg-white border border-ms-border/60 shadow-[0_18px_50px_-12px_rgba(33,33,33,0.28)] ring-1 ring-black/5 z-[70]">
      {user ? (
        <Link href={profileHref} onClick={close} className="flex items-center gap-3 px-4 pt-4 pb-3">
          <ProfileAvatar url={user.avatar_url} name={user.nome} size={44} />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-ms-dark truncate">{user.nome}</span>
            <span className="block text-[11px] text-ms-blue font-semibold">Ver perfil</span>
          </span>
        </Link>
      ) : (
        <div className="px-4 pt-4 pb-3">
          <p className="text-sm font-bold text-ms-dark">Bem-vindo ao MÔ SALO</p>
          <p className="text-[11px] text-ms-gray mt-0.5">Entra para te candidatares e guardares vagas.</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link href="/auth/login/" onClick={close} className="text-center text-xs font-bold text-ms-blue border border-ms-blue/40 rounded-full py-2 press">Entrar</Link>
            <Link href="/auth/registar/" onClick={close} className="text-center text-xs font-bold text-white bg-ms-blue rounded-full py-2 press">Criar conta</Link>
          </div>
        </div>
      )}
      {user && (
        <div className="border-t border-ms-border/70 py-1">
          <Link href={dashboardHref} onClick={close} className={menuRow}><LayoutDashboard size={17} className="text-ms-gray" /> Painel</Link>
          <Link href="/candidaturas/" onClick={close} className={menuRow}><ClipboardList size={17} className="text-ms-gray" /> Minhas candidaturas</Link>
        </div>
      )}
      <div className="border-t border-ms-border/70 py-1">
        <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ms-gray">Explorar</p>
        {MORE_NAV.map((item) => {
          const Icon = item.icon
          return <Link key={item.key} href={item.href} onClick={close} className={menuRow}><Icon size={17} className="text-ms-gray" /> {item.label}</Link>
        })}
        <Link href="/modelos-cv/" onClick={close} className={menuRow}><FileText size={17} className="text-ms-gray" /> Modelos de CV</Link>
      </div>
      {user && (
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-red-600 hover:bg-red-50 border-t border-ms-border/70"><LogOut size={17} /> Terminar sessão</button>
      )}
    </div>
  )

  const searchPill = (className: string) => (
    <form onSubmit={submitSearch} className={`relative ${className}`} role="search">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ms-gray pointer-events-none" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Pesquisar vagas, empresas…"
        aria-label="Pesquisar vagas"
        enterKeyHint="search"
        className="w-full h-9 bg-ms-surface/90 rounded-full pl-9 pr-4 text-[13px] text-ms-dark placeholder:text-ms-gray outline-none border border-transparent focus:bg-white focus:border-ms-blue/40 focus:ring-4 focus:ring-ms-blue/10 transition"
      />
    </form>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-ms-border/70" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Desktop */}
      <div className="hidden lg:flex max-w-6xl mx-auto items-stretch justify-between px-4 gap-4 h-[54px]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/" className="flex items-center flex-shrink-0" aria-label="MÔ SALO">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>
          {searchPill('w-full max-w-[300px]')}
        </div>
        <nav className="flex items-stretch" aria-label="Navegação principal">
          {MAIN_NAV.map((item) => <NavTab key={item.key} item={item} />)}
        </nav>
        <div className="flex items-center gap-2 flex-shrink-0 pl-3 border-l border-ms-border/70">
          {ready && user && <NotificationsBell />}
          {ready && !user && (
            <>
              <Link href="/auth/login/" className="text-xs font-bold text-ms-blue rounded-full px-4 py-2 hover:bg-ms-blue/5">Entrar</Link>
              <Link href="/auth/registar/" className="text-xs font-bold text-white bg-ms-blue rounded-full px-4 py-2 press">Criar conta</Link>
            </>
          )}
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 hover:bg-ms-surface transition-colors" aria-label="Menu" aria-expanded={menuOpen}>
              {user ? <ProfileAvatar url={user.avatar_url} name={user.nome} size={32} /> : <span className="w-8 h-8 rounded-full bg-ms-surface flex items-center justify-center text-ms-dark"><LayoutGrid size={16} /></span>}
              <ChevronDown size={14} className={`text-ms-gray transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && menuPanel}
          </div>
        </div>
      </div>

      {/* Mobile — uma só linha: logo, pesquisa, sino, conta. A navegação fica na barra de baixo. */}
      <div className="lg:hidden flex items-center gap-2 px-3 h-[52px]">
        <Link href="/" className="flex-shrink-0" aria-label="MÔ SALO">
          <Logo variant="icon" className="h-9 w-9" />
        </Link>
        {searchPill('flex-1 min-w-0')}
        {ready && user && <NotificationsBell />}
        {ready && !user && (
          <Link href="/auth/login/" className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-white bg-ms-blue rounded-full px-3.5 h-9 press"><LogIn size={14} /> Entrar</Link>
        )}
        <div ref={mobileMenuRef} className="relative flex-shrink-0">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center justify-center rounded-full press" aria-label="Menu" aria-expanded={menuOpen}>
            {user ? <ProfileAvatar url={user.avatar_url} name={user.nome} size={34} /> : <span className="w-9 h-9 rounded-full bg-ms-surface flex items-center justify-center text-ms-dark"><LayoutGrid size={17} /></span>}
          </button>
          {menuOpen && menuPanel}
        </div>
      </div>
    </header>
  )
}
