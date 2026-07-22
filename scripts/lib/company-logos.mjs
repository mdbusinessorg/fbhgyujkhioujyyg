import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOMAINS = JSON.parse(readFileSync(join(__dirname, '..', '..', 'src', 'lib', 'company-domains.json'), 'utf8'))

function normalize(name) {
  if (!name) return ''
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function getDomain(company) {
  if (!company) return undefined
  const trimmed = company.trim()
  for (const [key, domain] of Object.entries(DOMAINS)) {
    if (trimmed.localeCompare(key, undefined, { sensitivity: 'base' }) === 0) return domain
  }
  const norm = normalize(trimmed)
  const suffixes = [
    ' angola', ' (su)', ' lda', ' lda.', ' s.a', ' s.a.', ', lda', ', lda.', ', s.a', ', s.a.',
    ' – sucursal em angola', ' - sucursal em angola', ' sucursal em angola',
    ' (block 15) limited', ' (block 15) limited – exxonmobil', ' – exxonmobil', ' – exxon mobil',
    ' via cliente', ' (m/f)', ' (m/f/d)', ' limitada', ' limitada.', ' (su), lda', ' (su), lda.',
  ]
  let cleaned = norm
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) cleaned = cleaned.slice(0, -suffix.length).trim()
  }
  for (const [key, domain] of Object.entries(DOMAINS)) {
    const keyNorm = normalize(key)
    if (keyNorm === norm || keyNorm === cleaned || cleaned.includes(keyNorm) || keyNorm.includes(cleaned)) {
      if (cleaned.length > 2 || keyNorm === cleaned) return domain
    }
  }
  return undefined
}

export function getCompanyLogoUrl(company, logoUrl) {
  if (logoUrl) return logoUrl
  const domain = getDomain(company)
  if (!domain) return undefined
  return `https://logo.pubrio.com/${domain}`
}
