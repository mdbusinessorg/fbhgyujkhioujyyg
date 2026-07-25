'use client'

import { useEffect, useRef, useState } from 'react'
import { Megaphone, Eye, MousePointerClick, ExternalLink, MessageCircle } from 'lucide-react'

interface PaidAd {
  id: string
  title: string
  description?: string
  image_url: string
  link?: string
  whatsapp?: string
  impressions?: number
  clicks?: number
}

export default function PaidAdsCarousel() {
  const [ads, setAds] = useState<PaidAd[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const tracked = useRef<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/paid-ads')
      .then((res) => res.json())
      .then((data) => {
        setAds(data.ads || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Track impressions once per ad id
  useEffect(() => {
    if (ads.length === 0) return
    ads.forEach((ad) => {
      if (tracked.current.has(ad.id)) return
      tracked.current.add(ad.id)
      fetch(`/api/paid-ads?event=impression&id=${ad.id}`, { method: 'POST' }).catch(() => {})
    })
  }, [ads])

  // Auto-scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container || ads.length < 2) return

    const step = () => {
      if (!container) return
      const maxScroll = container.scrollWidth - container.clientWidth
      if (maxScroll <= 0) return
      const next = container.scrollLeft + 1
      if (next >= maxScroll) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        container.scrollTo({ left: next, behavior: 'auto' })
      }
    }

    intervalRef.current = setInterval(step, 30)
    const stop = () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    const start = () => { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = setInterval(step, 30) }

    container.addEventListener('mouseenter', stop)
    container.addEventListener('mouseleave', start)
    container.addEventListener('touchstart', stop)
    container.addEventListener('touchend', start)

    return () => {
      stop()
      container.removeEventListener('mouseenter', stop)
      container.removeEventListener('mouseleave', start)
      container.removeEventListener('touchstart', stop)
      container.removeEventListener('touchend', start)
    }
  }, [ads])

  const handleClick = async (ad: PaidAd) => {
    fetch(`/api/paid-ads?event=click&id=${ad.id}`, { method: 'POST' }).catch(() => {})
    const url = ad.whatsapp
      ? `https://wa.me/${ad.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi o anúncio "${ad.title}" no MÔ SALO e quero saber mais.`)}`
      : ad.link
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <section className="mb-6">
        <div className="bg-white rounded-3xl overflow-hidden border border-ms-border shadow-xl h-48 animate-pulse" />
      </section>
    )
  }

  if (ads.length === 0) return null

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-ms-blue to-ms-purple flex items-center justify-center">
            <Megaphone size={14} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-ms-dark">Anúncios Patrocinados</h2>
        </div>
        <a href="/anuncios/" className="text-xs text-ms-blue font-medium">Anunciar</a>
      </div>
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 no-scrollbar -mx-4 px-4"
      >
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="snap-start flex-shrink-0 w-80 sm:w-96 bg-white rounded-3xl overflow-hidden border border-ms-border shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
            onClick={() => handleClick(ad)}
          >
            <div className="relative h-40 overflow-hidden">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-ms-blue to-ms-purple px-2.5 py-1 rounded-full shadow-sm">
                Anúncio Pago
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-ms-dark mb-1 line-clamp-1">{ad.title}</h3>
              {ad.description && <p className="text-xs text-ms-gray line-clamp-2 mb-3">{ad.description}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-ms-gray">
                  <span className="inline-flex items-center gap-0.5"><Eye size={10} /> {ad.impressions || 0}</span>
                  <span className="inline-flex items-center gap-0.5"><MousePointerClick size={10} /> {ad.clicks || 0}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-ms-blue">
                  {ad.whatsapp ? <><MessageCircle size={14} /> WhatsApp</> : <><ExternalLink size={14} /> Visitar</>}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
