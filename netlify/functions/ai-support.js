const { groqChat } = require('./_groq')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  let payload = {}
  try { payload = JSON.parse(event.body || '{}') } catch {}

  const message = (payload.message || '').trim()
  const context = payload.context || {}
  const history = Array.isArray(payload.history) ? payload.history : []

  if (!message) return { statusCode: 400, headers, body: JSON.stringify({ error: 'message obrigatório' }) }

  const profileSummary = `Nome: ${context.nome || 'não preenchido'}
Área: ${context.area || 'não definida'}
Nível académico: ${context.nivel_academico || 'não definido'}
Competências: ${context.competencias || 'não definidas'}
Experiências: ${context.experiencias || 'não definidas'}
Bio: ${context.bio || 'não preenchida'}
Candidaturas enviadas: ${context.numCandidaturas || 0}
Documentos/CV: ${context.numDocumentos || 0}`

  const systemPrompt = `És o Assistente MÔ SALO, um especialista em recrutamento e carreira no mercado angolano. Ajuda candidatos a encontrar emprego, melhorar CV, preparar entrevistas e candidatar-se a vagas. Responde em português de Angola, de forma clara, prática e acçãoável. Quando útil, apresenta passos numerados ou bullets. Não inventes informações; se não souberes, orienta o utilizador a completar o perfil ou contactar suporte.`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: `Perfil do candidato:\n${profileSummary}` },
    ...history.slice(-6).map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
    { role: 'user', content: message },
  ]

  try {
    const answer = await groqChat(messages, { temperature: 0.7, maxTokens: 900 })
    return { statusCode: 200, headers, body: JSON.stringify({ answer }) }
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ answer: 'Desculpa, o assistente está temporariamente indisponível. Tenta novamente daqui a pouco.', error: String(err) }) }
  }
}
