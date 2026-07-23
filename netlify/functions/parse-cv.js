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

async function extractText(fileUrl, fallbackText) {
  if (!fileUrl) return fallbackText || ''
  const name = fileNameFromUrl(fileUrl).toLowerCase()
  const text = (fallbackText || '').trim()

  if (text) return text

  try {
    const buf = await fetchFileAsBuffer(fileUrl)
    if (name.endsWith('.txt') || name.endsWith('.md')) {
      return buf.toString('utf-8')
    }
    if (name.endsWith('.pdf')) {
      const pdf = require('pdf-parse')
      const data = await pdf(buf)
      return data.text || ''
    }
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer: buf })
      return result.value || ''
    }
  } catch (err) {
    console.error('Erro a extrair texto do CV:', err)
  }
  return ''
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

  try {
    const raw = await groqChat(
      [
        { role: 'system', content: system },
        { role: 'user', content: `CV:\n"""${text.slice(0, 12000)}"""\n\nExtrai os campos pedidos em JSON.` },
      ],
      { temperature: 0.4, maxTokens: 1024, json: true }
    )
    const parsed = JSON.parse(raw || '{}')
    return { statusCode: 200, headers, body: JSON.stringify({ ...parsed, _textPreview: text.slice(0, 200) }) }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: `Erro IA: ${err.message}` }) }
  }
}
