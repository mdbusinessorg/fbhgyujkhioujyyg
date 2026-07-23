// Scrapes angolaemprego.com and writes the jobs as static JSON served by the site.
// Merges with jobs already known from previous runs, so the site accumulates
// listings over time instead of resetting to whatever is on the first N pages today.
//
// Usage:
//   node scripts/ingest-angolaemprego.mjs --dry-run     (parse only, print samples)
//   node scripts/ingest-angolaemprego.mjs --json        (write public/external-jobs.json + public/vagas-data/*.json)
// Env: MAX_PAGES (default 30), START_PAGE (default 1), CONCURRENCY (default 4), MAX_AGE_DAYS (default 60)

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { listPageUrls, parseJob, fetchHtml, listUrl } from './lib/angolaemprego.mjs'
import { loadPrevious, mergeWithPrevious, writeJson, enrichFreshJobs, slugOf, mapPool } from './lib/merge-jobs.mjs'

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

  const byId = new Map()
  for (const j of all) if (!byId.has(j.id)) byId.set(j.id, j)
  return { jobs: [...byId.values()], errors }
}

async function main() {
  const previousById = JSON_MODE ? await loadPrevious(DATA_DIR) : new Map()
  const { jobs: freshJobs, errors } = await scrape()

  const enrichedFresh = JSON_MODE ? await enrichFreshJobs(freshJobs, previousById) : freshJobs
  const jobs = JSON_MODE ? mergeWithPrevious(enrichedFresh, previousById, MAX_AGE_DAYS) : enrichedFresh

  const newCount = jobs.filter((j) => !previousById.has(j.id)).length
  console.log(`\nscraped=${freshJobs.length} new=${newCount} total=${jobs.length} errors=${errors}`)

  if (DRY_RUN) {
    console.log(
      JSON.stringify(
        enrichedFresh.slice(0, 3).map((s) => ({ ...s, description: (s.description || '').slice(0, 160) + '…' })),
        null,
        2
      )
    )
    return
  }
  if (JSON_MODE) {
    await writeJson(jobs, { dataDir: DATA_DIR, indexPath: INDEX_PATH })
    return
  }
  console.log('No output mode given. Use --json to write files or --dry-run to preview.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
