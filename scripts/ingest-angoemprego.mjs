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
import { decodeEntities, stripTags, sanitizeHtml, inferCategory, extractSalary, computeScore } from './lib/job-utils.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DRY_RUN = process.argv.includes('--dry-run')
const JSON_MODE = process.argv.includes('--json')
const MAX_JOBS = parseInt(process.env.MAX_JOBS || '300', 10)
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10)
const MAX_AGE_DAYS = parseInt(process.env.MAX_AGE_DAYS || '60', 10)
const SITEMAP = 'https://angoemprego.com/sitemap.xml'
const FEED = 'https://angoemprego.com/feed/?post_type=job_listing'

const DATA_DIR = join(ROOT, 'public', 'vagas-data')
const INDEX_PATH = join(ROOT, 'public', 'external-jobs.json')

// Descoberta via RSS do post_type job_listing — a feed NÃO é desafiada pelo
// Cloudflare e funciona através do proxy Netlify (as páginas HTML e o
// sitemap.xml são). Cada página da feed traz 10 vagas com link + pubDate.
// Cada item traz também título e um teaser (serve de descrição de reserva
// quando o detalhe da página falha — o angoemprego desafia o Cloudflare a
// todo o tráfego de datacenter excepto /feed/).
async function jobUrlsFromFeed() {
  const urls = new Map()
  const itemRe = /<item>([\s\S]*?)<\/item>/gi
  const pick = (block, re) => {
    const m = re.exec(block)
    return m ? m[1].trim() : ''
  }
  for (let page = 1; page <= Math.ceil(MAX_JOBS / 10); page++) {
    const xml = await fetchHtml(`${FEED}&paged=${page}`)
    const before = urls.size
    let m
    while ((m = itemRe.exec(xml)) !== null) {
      const block = m[1]
      const loc = pick(block, /<link>([^<]+)<\/link>/i)
      if (!loc.includes('/vagas/')) continue
      const pubDate = pick(block, /<pubDate>([^<]*)<\/pubDate>/i)
      const title = pick(block, /<title>([^<]*)<\/title>/i)
      const teaser = pick(block, /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)
      const d = new Date(pubDate)
      urls.set(loc, {
        lastmod: isNaN(d.getTime()) ? '' : d.toISOString(),
        title: stripTags(decodeEntities(title)),
        teaser: decodeEntities(teaser.replace(/<br\s*\/?>/gi, '\n')),
      })
    }
    if (urls.size === before) break // feed vazia — fim da paginação
  }
  return [...urls.entries()].map(([loc, meta]) => ({ loc, ...meta }))
}

async function jobUrls() {
  try {
    const feed = await jobUrlsFromFeed()
    if (feed.length) {
      return feed
        .sort((a, b) => (b.lastmod || '').localeCompare(a.lastmod || ''))
        .slice(0, MAX_JOBS)
    }
  } catch (e) {
    console.error('feed failed:', e.message)
  }

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

// Vaga de resposta construída a partir do item da feed (título + teaser +
// pubDate) quando o detalhe da página falha. O apply_url aponta para a página
// da vaga no angoemprego — o Cloudflare só bloqueia datacenters, nos browsers
// dos candidatos abre normalmente.
function jobFromFeedItem({ loc, lastmod, title, teaser }) {
  // A teaser acaba sempre em "… | Continue Lendo \"título\"" — corta essa cauda
  // e descodifica entidades antes de extrair localização/empresa.
  const teaserText = decodeEntities(stripTags(teaser || ''))
    .replace(/\s*\|?\s*Continue Lendo[\s\S]*$/i, '')
    .replace(/["'»]\s*$/, '')
    .replace(/[\s|]+$/, '')
    .trim()
  const loc2 = teaserText.match(/📍\s*([^|\n]+)/)?.[1]?.trim() || ''
  // Muitos teasers abrem com "Sobre a Vaga A <Empresa>, …" — captura a empresa
  // apenas quando o padrão é claro, para não inventar nomes.
  const company =
    teaserText.match(/Sobre a Vaga\s+(?:A|O|As|Os|Para|Na|No|Da|De|Do)\s+([A-ZÀ-Þ][A-Za-zÀ-Þ0-9&.\- ]{2,60}?)\s*[,.\n]/u)?.[1]?.trim() || ''
  const description = sanitizeHtml(`<p>${teaserText}</p>`)
  const excerpt = teaserText.slice(0, 300)
  return {
    id: `ae-${pathSlug(loc)}`,
    source: 'AngoEmprego',
    source_url: loc,
    title: title || pathSlug(loc).replace(/-/g, ' '),
    company,
    logo_url: '',
    location: loc2 || 'Angola',
    category: inferCategory(`${title} ${teaserText}`),
    description,
    excerpt,
    apply_url: loc,
    salary: extractSalary(`${description} ${excerpt}`),
    score: computeScore(title || '', '', `${description} ${excerpt}`, loc),
    posted_at: lastmod || null,
    tipo_contrato: '',
    feed_only: true,
  }
}

async function scrape(previousById = new Map()) {
  const allEntries = await jobUrls()
  const entries = allEntries.filter(({ loc }) => !previousById.has(`ae-${pathSlug(loc)}`))
  console.log(`angoemprego urls=${allEntries.length} new_candidates=${entries.length}`)

  return mapPool(
    entries,
    async ({ loc, ...meta }) => {
      try {
        const html = await fetchHtml(loc)
        const ld = extractJobPostings(html)[0]
        if (!ld) return meta.title ? jobFromFeedItem({ loc, ...meta }) : null
        return jobFromLd(ld, {
          url: loc,
          source: 'AngoEmprego',
          applyUrl: findApplyUrl(html, { pageUrl: loc }),
          id: `ae-${pathSlug(loc)}`,
        })
      } catch (e) {
        // Detalhe bloqueado — ainda assim publica a vaga com os dados da feed.
        if (meta.title) return { ...jobFromFeedItem({ loc, ...meta }), __partial: true }
        return { __error: String(e) }
      }
    },
    CONCURRENCY,
    200
  )
}

async function main() {
  const previousById = await loadPrevious(DATA_DIR)
  const raw = await scrape(previousById)
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
