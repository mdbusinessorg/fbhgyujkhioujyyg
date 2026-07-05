// Shared parser for angolaemprego.com job listings and detail pages.
// Pure JS (Node built-ins + regex only) so it can run in a script or a Netlify function.

const BASE = 'https://www.angolaemprego.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const CATEGORY_KEYWORDS = [
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

function inferCategory(text) {
  const t = ' ' + (text || '').toLowerCase() + ' '
  for (const [cat, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((k) => t.includes(k))) return cat
  }
  return 'Outro'
}

function decodeEntities(s) {
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

function metaContent(html, prop) {
  const re = new RegExp('<meta[^>]+(?:property|name)="' + prop + '"[^>]*content="([^"]*)"', 'i')
  const m = html.match(re)
  if (m) return decodeEntities(m[1].trim())
  const re2 = new RegExp('<meta[^>]+content="([^"]*)"[^>]*(?:property|name)="' + prop + '"', 'i')
  const m2 = html.match(re2)
  return m2 ? decodeEntities(m2[1].trim()) : ''
}

function stripTags(html) {
  return decodeEntities((html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim()
}

// Allow only a safe subset of tags for native rendering.
function sanitizeHtml(html) {
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

// Extract the list of job detail URLs from a listing page.
export function listPageUrls(html) {
  const urls = new Set()
  const re = /https:\/\/www\.angolaemprego\.com\/vagas\/[a-z0-9-]+/gi
  let m
  while ((m = re.exec(html)) !== null) urls.add(m[0])
  return [...urls]
}

// Parse a single job detail page.
export function parseJob(html, url) {
  const source_url = url

  let title = ''
  const h1 = html.match(/<h1[^>]*class="[^"]*fw-bold[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) title = stripTags(h1[1])
  if (!title) {
    title = metaContent(html, 'og:title').replace(/\s*-\s*Angola Emprego.*$/i, '').trim()
  }

  const badge = (icon) => {
    const re = new RegExp('<i class="bi bi-' + icon + '[^"]*"[^>]*><\\/i>\\s*([^<]+)', 'i')
    const m = html.match(re)
    return m ? decodeEntities(m[1].trim()) : ''
  }
  const company = badge('building')
  const location = badge('geo-alt') || 'Angola'
  const dateBadge = badge('clock')

  // Apply link: the "Candidatar-se" button anchor.
  let apply_url = ''
  const anchorRe = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let a
  while ((a = anchorRe.exec(html)) !== null) {
    if (/Candidatar/i.test(a[2])) { apply_url = decodeEntities(a[1].trim()); break }
  }
  // Ignore self-referential / auth links — no official source in that case.
  if (apply_url && /angolaemprego\.com\/(login|entrar|criar|registar|register)/i.test(apply_url)) {
    apply_url = ''
  }
  if (apply_url && !/^(https?:|mailto:)/i.test(apply_url)) apply_url = ''

  // Description body.
  let descHtml = ''
  const body = html.match(/<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*(?:d-flex|social|share)|<\/section|<footer)/i)
  if (body) descHtml = body[1]
  if (!descHtml) {
    const body2 = html.match(/<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (body2) descHtml = body2[1]
  }
  const description = sanitizeHtml(descHtml)
  const excerptSrc = stripTags(descHtml) || metaContent(html, 'og:title')
  const excerpt = excerptSrc.slice(0, 300)

  // Published date.
  let posted_at = null
  const pub = metaContent(html, 'article:published_time')
  if (pub) {
    const d = new Date(pub.replace(' ', 'T'))
    if (!isNaN(d.getTime())) posted_at = d.toISOString()
  }
  if (!posted_at && /^\d{2}\/\d{2}\/\d{4}$/.test(dateBadge)) {
    const [dd, mm, yy] = dateBadge.split('/')
    const d = new Date(`${yy}-${mm}-${dd}T00:00:00`)
    if (!isNaN(d.getTime())) posted_at = d.toISOString()
  }

  const category = inferCategory(`${title} ${excerpt}`)

  return {
    source: 'AngolaEmprego',
    source_url,
    title,
    company,
    location,
    category,
    description,
    excerpt,
    apply_url: apply_url || null,
    salary: '',
    posted_at,
  }
}

export async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

export function listUrl(page) {
  return `${BASE}/vagas?page=${page}`
}
