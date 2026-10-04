// Shared parser for job boards that expose schema.org JobPosting JSON-LD
// on their detail pages (Empregos Yoyota, Ango Emprego, ...).

import { decodeEntities, sanitizeHtml, stripTags, inferCategory, extractSalary, computeScore } from './job-utils.mjs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

export async function fetchHtml(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } })
    if (res.ok) return res.text()
    if (res.status === 429 && i < retries) {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)))
      continue
    }
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
}

function collectNodes(parsed, out) {
  if (Array.isArray(parsed)) {
    for (const n of parsed) collectNodes(n, out)
    return
  }
  if (!parsed || typeof parsed !== 'object') return
  const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type']]
  if (types.includes('JobPosting')) out.push(parsed)
  if (parsed['@graph']) collectNodes(parsed['@graph'], out)
}

export function extractJobPostings(html) {
  const postings = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    // Some sites embed literal control chars inside description strings.
    const clean = m[1].replace(/[\x00-\x1f]/g, ' ')
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      continue
    }
    collectNodes(parsed, postings)
  }
  return postings
}

function locationOf(ld) {
  const locs = Array.isArray(ld.jobLocation) ? ld.jobLocation : ld.jobLocation ? [ld.jobLocation] : []
  for (const l of locs) {
    const a = l && l.address
    if (typeof a === 'string' && a.trim()) return a.trim()
    if (a && typeof a === 'object') {
      const v = a.addressLocality || a.addressRegion || a.addressCountry
      if (v && typeof v === 'string') return v
    }
  }
  return 'Angola'
}

function salaryOf(ld) {
  const bs = ld.baseSalary
  if (!bs) return ''
  const v = bs.value && typeof bs.value === 'object' ? (bs.value.value ?? bs.value.minValue ?? '') : (bs.value ?? '')
  return v ? `${v} ${bs.currency || ''}`.trim() : ''
}

// Builds a normalized job object from a JobPosting JSON-LD node.
export function jobFromLd(ld, { url, source, applyUrl, id }) {
  const title = stripTags(decodeEntities(ld.title || '')).trim()
  const org = ld.hiringOrganization || {}
  const company = decodeEntities(typeof org === 'string' ? org : org.name || '').trim()
  let logo_url = ''
  if (org && typeof org === 'object') {
    const logo = org.logo
    logo_url = typeof logo === 'string' ? logo : (logo && logo.url) || ''
  }

  const descRaw = decodeEntities(ld.description || '')
  const description = sanitizeHtml(descRaw)
  const excerpt = stripTags(descRaw).slice(0, 300)

  let posted_at = null
  const d = new Date(ld.datePosted || '')
  if (!isNaN(d.getTime())) posted_at = d.toISOString()

  const salary = salaryOf(ld) || extractSalary(`${description} ${excerpt}`)
  const apply_url = applyUrl || null

  const empType = Array.isArray(ld.employmentType) ? ld.employmentType.join(', ') : ld.employmentType || ''

  return {
    id,
    source,
    source_url: url,
    title,
    company,
    logo_url: decodeEntities(logo_url),
    location: locationOf(ld),
    category: inferCategory(`${title} ${excerpt}`),
    description,
    excerpt,
    apply_url,
    salary,
    score: computeScore(title, company, `${description} ${excerpt}`, apply_url),
    posted_at,
    tipo_contrato: empType,
  }
}

// Slug from the last meaningful path segment, e.g. /empregos/vaga-para-x-123 -> vaga-para-x-123
export function pathSlug(url, max = 120) {
  const seg = (url.split('?')[0].split('#')[0].split('/').filter(Boolean).pop() || url)
  return seg.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, max)
}

// Extract <loc>/<lastmod> pairs from a sitemap (urlset or sitemapindex).
export function parseSitemap(xml) {
  const entries = []
  const re = /<(?:url|sitemap)>[\s\S]*?<loc>([^<]+)<\/loc>(?:[\s\S]*?<lastmod>([^<]+)<\/lastmod>)?[\s\S]*?<\/(?:url|sitemap)>/gi
  let m
  while ((m = re.exec(xml)) !== null) {
    entries.push({ loc: m[1].trim(), lastmod: (m[2] || '').trim() })
  }
  return entries
}

// Cloudflare email-protection obfuscation: hex string XORed with its first byte.
export function decodeCfEmail(hex) {
  const key = parseInt(hex.slice(0, 2), 16)
  let out = ''
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key)
  return out
}

// Resolve the best apply target from a detail page: explicit mailto, a
// Cloudflare-protected email in the application area, or a direct link.
export function findApplyUrl(html, { pageUrl } = {}) {
  const mailto = html.match(/mailto:([^\s"'<>\\]+@[^\s"'<>\\]+)/i)
  if (mailto) return `mailto:${decodeEntities(mailto[1])}`

  const cf = html.match(/email-protection#([a-f0-9]+)/i)
  if (cf) {
    const email = decodeCfEmail(cf[1])
    if (email && email.includes('@')) return `mailto:${email}`
  }

  const anchorRe = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let a
  while ((a = anchorRe.exec(html)) !== null) {
    if (/candidatar|aplicar|apply/i.test(stripTags(a[2]))) {
      const href = decodeEntities(a[1].trim())
      if (/^(https?:|mailto:)/i.test(href) && !/#$/.test(href)) return href
    }
  }
  return pageUrl || null
}
