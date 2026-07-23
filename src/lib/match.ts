export interface ProfileForMatch {
  area?: string | null
  localizacao?: string | null
  nivel_academico?: string | null
  experiencias?: string | null
  competencias?: string | null
  bio?: string | null
  jobTitles?: string[]
}

export interface JobForMatch {
  titulo?: string | null
  title?: string | null
  area?: string | null
  category?: string | null
  descricao?: string | null
  description?: string | null
  excerpt?: string | null
  empresa_nome?: string | null
  company?: string | null
  localizacao?: string | null
  location?: string | null
  salario?: string | null
  salary?: string | null
  is_prioritaria?: boolean
  score?: number
}

export function computeJobMatchScore(job: JobForMatch, profile?: ProfileForMatch | null): number {
  if (!profile) return 0
  const text = `${job.titulo || ''} ${job.title || ''} ${job.area || ''} ${job.category || ''} ${job.descricao || ''} ${job.description || ''} ${job.excerpt || ''}`.toLowerCase()
  const local = `${job.localizacao || ''} ${job.location || ''}`.toLowerCase()
  let score = 0

  if (profile.area) {
    const area = profile.area.toLowerCase()
    if (text.includes(area)) score += 40
  }

  if (profile.localizacao && local.includes(profile.localizacao.toLowerCase())) {
    score += 30
  }

  if (profile.competencias) {
    const comps = profile.competencias.split(/[,;]+/).map((c) => c.trim().toLowerCase()).filter(Boolean)
    let compHits = 0
    for (const c of comps) {
      if (c.length > 2 && text.includes(c)) compHits++
    }
    score += Math.min(compHits * 10, 60)
  }

  if (profile.jobTitles && profile.jobTitles.length > 0) {
    for (const t of profile.jobTitles) {
      if (t && text.includes(t.toLowerCase())) score += 25
    }
  }

  if (profile.bio && text.includes(profile.bio.toLowerCase())) score += 10
  if (profile.nivel_academico && text.includes(profile.nivel_academico.toLowerCase())) score += 5
  if (profile.experiencias) {
    const exp = profile.experiencias.toLowerCase()
    if (text.includes(exp)) score += 10
  }

  if (job.salario || job.salary) score += 5
  if (job.is_prioritaria) score += 20

  return Math.min(score, 100)
}

export function sortByMatch<T extends JobForMatch>(items: T[], profile?: ProfileForMatch | null): T[] {
  if (!profile || !profile.area) return items
  return [...items].sort((a, b) => {
    const scoreA = (a.score || 0) * 0.3 + computeJobMatchScore(a, profile)
    const scoreB = (b.score || 0) * 0.3 + computeJobMatchScore(b, profile)
    return scoreB - scoreA
  })
}
