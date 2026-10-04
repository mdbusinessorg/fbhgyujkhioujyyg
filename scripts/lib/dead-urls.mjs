// Lista persistente de URLs de vagas mortas (404 definitivo) — os sitemaps
// das fontes mantêm links de vagas removidas, e sem esta lista cada corrida
// voltava a buscar centenas de páginas que nunca vão existir.
// Fica dentro de public/vagas-data (commitada pelo workflow); loadPrevious
// ignora-a porque é um array sem `.id`.

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const FILE = 'dead-urls.json'
const MAX_AGE_DAYS = 60
const MAX_ENTRIES = 8000

export async function loadDead(dataDir) {
  try {
    const raw = JSON.parse(await readFile(join(dataDir, FILE), 'utf8'))
    if (!Array.isArray(raw)) return new Set()
    const cutoff = Date.now() - MAX_AGE_DAYS * 86400000
    return new Set(raw.filter((e) => e && e.id && Date.parse(e.at || 0) > cutoff).map((e) => e.id))
  } catch {
    return new Set()
  }
}

export async function markDead(dataDir, ids) {
  const fresh = [...new Set(ids)].filter(Boolean)
  if (fresh.length === 0) return
  let list = []
  try {
    const raw = JSON.parse(await readFile(join(dataDir, FILE), 'utf8'))
    if (Array.isArray(raw)) list = raw
  } catch {}
  const now = new Date().toISOString()
  const map = new Map(list.filter((e) => e && e.id).map((e) => [e.id, e]))
  for (const id of fresh) map.set(id, { id, at: now })
  await writeFile(join(dataDir, FILE), JSON.stringify([...map.values()].slice(-MAX_ENTRIES)))
}

export function isGoneError(err) {
  const s = String(err || '')
  return /HTTP 404|HTTP 410/i.test(s)
}
