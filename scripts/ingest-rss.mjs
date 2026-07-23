// Fetches the AngolaEmprego RSS feed and merges any job posts into the static store.
// This catches same-day listings quickly even before they appear in paginated lists.

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fetchHtml, parseJob } from './lib/angolaemprego.mjs'
import { loadPrevious, mergeWithPrevious, writeJson, enrichFreshJobs, slugOf, mapPool } from './lib/merge-jobs.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DATA_DIR = join(ROOT, 'public', 'vagas-data')
const INDEX_PATH = join(ROOT, 'public', 'external-jobs.json')
const FEED_URL = 'https://www.angolaemprego.com/feed'
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10)
const MAX_AGE_DAYS = parseInt(process.env.MAX_AGE_DAYS || '60', 10)

async function fetchRssItems() {
  const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${FEED_URL}`)
  const xml = await res.text()
  const items = []
  const itemRe = /<item>[\s\S]*?<\/item>/gi
  let m
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[0]
    const linkMatch = block.match(/<link>([^<]+)<\/link>/i)
    const titleMatch = block.match(/<title>([^<]+)<\/title>/i)
    const pubDateMatch = block.match(/<pubDate>([^<]+)<\/pubDate>/i)
    if (linkMatch && /\/vagas\//i.test(linkMatch[1])) {
      items.push({
        link: linkMatch[1].trim(),
        title: titleMatch ? titleMatch[1].trim() : '',
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
      })
    }
  }
  return items
}

async function main() {
  const previousById = await loadPrevious(DATA_DIR)
  const items = await fetchRssItems()
  console.log(`rss items=${items.length}`)

  const freshJobs = (await mapPool(items, async (item) => {
    try {
      const html = await fetchHtml(item.link)
      const job = parseJob(html, item.link)
      return { ...job, id: slugOf(item.link) }
    } catch (e) {
      console.error('rss parse failed:', item.link, e.message)
      return null
    }
  }, CONCURRENCY)).filter((j) => j && j.title)

  const enrichedFresh = await enrichFreshJobs(freshJobs, previousById)
  const jobs = mergeWithPrevious(enrichedFresh, previousById, MAX_AGE_DAYS)
  const newCount = jobs.filter((j) => !previousById.has(j.id)).length

  console.log(`rss parsed=${freshJobs.length} new=${newCount} total=${jobs.length}`)
  await writeJson(jobs, { dataDir: DATA_DIR, indexPath: INDEX_PATH })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
