// CareerJet v4 API scraper (optional). Requires CAREERJET_API_KEY and CAREERJET_REFERER.
// Docs: https://www.careerjet.com/partners/api/

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadPrevious, mergeWithPrevious, writeJson, enrichFreshJobs, slugOf, mapPool } from './lib/merge-jobs.mjs'
import { inferCategory, extractSalary, computeScore } from './lib/job-utils.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DATA_DIR = join(ROOT, 'public', 'vagas-data')
const INDEX_PATH = join(ROOT, 'public', 'external-jobs.json')
const API_KEY = process.env.CAREERJET_API_KEY || ''
const REFERER = process.env.CAREERJET_REFERER || 'https://mosalo.eu.cc/'
const MAX_AGE_DAYS = parseInt(process.env.MAX_AGE_DAYS || '60', 10)

function idFromUrl(url) {
  const u = url.replace(/^https?:\/\//, '').replace(/[^a-z0-9-]/gi, '-')
  return `careerjet-${u.slice(0, 100)}`
}

async function searchCareerjet({ keywords = 'emprego', location = 'Angola', locale = 'pt_PT', page = 1, pagesize = 50 } = {}) {
  const params = new URLSearchParams({
    locale_code: locale,
    keywords,
    location,
    page: String(page),
    page_size: String(pagesize),
    sort: 'date',
    user_ip: '8.8.8.8',
    user_agent: 'Mosalo/1.0',
  })
  const res = await fetch(`https://search.api.careerjet.net/v4/query?${params.toString()}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      Referer: REFERER,
    },
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`CareerJet API ${res.status}: ${txt}`)
  }
  return res.json()
}

function normalizeJob(j) {
  const title = j.title || ''
  const company = j.company || ''
  const location = Array.isArray(j.locations) ? j.locations.join(', ') : (j.locations || j.location || 'Angola')
  const description = j.description || ''
  const date = j.date || ''
  const applyUrl = j.url || ''
  const id = idFromUrl(applyUrl)

  return {
    source: 'CareerJet',
    source_url: applyUrl,
    id,
    title,
    company,
    location,
    category: inferCategory(`${title} ${description}`),
    description,
    excerpt: description.slice(0, 300),
    apply_url: applyUrl || null,
    salary: extractSalary(description),
    score: computeScore(title, company, description, applyUrl),
    posted_at: date ? new Date(date).toISOString() : null,
  }
}

async function main() {
  if (!API_KEY) {
    console.log('CAREERJET_API_KEY não configurado — a ignorar fonte CareerJet.')
    return
  }

  const previousById = await loadPrevious(DATA_DIR)
  let page = 1
  let all = []
  try {
    const data = await searchCareerjet({ page, pagesize: 50 })
    const pages = data.pages || 1
    all = (data.jobs || []).map(normalizeJob)
    console.log(`careerjet page ${page}/${pages}: ${data.jobs?.length || 0} jobs`)

    while (page < pages && page < 10) {
      page++
      const d = await searchCareerjet({ page, pagesize: 50 })
      if (!d.jobs || d.jobs.length === 0) break
      all.push(...d.jobs.map(normalizeJob))
      console.log(`careerjet page ${page}/${pages}: ${d.jobs.length} jobs`)
    }
  } catch (e) {
    console.error('careerjet failed:', e.message)
    return
  }

  const enrichedFresh = await enrichFreshJobs(all, previousById)
  const jobs = mergeWithPrevious(enrichedFresh, previousById, MAX_AGE_DAYS)
  const newCount = jobs.filter((j) => !previousById.has(j.id)).length

  console.log(`careerjet parsed=${all.length} new=${newCount} total=${jobs.length}`)
  await writeJson(jobs, { dataDir: DATA_DIR, indexPath: INDEX_PATH })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
