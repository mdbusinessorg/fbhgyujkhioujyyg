'use client'

import Link from 'next/link'
import { Home, Search, Heart, User, Briefcase, BarChart3, Wallet } from 'lucide-react'

interface BottomNavProps {
  active: 'home' | 'search' | 'saved' | 'profile' | 'vagas' | 'stats'
  userRole?: 'candidato' | 'recrutador' | 'admin'
}

export default function BottomNav({ active, userRole }: BottomNavProps) {
  const candidatoItems = [
    { key: 'home', icon: Home, href: '/dashboard/candidato', label: 'Início' },
    { key: 'vagas', icon: Briefcase, href: '/vagas', label: 'Vagas' },
    { key: 'saved', icon: Heart, href: '/dashboard/candidato?tab=guardados', label: 'Guardados' },
    { key: 'stats', icon: BarChart3, href: '/dashboard/candidato?tab=stats', label: 'Stats' },
    { key: 'profile', icon: User, href: '/dashboard/candidato?tab=perfil', label: 'Perfil' },
  ]

  const recrutadorItems = [
    { key: 'home', icon: Home, href: '/dashboard/recrutador', label: 'Início' },
    { key: 'vagas', icon: Briefcase, href: '/dashboard/recrutador?tab=vagas', label: 'Vagas' },
    { key: 'stats', icon: BarChart3, href: '/dashboard/recrutador?tab=analytics', label: 'Stats' },
    { key: 'profile', icon: User, href: '/dashboard/recrutador?tab=perfil', label: 'Perfil' },
  ]

  const items = userRole === 'recrutador' ? recrutadorItems : candidatoItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border z-50 lg:hidden">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          const isFab = item.key === 'saved' && userRole !== 'recrutador'
          
          if (isFab) {
            return (
              <Link key={item.key} href={item.href} className="flex flex-col items-center -mt-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${isActive ? 'bg-ms-purple' : 'bg-ms-purple'}`}>
                  <Wallet size={20} className="text-white" />
                </div>
              </Link>
            )
          }

          return (
            <Link key={item.key} href={item.href} className="flex flex-col items-center gap-0.5 py-1">
              <Icon size={22} className={isActive ? 'text-ms-purple' : 'text-gray-400'} />
              <span className={`text-[10px] ${isActive ? 'text-ms-purple font-medium' : 'text-gray-400'}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
