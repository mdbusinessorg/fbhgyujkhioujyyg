'use client'

import Link from 'next/link'
import { Home, Search, Briefcase, User, CreditCard, Eye, Users, Plus, Sparkles } from 'lucide-react'

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
    { key: 'jarvis', icon: Sparkles, label: 'Jarvis' },
    { key: 'pagamentos', icon: CreditCard, label: 'Pagamentos' },
  ]

  const items = userRole === 'recrutador' ? recrutadorItems : userRole === 'admin' ? adminItems : candidatoItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-white/40 lg:hidden rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around py-2.5 px-4 max-w-md mx-auto pb-safe">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key

          const content = (
            <div className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${isActive ? 'text-ms-blue' : 'text-ms-gray'}`}>
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-ms-blue/10 text-ms-blue' : 'bg-transparent'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] leading-none ${isActive ? 'font-semibold text-ms-blue' : 'font-medium'}`}>{item.label}</span>
            </div>
          )

          if (item.href) {
            return (
              <Link key={item.key} href={item.href}>
                {content}
              </Link>
            )
          }

          return (
            <button key={item.key} onClick={() => onTabChange?.(item.key)}>
              {content}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
