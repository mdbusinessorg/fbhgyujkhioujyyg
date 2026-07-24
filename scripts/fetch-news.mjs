import { XMLParser } from 'fast-xml-parser'
import { writeFileSync, existsSync, readFileSync } from 'fs'

const FEED = 'https://www.portaldeangola.com/feed/'
const OUT = 'public/noticias.json'

function decodeEntities(str) {
  return (str || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, '…')
}

function cleanText(html) {
  const text = (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[&#8230;\]|\[&hellip;\]|\u2026/g, '…')
    .replace(/The post .+ first appeared on .+\./g, '')
  return decodeEntities(text)
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchNews() {
  try {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const parser = new XMLParser({ ignoreAttributes: false })
    const data = parser.parse(xml)
    const items = (data?.rss?.channel?.item || []).slice(0, 8)
    return items.map((item) => ({
      id: item.guid?.['#text'] || item.guid || item.link,
      title: item.title || 'Sem título',
      link: item.link || '',
      source: 'Portal de Angola',
      date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      excerpt: cleanText(item.description || ''),
    }))
  } catch (err) {
    console.error('Erro ao buscar notícias:', err.message || err)
    if (existsSync(OUT)) {
      console.log(`A usar ${OUT} existente.`)
      return JSON.parse(readFileSync(OUT, 'utf-8'))
    }
    return []
  }
}

const news = await fetchNews()
writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), items: news }, null, 2))
console.log(`Notícias guardadas: ${news.length}`)
