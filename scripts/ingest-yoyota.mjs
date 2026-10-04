// Scrapes Empregos Yoyota (ao.empregosyoyota.net) via the sitemap urlset and
// the JobPosting JSON-LD on each detail page. Applications happen on the
// Yoyota page itself, so apply_url falls back to the source URL.
//
// Usage:
//   node scripts/ingest-yoyota.mjs --dry-run
//   node scripts/ingest-yoyota.mjs --json
// Env: MAX_JOBS (default 300), CONCURRENCY (default 4), MAX_AGE_DAYS (default 60)

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fetchHtml, extractJobPostings, jobFromLd, pathSlug, parseSitemap } from './lib/jsonld-jobs.mjs'
import { decodeEntities, stripTags } from './lib/job-utils.mjs'
import { loadPrevious, mergeWithPrevious, writeJson, enrichFreshJobs, mapPool } from './lib/merge-jobs.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DRY_RUN = process.argv.includes('--dry-run')
const JSON_MODE = process.argv.includes('--json')
const MAX_JOBS = parseInt(process.env.MAX_JOBS || '300', 10)
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10)
const MAX_AGE_DAYS = parseInt(process.env.MAX_AGE_DAYS || '60', 10)
const SITEMAP = 'https://ao.empregosyoyota.net/sitemap.xml'

const DATA_DIR = join(ROOT, 'public', 'vagas-data')
const INDEX_PATH = join(ROOT, 'public', 'external-jobs.json')

async function jobUrls() {
  const entries = parseSitemap(await fetchHtml(SITEMAP))
  return entries
    .filter((e) => e.loc.includes('/empregos/') && !e.loc.includes('/en/'))
    .sort((a, b) => (b.lastmod || '').localeCompare(a.lastmod || ''))
    .slice(0, MAX_JOBS)
}

async function scrape() {
  const entries = await jobUrls()
  console.log(`yoyota urls=${entries.length}`)

  return mapPool(
    entries,
    async ({ loc }) => {
      try {
        const html = await fetchHtml(loc)
        const ld = extractJobPostings(html)[0]
        if (!ld) return null
        // Descriptions usually carry "Envie a sua candidatura para: email@..."
        const email = stripTags(decodeEntities(ld.description || ''))
          .match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0]
        const applyUrl = email ? `mailto:${email}` : loc
        return jobFromLd(ld, {
          url: loc,
          source: 'EmpregosYoyota',
          applyUrl,
          id: `yy-${pathSlug(loc)}`,
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

  console.log(`yoyota parsed=${freshJobs.length} errors=${errors} new=${newCount} total=${jobs.length}`)
  await writeJson(jobs, { dataDir: DATA_DIR, indexPath: INDEX_PATH })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
