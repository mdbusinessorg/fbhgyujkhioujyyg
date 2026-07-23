'use client'

import { ArrowRight, Users, Briefcase, FileText } from 'lucide-react'

interface LatestListProps {
  title: string
  items: { id: string; icon?: 'user' | 'briefcase' | 'file' | 'default'; title: string; subtitle: string; meta: string; action?: () => void }[]
  onSeeAll?: () => void
}

const iconMap = {
  user: Users,
  briefcase: Briefcase,
  file: FileText,
  default: FileText,
}

export function LatestList({ title, items, onSeeAll }: LatestListProps) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-xs text-ms-blue font-medium flex items-center gap-0.5">
            Ver todos <ArrowRight size={12} />
          </button>
        )}
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Nenhum registo recente</p>
        ) : (
          items.slice(0, 5).map((item) => {
            const Icon = iconMap[item.icon || 'default']
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center gap-3 text-left hover:bg-gray-50 p-2 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-ms-purple-light rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-ms-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-800">{item.meta}</p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
