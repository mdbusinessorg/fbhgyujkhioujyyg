// Scrapes angolaemprego.com and writes the jobs as static JSON served by the site.
// Merges with jobs already known from previous runs, so the site accumulates
// listings over time instead of resetting to whatever is on the first N pages today.
//
// Usage:
//   node scripts/ingest-angolaemprego.mjs --dry-run     (parse only, print samples)
//   node scripts/ingest-angolaemprego.mjs --json        (write public/external-jobs.json + public/vagas-data/*.json)
// Env: MAX_PAGES (default 30), START_PAGE (default 1), CONCURRENCY (default 4), MAX_AGE_DAYS (default 60)
 
import { writeFile, mkdir, readFile, readdir, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { listPageUrls, parseJob, fetchHtml, listUrl } from './lib/angolaemprego.mjs'
import { getCompanyLogoUrl } from './lib/company-logos.mjs'
 
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
 
const DRY_RUN = process.argv.includes('--dry-run')
const JSON_MODE = process.argv.includes('--json')
const MAX_PAGES = parseInt(process.env.MAX_PAGES || '30', 10)
const START_PAGE = parseInt(process.env.START_PAGE || '1', 10)
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10)
const MAX_AGE_DAYS = parseInt(process.env.MAX_AGE_DAYS || '60', 10)
 
const DATA_DIR = join(ROOT, 'public', 'vagas-data')
const INDEX_PATH = join(ROOT, 'public', 'external-jobs.json')
 
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const slugOf = (url) => (url.split('/vagas/')[1] || url).replace(/[^a-z0-9-]/gi, '').slice(0, 120)
 
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
 
// Load whatever we already know about, so re-running the scraper doesn't
// wipe out jobs that fell off the first MAX_PAGES pages of the source site.
async function loadPrevious() {
  const byId = new Map()
  try {
    const files = await readdir(DATA_DIR)
    for (const f of files) {
      if (!f.endsWith('.json')) continue
      try {
        const raw = await readFile(join(DATA_DIR, f), 'utf8')
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
 
async function scrape({ maxPages = MAX_PAGES, startPage = START_PAGE, concurrency = CONCURRENCY } = {}) {
  const seen = new Set()
  const all = []
  let errors = 0
 
  for (let page = startPage; page < startPage + maxPages; page++) {
    let listHtml
    try {
      listHtml = await fetchHtml(listUrl(page))
    } catch {
      errors++
      continue
    }
    const urls = listPageUrls(listHtml).filter((u) => !seen.has(u))
    urls.forEach((u) => seen.add(u))
    if (urls.length === 0) continue
 
    const jobs = (await mapPool(urls, async (u) => {
      const html = await fetchHtml(u)
      return { ...parseJob(html, u), id: slugOf(u) }
    }, concurrency)).filter((j) => j && !j.__error && j.title)
 
    errors += urls.length - jobs.length
    all.push(...jobs)
    console.log(`page ${page}: ${urls.length} urls, ${jobs.length} parsed (total ${all.length})`)
  }
 
  // De-dupe within this run's fetch, keeping first occurrence.
  const byId = new Map()
  for (const j of all) if (!byId.has(j.id)) byId.set(j.id, j)
  return { jobs: [...byId.values()], errors }
}
 
// Combine freshly scraped jobs with what we already had on disk.
function mergeWithPrevious(freshJobs, previousById) {
  const now = new Date().toISOString()
  const merged = new Map(previousById) // start from what we already had
 
  for (const job of freshJobs) {
    const existing = merged.get(job.id)
    if (existing) {
      // Already known — keep the ORIGINAL first_seen_at so it doesn't
      // jump back to "today" just because the scraper saw it again.
      merged.set(job.id, {
        ...existing,
        ...job,
        first_seen_at: existing.first_seen_at || existing.scraped_at || now,
      })
    } else {
      // Genuinely new — this is what should show up as "today's" job.
      merged.set(job.id, { ...job, first_seen_at: now })
    }
  }
 
  // Drop listings we haven't seen again in a long time (likely expired/removed).
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  const kept = [...merged.values()].filter((j) => {
    const ts = Date.parse(j.first_seen_at || j.posted_at || '')
    return Number.isNaN(ts) || ts >= cutoff
  })
 
  // Sort by priority score (importance/payment signals), then by when we first saw it.
  kept.sort((a, b) => {
    const scoreDiff = (b.score || 0) - (a.score || 0)
    if (scoreDiff !== 0) return scoreDiff
    return (b.first_seen_at || '').localeCompare(a.first_seen_at || '')
  })
  return kept
}
 
async function writeJson(jobs) {
  await mkdir(DATA_DIR, { recursive: true })
 
  // Remove files for jobs that dropped out of the merged set (pruned/expired),
  // WITHOUT wiping the ones we want to keep.
  const keepIds = new Set(jobs.map((j) => j.id))
  try {
    const existingFiles = await readdir(DATA_DIR)
    for (const f of existingFiles) {
      const id = f.replace(/\.json$/, '')
      if (!keepIds.has(id)) await unlink(join(DATA_DIR, f)).catch(() => {})
    }
  } catch {
    // dir didn't exist yet — fine
  }
 
  // Enrich every job with its company logo (if known).
  const enriched = jobs.map((j) => ({ ...j, logo_url: getCompanyLogoUrl(j.company, j.logo_url) }))

  // Slim index for the listing page. first_seen_at lets the site show a
  // "novo hoje" badge and sort by when the job actually appeared on mosalo.
  const index = enriched.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    logo_url: j.logo_url,
    location: j.location,
    category: j.category,
    excerpt: j.excerpt,
    salary: j.salary || '',
    score: j.score || 0,
    posted_at: j.posted_at,
    first_seen_at: j.first_seen_at,
    has_apply: !!j.apply_url,
  }))
  await writeFile(
    INDEX_PATH,
    JSON.stringify({ updated_at: new Date().toISOString(), count: index.length, jobs: index })
  )
 
  // Full record per job for the detail page.
  for (const j of enriched) {
    await writeFile(join(DATA_DIR, `${j.id}.json`), JSON.stringify(j))
  }
  console.log(`wrote public/external-jobs.json (${index.length}) + public/vagas-data/*.json`)
}
 
async function main() {
  const previousById = JSON_MODE ? await loadPrevious() : new Map()
  const { jobs: freshJobs, errors } = await scrape()
  const jobs = JSON_MODE ? mergeWithPrevious(freshJobs, previousById) : freshJobs
 
  const newCount = jobs.filter((j) => !previousById.has(j.id)).length
  console.log(`\nscraped=${freshJobs.length} new=${newCount} total=${jobs.length} errors=${errors}`)
 
  if (DRY_RUN) {
    console.log(
      JSON.stringify(
        freshJobs.slice(0, 3).map((s) => ({ ...s, description: (s.description || '').slice(0, 160) + '…' })),
        null,
        2
      )
    )
    return
  }
  if (JSON_MODE) {
    await writeJson(jobs)
    return
  }
  console.log('No output mode given. Use --json to write files or --dry-run to preview.')
}
 
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
