// Gera email de candidatura personalizado (assunto + corpo) com base no perfil do candidato e na vaga.
// Escreve em inglês quando a vaga/empresa é estrangeira; caso contrário em português de Angola.
const { groqChat } = require('./_groq')

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const { job, candidate } = JSON.parse(event.body || '{}')
    if (!job || !job.title) return { statusCode: 400, headers, body: JSON.stringify({ error: 'job.title obrigatório' }) }

    const desc = String(job.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 1500)

    const system = `És um assistente de carreira do MÔ SALO (plataforma de emprego de Angola) que escreve emails de candidatura curtos, profissionais e personalizados.
Regras:
- Decide o idioma: se a descrição da vaga estiver em inglês, ou a empresa for claramente estrangeira/internacional, escreve o email em INGLÊS; caso contrário escreve em PORTUGUÊS (de Angola, tratamento formal).
- O corpo apresenta o candidato (nome, área, competências e experiência relevantes), refere explicitamente a posição e a empresa, mostra motivação genuína e termina com despedida cordial, nome e contactos disponíveis.
- Máximo 170 palavras no corpo. Sem placeholders tipo [nome]; usa apenas os dados fornecidos e omite o que não existir.
- Menciona que o CV segue em anexo.
Responde APENAS com JSON válido: {"subject": "...", "body": "..."}`

    const user = `VAGA:
Título: ${job.title}
Empresa: ${job.company || 'não indicada'}
Localização: ${job.location || 'não indicada'}
Descrição: ${desc || 'não disponível'}

CANDIDATO:
Nome: ${candidate?.nome || 'não indicado'}
Área profissional: ${candidate?.area || 'não indicada'}
Localização: ${candidate?.localizacao || 'não indicada'}
Competências: ${candidate?.competencias || 'não indicadas'}
Experiência: ${String(candidate?.experiencias || 'não indicada').slice(0, 800)}
Nível académico: ${candidate?.nivel_academico || 'não indicado'}
Telefone: ${candidate?.telefone || ''}
Email: ${candidate?.email || ''}

Gera o email de candidatura.`

    const content = await groqChat(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0.5, maxTokens: 700, json: true }
    )

    const parsed = JSON.parse(content)
    if (!parsed.subject || !parsed.body) throw new Error('Resposta AI incompleta')
    return { statusCode: 200, headers, body: JSON.stringify({ subject: String(parsed.subject), body: String(parsed.body) }) }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Erro interno' }) }
  }
}
