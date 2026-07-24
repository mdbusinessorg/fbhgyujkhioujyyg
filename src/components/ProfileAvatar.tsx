'use client'

import { User } from 'lucide-react'
import { SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'

function getSrc(url?: string | null) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${url}`
}

export default function ProfileAvatar({
  url,
  name,
  size = 40,
  className = '',
}: {
  url?: string | null
  name?: string
  size?: number
  className?: string
}) {
  const src = getSrc(url)
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`rounded-full bg-slate-100 text-slate-400 flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <User size={Math.max(14, Math.floor(size * 0.45))} strokeWidth={1.5} />
    </div>
  )
}
