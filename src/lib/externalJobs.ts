// Carrega o índice de vagas externas de forma progressiva e com cache.
//
// O índice completo (external-jobs.json) tem vários MB — no telemóvel demorava
// ~20s até as vagas aparecerem. Em vez disso:
//   1. lê external-jobs-meta.json (minúsculo) → versão estável `v` + nº de chunks
//   2. se o IndexedDB já tem essa versão → devolve logo, sem download
//   3. senão descarrega os chunks c-0..c-N (~100 vagas cada): o primeiro
//      renderiza imediatamente e o resto chega em background
//   4. fallback: se os ficheiros novos ainda não existirem, usa o JSON antigo.

const META_URL = '/external-jobs-meta.json'
const FALLBACK_URL = '/external-jobs.json'
const DB_NAME = 'mosalo-external-jobs'
const STORE = 'kv'
const CACHE_KEY = 'data'

type Meta = { updated_at?: string; v?: string; count?: number; chunks?: number }

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null)
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve((req.result as T) ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

// onJobs(jobs, done): chamado assim que houver vagas para mostrar (1º chunk)
// e de novo no fim com a lista completa. Resolve sempre com a lista completa.
export async function loadExternalJobs(
  onJobs?: (jobs: any[], done: boolean) => void
): Promise<any[]> {
  let meta: Meta | null = null
  try {
    const res = await fetch(META_URL, { cache: 'no-store' })
    if (res.ok) meta = await res.json()
  } catch {
    meta = null
  }

  const version = meta?.v || meta?.updated_at || ''
  const chunkCount = Math.max(0, Math.min(500, meta?.chunks || 0))

  if (meta && chunkCount > 0) {
    if (version) {
      const cached = await idbGet<{ v: string; jobs: any[] }>(CACHE_KEY)
      if (cached && cached.v === version && Array.isArray(cached.jobs)) {
        onJobs?.(cached.jobs, true)
        return cached.jobs
      }
    }

    const all: any[] = []
    let emitted = false
    for (let i = 0; i < chunkCount; i++) {
      try {
        const res = await fetch(`/external-jobs-chunks/c-${i}.json?v=${encodeURIComponent(version)}`)
        if (!res.ok) continue
        const data = await res.json()
        const part = Array.isArray(data) ? data : (Array.isArray(data?.jobs) ? data.jobs : [])
        all.push(...part)
      } catch {
        // chunk falhou — continuar com os restantes
      }
      const last = i === chunkCount - 1
      if (!emitted || last) {
        emitted = true
        onJobs?.(all.slice(), last)
      }
    }

    if (version && all.length > 0) {
      await idbSet(CACHE_KEY, { v: version, jobs: all })
    }
    return all
  }

  // Fallback: índice monolítico antigo
  try {
    const res = await fetch(FALLBACK_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const jobs = Array.isArray(data) ? data : (Array.isArray(data?.jobs) ? data.jobs : [])
    onJobs?.(jobs, true)
    return jobs
  } catch {
    onJobs?.([], true)
    return []
  }
}
