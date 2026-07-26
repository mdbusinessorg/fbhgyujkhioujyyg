// Gamificação: check-in diário com streak, roleta da sorte e pontos.
// Prémios 100% internos e verificáveis na plataforma (pontos, destaque de perfil, badge)
// — nunca dinheiro nem promessas externas. Seleção do prémio é feita no servidor.
const { getStoreWithFallback } = require('../lib/store')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

// A ordem tem de corresponder às fatias da roleta no frontend (RewardsHub)
const WHEEL_PRIZES = [
  { key: 'points_20', label: '+20 pontos', points: 20, weight: 34 },
  { key: 'points_50', label: '+50 pontos', points: 50, weight: 24 },
  { key: 'boost_24h', label: 'Destaque de perfil 24h', points: 0, boostHours: 24, weight: 10 },
  { key: 'points_100', label: '+100 pontos', points: 100, weight: 14 },
  { key: 'try_again', label: 'Tenta amanhã', points: 0, weight: 12 },
  { key: 'points_200', label: '+200 pontos', points: 200, weight: 6 },
]

const CHECKIN_POINTS = [10, 15, 20, 25, 30, 40, 100]

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayKey() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
}

function pickPrize() {
  const total = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0)
  let r = Math.random() * total
  for (let i = 0; i < WHEEL_PRIZES.length; i++) {
    r -= WHEEL_PRIZES[i].weight
    if (r <= 0) return { index: i, prize: WHEEL_PRIZES[i] }
  }
  return { index: 0, prize: WHEEL_PRIZES[0] }
}

function defaultState() {
  return { points: 0, streak: 0, last_checkin: null, last_spin: null, boost_until: null, history: [] }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('rewards')

  const loadState = async (userId) => {
    try { return { ...defaultState(), ...JSON.parse((await store.get(userId)) || '') } } catch { return defaultState() }
  }
  const saveState = async (userId, state) => store.set(userId, JSON.stringify(state))

  if (event.httpMethod === 'GET') {
    const userId = event.queryStringParameters?.user_id
    if (!userId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id obrigatório' }) }
    const state = await loadState(userId)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...state,
        can_checkin: state.last_checkin !== todayKey(),
        can_spin: state.last_spin !== todayKey(),
      }),
    }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { user_id, action } = payload
    if (!user_id || !action) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id e action obrigatórios' }) }

    const state = await loadState(user_id)
    const today = todayKey()

    if (action === 'checkin') {
      if (state.last_checkin === today) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Já fizeste check-in hoje' }) }
      }
      state.streak = state.last_checkin === yesterdayKey() ? Math.min(state.streak + 1, 7) : 1
      if (state.streak > 7) state.streak = 1
      const dayIndex = ((state.streak - 1) % 7)
      const earned = CHECKIN_POINTS[dayIndex]
      state.points += earned
      state.last_checkin = today
      state.history = [{ type: 'checkin', points: earned, streak: state.streak, at: new Date().toISOString() }, ...state.history].slice(0, 50)
      await saveState(user_id, state)
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, earned, streak: state.streak, points: state.points, day: dayIndex + 1 }) }
    }

    if (action === 'spin') {
      if (state.last_spin === today) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Já giraste a roleta hoje' }) }
      }
      const { index, prize } = pickPrize()
      state.points += prize.points || 0
      if (prize.boostHours) {
        const base = state.boost_until && Date.parse(state.boost_until) > Date.now() ? Date.parse(state.boost_until) : Date.now()
        state.boost_until = new Date(base + prize.boostHours * 3600000).toISOString()
      }
      state.last_spin = today
      state.history = [{ type: 'spin', prize: prize.key, label: prize.label, points: prize.points || 0, at: new Date().toISOString() }, ...state.history].slice(0, 50)
      await saveState(user_id, state)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, prize_index: index, prize: prize.key, label: prize.label, points: state.points, boost_until: state.boost_until }),
      }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ação inválida' }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
