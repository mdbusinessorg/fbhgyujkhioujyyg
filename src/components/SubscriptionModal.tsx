'use client'

import { CreditCard } from 'lucide-react'

interface SubscriptionModalProps {
  show: boolean
  onDismiss: () => void
}

export default function SubscriptionModal({ show, onDismiss }: SubscriptionModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center">
        <div className="w-16 h-16 bg-ms-purple-light rounded-full flex items-center justify-center mx-auto mb-5">
          <CreditCard size={28} className="text-ms-purple" />
        </div>
        <h2 className="text-xl font-bold text-ms-dark mb-2">Subscrição Expirada</h2>
        <p className="text-sm text-ms-gray mb-6">
          O seu plano expirou. Renove para continuar a aceder a todas as funcionalidades.
        </p>
        <div className="bg-ms-surface rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-ms-dark mb-2">Dados de pagamento:</p>
          <p className="text-xs text-ms-gray">Multicaixa Express: <strong>926 115 429</strong></p>
          <p className="text-xs text-ms-gray">IBAN: <strong>0005.0000.0626.9321.1011.5</strong></p>
          <p className="text-xs text-ms-gray mt-1">Valor: <strong>1.000 Kz/mês</strong></p>
        </div>
        <button className="w-full bg-ms-blue text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors mb-3">
          Renovar Subscrição
        </button>
        <button onClick={onDismiss} className="text-sm text-ms-gray hover:text-ms-dark transition-colors">
          Continuar com acesso limitado
        </button>
      </div>
    </div>
  )
}
