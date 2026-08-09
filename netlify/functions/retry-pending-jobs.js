// Cron diário: processa vagas recentes sem candidatura de algum candidato,
// e re-tenta logs com erro, respeitando o limite diário por candidato.
const { headers, supabaseRest, processExternalJob } = require('./_auto-apply')

async function fetchRecentJobs(limit = 200) {
  const rows = await supabaseRest(`/external_jobs?select=*&order=created_at.desc&limit=${limit}`)
  return rows || []
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const jobs = await fetchRecentJobs()
    const results = []
    for (const job of jobs) {
      try {
        const jobResults = await processExternalJob(job)
        results.push({ id: job.id, results: jobResults })
      } catch (err) {
        results.push({ id: job.id, error: String(err.message || err) })
      }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, processed: results.length, results }) }
  } catch (err) {
    console.error('retry-pending-jobs error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String(err.message || err) }) }
  }
}
