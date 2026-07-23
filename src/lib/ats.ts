const stopWords = new Set([
  'para', 'com', 'por', 'que', 'como', 'quando', 'onde', 'mais', 'muito', 'tem', 'ter', 'anos', 'experiência', 'conhecimento', 'formação', 'ensino', 'superior', 'médio', 'licenciatura', 'mestrado', 'doutoramento', 'ano', 'meses', 'trabalho', 'emprego', 'vaga', 'candidato', 'recrutador', 'empresa', 'área', 'função', 'cargo', 'pessoa', 'equipa', 'capacidade', 'capaz', 'boa', 'bom', 'ser', 'estar', 'profissional', 'desejável', 'desejaveis', 'necessário', 'necessarios', 'obrigatório', 'obrigatorio', 'requisitos', 'requisito'
])

function tokenize(text?: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/[^a-záàãâéêíóõôúç\s]/gi, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 4 && !stopWords.has(t) && !/^\d+$/.test(t))
}

function normalize(word: string) {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export interface ValenceResult {
  matched: string[]
  score: number
  totalJobTokens: number
}

export function detectValences(jobText: string, candidateText: string): ValenceResult {
  const jobTokens = new Set(tokenize(jobText).map(normalize))
  const candWords = tokenize(candidateText).map(normalize)
  const matched = new Set<string>()
  candWords.forEach(w => {
    jobTokens.forEach(jt => {
      if (w === jt || w.includes(jt) || jt.includes(w)) matched.add(jt)
    })
  })
  const matchedArr = Array.from(matched).slice(0, 8)
  const totalJobTokens = jobTokens.size || 1
  const score = Math.min(100, Math.round((matched.size / totalJobTokens) * 100))
  return { matched: matchedArr, score, totalJobTokens }
}

export type ATSStage = 'recebida' | 'triagem' | 'entrevista' | 'teste' | 'concorrencia' | 'pre_selecionados' | 'contratado' | 'rejeitado'

export const STAGE_ORDER: ATSStage[] = ['recebida', 'triagem', 'entrevista', 'teste', 'concorrencia', 'pre_selecionados', 'contratado']

export const STAGE_LABELS: Record<ATSStage, string> = {
  recebida: 'Recebidas',
  triagem: 'Triagem',
  entrevista: 'Entrevista',
  teste: 'Teste / Valências',
  concorrencia: 'Fase de Concorrência',
  pre_selecionados: 'Pré-selecionados',
  contratado: 'Contratado',
  rejeitado: 'Rejeitado',
}

export const STAGE_COLORS: Record<ATSStage, string> = {
  recebida: 'bg-slate-100 text-slate-600 border-slate-200',
  triagem: 'bg-blue-50 text-blue-600 border-blue-200',
  entrevista: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  teste: 'bg-purple-50 text-purple-600 border-purple-200',
  concorrencia: 'bg-amber-50 text-amber-600 border-amber-200',
  pre_selecionados: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  contratado: 'bg-green-50 text-green-600 border-green-200',
  rejeitado: 'bg-red-50 text-red-600 border-red-200',
}

export function getStage(c: any): ATSStage {
  const ats = c?.respostas?.__ats
  if (ats?.stage && STAGE_ORDER.includes(ats.stage)) return ats.stage
  if (c?.status === 'rejeitada' || c?.status === 'recusada') return 'rejeitado'
  if (c?.status === 'aprovada') return 'contratado'
  if (c?.status === 'em_analise') return 'triagem'
  return 'recebida'
}

export function drawWinners(candidates: any[], count = 1, minScore = 0): any[] {
  const eligible = candidates
    .filter(c => getStage(c) === 'concorrencia' && (c.atsScore || c.matchScore || 0) >= minScore)
    .sort(() => Math.random() - 0.5)
  return eligible.slice(0, Math.max(1, count))
}
