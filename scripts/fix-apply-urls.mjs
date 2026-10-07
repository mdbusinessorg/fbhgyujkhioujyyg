// One-off backfill: aplica sanitizeApplyUrl aos jobs já publicados em
// public/vagas-data/*.json e actualiza has_apply no índice external-jobs.json.
// Corre localmente: node scripts/fix-apply-urls.mjs

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sanitizeApplyUrl } from './lib/apply-url.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(ROOT, 'public', 'vagas-data')
const indexPath = join(ROOT, 'public', 'external-jobs.json')

const files = (await readdir(dataDir)).filter((f) => f.endsWith('.json'))
const cleanApply = new Map()
let fixed = 0

for (const f of files) {
  const p = join(dataDir, f)
  const job = JSON.parse(await readFile(p, 'utf8'))
  const next = sanitizeApplyUrl(job)
  cleanApply.set(job.id, !!next)
  if (next !== (job.apply_url || null)) {
    job.apply_url = next
    await writeFile(p, JSON.stringify(job))
    fixed++
  }
}

const idx = JSON.parse(await readFile(indexPath, 'utf8'))
let idxFixed = 0
for (const j of idx.jobs) {
  const has = cleanApply.get(j.id) ?? !!j.has_apply
  if (j.has_apply !== has) { j.has_apply = has; idxFixed++ }
}
await writeFile(indexPath, JSON.stringify(idx))

console.log(`detail files revistos: ${files.length}, apply_url corrigidos: ${fixed}, has_apply no índice: ${idxFixed}`)
