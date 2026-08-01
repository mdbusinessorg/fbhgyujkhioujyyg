// Cron diário: processa vagas inseridas recentemente que ainda não têm log,
// ou logs com erro, respeitando o limite diário.
const { headers, supabaseRest, processExternalJob } = require('./_auto-apply')

async function fetchPendingJobs() {
  const rows = await supabaseRest(`/external_jobs?select=*&order=created_at.desc&limit=200`)
  const logs = await supabaseRest(`/job_applications_log?select=external_job_id,status`)
  const logMap = new Map((logs || []).map(l => [l.external_job_id, l.status]))

  return (rows || []).filter(job => {
    const status = logMap.get(job.id)
    return !status || status === 'erro'
  })
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
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
        if (result.sent) {
          // Stop when we hit the daily limit implicitly handled by processExternalJob.
        }
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
