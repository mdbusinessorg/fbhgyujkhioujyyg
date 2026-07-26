'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gift, X, Star, Flame, Coins, Sparkles, CheckCircle2 } from 'lucide-react'

// Tem de corresponder a WHEEL_PRIZES em netlify/functions/rewards.js (mesma ordem)
const WHEEL_SLICES = [
  { label: '+20 pts', color: '#1A56FF' },
  { label: '+50 pts', color: '#6C47FF' },
  { label: 'Destaque 24h', color: '#F59E0B' },
  { label: '+100 pts', color: '#10B981' },
  { label: 'Tenta amanhã', color: '#6B7280' },
  { label: '+200 pts', color: '#EF4444' },
]

const CHECKIN_POINTS = [10, 15, 20, 25, 30, 40, 100]
const CONFETTI_COLORS = ['#1A56FF', '#6C47FF', '#F59E0B', '#10B981', '#EF4444', '#EC4899']

interface RewardsState {
  points: number
  streak: number
  boost_until: string | null
  can_checkin: boolean
  can_spin: boolean
}

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden">
      {Array.from({ length: 36 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 137) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 9) * 0.09}s`,
            animationDuration: `${1.2 + (i % 5) * 0.18}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function RewardsHub({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<RewardsState | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/rewards?user_id=${userId}`)
      if (res.ok) setState(await res.json())
    } catch {}
  }, [userId])

  useEffect(() => { if (userId) load() }, [userId, load])

  const celebrate = () => {
    setConfetti(true)
    setTimeout(() => setConfetti(false), 2200)
  }

  const doCheckin = async () => {
    if (busy || !state?.can_checkin) return
    setBusy(true)
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: 'checkin' }),
      })
      if (res.ok) {
        const data = await res.json()
        setCheckinMsg(`+${data.earned} pontos! Dia ${data.day} de 7 🔥`)
        celebrate()
        await load()
      }
    } catch {}
    setBusy(false)
  }

  const doSpin = async () => {
    if (busy || spinning || !state?.can_spin) return
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: 'spin' }),
      })
      if (res.ok) {
        const data = await res.json()
        const slice = 360 / WHEEL_SLICES.length
        // roda 5 voltas + pára com o centro da fatia premiada no ponteiro (topo)
        const target = 360 * 5 + (360 - (data.prize_index * slice + slice / 2))
        setSpinning(true)
        setRotation(prev => prev + target)
        setTimeout(async () => {
          setSpinning(false)
          setResult(data.label)
          if (data.prize !== 'try_again') celebrate()
          await load()
          setBusy(false)
        }, 4200)
        return
      }
    } catch {}
    setBusy(false)
  }

  if (!userId) return null

  const slice = 360 / WHEEL_SLICES.length
  const gradient = `conic-gradient(${WHEEL_SLICES.map((s, i) => `${s.color} ${i * slice}deg ${(i + 1) * slice}deg`).join(', ')})`
  const boostActive = state?.boost_until && Date.parse(state.boost_until) > Date.now()
  const hasDaily = state && (state.can_checkin || state.can_spin)

  return (
    <>
      <button
        onClick={() => { setOpen(true); load() }}
        className={`fixed bottom-24 right-4 lg:bottom-8 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-ms-purple to-ms-blue text-white flex items-center justify-center shadow-lg ${hasDaily ? 'gift-bounce' : ''}`}
        aria-label="Prémios diários"
      >
        <Gift size={24} />
        {hasDaily && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="relative bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto animate-pop-in" onClick={e => e.stopPropagation()}>
            {confetti && <Confetti />}
            <div className="bg-gradient-to-r from-ms-blue to-ms-purple text-white p-5 sm:rounded-t-3xl rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles size={18} /> Prémios Diários</h2>
                  <p className="text-xs text-white/80 mt-0.5">Volta todos os dias e ganha vantagens reais na plataforma</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 bg-white/20 rounded-full"><X size={18} /></button>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                  <Coins size={16} className="text-amber-300" />
                  <span className="text-sm font-bold">{state?.points ?? 0} pontos</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                  <Flame size={16} className="text-orange-300" />
                  <span className="text-sm font-bold">{state?.streak ?? 0} dias</span>
                </div>
                {boostActive && (
                  <div className="flex items-center gap-1 bg-amber-400/30 rounded-full px-3 py-1.5">
                    <Star size={14} className="text-amber-300 fill-amber-300" />
                    <span className="text-xs font-bold">Destaque ativo</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Check-in diário */}
              <div>
                <h3 className="text-sm font-bold text-ms-dark mb-2 flex items-center gap-1.5"><Flame size={15} className="text-orange-500" /> Check-in diário</h3>
                <div className="flex gap-1.5">
                  {CHECKIN_POINTS.map((pts, i) => {
                    const reached = (state?.streak ?? 0) >= i + 1
                    return (
                      <div key={i} className={`flex-1 rounded-xl py-2 text-center border transition-all ${reached ? 'bg-gradient-to-b from-ms-blue to-ms-purple text-white border-transparent' : 'bg-ms-surface text-ms-gray border-ms-border'}`}>
                        <p className="text-[9px] font-medium">Dia {i + 1}</p>
                        <p className="text-[10px] font-bold">{reached ? <CheckCircle2 size={12} className="mx-auto" /> : `+${pts}`}</p>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={doCheckin}
                  disabled={!state?.can_checkin || busy}
                  className={`w-full mt-3 py-2.5 rounded-xl text-sm font-bold transition-all ${state?.can_checkin ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white btn-shine' : 'bg-ms-surface text-ms-gray cursor-not-allowed'}`}
                >
                  {state?.can_checkin ? 'Fazer check-in de hoje' : 'Check-in feito ✓ volta amanhã'}
                </button>
                {checkinMsg && <p className="text-center text-xs font-bold text-ms-green mt-2 animate-pop-in">{checkinMsg}</p>}
              </div>

              {/* Roleta */}
              <div>
                <h3 className="text-sm font-bold text-ms-dark mb-3 flex items-center gap-1.5"><Gift size={15} className="text-ms-purple" /> Roleta da Sorte — 1 giro por dia</h3>
                <div className="relative w-56 h-56 mx-auto">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-ms-dark" />
                  <div
                    className={`w-56 h-56 rounded-full border-8 border-white ${spinning ? '' : 'wheel-glow'}`}
                    style={{
                      background: gradient,
                      transform: `rotate(${rotation}deg)`,
                      transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none',
                    }}
                  >
                    {WHEEL_SLICES.map((s, i) => (
                      <span
                        key={i}
                        className="absolute left-1/2 top-1/2 text-[9px] font-bold text-white whitespace-nowrap"
                        style={{ transform: `rotate(${i * slice + slice / 2}deg) translateY(-86px) translateX(-50%)` }}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                  <div className="absolute inset-0 m-auto w-14 h-14 bg-white rounded-full shadow flex items-center justify-center">
                    <Gift size={22} className="text-ms-purple" />
                  </div>
                </div>
                <button
                  onClick={doSpin}
                  disabled={!state?.can_spin || busy || spinning}
                  className={`w-full mt-4 py-2.5 rounded-xl text-sm font-bold transition-all ${state?.can_spin && !spinning ? 'bg-gradient-to-r from-ms-blue to-ms-purple text-white btn-shine' : 'bg-ms-surface text-ms-gray cursor-not-allowed'}`}
                >
                  {spinning ? 'A girar...' : state?.can_spin ? 'Girar a roleta 🎰' : 'Já giraste hoje ✓ volta amanhã'}
                </button>
                {result && <p className="text-center text-sm font-bold text-ms-purple mt-2 animate-pop-in">🎉 {result}</p>}
              </div>

              <p className="text-[10px] text-ms-gray text-center leading-relaxed">
                Prémios atribuídos automaticamente pelo sistema MÔ SALO: pontos e destaque de perfil dentro da plataforma. Sem custos, sem dinheiro envolvido.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
