// Registo local de candidaturas feitas em vagas externas (site oficial ou e-mail).
// As candidaturas internas vivem na tabela `candidaturas` do Supabase; as externas
// não passam por nós, por isso guardamos apenas um marcador local para mostrar
// na página "Minhas candidaturas".

export interface ExternalCandidacy {
  job_id: string
  title: string
  company: string
  logo_url?: string | null
  location?: string | null
  applied_at: string
  via: 'site_oficial' | 'email'
}

const KEY = 'mosalo_external_applies'

export function getExternalApplies(): ExternalCandidacy[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function recordExternalApply(entry: Omit<ExternalCandidacy, 'applied_at'>) {
  try {
    const list = getExternalApplies().filter((a) => a.job_id !== entry.job_id)
    list.unshift({ ...entry, applied_at: new Date().toISOString() })
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 300)))
  } catch {}
}

export function hasAppliedTo(jobId: string) {
  return getExternalApplies().some((a) => a.job_id === jobId)
}
