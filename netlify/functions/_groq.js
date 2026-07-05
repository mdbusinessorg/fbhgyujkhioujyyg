// Shared Groq chat helper
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

async function groqChat(messages, { temperature = 0.6, maxTokens = 1024, json = false } = {}) {
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

module.exports = { groqChat }
