// Proxy de fetch para o robô de vagas: corre em IPs da AWS/Netlify, que os
// boards de emprego não bloqueiam (bloqueiam os IPs dos GitHub Actions runners).
// O scripts/lib/jsonld-jobs.mjs chama isto quando o fetch directo dá 403/503.
//
// GET /.netlify/functions/fetch-proxy?url=<encoded>  -> body do URL alvo
//
// Restrito aos hosts de vagas que raspamos para não virar proxy aberto.

const ALLOWED_HOSTS = new Set([
  'angolaemprego.com',
  'www.angolaemprego.com',
  'angoemprego.com',
  'www.angoemprego.com',
  'ao.empregosyoyota.net',
  'empregosyoyota.net',
  'www.empregosyoyota.net',
  'jobartis.com',
  'www.jobartis.com',
])

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

exports.handler = async (event) => {
  const url = event.queryStringParameters?.url || ''
  let target
  try {
    target = new URL(url)
  } catch {
    return { statusCode: 400, body: 'bad url' }
  }
  if (!['http:', 'https:'].includes(target.protocol) || !ALLOWED_HOSTS.has(target.hostname)) {
    return { statusCode: 403, body: 'host not allowed' }
  }
  try {
    const res = await fetch(target.href, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/xml,text/xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    const body = await res.text()
    return {
      statusCode: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'text/html; charset=utf-8' },
      body,
    }
  } catch (e) {
    return { statusCode: 502, body: `proxy fetch failed: ${e.message}` }
  }
}
