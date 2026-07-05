// Scrapes angolaemprego.com and writes the jobs as static JSON served by the site.
// Usage:
//   node scripts/ingest-angolaemprego.mjs --dry-run     (parse only, print samples)
//   node scripts/ingest-angolaemprego.mjs --json        (write public/external-jobs.json + public/vagas-data/*.json)
// Env: MAX_PAGES (default 30), START_PAGE (default 1), CONCURRENCY (default 4)

import { writeFile, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { listPageUrls, parseJob, fetchHtml, listUrl } from './lib/angolaemprego.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DRY_RUN = process.argv.includes('--dry-run')
const JSON_MODE = process.argv.includes('--json')
const MAX_PAGES = parseInt(process.env.MAX_PAGES || '30', 10)
const START_PAGE = parseInt(process.env.START_PAGE || '1', 10)
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10)

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

  // Newest first; de-dupe by id keeping first occurrence.
  const byId = new Map()
  for (const j of all) if (!byId.has(j.id)) byId.set(j.id, j)
  const unique = [...byId.values()].sort((a, b) => (b.posted_at || '').localeCompare(a.posted_at || ''))
  return { jobs: unique, errors }
}

async function writeJson(jobs) {
  const dataDir = join(ROOT, 'public', 'vagas-data')
  await rm(dataDir, { recursive: true, force: true })
  await mkdir(dataDir, { recursive: true })

  // Slim index for the listing page.
  const index = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    category: j.category,
    excerpt: j.excerpt,
    posted_at: j.posted_at,
    has_apply: !!j.apply_url,
  }))
  await writeFile(join(ROOT, 'public', 'external-jobs.json'), JSON.stringify({ updated_at: new Date().toISOString(), count: index.length, jobs: index }))

  // Full record per job for the detail page.
  for (const j of jobs) {
    await writeFile(join(dataDir, `${j.id}.json`), JSON.stringify(j))
  }
  console.log(`wrote public/external-jobs.json (${index.length}) + public/vagas-data/*.json`)
}

async function main() {
  const { jobs, errors } = await scrape()
  console.log(`\nparsed=${jobs.length} errors=${errors}`)

  if (DRY_RUN) {
    console.log(JSON.stringify(jobs.slice(0, 3).map((s) => ({ ...s, description: (s.description || '').slice(0, 160) + '…' })), null, 2))
    return
  }
  if (JSON_MODE) {
    await writeJson(jobs)
    return
  }
  console.log('No output mode given. Use --json to write files or --dry-run to preview.')
}

main().catch((e) => { console.error(e); process.exit(1) })
