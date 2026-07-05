// Netlify Scheduled Function — refreshes aggregated Angola jobs daily.
// Scrapes a small slice of angolaemprego.com and upserts into Supabase `external_jobs`.
import { createClient } from '@supabase/supabase-js'
import { listPageUrls, parseJob, fetchHtml, listUrl } from './lib/angolaemprego.mjs'

export const config = { schedule: '@daily' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const PAGES = parseInt(process.env.SCRAPE_PAGES || '6', 10)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default async () => {
  if (!SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }), { status: 500 })
  }
  const client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  const seen = new Set()
  let parsed = 0
  let upserted = 0
  let errors = 0

  for (let page = 1; page <= PAGES; page++) {
    let listHtml
    try {
      listHtml = await fetchHtml(listUrl(page))
    } catch {
      errors++
      continue
    }
    const urls = listPageUrls(listHtml).filter((u) => !seen.has(u))
    urls.forEach((u) => seen.add(u))

    const jobs = []
    for (const u of urls) {
      try {
        const html = await fetchHtml(u)
        const job = parseJob(html, u)
        if (job.title) jobs.push(job)
      } catch {
        errors++
      }
      await sleep(120)
    }
    parsed += jobs.length

    if (jobs.length > 0) {
      const { error } = await client.from('external_jobs').upsert(jobs, { onConflict: 'source_url' })
      if (error) errors++
      else upserted += jobs.length
    }
  }

  return new Response(JSON.stringify({ ok: true, pages: PAGES, parsed, upserted, errors }), {
    headers: { 'content-type': 'application/json' },
  })
}
