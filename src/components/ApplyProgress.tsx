'use client'

import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'

export type ApplyPhase = 'idle' | 'working' | 'flying'

export const APPLY_MIN_MS = 1400
export const APPLY_FLY_MS = 650
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, Math.max(0, ms)))

interface ApplyProgressProps {
  phase: ApplyPhase
  title: string
  steps: string[]
  doneLabel?: string
}

// Ecrã de progresso mostrado logo após o clique em "Candidatar".
export default function ApplyProgress({ phase, title, steps, doneLabel = 'A enviar…' }: ApplyProgressProps) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (phase !== 'working') { setStep(0); return }
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 700)
    return () => clearInterval(id)
  }, [phase, steps.length])

  if (phase === 'idle') return null
  const flying = phase === 'flying'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-6 bg-white/75 backdrop-blur-2xl backdrop-in" role="status" aria-live="polite">
      <div className="ms-pop-in w-full max-w-xs text-center">
        <div className="relative mx-auto w-28 h-28">
          <span className="absolute inset-0 rounded-full bg-ms-blue/10 ms-apply-halo" />
          <span className="absolute inset-0 rounded-full border-[3px] border-ms-blue/15 border-t-ms-blue ms-apply-orbit" />
          <span className={`absolute inset-3 rounded-full bg-ms-blue text-white flex items-center justify-center shadow-[0_12px_30px_rgba(66,165,245,0.45)] ${flying ? 'ms-apply-fly' : 'ms-apply-float'}`}>
            <Send size={34} strokeWidth={2.2} />
          </span>
        </div>
        <h3 className="text-lg font-extrabold text-ms-dark tracking-tight mt-6">{title}</h3>
        <p key={flying ? 'done' : step} className="ms-apply-step text-sm text-ms-gray mt-1.5 min-h-[20px]">{flying ? doneLabel : steps[step]}</p>
        <div className="mt-5 h-1.5 rounded-full bg-ms-blue/10 overflow-hidden">
          <span
            className="block h-full rounded-full bg-ms-blue transition-[width] duration-700 ease-out"
            style={{ width: flying ? '100%' : `${Math.round(((step + 1) / (steps.length + 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
