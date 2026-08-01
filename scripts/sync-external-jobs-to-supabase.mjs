// Syncs scraped external jobs from public/external-jobs.json into Supabase external_jobs.
// Intended to run after the scraping workflow so the auto-apply webhook can be triggered.
//
// Usage:
//   node scripts/sync-external-jobs-to-supabase.mjs
//
// Env:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const PAGE_SIZE = 100

async function rest(path, { method = 'GET', body } = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`
  const res = await fetch(url, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates' : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(`Supabase ${res.status} ${url}: ${txt.slice(0, 400)}`)
  try { return txt ? JSON.parse(txt) : null } catch { return null }
}

function mapJob(job) {
  return {
    id: job.id,
    source: job.source || null,
    source_url: job.source_url || null,
    title: job.title || '',
    company: job.company || null,
    logo_url: job.logo_url || null,
    location: job.location || null,
    category: job.category || null,
    description: job.description || job.excerpt || null,
    excerpt: job.excerpt || null,
    salary: job.salary || null,
    apply_url: job.apply_url || null,
    posted_at: job.posted_at || null,
    first_seen_at: job.first_seen_at || new Date().toISOString(),
    has_apply: !!job.apply_url,
    is_enriched: !!job.is_enriched,
    tipo_contrato: job.tipo_contrato || null,
    modalidade: job.modalidade || null,
    requisitos: job.requisitos || null,
    beneficios: job.beneficios || null,
    score: typeof job.score === 'number' ? job.score : 0,
  }
}

async function fetchExistingIds(allIds) {
  const existing = new Set()
  for (let i = 0; i < allIds.length; i += PAGE_SIZE) {
    const chunk = allIds.slice(i, i + PAGE_SIZE)
    const rows = await rest(`/external_jobs?select=id&id=in.(${chunk.map(id => encodeURIComponent(`"${id}"`)).join(',')})`)
    ;(rows || []).forEach(r => existing.add(r.id))
  }
  return existing
}

async function main() {
  const raw = await readFile(join(ROOT, 'public', 'external-jobs.json'), 'utf8').catch(() => null)
  if (!raw) {
    console.log('public/external-jobs.json not found; nothing to sync.')
    return
  }

  const data = JSON.parse(raw)
  const jobs = Array.isArray(data) ? data : (data.jobs || [])
  if (jobs.length === 0) {
    console.log('No jobs in external-jobs.json; nothing to sync.')
    return
  }

  const allIds = jobs.map(j => j.id)
  const existing = await fetchExistingIds(allIds)
  const newJobs = jobs.filter(j => !existing.has(j.id))

  if (newJobs.length === 0) {
    console.log('No new jobs to sync.')
    return
  }

  const rows = newJobs.map(mapJob)
  await rest('/external_jobs', { method: 'POST', body: rows })
  console.log(`Synced ${newJobs.length} new jobs to external_jobs.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
