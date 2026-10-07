'use client'

import { useEffect, useState, useCallback } from 'react'

export interface SavedJob {
  key: string
  kind: 'int' | 'ext'
  id: string
  title: string
  company: string
  ts: number
}

const KEY = 'mosalo_saved_jobs_v1'
const EVENT = 'mosalo:saved-changed'

function read(): SavedJob[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function write(list: SavedJob[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)))
  window.dispatchEvent(new Event(EVENT))
}

export function isSaved(key: string): boolean {
  return read().some(j => j.key === key)
}

export function getSavedJobs(): SavedJob[] {
  return read()
}

/** Returns true if the job is now saved. */
export function toggleSaved(job: Omit<SavedJob, 'ts'>): boolean {
  const list = read()
  const i = list.findIndex(j => j.key === job.key)
  if (i >= 0) {
    list.splice(i, 1)
    write(list)
    return false
  }
  list.unshift({ ...job, ts: Date.now() })
  write(list)
  return true
}

export function useSavedJobs() {
  const [jobs, setJobs] = useState<SavedJob[]>([])

  useEffect(() => {
    const refresh = () => setJobs(read())
    refresh()
    window.addEventListener(EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const keys = new Set(jobs.map(j => j.key))

  const toggle = useCallback((job: Omit<SavedJob, 'ts'>) => toggleSaved(job), [])

  return { jobs, keys, isSaved: (key: string) => keys.has(key), toggle }
}
