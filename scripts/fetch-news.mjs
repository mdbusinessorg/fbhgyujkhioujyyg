import { writeFileSync, existsSync, readFileSync } from 'fs'

const HOME = 'https://r.jina.ai/http://jornaldeangola.ao/'
const OUT = 'public/noticias.json'
const LIMIT = 6

async function fetchText(url, ms = 20000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function extractUrls(md) {
  const seen = new Set()
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  let m
  while ((m = regex.exec(md))) {
    const url = m[2].trim()
    if (/\/noticias\/\d+\/[^/]+\/\d+\//.test(url)) seen.add(url)
  }
  return [...seen]
}

function clean(str) {
  return (str || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractArticle(body) {
  const lines = body.split('\n').map(l => l.trim())
  const titleLine = lines.find(l => l.startsWith('Title:'))
  const title = clean(titleLine ? titleLine.replace('Title:', '').trim() : '')

  const contentIdx = lines.findIndex(l => l.startsWith('Markdown Content:'))
  const content = contentIdx >= 0 ? lines.slice(contentIdx + 1) : lines
  const h1Idx = content.findIndex(l => /^#\s+/.test(l))

  let excerpt = ''
  if (h1Idx >= 0) {
    for (let i = h1Idx + 1; i < content.length; i++) {
      const l = content[i].trim()
      if (!l) continue
      if (/^\*|^!\[|^\[|^#{1,3}\s|^>|^\-|^(quinta|sexta|sábado|domingo|segunda|terça|quarta|publicidade)\-?/i.test(l)) continue
      if (l.length < 50) continue
      excerpt = l
      break
    }
  }
  if (!excerpt) {
    const first = content.find(l => l.length > 50 && /^[A-ZÁÉÍÓÚÂÃÊÔÇ]/.test(l) && !/^Title:|^URL Source:|^Markdown Content:/.test(l))
    excerpt = first || ''
  }

  let date = new Date().toISOString()
  const dateLine = content.find(l => /^(segunda|terça|quarta|quinta|sexta|sábado|domingo)(-feira)?,\s+\d{1,2}\s+de/i.test(l))
  if (dateLine) {
    const m = dateLine.match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i)
    if (m) {
      const months = { janeiro:0, fevereiro:1, março:2, abril:3, maio:4, junho:5, julho:6, agosto:7, setembro:8, outubro:9, novembro:10, dezembro:11 }
      const month = months[m[2].toLowerCase()]
      if (month !== undefined) {
        const d = new Date(Number(m[3]), month, Number(m[1]), 12, 0, 0)
        if (!isNaN(d.getTime())) date = d.toISOString()
      }
    }
  }

  return { title, excerpt: clean(excerpt), date }
}

async function fetchArticles(urls) {
  const results = []
  const concurrency = 3
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      batch.map(async (url) => {
        const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`
        const text = await fetchText(jinaUrl, 25000)
        const data = extractArticle(text)
        if (!data.title || !data.excerpt) return null
        return { id: url, link: url, source: 'Jornal de Angola', ...data }
      })
    )
    settled.forEach((s) => { if (s.status === 'fulfilled' && s.value) results.push(s.value) })
  }
  return results
}

async function main() {
  try {
    const home = await fetchText(HOME, 30000)
    const urls = extractUrls(home).slice(0, LIMIT * 2)
    const articles = (await fetchArticles(urls.slice(0, LIMIT))).filter(Boolean)
    if (articles.length >= 3) {
      writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), items: articles.slice(0, LIMIT) }, null, 2))
      console.log(`Notícias guardadas: ${articles.length}`)
      return
    }
  } catch (err) {
    console.error('Erro ao buscar notícias do Jornal de Angola:', err.message || err)
  }

  if (existsSync(OUT)) {
    console.log(`A usar ${OUT} existente.`)
    return
  }

  writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), items: [] }, null, 2))
  console.log('Nenhuma notícia encontrada.')
}

main()
