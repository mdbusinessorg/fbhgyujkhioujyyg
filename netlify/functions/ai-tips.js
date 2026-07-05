const { groqChat } = require('./_groq')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { payload = {} }

  const profile = payload.profile || {}
  const vaga = payload.vaga || null

  const profileSummary = `Nome: ${profile.nome || 'não preenchido'}
Telefone: ${profile.telefone ? 'preenchido' : 'em falta'}
Área: ${profile.area || 'não definida'}
Nível académico: ${profile.nivel_academico || 'não definido'}
Documentos/CV: ${profile.numDocumentos || 0} carregado(s)
Candidaturas feitas: ${profile.numCandidaturas || 0}
Competências: ${profile.competencias || 'não definidas'}
Bio: ${profile.bio || 'não preenchida'}`

  const vagaContext = vaga
    ? `O candidato quer candidatar-se a: "${vaga.titulo}" (${vaga.area}). Requisitos: ${vaga.descricao || ''}. Dá dicas para AUMENTAR as hipóteses NESTA vaga.`
    : 'Dá dicas gerais para melhorar a empregabilidade no mercado angolano.'

  const messages = [
    {
      role: 'system',
      content: `És um coach de carreira angolano. Dás conselhos práticos, específicos e accionáveis para candidatos a emprego em Angola. Responde SEMPRE em JSON válido no formato: {"tips": ["dica 1", "dica 2", ...]}. Entre 5 e 7 dicas, cada uma curta (máximo 2 frases), personalizadas ao perfil real do candidato. Não repitas dicas genéricas se o candidato já tem esse aspecto resolvido.`,
    },
    {
      role: 'user',
      content: `Perfil do candidato:\n${profileSummary}\n\n${vagaContext}`,
    },
  ]

  try {
    const result = await groqChat(messages, { temperature: 0.7, maxTokens: 800, json: true })
    let tips = []
    try { tips = JSON.parse(result).tips || [] } catch { tips = [] }
    return { statusCode: 200, headers, body: JSON.stringify({ tips }) }
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ tips: [], error: String(err) }) }
  }
}
