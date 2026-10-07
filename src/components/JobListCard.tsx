'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bookmark, Share2, Check, Info } from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'
import { toast } from '@/lib/toast'

interface JobListCardProps {
  id: string
  href: string
  title: string
  company?: string
  logoUrl?: string | null
  location?: string
  /** muted spec row, like "Efetivo · Remoto · Sénior" */
  specs?: (string | null | undefined)[]
  salary?: string
  timeAgo?: string
  matchPct?: number
  isNew?: boolean
  isFeatured?: boolean
  isExternal?: boolean
  excerpt?: string
  loggedIn: boolean
  bookmarkKey: string
  saved: boolean
  onToggleSave: () => void
  applyLabel: string
  index?: number
}

export default function JobListCard({
  href,
  title,
  company,
  logoUrl,
  location,
  specs,
  salary,
  timeAgo,
  matchPct = 0,
  isNew,
  isFeatured,
  isExternal,
  excerpt,
  loggedIn,
  saved,
  onToggleSave,
  applyLabel,
  index = 0,
}: JobListCardProps) {
  const [copied, setCopied] = useState(false)

  const share = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}${href}`
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url).catch(() => {})
      toast('Link copiado', 'info')
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleSave()
  }

  const specLine = (specs || []).filter(Boolean).join(' · ')

  return (
    <Link href={href} className="block jobcard-enter" style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}>
      <div className={`bg-white rounded-2xl border p-4 press hover:shadow-md transition-shadow relative ${isFeatured ? 'border-amber-200 bg-gradient-to-br from-amber-50/60 to-white' : 'border-ms-border'} hover:border-ms-blue/40`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CompanyLogo company={company || ''} logoUrl={logoUrl || undefined} size={46} rounded="rounded-xl" className="border border-ms-border/60" />
          </div>
          <div className="flex-1 min-w-0 pr-9">
            <h3 className="font-bold text-ms-dark text-[15px] leading-snug line-clamp-2">{title}</h3>
            <p className="text-xs text-ms-gray mt-0.5 truncate">
              {company}
              {location ? ` · ${location}` : ''}
            </p>
            {specLine && (
              <p className="text-[11px] text-ms-gray/80 mt-1.5 truncate">{specLine}</p>
            )}
          </div>
          <button
            onClick={onBookmark}
            aria-label={saved ? 'Remover das guardadas' : 'Guardar vaga'}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${saved ? 'bg-ms-blue/10 text-ms-blue' : 'bg-transparent text-ms-gray/60 hover:text-ms-blue hover:bg-ms-surface'}`}
          >
            <Bookmark size={17} className={saved ? 'anim-pop' : ''} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {loggedIn && excerpt && (
          <p className="text-xs text-ms-gray mt-2.5 leading-relaxed line-clamp-2">{excerpt}</p>
        )}
        {!loggedIn && (
          <p className="text-xs text-ms-blue mt-2.5">Entra para ver a descrição completa</p>
        )}

        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          {isNew && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">NOVA</span>}
          {isFeatured && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">DESTAQUE</span>}
          {matchPct >= 40 && <span className="text-[10px] font-bold text-white bg-ms-blue px-2 py-0.5 rounded-full">{matchPct}% match</span>}
          {salary && <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{salary}</span>}
        </div>

        {isExternal && (
          <p className="inline-flex items-center gap-1 mt-2 text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
            <Info size={10} /> Vaga externa — candidatura na fonte oficial
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ms-border/50">
          <span className="text-[11px] text-ms-gray inline-flex items-center gap-1">
            {timeAgo && <>{timeAgo}</>}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={share}
              aria-label="Partilhar vaga"
              className="w-8 h-8 rounded-full flex items-center justify-center text-ms-gray/70 hover:text-ms-blue hover:bg-ms-surface transition-colors"
            >
              {copied ? <Check size={15} className="text-emerald-600 anim-pop" /> : <Share2 size={15} />}
            </button>
            <span className="text-xs font-semibold text-white bg-ms-blue px-4 py-1.5 rounded-full">{applyLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
