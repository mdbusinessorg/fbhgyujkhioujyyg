// Scrapes angolaemprego.com and upserts jobs into Supabase `external_jobs`.
// Usage:
//   node scripts/ingest-angolaemprego.mjs --dry-run           (parse only, no DB)
//   MAX_PAGES=30 node scripts/ingest-angolaemprego.mjs        (seed DB)
// Env: SUPABASE_URL (default project url), SUPABASE_SERVICE_ROLE_KEY (required for DB writes)

import { listPageUrls, parseJob, fetchHtml, listUrl } from './lib/angolaemprego.mjs'

const DRY_RUN = process.argv.includes('--dry-run')
const MAX_PAGES = parseInt(process.env.MAX_PAGES || '30', 10)
const START_PAGE = parseInt(process.env.START_PAGE || '1', 10)
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function mapPool(items, fn, concurrency) {
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
      await sleep(150)
    }
  })
  await Promise.all(workers)
  return results
}

export async function ingest({ maxPages = MAX_PAGES, startPage = START_PAGE, concurrency = CONCURRENCY, dryRun = DRY_RUN, onBatch } = {}) {
  const seen = new Set()
  let parsed = 0
  let errors = 0
  let upserted = 0
  const samples = []

  for (let page = startPage; page < startPage + maxPages; page++) {
    let listHtml
    try {
      listHtml = await fetchHtml(listUrl(page))
    } catch (e) {
      errors++
      continue
    }
    const urls = listPageUrls(listHtml).filter((u) => !seen.has(u))
    urls.forEach((u) => seen.add(u))
    if (urls.length === 0) continue

    const jobs = (await mapPool(urls, async (u) => {
      const html = await fetchHtml(u)
      return parseJob(html, u)
    }, concurrency)).filter((j) => j && !j.__error && j.title)

    errors += urls.length - jobs.length
    parsed += jobs.length
    if (samples.length < 3) samples.push(...jobs.slice(0, 3 - samples.length))

    if (!dryRun && jobs.length > 0) {
      upserted += await onBatch(jobs)
    }
    console.log(`page ${page}: ${urls.length} urls, ${jobs.length} parsed`)
  }

  return { parsed, errors, upserted, samples }
}

async function upsertBatch(client, jobs) {
  const { error } = await client.from('external_jobs').upsert(jobs, { onConflict: 'source_url' })
  if (error) { console.error('upsert error:', error.message); return 0 }
  return jobs.length
}

async function main() {
  if (DRY_RUN) {
    const { parsed, errors, samples } = await ingest({ dryRun: true })
    console.log(`\nDRY RUN: parsed=${parsed} errors=${errors}`)
    console.log(JSON.stringify(samples.map((s) => ({ ...s, description: (s.description || '').slice(0, 160) + '…' })), null, 2))
    return
  }
  if (!SERVICE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required for DB writes.')
    process.exit(1)
  }
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  const { parsed, errors, upserted } = await ingest({ onBatch: (jobs) => upsertBatch(client, jobs) })
  console.log(`\nDONE: parsed=${parsed} upserted=${upserted} errors=${errors}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
