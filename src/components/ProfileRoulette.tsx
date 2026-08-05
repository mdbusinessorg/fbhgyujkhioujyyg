'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Trophy, Sparkles, RotateCcw, Gift, Zap, Star, Crown, MessageCircle, Briefcase, X, ChevronDown, ChevronUp } from 'lucide-react'

interface Prize {
  label: string
  icon: React.ReactNode
  color: string
  text: string
  weight: number
}

const PRIZES: Prize[] = [
  { label: 'Boost de Perfil', icon: <Zap size={14} />, color: '#F59E0B', text: 'O teu perfil terá prioridade nas pesquisas por 24h.', weight: 15 },
  { label: 'Dica PRO', icon: <Star size={14} />, color: '#1A56FF', text: 'Adiciona competências-chave à tua área para subir no ranking.', weight: 25 },
  { label: 'Mensagem Premium', icon: <MessageCircle size={14} />, color: '#6C47FF', text: 'Ganhaste um crédito para contactar recrutadores.', weight: 10 },
  { label: 'Tentar Outra Vez', icon: <RotateCcw size={14} />, color: '#9CA3AF', text: 'Não foi desta. Volta amanhã para uma nova oportunidade.', weight: 25 },
  { label: 'Destaque no Feed', icon: <Briefcase size={14} />, color: '#10B981', text: 'A tua próxima publicação ficará destacada.', weight: 10 },
  { label: 'Desconto PRO', icon: <Crown size={14} />, color: '#EC4899', text: '20% de desconto no MÔ SALO PRO durante 7 dias.', weight: 15 },
]

const SEGMENT_ANGLE = 360 / PRIZES.length
const SPINS_MIN = 6
const SPINS_MAX = 10

function getDailyKey(userId?: string) {
  const today = new Date().toISOString().slice(0, 10)
  return `mosalo_roulette_${userId || 'guest'}_${today}`
}

export function ProfileRoulette({ userId, personName, inline = false }: { userId?: string; personName?: string; inline?: boolean }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Prize | null>(null)
  const [usedToday, setUsedToday] = useState(false)
  const [expanded, setExpanded] = useState(inline)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setUsedToday(localStorage.getItem(getDailyKey(userId)) === 'used')
  }, [userId])

  const weightedPrize = useCallback(() => {
    const total = PRIZES.reduce((s, p) => s + p.weight, 0)
    let r = Math.random() * total
    for (const p of PRIZES) {
      r -= p.weight
      if (r <= 0) return p
    }
    return PRIZES[PRIZES.length - 1]
  }, [])

  const spin = () => {
    if (spinning || usedToday) return
    setSpinning(true)
    setResult(null)
    const selected = weightedPrize()
    const index = PRIZES.indexOf(selected)
    const stopAngle = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
    const spins = SPINS_MIN + Math.floor(Math.random() * (SPINS_MAX - SPINS_MIN + 1))
    const target = spins * 360 + (360 - stopAngle)
    const start = rotation
    const final = start + target
    setRotation(final)

    const duration = 3200 + Math.floor(Math.random() * 600)
    setTimeout(() => {
      setSpinning(false)
      setResult(selected)
      if (typeof window !== 'undefined' && userId) {
        localStorage.setItem(getDailyKey(userId), 'used')
        setUsedToday(true)
      }
    }, duration)
  }

  const wheelMarks = useMemo(() => {
    return PRIZES.map((p, i) => {
      const startAngle = i * SEGMENT_ANGLE
      const endAngle = (i + 1) * SEGMENT_ANGLE
      const largeArc = endAngle - startAngle > 180 ? 1 : 0
      const r = 90
      const cx = 100
      const cy = 100
      const radStart = ((startAngle - 90) * Math.PI) / 180
      const radEnd = ((endAngle - 90) * Math.PI) / 180
      const x1 = cx + r * Math.cos(radStart)
      const y1 = cy + r * Math.sin(radStart)
      const x2 = cx + r * Math.cos(radEnd)
      const y2 = cy + r * Math.sin(radEnd)
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
      const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180)
      const tx = cx + 58 * Math.cos(midAngle)
      const ty = cy + 58 * Math.sin(midAngle)
      return { d, fill: p.color, label: p.label, icon: p.icon, tx, ty, rotate: startAngle + SEGMENT_ANGLE / 2 }
    })
  }, [])

  const transitionStyle = { transition: spinning ? `transform ${3.2 + Math.random() * 0.6}s cubic-bezier(0.2, 0.8, 0.3, 1)` : 'none' }

  if (!inline) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-40 group"
        aria-label="Abrir roda da sorte"
      >
        <div className="relative animate-pulse-soft">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-ms-blue to-ms-purple shadow-lg flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
            <Gift size={26} />
          </div>
          {!usedToday && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />}
        </div>
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-ms-border shadow-sm overflow-hidden animate-fade-in">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-ms-surface transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ms-blue to-ms-purple flex items-center justify-center text-white shadow-sm">
            <Trophy size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-ms-dark">Roda da Sorte do Perfil</h3>
            <p className="text-[11px] text-ms-gray">
              {usedToday ? 'Já giraste hoje — volta amanhã.' : 'Gira uma vez por dia e ganha vantagens.'}
            </p>
          </div>
        </div>
        <div className="text-ms-gray">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-5 pt-1 border-t border-ms-border">
          <p className="text-xs text-ms-gray text-center mb-4">
            {personName ? `Visita o perfil de ${personName} e ganha uma recompensa.` : 'Gira a roda e descobre uma vantagem para o teu perfil.'}
          </p>

          <div className="relative w-48 h-48 mx-auto mb-5">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-ms-dark" />
            </div>
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-lg"
              style={{ transform: `rotate(${rotation}deg)`, ...transitionStyle }}
            >
              {wheelMarks.map((m, i) => (
                <g key={i}>
                  <path d={m.d} fill={m.fill} opacity="0.95" />
                  <g transform={`translate(${m.tx},${m.ty}) rotate(${m.rotate + 90})`}>
                    <text x="0" y="-4" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" className="select-none">
                      {m.label}
                    </text>
                    <foreignObject x="-8" y="2" width="16" height="16">
                      <div className="flex items-center justify-center text-white">{m.icon}</div>
                    </foreignObject>
                  </g>
                </g>
              ))}
              <circle cx="100" cy="100" r="12" fill="white" />
              <circle cx="100" cy="100" r="7" fill="#1A56FF" />
            </svg>
          </div>

          {usedToday ? (
            <div className="bg-ms-surface rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-ms-dark flex items-center justify-center gap-2"><Sparkles size={16} className="text-ms-purple" /> Já giraste hoje</p>
              <p className="text-[11px] text-ms-gray mt-1">Volta amanhã para uma nova oportunidade.</p>
            </div>
          ) : (
            <button
              onClick={spin}
              disabled={spinning}
              className="w-full bg-gradient-to-r from-ms-blue to-ms-purple text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {spinning ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A girar...</>
              ) : (
                <><RotateCcw size={18} /> Girar a roda</>
              )}
            </button>
          )}

          {result && (
            <div className="mt-4 bg-gradient-to-br from-ms-purple-light to-white border border-ms-purple/20 rounded-2xl p-4 animate-fade-in">
              <p className="text-sm font-bold text-ms-dark flex items-center justify-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: result.color }}>{result.icon}</span>
                {result.label}
              </p>
              <p className="text-[11px] text-ms-gray mt-1.5">{result.text}</p>
            </div>
          )}

          <p className="text-[10px] text-ms-gray text-center mt-3">Disponível uma vez por dia. Prémios simbólicos sujeitos a termos.</p>
        </div>
      )}
    </div>
  )
}
