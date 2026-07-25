'use client'

import { ShieldCheck } from 'lucide-react'

export default function VerifiedBadge({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} title="Recrutador Verificado">
      <ShieldCheck size={size} className="text-ms-blue fill-blue-50" />
    </span>
  )
}
