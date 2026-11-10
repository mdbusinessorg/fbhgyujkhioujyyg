'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Zap, User } from 'lucide-react'

// Barra de navegação inferior estilo iOS (app) para as páginas públicas.
// Referência: fundo branco translúcido, borda superior arredondada, item activo em círculo azul.
export default function PublicBottomNav() {
  const pathname = usePathname() || '/'

  // Não mostrar no dashboard (que tem a sua própria BottomNav) nem em auth/onboarding.
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/admin')
  ) {
    return null
  }

  const items = [
    { key: 'home', label: 'Início', href: '/', icon: Home, active: pathname === '/' },
    { key: 'vagas', label: 'Vagas', href: '/vagas/', icon: Search, active: pathname.startsWith('/vagas') },
    { key: 'rapido', label: 'Rápido', href: '/trabalho-rapido/', icon: Zap, active: pathname.startsWith('/trabalho-rapido'), accent: true },
    {
      key: 'perfil',
      label: 'Perfil',
      href: '/dashboard/candidato/',
      icon: User,
      active: pathname.startsWith('/dashboard') || pathname.startsWith('/candidaturas') || pathname.startsWith('/pessoas/perfil'),
    },
  ]

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/85 backdrop-blur-xl border-t border-ms-border/70 rounded-t-[28px] shadow-[0_-10px_36px_rgba(33,33,33,0.10)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Navegação principal"
      >
        <div className="flex items-stretch justify-around px-2 pt-2 pb-2 max-w-md mx-auto">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                href={item.href}
                className="flex flex-col items-center gap-1 flex-1 py-1"
                aria-current={item.active ? 'page' : undefined}
              >
                <span
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                    item.active
                      ? 'bg-ms-blue text-white shadow-[0_6px_16px_rgba(66,165,245,0.4)] scale-105'
                      : item.accent
                        ? 'bg-ms-blue/10 text-ms-blue'
                        : 'text-ms-gray'
                  }`}
                >
                  <Icon size={20} strokeWidth={item.active ? 2.4 : 2} />
                </span>
                <span
                  className={`text-[10px] leading-none transition-colors ${
                    item.active ? 'font-bold text-ms-blue' : 'font-medium text-ms-gray'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
      {/* Espaçador para o conteúdo não ficar por baixo da barra */}
      <div className="lg:hidden h-24" aria-hidden />
    </>
  )
}
