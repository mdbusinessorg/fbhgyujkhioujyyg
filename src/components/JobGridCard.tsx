'use client'

import Link from 'next/link'
import { Heart, MapPin } from 'lucide-react'
import type { MouseEvent } from 'react'

interface JobGridCardProps {
  href: string
  title: string
  subtitle: string
  chip: string
  initials: string
  favoriteKey: string
  favorite: boolean
  salary?: string
  onToggleFavorite: (key: string, event: MouseEvent<HTMLButtonElement>) => void
}

const getInitials = (value: string) => {
  const cleaned = value.trim().split(/\s+/).filter(Boolean)
  if (cleaned.length === 0) return 'MS'
  if (cleaned.length === 1) return cleaned[0].slice(0, 2).toUpperCase()
  return `${cleaned[0][0]}${cleaned[1][0]}`.toUpperCase()
}

export default function JobGridCard({
  href,
  title,
  subtitle,
  chip,
  initials,
  favoriteKey,
  favorite,
  salary,
  onToggleFavorite,
}: JobGridCardProps) {
  const subtitleParts = subtitle.split('•').map((part) => part.trim()).filter(Boolean)
  const companyText = subtitleParts[0] || subtitle
  const locationText = subtitleParts.slice(1).join(' • ')

  return (
    <Link href={href} className="block h-full">
      <div className="relative flex h-full min-h-[168px] flex-col rounded-2xl border border-ms-border bg-white p-[18px] shadow-sm transition-shadow hover:shadow-md">
        <button
          type="button"
          onClick={(e) => onToggleFavorite(favoriteKey, e)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-ms-border bg-white text-ms-gray transition-colors hover:border-ms-blue hover:text-ms-blue"
          aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar vaga'}
        >
          <Heart
            size={14}
            fill={favorite ? 'currentColor' : 'none'}
            className={favorite ? 'text-red-500' : 'text-ms-gray'}
          />
        </button>

        <div className="flex flex-1 flex-col pr-11">
          <div className="flex items-start gap-3">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-ms-surface text-sm font-semibold text-ms-blue">
            {getInitials(initials)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-ms-blue/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ms-blue">
                {chip}
              </span>
              <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug text-ms-dark">
                {title}
              </h3>
              <div className="mt-1 space-y-0.5">
                <p className="line-clamp-1 text-[12px] font-medium text-ms-dark/90">
                  {companyText}
                </p>
                {locationText ? (
                  <p className="flex items-center gap-1 text-[12px] text-ms-gray">
                    <MapPin size={11} className="shrink-0" />
                    <span className="line-clamp-1">{locationText}</span>
                  </p>
                ) : (
                  <p className="line-clamp-1 text-[12px] text-ms-gray">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {salary && (
            <span className="mt-auto inline-flex w-fit rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
              {salary}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
