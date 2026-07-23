// Utilities for merging, enriching and writing job listings to the static data store.

import { writeFile, mkdir, readFile, readdir, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCompanyLogoUrl } from './company-logos.mjs'
import { enrichJobDescription, extractJobFields } from './groq.mjs'
import { stripTags } from './job-utils.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = join(__dirname, '..', '..')

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const slugOf = (url, max = 120) => (url.split('/vagas/')[1] || url).replace(/[^a-z0-9-]/gi, '').slice(0, max)

export async function mapPool(items, fn, concurrency, sleepMs = 150) {
  const results = []
  let i = 0
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++
      try {
        results[idx] = await fn(items[idx])
      } catch (e) {
        results[idx] = { __error: String(e) }
      }
      await sleep(sleepMs)
    }
  })
  await Promise.all(workers)
  return results
}

export async function loadPrevious(dataDir) {
  const byId = new Map()
  try {
    const files = await readdir(dataDir)
    for (const f of files) {
      if (!f.endsWith('.json')) continue
      try {
        const raw = await readFile(join(dataDir, f), 'utf8')
        const j = JSON.parse(raw)
        if (j && j.id) byId.set(j.id, j)
      } catch {
        // skip unreadable/corrupt file
      }
    }
  } catch {
    // no previous data yet — first run
  }
  return byId
}

export function mergeWithPrevious(freshJobs, previousById, maxAgeDays = 60) {
  const now = new Date().toISOString()
  const merged = new Map(previousById)

  for (const job of freshJobs) {
    if (!job || job.__error || !job.title || !job.id) continue
    const existing = merged.get(job.id)
    if (existing) {
      merged.set(job.id, {
        ...existing,
        ...job,
        first_seen_at: existing.first_seen_at || existing.scraped_at || now,
      })
    } else {
      merged.set(job.id, { ...job, first_seen_at: now })
    }
  }

  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
  const kept = [...merged.values()].filter((j) => {
    const ts = Date.parse(j.first_seen_at || j.posted_at || '')
    return Number.isNaN(ts) || ts >= cutoff
  })

  kept.sort((a, b) => {
    const scoreDiff = (b.score || 0) - (a.score || 0)
    if (scoreDiff !== 0) return scoreDiff
    return (b.first_seen_at || '').localeCompare(a.first_seen_at || '')
  })

  return kept
}

export async function enrichFreshJobs(freshJobs, previousById) {
  if (!process.env.GROQ_API_KEY) {
    console.log('GROQ_API_KEY não configurado — a enriquecer sem IA.')
    return freshJobs
  }

  const enriched = []
  let processed = 0
  for (const job of freshJobs) {
    if (!job || job.__error || !job.id) {
      enriched.push(job)
      continue
    }
    const existing = previousById.get(job.id)
    if (existing && existing.description_enriched) {
      enriched.push({
        ...existing,
        ...job,
        description_enriched: existing.description_enriched,
        tipo_contrato: existing.tipo_contrato,
        modalidade: existing.modalidade,
        requisitos: existing.requisitos,
        beneficios: existing.beneficios,
      })
      continue
    }

    const [descriptionHtml, fields] = await Promise.all([
      enrichJobDescription(job),
      extractJobFields(job),
    ])

    enriched.push({
      ...job,
      description_enriched: descriptionHtml || job.description,
      tipo_contrato: fields.tipo_contrato || '',
      modalidade: fields.modalidade || '',
      requisitos: fields.requisitos || '',
      beneficios: fields.beneficios || '',
    })

    processed++
    if (processed % 5 === 0) console.log(`enriched ${processed}/${freshJobs.filter((j) => j && !j.__error && j.id).length} new jobs`)
  }
  return enriched
}

export async function writeJson(jobs, { dataDir, indexPath }) {
  await mkdir(dataDir, { recursive: true })

  const keepIds = new Set(jobs.map((j) => j.id))
  try {
    const existingFiles = await readdir(dataDir)
    for (const f of existingFiles) {
      const id = f.replace(/\.json$/, '')
      if (!keepIds.has(id)) await unlink(join(dataDir, f)).catch(() => {})
    }
  } catch {
    // dir didn't exist yet
  }

  const enriched = jobs.map((j) => ({ ...j, logo_url: getCompanyLogoUrl(j.company, j.logo_url) }))

  const index = enriched.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    logo_url: j.logo_url,
    location: j.location,
    category: j.category,
    excerpt: stripTags(j.description_enriched || j.excerpt).slice(0, 240),
    salary: j.salary || '',
    score: j.score || 0,
    posted_at: j.posted_at,
    first_seen_at: j.first_seen_at,
    has_apply: !!j.apply_url,
    is_enriched: !!j.description_enriched,
    tipo_contrato: j.tipo_contrato || '',
    modalidade: j.modalidade || '',
    requisitos: j.requisitos || '',
    beneficios: j.beneficios || '',
  }))

  await writeFile(
    indexPath,
    JSON.stringify({ updated_at: new Date().toISOString(), count: index.length, jobs: index })
  )

  for (const j of enriched) {
    await writeFile(join(dataDir, `${j.id}.json`), JSON.stringify(j))
  }
  console.log(`wrote ${indexPath} (${index.length}) + ${dataDir}/*.json`)
}
