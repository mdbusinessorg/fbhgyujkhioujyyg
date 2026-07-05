'use client'

import { useState, useEffect } from 'react'

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
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(135deg, #1A56FF 0%, #6C47FF 100%)' }}
    >
      <div className="animate-bounce-slow">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <span className="text-4xl font-black bg-gradient-to-br from-[#1A56FF] to-[#6C47FF] bg-clip-text text-transparent">MS</span>
        </div>
      </div>
      <h1 className="text-white text-2xl font-bold tracking-tight mb-1">MÔ SALO</h1>
      <p className="text-white/70 text-sm">Emprego Ideal em Angola</p>
      <div className="mt-8">
        <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
