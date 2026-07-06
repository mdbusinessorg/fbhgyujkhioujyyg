'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Home, Search, Heart, User, CreditCard, Eye, Users, Plus, LayoutGrid } from 'lucide-react'

interface BottomNavProps {
  active: string
  userRole?: 'candidato' | 'recrutador' | 'admin'
  onTabChange?: (tab: string) => void
}

export default function BottomNav({ active, userRole, onTabChange }: BottomNavProps) {
  type NavItem = {
    key: string
    icon: LucideIcon
    label: string
    href?: string
    tab?: string
    filledOnActive?: boolean
  }

  const candidatoItems: NavItem[] = [
    { key: 'home', icon: Home, label: 'Início', tab: 'home', href: '/dashboard/candidato/' },
    { key: 'vagas', icon: Search, label: 'Vagas', href: '/vagas/' },
    { key: 'favoritos', icon: Heart, label: 'Favoritos', href: '/favoritos/', filledOnActive: true },
    { key: 'perfil', icon: User, label: 'Perfil', tab: 'perfil', href: '/dashboard/candidato/?tab=perfil' },
  ]

  const recrutadorItems: NavItem[] = [
    { key: 'home', icon: Home, label: 'Início', tab: 'home', href: '/dashboard/recrutador/' },
    { key: 'vagas', icon: Eye, label: 'Vagas', tab: 'vagas', href: '/dashboard/recrutador/?tab=vagas' },
    { key: 'candidatos', icon: Users, label: 'Candidatos', tab: 'candidatos', href: '/dashboard/recrutador/?tab=candidatos' },
    { key: 'nova_vaga', icon: Plus, label: 'Publicar', tab: 'nova_vaga', href: '/dashboard/recrutador/?tab=nova_vaga' },
  ]

  const adminItems: NavItem[] = [
    { key: 'home', icon: Home, label: 'Início', tab: 'home', href: '/dashboard/admin/' },
    { key: 'recrutadores', icon: LayoutGrid, label: 'Gestão', tab: 'recrutadores', href: '/dashboard/admin/?tab=recrutadores' },
    { key: 'utilizadores', icon: Users, label: 'Utilizadores', tab: 'utilizadores', href: '/dashboard/admin/?tab=utilizadores' },
    { key: 'pagamentos', icon: CreditCard, label: 'Pagamentos', tab: 'pagamentos', href: '/dashboard/admin/?tab=pagamentos' },
  ]

  const items = userRole === 'admin' ? adminItems : userRole === 'recrutador' ? recrutadorItems : candidatoItems

  const baseItemClasses = 'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 transition-colors'
  const activeItemClasses = 'text-ms-blue bg-ms-blue/10'
  const inactiveItemClasses = 'text-gray-400'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-ms-border bg-white shadow-[0_-8px_24px_rgba(17,24,39,0.06)] lg:hidden">
      <div className="mx-auto flex max-w-md items-end justify-around gap-1 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          const iconClass = isActive ? 'text-ms-blue' : 'text-gray-400'

          const iconNode = (
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${isActive ? 'bg-ms-blue/10 text-ms-blue' : 'bg-transparent text-gray-400'}`}>
              <Icon size={21} strokeWidth={isActive ? 2.4 : 2} fill={isActive && item.filledOnActive ? 'currentColor' : 'none'} className={iconClass} />
            </span>
          )

          const labelNode = (
            <span className={`text-[10px] leading-none ${isActive ? 'font-semibold text-ms-blue' : 'text-gray-400'}`}>
              {item.label}
            </span>
          )

          if (item.tab && onTabChange) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.tab || item.key)}
                className={`${baseItemClasses} ${isActive ? activeItemClasses : inactiveItemClasses}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {iconNode}
                {labelNode}
              </button>
            )
          }

          if (item.href) {
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`${baseItemClasses} ${isActive ? activeItemClasses : inactiveItemClasses}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {iconNode}
                {labelNode}
              </Link>
            )
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange?.(item.key)}
              className={`${baseItemClasses} ${isActive ? activeItemClasses : inactiveItemClasses}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {iconNode}
              {labelNode}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
