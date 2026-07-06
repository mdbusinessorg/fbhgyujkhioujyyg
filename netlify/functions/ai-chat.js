const { groqChat } = require('./_groq')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

const normalizeMessages = (messages) => {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((message) => message && typeof message.content === 'string')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content.trim(),
    }))
    .filter((message) => message.content)
}

const buildProfileSummary = (profile = {}) => {
  const parts = []
  if (profile.nome) parts.push(`Nome: ${profile.nome}`)
  if (profile.area) parts.push(`Área/Cargo: ${profile.area}`)
  if (profile.localizacao) parts.push(`Localização: ${profile.localizacao}`)
  if (profile.nivel_academico) parts.push(`Nível académico: ${profile.nivel_academico}`)
  if (profile.competencias) parts.push(`Competências: ${profile.competencias}`)
  if (profile.bio) parts.push(`Bio: ${profile.bio}`)
  if (profile.experiencias) parts.push(`Experiência: ${profile.experiencias}`)
  if (profile.numDocumentos !== undefined) parts.push(`Documentos/CV: ${profile.numDocumentos}`)
  if (profile.numCandidaturas !== undefined) parts.push(`Candidaturas: ${profile.numCandidaturas}`)
  return parts.length > 0 ? parts.join('\n') : 'Perfil: não preenchido'
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { payload = {} }

  const inputMessages = normalizeMessages(payload.messages).slice(-10)
  const profileSummary = buildProfileSummary(payload.profile || {})

  const systemMessage = {
    role: 'system',
    content: `És o Assistente MÔ SALO, um assistente de carreira amigável e prático para o mercado de trabalho angolano. Respondes em português de Angola, em texto simples e natural. Ajudas com CV, entrevistas, carreira, candidaturas e com a leitura/decisão sobre vagas. Dás respostas curtas quando a pergunta é curta e detalhadas quando necessário. Não inventes informações. Se o contexto for insuficiente, faz perguntas de seguimento.\n\nContexto do candidato:\n${profileSummary}`,
  }

  try {
    const reply = await groqChat([systemMessage, ...inputMessages], { temperature: 0.6, maxTokens: 800 })
    return { statusCode: 200, headers, body: JSON.stringify({ reply }) }
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ reply: '', error: String(err) }) }
  }
}
