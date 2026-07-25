// Scrapes Jobartis (www.jobartis.com) and merges into the static external-jobs store.
// Tries to use the recruiter's company website as the apply_url so the user lands on
// the company site instead of the Jobartis portal.
//
// Usage:
//   node scripts/ingest-jobartis.mjs --dry-run
//   node scripts/ingest-jobartis.mjs --json
// Env: MAX_PAGES (default 5), CONCURRENCY (default 3)

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { listUrl, fetchHtml, jinaProxy, parseListPage, parseJob, enrichJobWithCompanyWebsite } from './lib/jobartis.mjs'
import { loadPrevious, mergeWithPrevious, writeJson, enrichFreshJobs, slugOf, mapPool } from './lib/merge-jobs.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DRY_RUN = process.argv.includes('--dry-run')
const JSON_MODE = process.argv.includes('--json')
const MAX_PAGES = parseInt(process.env.MAX_PAGES || '5', 10)
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '2', 10)
const MAX_AGE_DAYS = parseInt(process.env.MAX_AGE_DAYS || '60', 10)

const DATA_DIR = join(ROOT, 'public', 'vagas-data')
const INDEX_PATH = join(ROOT, 'public', 'external-jobs.json')

async function scrape({ maxPages = MAX_PAGES, concurrency = CONCURRENCY } = {}) {
  const seen = new Set()
  const all = []
  let errors = 0

  for (let page = 1; page <= maxPages; page++) {
    let md
    try {
      md = await fetchHtml(listUrl(page))
    } catch {
      errors++
      continue
    }
    const entries = parseListPage(md).filter((e) => !seen.has(e.url))
    entries.forEach((e) => seen.add(e.url))
    if (entries.length === 0) continue

    const jobs = (await mapPool(
      entries,
      async (entry) => {
        try {
          const html = await fetchHtml(jinaProxy(entry.url))
          const job = parseJob(html, entry.url, entry)
          await enrichJobWithCompanyWebsite(job)
          return job
        } catch (e) {
          return { __error: String(e) }
        }
      },
      concurrency,
      800
    )).filter((j) => j && !j.__error && j.title)

    errors += entries.length - jobs.length
    all.push(...jobs)
    console.log(`page ${page}: ${entries.length} urls, ${jobs.length} parsed (total ${all.length})`)
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
