'use client'

import { useState, useEffect } from 'react'
import { Briefcase } from 'lucide-react'
import AuthIllustration from '@/components/AuthIllustration'

export default function SplashScreen() {
  const [show, setShow] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const shown = sessionStorage.getItem('splash-shown')
    if (shown) {
      setShow(false)
      return
    }
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => {
        setShow(false)
        sessionStorage.setItem('splash-shown', '1')
      }, 500)
    }, 1800)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center px-6 text-white transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: '#1A56FF' }}
    >
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
          <Briefcase size={28} className="text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">MÔ SALO</h1>
        <p className="mt-2 text-sm font-medium text-white/80">Emprego ideal em Angola</p>
        <div className="mt-8 w-full">
          <AuthIllustration />
        </div>
        <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/80">
          Encontra vagas reais, guarda as tuas favoritas e candidata-te com confiança.
        </p>
        <div className="mt-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      </div>
    </div>
  )
}
