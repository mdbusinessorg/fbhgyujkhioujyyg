// Direct Groq API helper used by scrapers and build scripts.
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export function isConfigured() {
  return !!GROQ_API_KEY
}

export async function groqChat(messages, { temperature = 0.6, maxTokens = 1024, json = false } = {}) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')

  const body = {
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  }
  if (json) body.response_format = { type: 'json_object' }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Groq error ${res.status}: ${txt}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function enrichJobDescription(job) {
  if (!GROQ_API_KEY) return null

  const prompt = `Reescreve e melhora a seguinte descrição de vaga para o site MÔ SALO (Angola). Mantém todos os factos importantes, corrige erros de HTML/ortografia, e organiza o texto em secções claras. Usa HTML simples (<p>, <ul>, <li>, <strong>). Não inventes requisitos ou benefícios que não estejam no texto original.

Título: ${job.title || ''}
Empresa: ${job.company || ''}
Localização: ${job.location || ''}
Texto original:
"""${(job.description || job.excerpt || '').slice(0, 4000)}"""

Devolve APENAS o HTML da descrição melhorada, sem explicações.`

  try {
    const html = await groqChat(
      [
        { role: 'system', content: 'És um editor de conteúdo de emprego em Angola. Transformas descrições de vagas em texto claro, profissional e bem formatado em HTML simples.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.4, maxTokens: 1200 }
    )
    return html.trim()
  } catch (e) {
    console.error('Groq enrich failed:', e.message)
    return null
  }
}

export async function extractJobFields(job) {
  if (!GROQ_API_KEY) return {}

  const prompt = `Analisa a vaga abaixo e extrai os campos num objeto JSON. Não inventes dados; deixa campos vazios se não encontrares.

Título: ${job.title || ''}
Empresa: ${job.company || ''}
Localização: ${job.location || ''}
Texto: """${(job.description || job.excerpt || '').slice(0, 3000)}"""

Responde EXACTAMENTE neste formato JSON:
{
  "tipo_contrato": "Efetivo | Temporário | Estágio | Trainee | Freelancer | "",
  "modalidade": "Presencial | Remoto | Híbrido | "",
  "requisitos": "resumo curto dos requisitos, separados por vírgula",
  "beneficios": "resumo curto dos benefícios, separados por vírgula"
}`

  try {
    const raw = await groqChat(
      [
        { role: 'system', content: 'És um extrator de informação de vagas de emprego. Respondes apenas com JSON válido.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.2, maxTokens: 600, json: true }
    )
    return JSON.parse(raw)
  } catch (e) {
    console.error('Groq extract failed:', e.message)
    return {}
  }
}
