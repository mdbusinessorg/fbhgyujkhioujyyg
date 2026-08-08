'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface SiteConfig {
  logo_url?: string
  logo_icon_url?: string
  hero_image_url?: string
  hero_title?: string
  hero_subtitle?: string
  support_whatsapp?: string
  ad_price_per_day?: number
  ad_default_duration_days?: number
  ad_max_active?: number
  maintenance_mode?: boolean
  site_title?: string
  site_description?: string
  primary_color?: string
  secondary_color?: string
}

const defaultConfig: SiteConfig = {
  logo_url: '/logo.png',
  logo_icon_url: '/logo-icon.png',
  hero_image_url: '/images/hero-destaque.jpg',
  hero_title: 'Encontra o teu próximo emprego',
  hero_subtitle: 'Vagas novas todos os dias das melhores empresas em Angola.',
  support_whatsapp: '244934859497',
  ad_price_per_day: 500,
  ad_default_duration_days: 7,
  ad_max_active: 5,
  maintenance_mode: false,
  site_title: 'MÔ SALO',
  site_description: 'Plataforma de recrutamento inteligente angolana.',
  primary_color: '#BC181C',
  secondary_color: '#ECA61B',
}

interface SiteConfigContextType {
  config: SiteConfig
  loading: boolean
  refresh: () => Promise<void>
  update: (partial: Partial<SiteConfig>) => Promise<void>
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: defaultConfig,
  loading: true,
  refresh: async () => {},
  update: async () => {},
})

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const res = await fetch('/api/site-config', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setConfig({ ...defaultConfig, ...(data.config || {}) })
      }
    } catch (e) {
      console.error('Erro ao carregar config:', e)
    } finally {
      setLoading(false)
    }
  }

  const update = async (partial: Partial<SiteConfig>) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const res = await fetch('/api/site-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(partial),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Falha ao guardar configuração')
    }
    await refresh()
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SiteConfigContext.Provider value={{ config, loading, refresh, update }}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export function useSiteConfig() {
  return useContext(SiteConfigContext)
}
