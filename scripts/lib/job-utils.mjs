// Shared helpers for parsing and scoring job listings.

export const CATEGORY_KEYWORDS = [
  ['Tecnologia', ['ti ', 'tecnolog', 'informát', 'software', 'developer', 'programad', 'sistemas', 'redes', 'suporte técnico', 'dados', 'data', 'devops']],
  ['Finanças', ['financ', 'banc', 'bank', 'crédito', 'tesourar', 'investiment']],
  ['Contabilidade', ['contab', 'contabilista', 'auditor', 'fiscal']],
  ['Engenharia', ['engenh', 'engineer', 'mecân', 'eletric', 'eléctric', 'electric', 'civil', 'instrument', 'estrutur', 'obra']],
  ['Petróleo', ['petról', 'offshore', 'onshore', 'oil', 'gás', 'reservatóri', 'perfura']],
  ['Saúde', ['saúde', 'enferm', 'médic', 'clínic', 'farmac', 'hospital', 'higiene e saúde']],
  ['Marketing', ['marketing', 'comunic', 'publicid', 'redes sociais', 'social media', 'vendas', 'comercial']],
  ['Direito', ['jurídic', 'advogad', 'direito', 'legal']],
  ['Educação', ['educa', 'professor', 'formador', 'docente', 'ensino']],
  ['Administração', ['administrat', 'secretari', 'assistente administrat', 'gestão', 'gestor', 'gestora', 'coordenad', 'diretor', 'director']],
  ['Logística', ['logíst', 'armazém', 'stock', 'transporte', 'motorista', 'distribuiç', 'aprovision']],
  ['Hotelaria', ['hotel', 'restaura', 'cozinh', 'chef', 'turismo', 'recepcion']],
  ['Construção', ['construç', 'pedreiro', 'canaliz', 'pintor', 'carpint']],
  ['RH', ['recursos humanos', 'rh ', 'recrutament', 'talent']],
  ['Design', ['design', 'gráfic', 'criativ', 'ux', 'ui']],
]

export function inferCategory(text) {
  const t = ' ' + (text || '').toLowerCase() + ' '
  for (const [cat, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((k) => t.includes(k))) return cat
  }
  return 'Outro'
}

export const PRIORITY_COMPANIES = ['total', 'shell', 'bp', 'chevron', 'exxon', 'schlumberger', 'halliburton', 'baker hughes', 'saipem', 'subsea7', 'technip', 'modec', 'nestle', 'dhl', 'standard bank', 'africell', 'unitel', 'movicel', 'angola lng', 'bp angola', 'eni', 'azule energy', 'ocm obary', 'grupo simples oil', 'sonepral', 'omatapalo', 'cimenfort', 'casais', 'mota-engil', 'mota engil', 'soico', 'spi', 'newrest', 'access bank', 'banco yetu', 'kixicrédito']
export const SENIORITY_KEYWORDS = ['sénior', 'senior', 'manager', 'gestor', 'director', 'diretor', 'coordenador', 'coordinator', 'chefe', 'head', 'lead', 'supervisor', 'especialista']

export function computeScore(title, company, description, applyUrl) {
  const text = `${title} ${company} ${description}`.toLowerCase()
  let score = 0

  if (applyUrl) score += 5
  if (SENIORITY_KEYWORDS.some((k) => text.includes(k))) score += 10

  const companyLower = (company || '').toLowerCase()
  if (PRIORITY_COMPANIES.some((c) => companyLower.includes(c))) score += 15

  if (/\b(urgente|urgência|immediate|asap|hoje)\b/i.test(text)) score += 5
  if (/(sal[áa]rio|remunera[çc][ãa]o|pretens[ãa]o|vencimento|ordenado|benef[íi]cios)/i.test(text)) score += 10
  if (/(\d{1,3}(?:\.\d{3})+|\d{3,})\s*(kz|kwanza|usd|\$|€|£)/i.test(text)) score += 15

  return Math.min(score, 100)
}

export function decodeEntities(s) {
  if (!s) return s
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&atilde;/g, 'ã')
    .replace(/&ccedil;/g, 'ç').replace(/&ecirc;/g, 'ê').replace(/&ocirc;/g, 'ô')
}

export function stripTags(html) {
  return decodeEntities((html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim()
}

export function cleanText(text) {
  return (text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function extractSalary(text) {
  if (!text) return ''
  const t = cleanText(text)
  const contextual = t.replace(/(\d{1,3}(?:\.\d{3})+|\d{3,})\s*(pa[íi]ses|anos|meses|dias|semanas|projetos|profissionais)/gi, '')

  const salaryPhrase = contextual.match(
    /\b(?:sal[áa]rio|remunera[çc][ãa]o|pretens[ãa]o|vencimento|ordenado)\b[^.,:]{0,80}?((?:\d{1,3}(?:\.\d{3})+|\d{3,}))\s*(kz|kwanza|USD|\$|€|£)?/i
  )
  if (salaryPhrase) {
    const amount = salaryPhrase[1] || ''
    const currency = salaryPhrase[2] || 'Kz'
    return `${amount} ${currency}`.trim().slice(0, 80)
  }

  const numberCurrency = contextual.match(/(\d{1,3}(?:\.\d{3})+|\d{3,})\s*(kz|kwanza|USD|\$|€|£)/i)
  if (numberCurrency) return `${numberCurrency[1]} ${numberCurrency[2]}`.trim().slice(0, 80)

  return ''
}

export function sanitizeHtml(html) {
  if (!html) return ''
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  const allowed = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'h2', 'h3', 'h4'])
  out = out.replace(/<(\/?)([a-z0-9]+)([^>]*)>/gi, (m, slash, tag, _attrs) => {
    const t = tag.toLowerCase()
    if (allowed.has(t)) return `<${slash}${t}>`
    return ''
  })
  return out.replace(/\s+\n/g, '\n').replace(/(\s*<br>\s*){3,}/g, '<br><br>').trim()
}
