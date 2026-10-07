// Registo local de vagas guardadas (bookmark) — internas e externas.
// Não passa pelo backend; vive no browser e alimenta a secção
// "Guardadas" da página Minhas Candidaturas.

export interface SavedJob {
  job_id: string
  source: 'interna' | 'externa'
  title: string
  company: string
  logo_url?: string | null
  location?: string | null
  salary?: string | null
  saved_at: string
}

const KEY = 'mosalo_saved_jobs'

export function getSavedJobs(): SavedJob[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function isJobSaved(jobId: string) {
  return getSavedJobs().some((j) => j.job_id === jobId)
}

export function toggleSavedJob(entry: Omit<SavedJob, 'saved_at'>): boolean {
  try {
    const list = getSavedJobs()
    const exists = list.some((j) => j.job_id === entry.job_id)
    const next = exists
      ? list.filter((j) => j.job_id !== entry.job_id)
      : [{ ...entry, saved_at: new Date().toISOString() }, ...list]
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, 300)))
    return !exists
  } catch {
    return false
  }
}

export function removeSavedJob(jobId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(getSavedJobs().filter((j) => j.job_id !== jobId)))
  } catch {}
}
