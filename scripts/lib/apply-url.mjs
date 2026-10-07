// Filtragem automática do destino de candidatura.
// Regra de produto: "Candidatar" nunca pode levar o utilizador ao job board
// de onde a vaga foi recolhida (angoemprego, jobartis, angolaemprego, careerjet,
// yoyota, linkedin, indeed, ...) — só ao e-mail da empresa ou ao site oficial.
// Quando o apply_url aponta para um board, tentamos recuperar um destino real
// a partir da descrição (link de candidatura da empresa ou e-mail); se não
// houver, devolvemos null e a UI cai no fallback.

// Domínios que são job boards / agregadores — nunca destino de candidatura.
const BLOCKED_DOMAINS = [
  'angoemprego.com',
  'jobartis.com',
  'angolaemprego.com',
  'careerjet.co.ao',
  'careerjet.com',
  'yoyota.co.ao',
  'yoyota.com',
  'empregosyoyota.net',
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'infojobs.net',
  'infojobs.com.br',
  'jora.com',
  'novojob.co.ao',
  'emprego.co.ao',
  'opcaoemprego.com.br',
  'net-empregos.com',
  'trabalhando.co.ao',
  'ofertas-emprego.com',
  'mosalo.eu.cc',
]

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/
const URL_RE = /https?:\/\/[^\s"'<>()\]]+/g

// URLs dentro da descrição que apontam para o canal de candidatura da empresa
// (ATS, formulários, site de recrutamento) — preferidos na recuperação.
const APPLY_HINT = /apply|candidat|recrut|careers?|jobs?|vaga|form|inscri|zoho|workday|greenhouse|lever|teamtailor|smartrecruiters|bamboohr|fillout|typeform|docs\.google|forms\.gle|inhire|e-recruiter|successfactors|icims|ashbyhq/i

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

export const isBoardUrl = (url) => {
  const host = hostOf(url)
  if (!host) return false
  return BLOCKED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
}

const cleanUrl = (url) => url.replace(/[).,;:!?'"\]]+$/, '')

/**
 * Garante que apply_url nunca aponta para um job board.
 * Ordem: apply_url válido → link de candidatura na descrição → e-mail na
 * descrição → null.
 */
export function sanitizeApplyUrl(job) {
  const applyUrl = String(job?.apply_url || '').trim()

  if (applyUrl && /^mailto:/i.test(applyUrl)) return applyUrl

  if (applyUrl && /^https?:\/\//i.test(applyUrl) && !isBoardUrl(applyUrl)) {
    return applyUrl
  }

  const text = `${job?.description || ''} ${job?.description_enriched || ''} ${job?.excerpt || ''}`

  // 1) link na descrição que não seja board — preferir os com hint de candidatura
  const urls = (text.match(URL_RE) || []).map(cleanUrl).filter((u) => !isBoardUrl(u))
  const hinted = urls.find((u) => APPLY_HINT.test(u))
  if (hinted) return hinted
  if (urls.length) return urls[0]

  // 2) e-mail de contacto na descrição
  const email = text.match(EMAIL_RE)?.[0]
  if (email) return `mailto:${email}`

  // 3) sem canal directo — a UI mostra o fallback
  return null
}
