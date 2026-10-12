// Shared security helpers for Netlify functions.
// - requireUser: verify the caller's Supabase JWT and (optionally) that it matches a claimed user_id
// - rateLimit: best-effort per-instance sliding-window rate limiter (warm instances share state;
//   cold starts reset — combined with Supabase/Netlify limits, not a substitute for them)
// - validators: small input checks to keep payloads clean

const { getAuthenticatedUser } = require('./auth')
const { verifyAdmin } = require('./admin')

function clientIp(event) {
  const h = event.headers || {}
  const fwd = h['x-forwarded-for'] || h['X-Forwarded-For'] || ''
  return (h['x-nf-client-connection-ip'] || fwd.split(',')[0] || 'unknown').trim()
}

const buckets = new Map()
// Prune the map lazily so it can't grow forever on a warm instance.
function rateLimit(key, limit = 60, windowMs = 60000) {
  const now = Date.now()
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k)
  }
  const b = buckets.get(key)
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  b.count += 1
  return b.count <= limit
}

function rateLimitResponse(headers) {
  return {
    statusCode: 429,
    headers,
    body: JSON.stringify({ error: 'Demasiados pedidos. Tenta de novo dentro de um minuto.' }),
  }
}

// Returns { user } on success or { response } with a 401/403 to return immediately.
// claimedUserId is optional: when given, the authenticated user must own that id.
async function requireUser(event, claimedUserId) {
  const user = await getAuthenticatedUser(event)
  if (!user) {
    return {
      response: {
        statusCode: 401,
        body: JSON.stringify({ error: 'Precisas de iniciar sessao' }),
      },
    }
  }
  if (claimedUserId && user.id !== claimedUserId) {
    const admin = await verifyAdmin(event)
    if (!admin.isAdmin) {
      return {
        response: {
          statusCode: 403,
          body: JSON.stringify({ error: 'Sem permissao para esta accao' }),
        },
      }
    }
  }
  return { user }
}

// Scheduled/cron functions: allow Netlify's internal schedule invocation or a Bearer CRON_SECRET.
function isScheduledOrInternal(event) {
  const h = event.headers || {}
  const nfEvent = h['x-nf-event'] || h['X-Nf-Event']
  const ua = h['user-agent'] || h['User-Agent'] || ''
  // Netlify Clockwork envia x-nf-event: schedule + user-agent próprio.
  if (nfEvent === 'schedule' && /netlify/i.test(ua)) return true
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = h.authorization || h.Authorization || ''
  return auth === 'Bearer ' + secret
}

const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u200B-\\u200F\\uFEFF]', 'g')

// Coerce to string, strip control/invisible chars, trim, cap length.
function str(v, max) {
  if (v === null || v === undefined) return ''
  const limit = max || 2000
  return String(v).replace(CONTROL_CHARS, '').trim().slice(0, limit)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LOOSE_ID_RE = /^[\w-]{1,80}$/

function isId(v) {
  return typeof v === 'string' && (UUID_RE.test(v) || LOOSE_ID_RE.test(v))
}

function isEmail(v) {
  return typeof v === 'string' && v.length <= 254 && /^[\w.+-]+@[\w-]+\.[\w.]+$/.test(v)
}

function badRequest(headers, error) {
  return { statusCode: 400, headers, body: JSON.stringify({ error }) }
}

module.exports = {
  clientIp,
  rateLimit,
  rateLimitResponse,
  requireUser,
  isScheduledOrInternal,
  str,
  isId,
  isEmail,
  badRequest,
}
