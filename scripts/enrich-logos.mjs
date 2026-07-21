import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getCompanyLogoUrl } from './lib/company-logos.mjs'

const ROOT = process.cwd()
const DATA_DIR = join(ROOT, 'public', 'vagas-data')
const INDEX_PATH = join(ROOT, 'public', 'external-jobs.json')

async function main() {
  const raw = await readFile(INDEX_PATH, 'utf8')
  const index = JSON.parse(raw)

  // Enrich index
  const enrichedIndex = {
    ...index,
    jobs: index.jobs.map((j) => ({ ...j, logo_url: getCompanyLogoUrl(j.company, j.logo_url) })),
  }
  await writeFile(INDEX_PATH, JSON.stringify(enrichedIndex))

  // Enrich individual files
  const files = await readdir(DATA_DIR)
  for (const f of files) {
    if (!f.endsWith('.json')) continue
    const path = join(DATA_DIR, f)
    const j = JSON.parse(await readFile(path, 'utf8'))
    const logoUrl = getCompanyLogoUrl(j.company, j.logo_url)
    if (logoUrl !== j.logo_url) {
      j.logo_url = logoUrl
      await writeFile(path, JSON.stringify(j))
    }
  }

  console.log(`enriched ${enrichedIndex.jobs.length} jobs`)
}

main().catch((e) => { console.error(e); process.exit(1) })
