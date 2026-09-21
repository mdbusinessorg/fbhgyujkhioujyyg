import { writeFileSync, existsSync } from 'fs'

// Jornal de Angola é um SPA Angular — as notícias vêm da API CMS.
// POST /cms/api/v1/noticias devolve as últimas notícias (titulo, introducao,
// dataNoticia, imagemDeCapa). O detalhe abre em /noticias/detalhe/{id}.
const API = 'https://kiami-back.jornaldeangola.ao/cms/api/v1/noticias'
const SITE = 'https://jornaldeangola.ao'

function slugify(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function articleUrl(n) {
  const cat = slugify(n.categoriasNoticia?.[0]?.categoriaNoticia || 'geral')
  return `${SITE}/noticias/${n.idTipoNoticia || 1}/${cat}/${n.idNoticia}/${slugify(n.titulo)}`
}
const OUT = 'public/noticias.json'
const LIMIT = 6

async function fetchJson(url, options, ms = 20000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(ms),
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json', 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function main() {
  try {
    const res = await fetchJson(API, {
      method: 'POST',
      body: JSON.stringify({ idTipoNoticia: 0, idIdioma: 1, pagina: 1, quantidade: LIMIT }),
    }, 30000)

    const items = (res.objecto || [])
      .filter((n) => n.titulo)
      .slice(0, LIMIT)
      .map((n) => ({
        id: String(n.idNoticia),
        link: articleUrl(n),
        source: 'Jornal de Angola',
        title: n.titulo.trim(),
        excerpt: (n.introducao || '').trim(),
        image: n.imagemDeCapa || null,
        date: n.dataNoticia ? new Date(n.dataNoticia).toISOString() : new Date().toISOString(),
      }))

    if (items.length >= 3) {
      writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), items }, null, 2))
      console.log(`Notícias guardadas: ${items.length}`)
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
