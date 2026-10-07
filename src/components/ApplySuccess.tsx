'use client'

import Link from 'next/link'
import { X } from 'lucide-react'

interface ApplySuccessProps {
  open: boolean
  title?: string
  message?: string
  onClose: () => void
}

// Full-screen success overlay shown after a successful candidatura.
export default function ApplySuccess({ open, title = 'Candidatura Enviada!', message = 'A empresa recebeu a tua candidatura. Boa sorte!', onClose }: ApplySuccessProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-in" onClick={onClose} />
      <div className="apply-success-in relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl px-6 pt-10 pb-8 text-center shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-ms-gray hover:text-ms-dark" aria-label="Fechar">
          <X size={18} />
        </button>
        <svg className="success-circle mx-auto" width="88" height="88" viewBox="0 0 88 88" fill="none">
          <circle cx="44" cy="44" r="40" stroke="#186cff" strokeWidth="5" opacity="0.15" />
          <circle cx="44" cy="44" r="40" stroke="#186cff" strokeWidth="5" strokeLinecap="round" strokeDasharray="252" strokeDashoffset="63" />
          <path className="success-check" d="M28 45 L39 56 L61 33" stroke="#186cff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <h3 className="text-lg font-extrabold text-ms-dark mt-5">{title}</h3>
        <p className="text-sm text-ms-gray mt-2 leading-relaxed">{message}</p>
        <div className="flex flex-col gap-2 mt-6">
          <Link href="/candidaturas/" className="w-full bg-ms-blue text-white text-sm font-bold py-3 rounded-2xl press">
            Ir para as minhas candidaturas
          </Link>
          <button onClick={onClose} className="w-full bg-ms-surface text-ms-dark text-sm font-bold py-3 rounded-2xl border border-ms-border press">
            Continuar a ver vagas
          </button>
        </div>
      </div>
    </div>
  )
}
