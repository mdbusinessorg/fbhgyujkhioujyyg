'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import { useSiteConfig } from './SiteConfigProvider'
import { Megaphone, Settings, Palette, Eye, MousePointerClick, CheckCircle, XCircle, Trash2, Upload, Save, Sparkles, ImageIcon, MessageCircle } from 'lucide-react'

interface PaidAd {
  id: string
  title: string
  description: string
  advertiser_name: string
  email: string
  phone: string
  link: string
  whatsapp: string
  image_url: string
  duration_days: number
  price_kz: number
  payment_status: string
  payment_proof_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'paused' | 'expired'
  starts_at: string | null
  expires_at: string | null
  impressions: number
  clicks: number
  admin_notes: string
  rejected_reason: string
  created_at: string
}

export default function JarvisPanel() {
  const { config, update: updateConfig, refresh: refreshConfig } = useSiteConfig()
  const [tab, setTab] = useState<'anuncios' | 'aparencia' | 'config'>('anuncios')
  const [token, setToken] = useState<string>('')

  const [ads, setAds] = useState<PaidAd[]>([])
  const [loadingAds, setLoadingAds] = useState(true)
  const [filter, setFilter] = useState('all')
  const [savingAd, setSavingAd] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const [appearance, setAppearance] = useState({
    logo_url: config.logo_url || '',
    logo_icon_url: config.logo_icon_url || '',
    hero_image_url: config.hero_image_url || '',
    hero_title: config.hero_title || '',
    hero_subtitle: config.hero_subtitle || '',
  })

  const [site, setSite] = useState({
    site_title: config.site_title || '',
    site_description: config.site_description || '',
    support_whatsapp: config.support_whatsapp || '',
    ad_price_per_day: String(config.ad_price_per_day || 500),
    ad_default_duration_days: String(config.ad_default_duration_days || 7),
    ad_max_active: String(config.ad_max_active || 5),
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setToken(data.session.access_token)
    })
  }, [])

  useEffect(() => {
    setAppearance({
      logo_url: config.logo_url || '',
      logo_icon_url: config.logo_icon_url || '',
      hero_image_url: config.hero_image_url || '',
      hero_title: config.hero_title || '',
      hero_subtitle: config.hero_subtitle || '',
    })
    setSite({
      site_title: config.site_title || '',
      site_description: config.site_description || '',
      support_whatsapp: config.support_whatsapp || '',
      ad_price_per_day: String(config.ad_price_per_day || 500),
      ad_default_duration_days: String(config.ad_default_duration_days || 7),
      ad_max_active: String(config.ad_max_active || 5),
    })
  }, [config])

  const loadAds = useCallback(async () => {
    if (!token) return
    setLoadingAds(true)
    try {
      const res = await fetch('/api/paid-ads?admin=1', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.ads) setAds(data.ads)
    } catch (e) {}
    setLoadingAds(false)
  }, [token])

  useEffect(() => { if (token) loadAds() }, [token, loadAds])

  const updateAd = async (id: string, updates: Partial<PaidAd>) => {
    if (!token) return
    setSavingAd(id)
    try {
      const res = await fetch('/api/paid-ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        setMessage('Anúncio actualizado.')
        setTimeout(() => setMessage(''), 3000)
        loadAds()
      }
    } catch {}
    setSavingAd(null)
  }

  const deleteAd = async (id: string) => {
    if (!confirm('Apagar este anúncio permanentemente?')) return
    if (!token) return
    await fetch(`/api/paid-ads?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    loadAds()
  }

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof appearance) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop() || 'png'
    const path = `site-config/${field}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })
    if (error) return
    const url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
    setAppearance({ ...appearance, [field]: url })
  }

  const saveAppearance = async () => {
    await updateConfig(appearance)
    setMessage('Aparência guardada.')
    setTimeout(() => setMessage(''), 3000)
  }

  const saveSite = async () => {
    await updateConfig({
      ...site,
      ad_price_per_day: Number(site.ad_price_per_day),
      ad_default_duration_days: Number(site.ad_default_duration_days),
      ad_max_active: Number(site.ad_max_active),
    })
    setMessage('Configurações guardadas.')
    setTimeout(() => setMessage(''), 3000)
  }

  const filteredAds = ads.filter(a => filter === 'all' || a.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ms-dark flex items-center gap-2"><Sparkles size={22} className="text-ms-purple" /> Jarvis — Centro de Comando</h2>
        {message && <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">{message}</span>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'anuncios', icon: Megaphone, label: 'Anúncios' },
          { key: 'aparencia', icon: Palette, label: 'Aparência' },
          { key: 'config', icon: Settings, label: 'Config' },
        ].map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key as any)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${tab === t.key ? 'bg-ms-blue text-white' : 'bg-white text-ms-gray border border-ms-border'}`}>
              <Icon size={16} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'anuncios' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['all', 'pending', 'approved', 'paused', 'rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${filter === f ? 'bg-ms-purple text-white' : 'bg-white text-ms-gray border border-ms-border'}`}>
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'approved' ? 'Aprovados' : f === 'paused' ? 'Pausados' : 'Rejeitados'} ({f === 'all' ? ads.length : ads.filter(a => a.status === f).length})
              </button>
            ))}
          </div>

          {loadingAds ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-ms-border"><div className="w-8 h-8 border-2 border-ms-purple border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filteredAds.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-ms-border text-sm text-ms-gray">Nenhum anúncio.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAds.map(ad => (
                <div key={ad.id} className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm">
                  <div className="flex items-start gap-3">
                    <img src={ad.image_url} alt={ad.title} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-ms-dark truncate">{ad.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ad.status === 'approved' ? 'bg-green-100 text-green-700' : ad.status === 'pending' ? 'bg-amber-100 text-amber-700' : ad.status === 'paused' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                          {ad.status}
                        </span>
                      </div>
                      <p className="text-xs text-ms-gray">{ad.advertiser_name} • {ad.phone} • {ad.email}</p>
                      <p className="text-xs text-ms-gray mt-1">{ad.duration_days} dias • {ad.price_kz} Kz • pagamento: {ad.payment_status}</p>
                      <div className="flex items-center gap-3 text-[10px] text-ms-gray mt-2">
                        <span className="flex items-center gap-0.5"><Eye size={10} /> {ad.impressions}</span>
                        <span className="flex items-center gap-0.5"><MousePointerClick size={10} /> {ad.clicks}</span>
                        {ad.expires_at && <span>Expira: {new Date(ad.expires_at).toLocaleDateString('pt-AO')}</span>}
                      </div>
                    </div>
                  </div>

                  {ad.payment_proof_url && (
                    <div className="mt-3">
                      <a href={ad.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-ms-blue hover:underline">Ver comprovativo de pagamento</a>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {ad.status !== 'approved' && (
                      <button onClick={() => updateAd(ad.id, { status: 'approved', payment_status: ad.payment_status === 'paid' ? ad.payment_status : 'pending' })} disabled={savingAd === ad.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg font-medium">
                        <CheckCircle size={12} /> Aprovar
                      </button>
                    )}
                    {ad.status !== 'paused' && ad.status === 'approved' && (
                      <button onClick={() => updateAd(ad.id, { status: 'paused' })} disabled={savingAd === ad.id} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">Pausar</button>
                    )}
                    {ad.status === 'paused' && (
                      <button onClick={() => updateAd(ad.id, { status: 'approved' })} disabled={savingAd === ad.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg font-medium">Retomar</button>
                    )}
                    {ad.payment_status !== 'paid' && (
                      <button onClick={() => updateAd(ad.id, { payment_status: 'paid' })} disabled={savingAd === ad.id} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-lg font-medium">Marcar pago</button>
                    )}
                    <button onClick={() => updateAd(ad.id, { status: 'rejected', rejected_reason: 'Não aprovado' })} disabled={savingAd === ad.id} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg font-medium">
                      <XCircle size={12} /> Rejeitar
                    </button>
                    <button onClick={() => deleteAd(ad.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg font-medium ml-auto">
                      <Trash2 size={12} /> Apagar
                    </button>
                  </div>

                  {ad.whatsapp && (
                    <a href={`https://wa.me/${ad.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${ad.advertiser_name}! Sobre o anúncio "${ad.title}" no MÔ SALO...`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-600 mt-2">
                      <MessageCircle size={12} /> Contactar anunciante
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'aparencia' && (
        <div className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ms-dark flex items-center gap-2"><Palette size={18} className="text-ms-purple" /> Aparência do site</h3>

          {['logo_url', 'logo_icon_url', 'hero_image_url'].map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-ms-dark mb-1 capitalize">{field.replace(/_/g, ' ')}</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-ms-surface rounded-xl flex items-center justify-center overflow-hidden border border-ms-border">
                  {appearance[field as keyof typeof appearance] ? <img src={appearance[field as keyof typeof appearance]} alt="" className="w-full h-full object-contain" /> : <ImageIcon size={20} className="text-ms-gray" />}
                </div>
                <label className="flex-1">
                  <span className="inline-flex items-center gap-1 text-xs text-ms-blue font-medium cursor-pointer"><Upload size={12} /> Carregar novo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, field as any)} />
                </label>
              </div>
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-ms-dark mb-1">Título do hero</label>
            <input value={appearance.hero_title} onChange={e => setAppearance({ ...appearance, hero_title: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ms-dark mb-1">Subtítulo do hero</label>
            <input value={appearance.hero_subtitle} onChange={e => setAppearance({ ...appearance, hero_subtitle: e.target.value })} className="input-field" />
          </div>

          <button onClick={saveAppearance} className="btn-primary flex items-center justify-center gap-2"><Save size={16} /> Guardar aparência</button>
        </div>
      )}

      {tab === 'config' && (
        <div className="bg-white rounded-2xl p-4 border border-ms-border shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ms-dark flex items-center gap-2"><Settings size={18} className="text-ms-purple" /> Configurações gerais</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">Título do site</label>
              <input value={site.site_title} onChange={e => setSite({ ...site, site_title: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">WhatsApp de suporte</label>
              <input value={site.support_whatsapp} onChange={e => setSite({ ...site, support_whatsapp: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ms-dark mb-1">Descrição do site</label>
            <input value={site.site_description} onChange={e => setSite({ ...site, site_description: e.target.value })} className="input-field" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">Preço anúncio/dia (Kz)</label>
              <input type="number" value={site.ad_price_per_day} onChange={e => setSite({ ...site, ad_price_per_day: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">Duração padrão (dias)</label>
              <input type="number" value={site.ad_default_duration_days} onChange={e => setSite({ ...site, ad_default_duration_days: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">Máx. anúncios activos</label>
              <input type="number" value={site.ad_max_active} onChange={e => setSite({ ...site, ad_max_active: e.target.value })} className="input-field" />
            </div>
          </div>

          <button onClick={saveSite} className="btn-primary flex items-center justify-center gap-2"><Save size={16} /> Guardar configurações</button>
        </div>
      )}
    </div>
  )
}
