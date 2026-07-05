'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    // Detect iOS
    const ua = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(isiOS)

    if (isiOS) {
      // On iOS, show after 3 seconds
      setTimeout(() => setShowBanner(true), 3000)
      return
    }

    // Android/Desktop - listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowBanner(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIOSGuide(false)
    localStorage.setItem('pwa-dismissed', Date.now().toString())
  }

  if (!showBanner) return null

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A56FF] to-[#6C47FF] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">MS</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Instalar MÔ SALO</p>
            <p className="text-xs text-gray-500">Acesso rápido no ecrã inicial</p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-[#1A56FF] text-white text-xs font-medium rounded-lg hover:bg-[#1445DD] transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-gray-400 text-xs hover:text-gray-600 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={handleDismiss}>
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-4">Instalar MÔ SALO no iPhone</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EEF0FF] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1A56FF] font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Toca no ícone <span className="inline-block">
                    <svg className="w-5 h-5 inline text-[#1A56FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </span> de partilha (em baixo no Safari)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EEF0FF] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1A56FF] font-bold text-sm">2</span>
                </div>
                <p className="text-sm text-gray-700">Desliza para baixo e toca em <strong>&quot;Adicionar ao Ecrã Inicial&quot;</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EEF0FF] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1A56FF] font-bold text-sm">3</span>
                </div>
                <p className="text-sm text-gray-700">Toca em <strong>&quot;Adicionar&quot;</strong> — e pronto!</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="mt-6 w-full py-3 bg-[#1A56FF] text-white font-medium rounded-xl hover:bg-[#1445DD] transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
