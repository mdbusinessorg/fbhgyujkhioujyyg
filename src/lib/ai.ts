// Frontend helpers to call Netlify serverless functions for AI + external jobs.
// On Netlify, /api/* is redirected to /.netlify/functions/* (see netlify.toml).

export interface Vaga {
  titulo?: string
  area?: string
  descricao?: string
  requisitos?: string
  nivel_minimo?: string
  experiencia_requerida?: string
}

export interface CareerJetJob {
  title: string
  description: string
  company: string
  locations: string
  salary: string
  url: string
  date: string
  source: string
}

export interface CareerJetResponse {
  jobs: CareerJetJob[]
  pages?: number
  error?: string
}

export async function improveCV(text: string, vaga?: Vaga): Promise<{ result: string; error?: string }> {
  try {
    const res = await fetch('/api/ai-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, vaga }),
    })
    return await res.json()
  } catch (err) {
    return { result: '', error: String(err) }
  }
}

export async function getTips(profile: Record<string, unknown>, vaga?: Vaga): Promise<{ tips: string[]; error?: string }> {
  try {
    const res = await fetch('/api/ai-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, vaga }),
    })
    return await res.json()
  } catch (err) {
    return { tips: [], error: String(err) }
  }
}

export async function matchCandidate(vaga: Vaga, candidato: Record<string, unknown>): Promise<{
  score: number
  resumo: string
  pontos_fortes: string[]
  pontos_fracos: string[]
  recomendacao: string
  error?: string
}> {
  try {
    const res = await fetch('/api/ai-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vaga, candidato }),
    })
    return await res.json()
  } catch (err) {
    return { score: 0, resumo: '', pontos_fortes: [], pontos_fracos: [], recomendacao: 'Considerar', error: String(err) }
  }
}

export async function askSupport(message: string, context?: Record<string, unknown>, history?: { role: 'user' | 'assistant'; content: string }[]): Promise<{ answer: string; error?: string }> {
  try {
    const res = await fetch('/api/ai-support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, history }),
    })
    return await res.json()
  } catch (err) {
    return { answer: '', error: String(err) }
  }
}

export async function fetchCareerJet(keywords: string, location = 'Luanda, Angola', page = 1): Promise<CareerJetResponse> {
  try {
    const params = new URLSearchParams({
      keywords,
      location,
      page: String(page),
      page_size: '20',
      sort: 'date',
    })
    const res = await fetch(`/api/vagas?${params.toString()}`)
    return await res.json()
  } catch (err) {
    return { jobs: [], pages: 1, error: String(err) }
  }
}
