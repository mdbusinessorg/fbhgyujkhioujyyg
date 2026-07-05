const { groqChat } = require('./_groq')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

// Intelligent candidate-vaga matching for recruiters
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { payload = {} }

  const vaga = payload.vaga || {}
  const candidato = payload.candidato || {}

  const messages = [
    {
      role: 'system',
      content: `És um sistema de triagem de recrutamento em Angola. Avalias o quão bem um candidato se adequa a uma vaga. Responde SEMPRE em JSON: {"score": <0-100>, "resumo": "<1 frase>", "pontos_fortes": ["..."], "pontos_fracos": ["..."], "recomendacao": "<Recomendado|Considerar|Não recomendado>"}. Sê objectivo e baseia-te nos dados fornecidos.`,
    },
    {
      role: 'user',
      content: `VAGA:\nTítulo: ${vaga.titulo || ''}\nÁrea: ${vaga.area || ''}\nNível mínimo: ${vaga.nivel_minimo || ''}\nExperiência requerida: ${vaga.experiencia_requerida || ''}\nDescrição: ${vaga.descricao || ''}\n\nCANDIDATO:\nNome: ${candidato.nome || ''}\nÁrea: ${candidato.area || ''}\nNível académico: ${candidato.nivel_academico || ''}\nCompetências: ${candidato.competencias || ''}\nExperiência: ${candidato.experiencias || ''}\nBio: ${candidato.bio || ''}\nRespostas às perguntas: ${candidato.respostas || 'nenhuma'}\nMensagem de candidatura: ${candidato.mensagem || ''}`,
    },
  ]

  try {
    const result = await groqChat(messages, { temperature: 0.3, maxTokens: 700, json: true })
    let parsed
    try { parsed = JSON.parse(result) } catch { parsed = { score: 0, resumo: 'Erro ao avaliar', pontos_fortes: [], pontos_fracos: [], recomendacao: 'Considerar' } }
    return { statusCode: 200, headers, body: JSON.stringify(parsed) }
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ score: 0, resumo: '', pontos_fortes: [], pontos_fracos: [], recomendacao: 'Considerar', error: String(err) }) }
  }
}
