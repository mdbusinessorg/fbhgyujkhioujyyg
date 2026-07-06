'use client'

import { useEffect, useMemo, useState } from 'react'
import { avatarUrl } from '@/lib/avatar'

interface UserAvatarProps {
  userId?: string
  name?: string
  size?: number
  cacheBuster?: number | string
  className?: string
  imageClassName?: string
  fallbackClassName?: string
}

const getInitials = (name?: string) => {
  const value = (name || 'MS').trim()
  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'MS'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function UserAvatar({
  userId,
  name,
  size = 48,
  cacheBuster,
  className = '',
  imageClassName = '',
  fallbackClassName = '',
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false)
  const initials = useMemo(() => getInitials(name), [name])
  const src = userId ? avatarUrl(userId, cacheBuster) : ''
  const shouldShowImage = Boolean(userId) && !failed

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {shouldShowImage ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue ${fallbackClassName}`}>
          <span className="text-sm font-semibold leading-none">{initials}</span>
        </div>
      )}
    </div>
  )
}
