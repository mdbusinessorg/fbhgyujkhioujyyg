'use client'

import Link from 'next/link'
import { Home, Search, Heart, User, Briefcase, BarChart3, LogOut, Settings, UserCheck, CreditCard } from 'lucide-react'

interface SidebarProps {
  active: string
  userRole: 'candidato' | 'recrutador' | 'admin'
  userName?: string
}

export default function Sidebar({ active, userRole, userName }: SidebarProps) {
  const candidatoLinks = [
    { key: 'home', icon: Home, label: 'Início', href: '/dashboard/candidato' },
    { key: 'vagas', icon: Search, label: 'Pesquisar Vagas', href: '/vagas' },
    { key: 'saved', icon: Heart, label: 'Guardados', href: '/dashboard/candidato?tab=guardados' },
    { key: 'candidaturas', icon: Briefcase, label: 'Candidaturas', href: '/dashboard/candidato?tab=candidaturas' },
    { key: 'profile', icon: User, label: 'Perfil', href: '/dashboard/candidato?tab=perfil' },
  ]

  const recrutadorLinks = [
    { key: 'home', icon: Home, label: 'Início', href: '/dashboard/recrutador' },
    { key: 'vagas', icon: Briefcase, label: 'Minhas Vagas', href: '/dashboard/recrutador?tab=vagas' },
    { key: 'candidatos', icon: User, label: 'Candidatos', href: '/dashboard/recrutador?tab=candidatos' },
    { key: 'analytics', icon: BarChart3, label: 'Relatórios', href: '/dashboard/recrutador?tab=analytics' },
    { key: 'profile', icon: Settings, label: 'Perfil', href: '/dashboard/recrutador?tab=perfil' },
  ]

  const adminLinks = [
    { key: 'home', icon: Home, label: 'Início', href: '/dashboard/admin' },
    { key: 'recrutadores', icon: UserCheck, label: 'Aprovar Recrutadores', href: '/dashboard/admin?tab=recrutadores' },
    { key: 'vagas', icon: Briefcase, label: 'Aprovar Vagas', href: '/dashboard/admin?tab=vagas' },
    { key: 'utilizadores', icon: User, label: 'Utilizadores', href: '/dashboard/admin?tab=utilizadores' },
    { key: 'subscricoes', icon: CreditCard, label: 'Subscrições', href: '/dashboard/admin?tab=subscricoes' },
    { key: 'config', icon: Settings, label: 'Configurações', href: '/dashboard/admin?tab=config' },
  ]

  const links = userRole === 'admin' ? adminLinks : userRole === 'recrutador' ? recrutadorLinks : candidatoLinks

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 h-screen fixed left-0 top-0 bg-white border-r border-ms-border z-40">
      <div className="p-6 border-b border-ms-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ms-blue rounded-lg flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
        </Link>
      </div>

      {userName && (
        <div className="px-6 py-4 border-b border-ms-border">
          <p className="text-sm font-medium text-ms-dark">{userName}</p>
          <p className="text-xs text-ms-gray capitalize">{userRole}</p>
        </div>
      )}

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = active === link.key
          return (
            <Link
              key={link.key}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
                isActive
                  ? 'bg-ms-purple-light text-ms-purple'
                  : 'text-ms-gray hover:bg-ms-surface'
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-ms-border">
        <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ms-gray hover:text-ms-red hover:bg-red-50 transition-colors">
          <LogOut size={18} />
          Sair
        </Link>
      </div>
    </aside>
  )
}
