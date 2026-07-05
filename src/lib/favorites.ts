'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'mosalo_favorites'
const FAVORITES_EVENT = 'mosalo:favorites'

const readFavorites = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

const writeFavorites = (favorites: string[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
}

const emitFavoritesChange = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(FAVORITES_EVENT))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  const syncFavorites = useCallback(() => {
    setFavorites(readFavorites())
  }, [])

  useEffect(() => {
    syncFavorites()

    if (typeof window === 'undefined') return

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) {
        syncFavorites()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(FAVORITES_EVENT, syncFavorites)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(FAVORITES_EVENT, syncFavorites)
    }
  }, [syncFavorites])

  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  const isFavorite = useCallback((key: string) => favoriteSet.has(key), [favoriteSet])

  const toggle = useCallback((key: string) => {
    const current = readFavorites()
    const next = current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]

    setFavorites(next)
    writeFavorites(next)
    emitFavoritesChange()
  }, [])

  return {
    favorites,
    favoriteSet,
    isFavorite,
    toggle,
  }
}
