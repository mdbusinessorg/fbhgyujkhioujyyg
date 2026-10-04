// Dispara o workflow de scraping no GitHub Actions uma vez por hora.
// O agendador de cron do GitHub atrasa execuções em períodos de carga —
// esta função garante que o robô corre mesmo assim, 24/7, sem depender
// de nenhuma sessão do Devin nem do cron interno do GitHub.
//
// Config: GH_DISPATCH_TOKEN (PAT com scope actions:write no repo),
//         GH_REPO (default mdbusinessorg/fbhgyujkhioujyyg),
//         GH_WORKFLOW (default scrape-jobs.yml)

const REPO = process.env.GH_REPO || 'mdbusinessorg/fbhgyujkhioujyyg'
const WORKFLOW = process.env.GH_WORKFLOW || 'scrape-jobs.yml'
const TOKEN = process.env.GH_DISPATCH_TOKEN || ''

// Evita disparar se uma execução do workflow já está a correr/em fila —
// o workflow tem concurrency:cancel-in-progress:false, pelo que
// dispatches repetidos ficariam horas em fila.
async function inFlight(headers) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=3`,
    { headers }
  )
  if (!res.ok) return false
  const data = await res.json()
  return (data.workflow_runs || []).some(
    (r) => r.status === 'in_progress' || r.status === 'queued'
  )
}

exports.handler = async () => {
  if (!TOKEN) {
    console.warn('GH_DISPATCH_TOKEN não configurado — trigger desativado.')
    return { statusCode: 200 }
  }
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
  try {
    if (await inFlight(headers)) {
      console.log('Workflow já em execução/fila — skip.')
      return { statusCode: 200 }
    }
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      { method: 'POST', headers, body: JSON.stringify({ ref: 'main' }) }
    )
    console.log('workflow_dispatch:', res.status)
    return { statusCode: res.ok ? 200 : 502 }
  } catch (e) {
    console.error('trigger-scrape falhou:', e.message)
    return { statusCode: 500 }
  }
}
