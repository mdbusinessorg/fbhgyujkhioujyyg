// Jobartis (www.jobartis.com) list + detail parser via r.jina.ai markdown.
// Tries to use the recruiter's company website as the apply_url so the user lands on
// the company site instead of the Jobartis portal.

export function listUrl(page = 1) {
  return `https://r.jina.ai/http://www.jobartis.com/vagas-emprego/?page=${page}`
}

export function jinaProxy(url) {
  return url.replace(/^https?:\/\//, (m) => `https://r.jina.ai/http${m === 'https://' ? 's' : ''}://`)
}

export async function fetchHtml(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'MosaloBot/1.0' } })
    if (res.ok) return res.text()
    if (res.status === 429 && i < retries) {
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)))
      continue
    }
    throw new Error(`HTTP ${res.status}: ${url}`)
  }
  throw new Error(`HTTP fetch failed: ${url}`)
}

function cleanText(s) {
  return (s || '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractSection(markdown, headings) {
  const lines = markdown.split(/\r?\n/)
  const result = []
  let inside = false
  for (const line of lines) {
    if (/^#{1,4}\s+/.test(line)) {
      const text = line.replace(/^#{1,4}\s+/, '').trim()
      if (headings.some((h) => text.toLowerCase().includes(h.toLowerCase()))) {
        inside = true
        continue
      } else if (inside) {
        break
      }
    }
    if (inside) result.push(line)
  }
  return cleanText(result.join('\n'))
}

function normalizeCompare(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
}

const KNOWN_LABELS = new Set([
  'cargo', 'industria', 'numero de vagas', 'descricao da funcao', 'requisitos', 'titulacao minima',
  'experiencia exigida', 'nacionalidade', 'linguas', 'area funcional', 'competencias', 'aptidoes necessarias',
  'competencias valorizadas', 'o que procuramos', 'sobre a nossa empresa', 'website', 'endereco', 'titulacao',
  'experiencia', 'tipo contrato', 'oferta aberta ate',
])

function extractField(markdown, label) {
  const regex = new RegExp(`(?:^|\\n)${label}\\s*\\n+([^\\n#]+)`, 'i')
  const m = markdown.match(regex)
  const value = cleanText(m?.[1] || '')
  if (!value || KNOWN_LABELS.has(normalizeCompare(value))) return ''
  return value
}

export function parseListPage(markdown) {
  const entries = []
  const seen = new Set()
  const lines = markdown.split(/\r?\n/)
  const headingRegex = /^##\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(headingRegex)
    if (!m) continue

    const rawText = m[1]
    const url = m[2]
    if (!/jobartis\.com\/emprego/.test(url) || seen.has(url)) continue
    seen.add(url)

    let title = rawText
    let company = ''
    let location = ''
    let contract = ''
    let category = ''

    // Some list entries embed metadata inside the link text: Title ##### Company * Location * Contract * ...
    const splitMarker = / ##### /
    if (splitMarker.test(rawText)) {
      const parts = rawText.split(' * ')
      const head = parts[0].split(' ##### ')
      title = head[0]
      company = head[1] || ''
      location = parts[1] || ''
      contract = parts[2] || ''
    } else {
      // Company may be on following lines as ##### [Company](...) or ##### Company
      for (let j = 1; j <= 60 && i + j < lines.length; j++) {
        const next = lines[i + j]
        if (/^##\s*\[/.test(next)) break
        const cm = next.match(/#####\s*\[([^\]]+)\]/)
        if (cm && !company) { company = cm[1] }
        const cm2 = next.match(/#####\s*(.+)/)
        if (cm2 && !company) { company = cm2[1] }
        // Category links: *   [Banca, seguros](http://www.jobartis.com/vagas-emprego/...)
        const catm = next.match(/^\*\s+\[([^\]]+)\]\(https?:\/\/www\.jobartis\.com\/vagas-emprego\/[^\s)]+\)/)
        if (catm && !category) { category = catm[1] }
      }
    }

    entries.push({
      url,
      title: cleanText(title),
      company: cleanText(company),
      location: cleanText(location),
      contract: cleanText(contract),
      category: cleanText(category),
    })
  }

  // Fallback: plain links to detail pages
  const linkRegex = /\]\((https?:\/\/www\.jobartis\.com\/emprego[^\s)]+)\)/g
  let m
  while ((m = linkRegex.exec(markdown)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1])
      entries.push({ url: m[1], title: '', company: '', location: '', contract: '', category: '' })
    }
  }

  return entries
}

export function parseJob(markdown, url, listMeta = {}) {
  // Prefer the Cargo field inside the job description, then the r.jina.ai Title line, then h1, then list meta
  const cargo = extractField(markdown, 'Cargo')
  const titleLine = markdown.match(/^Title:\s*Emprego[^-]*[-–]\s*(.+?)(?:\s+em\s+(.+?))?\s*\|/mi)
  let title = cleanText(cargo || titleLine?.[1] || markdown.match(/^#\s+(.+)$/m)?.[1] || listMeta.title || '')
  let location = cleanText(titleLine?.[2] || listMeta.location || '')

  // H2 with company - location
  const companyLocationMatch = markdown.match(/^##\s+(.+?)\s+-\s+(.+)$/m)
  let company = cleanText(listMeta.company || companyLocationMatch?.[1] || '')
  if (companyLocationMatch && !location) location = cleanText(companyLocationMatch[2])

  // Remove any trailing ellipsis introduced by r.jina.ai truncation
  title = title.replace(/\.\.\.$/, '').trim()

  // Fallback company from employer section
  if (!company) {
    const emp = extractSection(markdown, ['Empregador'])
    if (emp) {
      const lines = emp.split('\n').map(cleanText).filter((l) => l && !l.match(/^(Sobre|Website|Endereço)/i))
      company = lines[0] || ''
    }
  }

  const applyMatch = markdown.match(/\[Enviar candidatura\]\((https?:\/\/[^\s)]+)\)/)
  let applyUrl = applyMatch?.[1] || url

  const contractMatch = markdown.match(/Tipo\s+contrato\s*\n+([^\n]+)/i)
  const contract = cleanText(listMeta.contract || contractMatch?.[1] || '')

  const description = extractSection(markdown, ['Descrição da função', 'Descrição', 'Sobre a vaga'])
  const requirements = extractSection(markdown, ['Requisitos', 'Requisitos / Conhecimentos', 'Perfil'])
  const category = cleanText(listMeta.category || extractField(markdown, 'Area funcional') || extractField(markdown, 'Industria'))

  const fullDescription = [
    contract ? `Tipo de contrato: ${contract}` : '',
    description ? `Descrição:\n${description}` : '',
    requirements ? `Requisitos:\n${requirements}` : '',
  ].filter(Boolean).join('\n\n')

  return {
    source: 'Jobartis',
    source_url: url,
    id: url.split('/').pop().replace(/[^a-z0-9-]/gi, '').slice(0, 120),
    title: title || listMeta.title || 'Vaga Jobartis',
    company: company || 'Empresa não divulgada',
    location: location || 'Angola',
    category: category || 'Outro',
    description: fullDescription || cleanText(markdown.slice(0, 2000)),
    excerpt: cleanText((description || markdown).slice(0, 240)),
    posted_at: new Date().toISOString(),
    apply_url: applyUrl,
    contract_type: contract,
    salary: '',
    __raw: markdown.slice(0, 5000),
  }
}

export function parseCompanyPage(markdown) {
  const websiteMatch = markdown.match(/Website\s*\n+(https?:\/\/[^\s]+)/i)
  if (websiteMatch) return cleanText(websiteMatch[1])
  const fallback = markdown.match(/https?:\/\/www\.[a-z0-9.-]+\.(ao|com|co\.ao|net|org)/i)
  return fallback?.[0] || ''
}

export async function enrichJobWithCompanyWebsite(job) {
  try {
    const companyLinkMatch = job.__raw?.match(/\[([^\]]+)\]\((https?:\/\/www\.jobartis\.com\/empregadores\/[^\s)]+)\)/)
    if (companyLinkMatch) {
      const md = await fetchHtml(jinaProxy(companyLinkMatch[2]))
      const website = parseCompanyPage(md)
      if (website) {
        job.apply_url = website
        job.source_url = job.source_url || website
      }
    }
  } catch {
    // keep original apply_url
  }
  delete job.__raw
  return job
}
