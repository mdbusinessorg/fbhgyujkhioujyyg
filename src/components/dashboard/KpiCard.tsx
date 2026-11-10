'use client'

import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: string
}

export function KpiCard({ title, value, subtitle, icon: Icon, color = '#1A56FF' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-[11px] text-gray-400 mt-1 truncate">{subtitle}</p>}
      </div>
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}14` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
    </div>
  )
}
