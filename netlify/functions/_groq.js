// Shared Groq chat helper
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

const FALLBACK_KEY = process.env.GROQ_API_KEY_FALLBACK || process.env.GROQ_API_KEY_2

async function groqChat(messages, { temperature = 0.6, maxTokens = 1024, json = false } = {}) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')

  const body = {
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  }
  if (json) body.response_format = { type: 'json_object' }

  const keys = [GROQ_API_KEY, FALLBACK_KEY].filter(Boolean)
  let lastErr
  for (let i = 0; i < keys.length; i++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys[i]}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    }

    const txt = await res.text()
    lastErr = new Error(`Groq error ${res.status}: ${txt}`)
    // Retry with the fallback key on rate limit / server / auth errors.
    if (i + 1 < keys.length && (res.status === 429 || res.status >= 500 || res.status === 401 || res.status === 403)) {
      continue
    }
    throw lastErr
  }
  throw lastErr
}

module.exports = { groqChat }
