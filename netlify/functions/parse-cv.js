const { groqChat } = require('./_groq')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

function fileNameFromUrl(url) {
  try {
    return new URL(url).pathname.split('/').pop() || ''
  } catch {
    return ''
  }
}

async function fetchFileAsBuffer(fileUrl) {
  const res = await fetch(fileUrl, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function stripNonPrintable(str) {
  return str.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, ' ').replace(/\s+/g, ' ').trim()
}

async function extractPdfText(buf) {
  try {
    const [{ getDocument, GlobalWorkerOptions }, { pathToFileURL }] = await Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('url'),
    ])
    const workerPath = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href
    GlobalWorkerOptions.workerSrc = workerPath
    const doc = await getDocument({ data: new Uint8Array(buf), useSystemFonts: true, disableFontFace: true }).promise
    const pages = await Promise.all(Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1)))
    const texts = await Promise.all(pages.map(async p => {
      const txt = await p.getTextContent()
      return txt.items.map(item => item.str).join(' ')
    }))
    await doc.destroy()
    return stripNonPrintable(texts.join('\n'))
  } catch (err) {
    console.error('pdfjs-dist falhou:', err.message || err)
    return ''
  }
}

async function extractText(fileUrl, fallbackText) {
  const text = (fallbackText || '').trim()
  if (text) return text

  if (!fileUrl) return ''
  const name = fileNameFromUrl(fileUrl).toLowerCase()

  try {
    const buf = await fetchFileAsBuffer(fileUrl)
    if (name.endsWith('.txt') || name.endsWith('.md')) {
      return stripNonPrintable(buf.toString('utf-8'))
    }
    if (name.endsWith('.pdf')) {
      const pdfText = await extractPdfText(buf)
      if (pdfText) return pdfText
      const raw = buf.toString('utf-8', 0, Math.min(buf.length, 100000))
      return stripNonPrintable(raw.replace(/[^\x20-\x7E\n\r\tÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÃÕãõÂÊÔâêôÇç]/gi, ' '))
    }
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      try {
        const mammoth = require('mammoth')
        const result = await mammoth.extractRawText({ buffer: buf })
        return stripNonPrintable(result.value || '')
      } catch (docErr) {
        console.error('mammoth falhou:', docErr.message || docErr)
        return ''
      }
    }
    return stripNonPrintable(buf.toString('utf-8', 0, Math.min(buf.length, 100000)))
  } catch (err) {
    console.error('Erro a extrair texto do CV:', err.message || err)
    return ''
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  let payload = {}
  try { payload = JSON.parse(event.body || '{}') } catch {}

  const fileUrl = (payload.fileUrl || '').trim()
  const fallbackText = (payload.text || '').trim()

  let text = ''
  try {
    text = await extractText(fileUrl, fallbackText)
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) }
  }

  if (!text) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Não foi possível extrair texto do ficheiro. Tenta colar o conteúdo do CV.' }) }
  }

  const system = `És um assistente de recrutamento especializado no mercado angolano. Analisa um currículo e devolve APENAS um objeto JSON com estes campos preenchidos: nome (string), area (string - área principal/cargo procurado, em português), localizacao (string - cidade/província), nivel_academico (string), experiencias (string resumo das experiências principais, com anos se possível), competencias (string com competências separadas por vírgula) e bio (string com resumo profissional em 2-3 frases). Se não tiveres certeza de algum campo, usa string vazia.`

function extractJson(raw) {
  if (!raw) return null
  raw = raw.trim()
  if (raw.startsWith('```json')) {
    raw = raw.slice(7).replace(/```$/, '').trim()
  } else if (raw.startsWith('```')) {
    raw = raw.slice(3).replace(/```$/, '').trim()
  }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)) } catch {}
  }
  try { return JSON.parse(raw) } catch { return null }
}

  try {
    const raw = await groqChat(
      [
        { role: 'system', content: system },
        { role: 'user', content: `CV:\n"""${text.slice(0, 12000)}"""\n\nExtrai os campos pedidos em JSON.` },
      ],
      { temperature: 0.4, maxTokens: 1024, json: true }
    )
    const parsed = extractJson(raw) || {}
    const fields = ['nome', 'area', 'localizacao', 'nivel_academico', 'experiencias', 'competencias', 'bio']
    const result = {}
    fields.forEach(f => { result[f] = parsed[f] || '' })
    result._textPreview = text.slice(0, 200)
    return { statusCode: 200, headers, body: JSON.stringify(result) }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: `Erro IA: ${err.message || err}` }) }
  }
}
