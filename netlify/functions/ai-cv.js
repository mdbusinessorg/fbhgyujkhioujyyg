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

  const text = (payload.text || '').trim()
  const vaga = payload.vaga || null

  if (!text) return { statusCode: 400, headers, body: JSON.stringify({ error: 'text obrigatório' }) }

  const vagaContext = vaga
    ? `O candidato está a candidatar-se a esta vaga:\nTítulo: ${vaga.titulo || ''}\nÁrea: ${vaga.area || ''}\nDescrição: ${vaga.descricao || ''}\nRequisitos: ${vaga.requisitos || vaga.nivel_minimo || ''}\n\nAdapta o texto para destacar competências relevantes para ESTA vaga específica.`
    : 'Não há vaga específica. Melhora o texto de forma geral para o mercado angolano.'

  const messages = [
    {
      role: 'system',
      content: `És um especialista em recrutamento e redação de CVs em Angola. Melhoras textos de CV/experiência profissional para português de Angola, com tom profissional. Usas verbos de ação, quantificas resultados quando possível, e manténs concisão. Devolves APENAS o texto melhorado, sem preâmbulos nem explicações longas. No final, adiciona uma linha começada por "DICAS:" com 2-3 sugestões curtas separadas por " | ".`,
    },
    {
      role: 'user',
      content: `${vagaContext}\n\nTexto original do candidato:\n"""${text}"""\n\nReescreve este texto de forma profissional e impactante.`,
    },
  ]

  try {
    const result = await groqChat(messages, { temperature: 0.6, maxTokens: 900 })
    return { statusCode: 200, headers, body: JSON.stringify({ result }) }
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ result: '', error: String(err) }) }
  }
}
