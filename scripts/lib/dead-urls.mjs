// Lista persistente de URLs de vagas mortas (404/410 definitivo). Guardada em
// data/dead-urls.json — NÃO pode ficar em public/vagas-data/ porque o writeJson
// apaga qualquer ficheiro que não seja uma vaga activa.
//
// O git add do workflow scrape-jobs inclui data/ para o estado sobreviver
// entre corridas.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATE_DIR = join(__dirname, '..', '..', 'data')
const FILE = join(STATE_DIR, 'dead-urls.json')

const MAX_AGE_DAYS = 60
const MAX_ENTRIES = 8000

export async function loadDead() {
  try {
    const arr = JSON.parse(await readFile(FILE, 'utf8'))
    if (!Array.isArray(arr)) return new Set()
    const cutoff = Date.now() - MAX_AGE_DAYS * 86400e3
    return new Set(arr.filter((e) => e && e.id && new Date(e.at).getTime() > cutoff).map((e) => e.id))
  } catch {
    return new Set()
  }
}

export async function markDead(ids) {
  if (!ids.length) return
  let existing = []
  try {
    const parsed = JSON.parse(await readFile(FILE, 'utf8'))
    if (Array.isArray(parsed)) existing = parsed
  } catch {
    // ficheiro ainda não existe
  }
  const seen = new Set(existing.map((e) => e && e.id))
  const at = new Date().toISOString()
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    existing.push({ id, at })
  }
  await mkdir(STATE_DIR, { recursive: true })
  await writeFile(FILE, JSON.stringify(existing.slice(-MAX_ENTRIES)))
}

export function isGoneError(err) {
  return /HTTP 404|HTTP 410/i.test(String(err))
}
