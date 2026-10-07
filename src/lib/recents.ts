'use client'

import { useEffect, useState } from 'react'

const SEARCH_KEY = 'mosalo_recent_searches'
const VIEW_KEY = 'mosalo_recent_views'
const EVENT = 'mosalo:recents-changed'

export interface RecentView {
  kind: 'int' | 'ext'
  id: string
  title: string
  company: string
  ts: number
}

function readJSON<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function emit() {
  window.dispatchEvent(new Event(EVENT))
}

export function recordSearch(q: string) {
  const term = q.trim()
  if (term.length < 2 || typeof window === 'undefined') return
  const list = readJSON<string>(SEARCH_KEY).filter(s => s.toLowerCase() !== term.toLowerCase())
  list.unshift(term)
  localStorage.setItem(SEARCH_KEY, JSON.stringify(list.slice(0, 8)))
  emit()
}

export function recordView(v: Omit<RecentView, 'ts'>) {
  if (typeof window === 'undefined' || !v.id) return
  const list = readJSON<RecentView>(VIEW_KEY).filter(j => !(j.kind === v.kind && j.id === v.id))
  list.unshift({ ...v, ts: Date.now() })
  localStorage.setItem(VIEW_KEY, JSON.stringify(list.slice(0, 10)))
  emit()
}

export function useRecents() {
  const [searches, setSearches] = useState<string[]>([])
  const [views, setViews] = useState<RecentView[]>([])

  useEffect(() => {
    const refresh = () => {
      setSearches(readJSON<string>(SEARCH_KEY))
      setViews(readJSON<RecentView>(VIEW_KEY))
    }
    refresh()
    window.addEventListener(EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const clearSearch = (term: string) => {
    const list = readJSON<string>(SEARCH_KEY).filter(s => s !== term)
    localStorage.setItem(SEARCH_KEY, JSON.stringify(list))
    emit()
  }

  return { searches, views, clearSearch }
}
