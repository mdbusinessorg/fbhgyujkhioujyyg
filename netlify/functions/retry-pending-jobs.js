// Cron: processa vagas recentes que ainda não têm log, ou logs com erro,
// respeitando o limite diário. Lê o índice público de vagas (external-jobs.json)
// e o estado em Netlify Blobs — não depende das tabelas Supabase do auto-apply.
const { headers, processExternalJob } = require('./_auto-apply')
const { isScheduledOrInternal } = require('../lib/security')
const store = require('../lib/autoapply-store')

const SITE_URL = process.env.URL || 'https://mosalo.eu.cc'
const SCAN_LIMIT = 250

async function fetchRecentJobs() {
  const res = await fetch(`${SITE_URL}/external-jobs.json`, { headers: { 'User-Agent': 'netlify-function' } })
  if (!res.ok) throw new Error(`external-jobs.json ${res.status}`)
  const data = await res.json()
  const jobs = Array.isArray(data) ? data : (data.jobs || [])
  return jobs.slice(0, SCAN_LIMIT)
}

async function fetchPendingJobs() {
  const jobs = await fetchRecentJobs()
  const logs = await store.listLogs(3000)
  const logMap = new Map(logs.map(l => [l.external_job_id, l.status]))

  return jobs.filter(job => {
    const status = logMap.get(job.id)
    return !status || status === 'erro'
  })
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (!isScheduledOrInternal(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autorizado' }) }
  }
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const pending = await fetchPendingJobs()
    const results = []
    for (const job of pending) {
      try {
        const result = await processExternalJob(job)
        results.push({ id: job.id, ...result })
        if (result.reason === 'limite diário atingido') break
      } catch (err) {
        results.push({ id: job.id, error: String(err.message || err) })
      }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, scanned: pending.length, processed: results.length, results }) }
  } catch (err) {
    console.error('retry-pending-jobs error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String(err.message || err) }) }
  }
}
