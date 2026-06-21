'use client'

import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionBannerProps {
  daysRemaining: number
}

export default function SubscriptionBanner({ daysRemaining }: SubscriptionBannerProps) {
  if (daysRemaining > 7) return null

  if (daysRemaining <= 0) return null // Modal handles this case

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2">
      <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
      <span className="text-sm text-amber-800">
        A sua subscrição expira em <strong>{daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}</strong>.
      </span>
      <Link href="/dashboard/candidato?tab=subscricao" className="text-sm font-semibold text-ms-blue hover:underline ml-1">
        Renovar agora →
      </Link>
    </div>
  )
}
