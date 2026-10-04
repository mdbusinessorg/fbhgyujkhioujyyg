'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search, Home as HomeIcon, Briefcase, Users, MessageSquare, Zap, Megaphone, FileText,
  LogIn, LogOut, User, LayoutDashboard, ChevronDown, X, ClipboardList, Building2,
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

const PUBLIC_NAV: NavItem[] = [
  { key: 'home', label: 'Início', href: '/', icon: HomeIcon, match: (p) => p === '/' },
  { key: 'vagas', label: 'Vagas', href: '/vagas/', icon: Search, match: (p) => p.startsWith('/vagas') },
  { key: 'empresas', label: 'Empresas', href: '/empresas/', icon: Building2, match: (p) => p.startsWith('/empresas') },
  { key: 'comunidades', label: 'Comunidades', href: '/comunidades/', icon: Users, match: (p) => p.startsWith('/comunidades') },
  { key: 'pessoas', label: 'Pessoas', href: '/pessoas/', icon: Users, match: (p) => p.startsWith('/pessoas') },
  { key: 'mensagens', label: 'Mensagens', href: '/mensagens/', icon: MessageSquare, match: (p) => p.startsWith('/mensagens') },
  { key: 'rapido', label: 'Rápido', href: '/trabalho-rapido/', icon: Zap, accent: true, match: (p) => p.startsWith('/trabalho-rapido') },
  { key: 'anuncios', label: 'Anunciar', href: '/anuncios/', icon: Megaphone, match: (p) => p.startsWith('/anuncios') },
]

export default function AppHeader({ searchDefault = '' }: { searchDefault?: string }) {
  const pathname = usePathname() || '/'
  const router = useRouter()
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const [query, setQuery] = useState(searchDefault)
  const menuRef = useRef<HTMLDivElement>(null)

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
    const onClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
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
    setMobileSearch(false)
  }

  const dashboardHref = `/dashboard/${user?.role || 'candidato'}/`
  const profileHref = user?.role === 'candidato' ? `/pessoas/perfil/?id=${user.id}` : `${dashboardHref}?tab=perfil`

  const authedNav: NavItem[] = [
    ...PUBLIC_NAV.slice(0, 6),
    { key: 'candidaturas', label: 'Candidaturas', href: '/candidaturas/', icon: ClipboardList, match: (p) => p.startsWith('/candidaturas') },
    ...PUBLIC_NAV.slice(6),
  ]
  const guestNav: NavItem[] = [
    ...PUBLIC_NAV,
    { key: 'entrar', label: 'Entrar', href: '/auth/login/', icon: LogIn },
    { key: 'conta', label: 'Criar Conta', href: '/auth/registar/', icon: FileText },
  ]
  const mobileNav = user ? authedNav : guestNav
  const desktopNav = user ? authedNav : PUBLIC_NAV

  const isActive = (item: NavItem) => (item.match ? item.match(pathname) : false)

  const NavTab = ({ item, compact }: { item: NavItem; compact?: boolean }) => {
    const Icon = item.icon
    const active = isActive(item)
    return (
      <Link
        href={item.href}
        className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg flex-shrink-0 transition-colors ${compact ? 'min-w-[54px] py-1.5 px-1 active:bg-ms-surface' : 'min-w-[68px] py-1.5 px-2 hover:bg-ms-surface'} ${active ? 'text-ms-blue' : item.accent ? 'text-ms-blue/80' : 'text-ms-dark'}`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={compact ? 19 : 20} strokeWidth={active ? 2.5 : 2} />
        <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-medium whitespace-nowrap`}>{item.label}</span>
        {active && !compact && <span className="absolute -bottom-1.5 left-2 right-2 h-0.5 rounded-full bg-ms-blue" />}
      </Link>
    )
  }

  const UserMenu = () => (
    <div ref={menuRef} className="relative">
      <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-1.5 rounded-full pl-0.5 pr-2 py-0.5 hover:bg-ms-surface" aria-label="Menu da conta">
        <ProfileAvatar url={user?.avatar_url} name={user?.nome} size={32} />
        <ChevronDown size={14} className="text-ms-gray hidden lg:block" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-11 w-60 bg-white rounded-2xl shadow-xl border border-ms-border z-[70] overflow-hidden">
          <div className="px-4 py-3 border-b border-ms-border">
            <p className="text-sm font-bold text-ms-dark truncate">{user?.nome}</p>
            <p className="text-[11px] text-ms-gray capitalize">{user?.role}</p>
          </div>
          <Link href={profileHref} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ms-dark hover:bg-ms-surface"><User size={16} /> O meu perfil</Link>
          <Link href={dashboardHref} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ms-dark hover:bg-ms-surface"><LayoutDashboard size={16} /> Dashboard</Link>
          <Link href="/candidaturas/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ms-dark hover:bg-ms-surface"><ClipboardList size={16} /> Minhas candidaturas</Link>
          <Link href="/modelos-cv/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ms-dark hover:bg-ms-surface"><FileText size={16} /> Modelos de CV</Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-ms-border"><LogOut size={16} /> Terminar sessão</button>
        </div>
      )}
    </div>
  )

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-ms-border">
      {/* Desktop */}
      <div className="hidden lg:flex max-w-7xl mx-auto items-center justify-between px-4 py-1.5 gap-6">
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href="/" className="flex items-center" aria-label="MÔ SALO">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>
          <form onSubmit={submitSearch} className="relative w-64 xl:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ms-gray" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que procuras?"
              aria-label="Pesquisar vagas"
              className="w-full bg-ms-surface rounded-full pl-9 pr-4 py-2 text-sm text-ms-dark placeholder:text-ms-gray outline-none focus:ring-2 focus:ring-ms-blue/20"
            />
          </form>
        </div>
        <nav className="flex items-center gap-1" aria-label="Navegação principal">
          {desktopNav.map((item) => <NavTab key={item.key} item={item} />)}
        </nav>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ready && user ? (
            <>
              <NotificationsBell />
              <UserMenu />
            </>
          ) : ready ? (
            <>
              <Link href="/auth/login/" className="text-xs font-bold text-ms-blue border border-ms-blue rounded-xl px-4 py-2 hover:bg-ms-blue/5">Entrar</Link>
              <Link href="/auth/registar/" className="text-xs font-bold text-white bg-ms-blue rounded-xl px-4 py-2 hover:bg-blue-700">Criar Conta</Link>
            </>
          ) : (
            <span className="w-9 h-9 rounded-full bg-ms-surface" />
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          {mobileSearch ? (
            <form onSubmit={submitSearch} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ms-gray" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="O que procuras?"
                  className="w-full bg-ms-surface rounded-full pl-9 pr-3 py-2 text-sm text-ms-dark outline-none"
                />
              </div>
              <button type="button" onClick={() => setMobileSearch(false)} className="p-1.5 text-ms-gray" aria-label="Fechar pesquisa"><X size={20} /></button>
            </form>
          ) : (
            <>
              <Link href="/" className="flex items-center" aria-label="MÔ SALO">
                <Logo variant="full" className="h-7 w-auto" />
              </Link>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setMobileSearch(true)} className="w-9 h-9 rounded-full bg-ms-surface flex items-center justify-center text-ms-dark" aria-label="Pesquisar">
                  <Search size={18} />
                </button>
                {ready && user ? (
                  <>
                    <NotificationsBell />
                    <UserMenu />
                  </>
                ) : ready ? (
                  <Link href="/auth/login/" className="w-9 h-9 rounded-full bg-ms-blue flex items-center justify-center text-white" aria-label="Entrar"><LogIn size={17} /></Link>
                ) : null}
              </div>
            </>
          )}
        </div>
        <nav className="flex items-center gap-0.5 overflow-x-auto px-2 pb-1 no-scrollbar scrollbar-hide border-t border-ms-border/60" aria-label="Navegação principal">
          {mobileNav.map((item) => <NavTab key={item.key} item={item} compact />)}
          {user && (
            <NavTab item={{ key: 'dashboard', label: 'Dashboard', href: dashboardHref, icon: Briefcase, match: (p) => p.startsWith('/dashboard') }} compact />
          )}
        </nav>
      </div>
    </header>
  )
}
