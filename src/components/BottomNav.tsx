'use client'

import Link from 'next/link'
import { Home, Search, Briefcase, User, CreditCard, Eye, Users, Plus } from 'lucide-react'

interface BottomNavProps {
  active: string
  userRole?: 'candidato' | 'recrutador' | 'admin'
  onTabChange?: (tab: string) => void
}

export default function BottomNav({ active, userRole, onTabChange }: BottomNavProps) {
  const candidatoItems: { key: string; icon: typeof Home; label: string; href?: string }[] = [
    { key: 'home', icon: Home, label: 'Início', href: '/' },
    { key: 'search', icon: Search, label: 'Vagas', href: '/vagas/' },
    { key: 'subscricao', icon: CreditCard, label: 'Pagamento' },
    { key: 'perfil', icon: User, label: 'Perfil' },
  ]

  const recrutadorItems: { key: string; icon: typeof Home; label: string; href?: string }[] = [
    { key: 'home', icon: Home, label: 'Início' },
    { key: 'vagas', icon: Eye, label: 'Vagas' },
    { key: 'candidatos', icon: Users, label: 'Candidatos' },
    { key: 'nova_vaga', icon: Plus, label: 'Publicar' },
  ]

  const adminItems: { key: string; icon: typeof Home; label: string; href?: string }[] = [
    { key: 'home', icon: Home, label: 'Início' },
    { key: 'vagas', icon: Briefcase, label: 'Vagas' },
    { key: 'recrutadores', icon: Users, label: 'Aprovar' },
    { key: 'pagamentos', icon: CreditCard, label: 'Pagamentos' },
  ]

  const items = userRole === 'recrutador' ? recrutadorItems : userRole === 'admin' ? adminItems : candidatoItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key

          if (item.href) {
            return (
              <Link key={item.key} href={item.href} className="flex flex-col items-center gap-0.5 py-1">
                <Icon size={22} className={isActive ? 'text-ms-purple' : 'text-gray-400'} />
                <span className={`text-[10px] ${isActive ? 'text-ms-purple font-medium' : 'text-gray-400'}`}>{item.label}</span>
              </Link>
            )
          }

          return (
            <button key={item.key} onClick={() => onTabChange?.(item.key)} className="flex flex-col items-center gap-0.5 py-1">
              <Icon size={22} className={isActive ? 'text-ms-purple' : 'text-gray-400'} />
              <span className={`text-[10px] ${isActive ? 'text-ms-purple font-medium' : 'text-gray-400'}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
