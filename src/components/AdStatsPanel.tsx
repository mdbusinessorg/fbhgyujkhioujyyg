'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Eye, MousePointerClick, RefreshCw } from 'lucide-react'

interface AdStats {
  [adId: string]: {
    impressions: number
    clicks: number
    updated_at: string
  }
}

export default function AdStatsPanel() {
  const [stats, setStats] = useState<AdStats>({})
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ad-analytics?ad=all')
      const data = await res.json()
      if (data?.stats) setStats(data.stats)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    loadStats()
  }, [])

  const ads = Object.entries(stats)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ms-dark flex items-center gap-2">
          <Megaphone size={22} className="text-ms-purple" /> Estatísticas de Anúncios
        </h2>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-1 text-xs font-medium text-ms-blue bg-ms-surface px-3 py-2 rounded-lg hover:bg-ms-purple-light transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {ads.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-ms-border">
          <Megaphone size={32} className="text-ms-gray mx-auto mb-3" />
          <p className="text-sm text-ms-gray">Sem dados de anúncios ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map(([adId, s]) => {
            const ctr = s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(1) : '0.0'
            return (
              <div key={adId} className="bg-white rounded-2xl p-5 border border-ms-border shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ms-blue to-ms-purple flex items-center justify-center text-white">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ms-dark capitalize">{adId.replace(/-/g, ' ')}</h3>
                    <p className="text-[10px] text-ms-gray">Última actualização: {new Date(s.updated_at).toLocaleString('pt-AO')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-ms-gray mb-1 flex items-center justify-center gap-1"><Eye size={12} /> Views</p>
                    <p className="text-lg font-bold text-ms-blue">{s.impressions}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-ms-gray mb-1 flex items-center justify-center gap-1"><MousePointerClick size={12} /> Cliques</p>
                    <p className="text-lg font-bold text-green-600">{s.clicks}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-ms-gray mb-1">CTR</p>
                    <p className="text-lg font-bold text-ms-purple">{ctr}%</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
