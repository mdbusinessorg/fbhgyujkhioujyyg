'use client'

import { Zap, ArrowRight } from 'lucide-react'

interface ProBannerProps {
  role: 'admin' | 'recrutador' | 'candidato'
  daysRemaining?: number | null
  onClick?: () => void
}

const roleText = {
  admin: 'Controlo completo da plataforma e relatórios avançados.',
  recrutador: 'Publica vagas ilimitadas e destaca as tuas oportunidades.',
  candidato: 'Destaca o teu perfil e acede a vagas exclusivas.',
}

export function ProBanner({ role, daysRemaining, onClick }: ProBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-300 to-yellow-400 p-5 shadow-sm">
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-amber-900" />
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">MÔ SALO PRO</span>
          </div>
          <h3 className="text-base font-bold text-amber-950 mb-1">
            {daysRemaining !== null && daysRemaining !== undefined ? (
              daysRemaining > 0 ? `Faltam ${daysRemaining} dias no teu plano` : 'O teu plano expirou'
            ) : (
              'Upgrade para PRO'
            )}
          </h3>
          <p className="text-xs text-amber-900/80 max-w-xs">{roleText[role]}</p>
        </div>
        <button
          onClick={onClick}
          className="flex-shrink-0 bg-amber-950 text-white text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-1 hover:bg-amber-900 transition-colors"
        >
          {role === 'candidato' ? 'Ver planos' : 'Gerir'} <ArrowRight size={12} />
        </button>
      </div>
      <div className="absolute -right-6 -bottom-8 w-32 h-32 bg-white/20 rounded-full" />
    </div>
  )
}
