// Shared parser for angolaemprego.com job listings and detail pages.
// Pure JS (Node built-ins + regex only) so it can run in a script or a Netlify function.

import { decodeEntities, sanitizeHtml, stripTags, inferCategory, extractSalary, computeScore } from './job-utils.mjs'

const BASE = 'https://www.angolaemprego.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

function metaContent(html, prop) {
  const re = new RegExp('<meta[^>]+(?:property|name)="' + prop + '"[^>]*content="([^"]*)"', 'i')
  const m = html.match(re)
  if (m) return decodeEntities(m[1].trim())
  const re2 = new RegExp('<meta[^>]+content="([^"]*)"[^>]*(?:property|name)="' + prop + '"', 'i')
  const m2 = html.match(re2)
  return m2 ? decodeEntities(m2[1].trim()) : ''
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
  const salary = extractSalary(`${description} ${excerpt}`)
  const score = computeScore(title, company, `${description} ${excerpt}`, apply_url)

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
    salary,
    score,
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
