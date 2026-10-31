// Recebe novas vagas (do GitHub Action de scraping ou do webhook Supabase)
// e dispara a candidatura automática. Suporta {record}, {job} ou {jobs:[...]}.
const { headers, processExternalJob } = require('./_auto-apply')

function authorized(event) {
  const h = event.headers || {}
  const given = (h['x-webhook-secret'] || h['X-Webhook-Secret'] || event.queryStringParameters?.secret || '').trim()
  const bearer = (h.authorization || h.Authorization || '').replace(/^Bearer\s+/i, '').trim()
  const candidates = [given, bearer].filter(Boolean)
  const secrets = [process.env.AUTO_APPLY_WEBHOOK_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY].filter(Boolean)
  if (secrets.length === 0) return false
  return candidates.some(c => secrets.includes(c))
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  if (!authorized(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const force = event.queryStringParameters?.force === 'true'
  const jobs = Array.isArray(payload.jobs)
    ? payload.jobs
    : [payload.record || payload.job || payload]

  const results = []
  for (const record of jobs.slice(0, 50)) {
    if (!record || !record.id || !record.title) {
      results.push({ skipped: true, reason: 'missing id/title' })
      continue
    }
    try {
      results.push({ id: record.id, ...(await processExternalJob(record, { force })) })
    } catch (err) {
      console.error('process-new-job error:', err)
      results.push({ id: record.id, error: String(err.message || err) })
    }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, processed: results.length, results }) }
}
