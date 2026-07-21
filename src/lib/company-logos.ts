import domains from './company-domains.json'

export const COMPANY_LOGO_DOMAINS: Record<string, string> = domains

function normalizeCompanyName(name?: string): string {
  if (!name) return ""
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function getCompanyLogoDomain(company?: string): string | undefined {
  if (!company) return undefined
  const trimmed = company.trim()

  // Exact match (case insensitive) by scanning keys
  for (const [key, domain] of Object.entries(COMPANY_LOGO_DOMAINS)) {
    if (trimmed.localeCompare(key, undefined, { sensitivity: 'base' }) === 0) {
      return domain
    }
  }

  const norm = normalizeCompanyName(trimmed)

  const suffixes = [
    " angola",
    " (su)",
    " lda",
    " lda.",
    " s.a",
    " s.a.",
    ", lda",
    ", lda.",
    ", s.a",
    ", s.a.",
    " – sucursal em angola",
    " - sucursal em angola",
    " sucursal em angola",
    " (block 15) limited",
    " (block 15) limited – exxonmobil",
    " – exxonmobil",
    " – exxon mobil",
    " via cliente",
    " (m/f)",
    " (m/f/d)",
    " limitada",
    " limitada.",
    " (su), lda",
    " (su), lda.",
    ", lda.",
  ]

  let cleaned = norm
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) cleaned = cleaned.slice(0, -suffix.length).trim()
  }

  for (const [key, domain] of Object.entries(COMPANY_LOGO_DOMAINS)) {
    const keyNorm = normalizeCompanyName(key)
    if (keyNorm === norm || keyNorm === cleaned || cleaned.includes(keyNorm) || keyNorm.includes(cleaned)) {
      if (cleaned.length > 2 || keyNorm === cleaned) return domain
    }
  }

  return undefined
}

export function getCompanyLogoUrl(company?: string, logoUrl?: string): string | undefined {
  if (logoUrl) return logoUrl
  const domain = getCompanyLogoDomain(company)
  if (!domain) return undefined
  return `https://logo.pubrio.com/${domain}`
}

export function getCompanyInitials(company?: string): string {
  if (!company) return "?"
  const words = company.split(/\s+/).filter(Boolean)
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() || "")
  return letters.join("") || company.slice(0, 2).toUpperCase()
}

export function getCompanyColor(company?: string): string {
  if (!company) return "#3b82f6"
  let hash = 0
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 60%, 55%)`
}
