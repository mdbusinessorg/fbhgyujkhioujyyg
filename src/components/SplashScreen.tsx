'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function SplashScreen() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (pathname && pathname !== '/') {
      setShow(false)
      return
    }
    if (pathname !== '/') return
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => setShow(false), 500)
    }, 2500)
    return () => clearTimeout(timer)
  }, [mounted, pathname])

  if (!mounted || !show) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center px-6 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(135deg, #1A56FF 0%, #6C47FF 100%)' }}
    >
      <div className="animate-scale-in flex flex-col items-center w-full max-w-xs">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-3xl p-4 shadow-2xl mb-5 flex items-center justify-center overflow-hidden max-w-[80vw] max-h-[35vh]">
          <img
            src="/logo-icon.png"
            alt="MÔ SALO"
            width={96}
            height={96}
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight mb-1 animate-fade-up text-center">MÔ SALO</h1>
        <p className="text-white/70 text-xs sm:text-sm animate-fade-up text-center" style={{ animationDelay: '0.15s' }}>Emprego Ideal em Angola</p>
        <div className="mt-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.5s ease-out; }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
      `}</style>
    </div>
  )
}
