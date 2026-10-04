// Scrapes Ango Emprego (angoemprego.com) job listings via the WP Job Manager
// sitemaps + JobPosting JSON-LD on each detail page, and merges into the
// static external-jobs store.
//
// Usage:
//   node scripts/ingest-angoemprego.mjs --dry-run
//   node scripts/ingest-angoemprego.mjs --json
// Env: MAX_JOBS (default 300), CONCURRENCY (default 4), MAX_AGE_DAYS (default 60)

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fetchHtml, extractJobPostings, jobFromLd, findApplyUrl, pathSlug, parseSitemap } from './lib/jsonld-jobs.mjs'
import { loadPrevious, mergeWithPrevious, writeJson, enrichFreshJobs, mapPool } from './lib/merge-jobs.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DRY_RUN = process.argv.includes('--dry-run')
const JSON_MODE = process.argv.includes('--json')
const MAX_JOBS = parseInt(process.env.MAX_JOBS || '300', 10)
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10)
const MAX_AGE_DAYS = parseInt(process.env.MAX_AGE_DAYS || '60', 10)
const SITEMAP = 'https://angoemprego.com/sitemap.xml'

const DATA_DIR = join(ROOT, 'public', 'vagas-data')
const INDEX_PATH = join(ROOT, 'public', 'external-jobs.json')

async function jobUrls() {
  const index = parseSitemap(await fetchHtml(SITEMAP))
  const subs = index.filter((e) => /job_listing-sitemap.*\.xml$/.test(e.loc))
  const sitemaps = subs.length ? subs : index.filter((e) => e.loc.includes('/vagas/'))

  const urls = new Map()
  for (const s of subs) {
    try {
      const xml = await fetchHtml(s.loc)
      for (const e of parseSitemap(xml)) {
        if (e.loc.includes('/vagas/')) urls.set(e.loc, e.lastmod)
      }
    } catch (e) {
      console.error('sitemap failed:', s.loc, e.message)
    }
  }
  if (urls.size === 0) {
    for (const e of sitemaps) urls.set(e.loc, e.lastmod)
  }

  return [...urls.entries()]
    .map(([loc, lastmod]) => ({ loc, lastmod }))
    .sort((a, b) => (b.lastmod || '').localeCompare(a.lastmod || ''))
    .slice(0, MAX_JOBS)
}

async function scrape() {
  const entries = await jobUrls()
  console.log(`angoemprego urls=${entries.length}`)

  return mapPool(
    entries,
    async ({ loc }) => {
      try {
        const html = await fetchHtml(loc)
        const ld = extractJobPostings(html)[0]
        if (!ld) return null
        return jobFromLd(ld, {
          url: loc,
          source: 'AngoEmprego',
          applyUrl: findApplyUrl(html, { pageUrl: loc }),
          id: `ae-${pathSlug(loc)}`,
        })
      } catch (e) {
        return { __error: String(e) }
      }
    },
    CONCURRENCY,
    200
  )
}

async function main() {
  const previousById = await loadPrevious(DATA_DIR)
  const raw = await scrape()
  const freshJobs = raw.filter((j) => j && !j.__error && j.title)
  const errors = raw.filter((j) => j && j.__error).length

  if (DRY_RUN) {
    console.log(JSON.stringify(freshJobs.slice(0, 3), null, 2))
    console.log(`dry-run: parsed=${freshJobs.length} errors=${errors}`)
    return
  }

  const enrichedFresh = JSON_MODE ? await enrichFreshJobs(freshJobs, previousById) : freshJobs
  const jobs = mergeWithPrevious(enrichedFresh, previousById, MAX_AGE_DAYS)
  const newCount = jobs.filter((j) => !previousById.has(j.id)).length

  console.log(`angoemprego parsed=${freshJobs.length} errors=${errors} new=${newCount} total=${jobs.length}`)
  await writeJson(jobs, { dataDir: DATA_DIR, indexPath: INDEX_PATH })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
