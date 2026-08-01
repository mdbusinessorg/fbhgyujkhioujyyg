// Recebe webhook de INSERT na tabela external_jobs e dispara a candidatura automática.
const { headers, processExternalJob } = require('./_auto-apply')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  // Simple secret check so the endpoint is not public.
  const secret = (event.headers['x-webhook-secret'] || event.queryStringParameters?.secret || '').trim()
  const expected = process.env.AUTO_APPLY_WEBHOOK_SECRET || ''
  if (expected && secret !== expected) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  // Support both Supabase webhook body shape and raw job objects.
  const record = payload.record || payload

  if (!record.id || !record.title) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id/title' }) }
  }

  try {
    const result = await processExternalJob(record, { force: event.queryStringParameters?.force === 'true' })
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ...result }) }
  } catch (err) {
    console.error('process-new-job error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String(err.message || err) }) }
  }
}
