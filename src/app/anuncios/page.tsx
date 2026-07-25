'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import { useSiteConfig } from '@/components/SiteConfigProvider'
import PaidAdsCarousel from '@/components/PaidAdsCarousel'
import Logo from '@/components/Logo'
import { Megaphone, Upload, ArrowLeft, MessageCircle, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default function AnunciosPage() {
  const router = useRouter()
  const { config } = useSiteConfig()
  const [user, setUser] = useState<any>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    advertiser_name: '',
    email: '',
    phone: '',
    link: '',
    whatsapp: '',
    duration_days: String(config.ad_default_duration_days || 7),
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedAd, setSubmittedAd] = useState<any>(null)
  const [error, setError] = useState('')

  const price = Math.max(1, Number(form.duration_days) || 7) * (config.ad_price_per_day || 500)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(data.session.user)
    })
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
  }

  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg'
    const id = crypto.randomUUID()
    const path = `${prefix}/${id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })
    if (error) throw error
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.advertiser_name || !form.phone || !imageFile) {
      setError('Preenche título, nome, contacto e imagem do anúncio.')
      return
    }

    setSubmitting(true)
    try {
      const imageUrl = await uploadFile(imageFile, 'paid-ads')
      let proofUrl = null
      if (proofFile) proofUrl = await uploadFile(proofFile, 'payment-proofs')

      const payload = {
        ...form,
        duration_days: Number(form.duration_days),
        price_kz: price,
        image_url: imageUrl,
        payment_proof_url: proofUrl,
      }

      const res = await fetch('/api/paid-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao submeter')
      setSubmittedAd(data.ad)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter anúncio')
    } finally {
      setSubmitting(false)
    }
  }

  const supportWhatsapp = (config.support_whatsapp || '244934859497').replace(/\D/g, '')
  const supportMessage = submittedAd
    ? `Olá! Submeti o anúncio "${submittedAd.title}" (ref: ${submittedAd.id}) no MÔ SALO. Quero pagar/aprovar.`
    : 'Olá! Quero anunciar no MÔ SALO.'
  const supportLink = `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(supportMessage)}`

  return (
    <div className="min-h-screen bg-ms-surface pb-24">
      <header className="sticky top-0 bg-white z-50 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="p-1 -ml-2 text-ms-dark"><ArrowLeft size={22} /></button>
          <Link href="/" className="flex items-center"><Logo variant="full" className="h-7 w-auto" /></Link>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-gradient-to-br from-ms-blue to-ms-purple rounded-3xl p-6 text-white mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone size={24} />
            <h1 className="text-xl font-bold">Anuncie no MÔ SALO</h1>
          </div>
          <p className="text-sm text-white/80">Milhares de candidatos e recrutadores veem a plataforma todos os dias. Destaque a sua marca ou oportunidade.</p>
        </div>

        <PaidAdsCarousel />

        {submitted ? (
          <div className="bg-white rounded-3xl p-6 border border-ms-border shadow-sm mb-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-ms-dark text-center mb-2">Anúncio submetido com sucesso!</h2>
            <p className="text-sm text-ms-gray text-center mb-4">Estado: <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><Clock size={12} /> Pendente de aprovação</span></p>
            {submittedAd?.price_kz && (
              <p className="text-sm text-ms-dark text-center mb-4">Valor a pagar: <strong>{submittedAd.price_kz} Kz</strong> ({submittedAd.duration_days} dia{submittedAd.duration_days > 1 && 's'})</p>
            )}
            <div className="flex flex-col gap-3">
              <a href={supportLink} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center justify-center gap-2">
                <MessageCircle size={18} /> Falar com suporte para aprovação
              </a>
              <button onClick={() => router.push('/')} className="btn-outline">Voltar ao início</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-ms-border shadow-sm mb-8 space-y-4">
            <h2 className="text-base font-bold text-ms-dark flex items-center gap-2"><Megaphone size={18} className="text-ms-purple" /> Criar anúncio</h2>

            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">Título do anúncio *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Curso Preparatório 2ª Edição" className="input-field" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">Descrição curta</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição do produto/serviço..." className="input-field min-h-[80px]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ms-dark mb-1">Nome do anunciante *</label>
                <input value={form.advertiser_name} onChange={e => setForm({ ...form, advertiser_name: e.target.value })} placeholder="Empresa / Nome" className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-dark mb-1">Telemóvel *</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="244 9XX XXX XXX" className="input-field" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ms-dark mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-dark mb-1">WhatsApp (com prefixo)</label>
                <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="2449XXXXXXXX" className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">Link do anúncio</label>
              <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." className="input-field" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ms-dark mb-1">Duração (dias) *</label>
                <input type="number" min={1} value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-dark mb-1">Preço estimado</label>
                <div className="input-field bg-ms-surface text-ms-dark font-semibold">{price} Kz</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">Imagem do anúncio *</label>
              <label className="block border-2 border-dashed border-ms-border rounded-xl p-4 hover:border-ms-blue transition-colors cursor-pointer">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-contain rounded-xl" />
                ) : (
                  <div className="text-center">
                    <Upload size={24} className="text-ms-gray mx-auto mb-2" />
                    <p className="text-sm text-ms-gray">Clique para carregar imagem</p>
                    <p className="text-xs text-ms-gray mt-1">PNG ou JPG (recomendado 1200x600)</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-ms-dark mb-1">Comprovativo de pagamento (opcional)</label>
              <input type="file" accept="image/*,.pdf" onChange={handleProofChange} className="block w-full text-sm text-ms-gray file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-ms-purple-light file:text-ms-purple file:font-medium" />
              <p className="text-[10px] text-ms-gray mt-1">Podes enviar depois pelo suporte.</p>
            </div>

            <div className="bg-ms-surface rounded-xl p-4">
              <p className="text-xs text-ms-dark font-medium mb-2">Métodos de pagamento:</p>
              <ul className="text-xs text-ms-gray space-y-1">
                <li>• Multicaixa Express: 926 115 429</li>
                <li>• Unitel Money / Africell Money: 934 859 497</li>
                <li>• IBAN: 0005.0000.0626.9321.1011.5</li>
              </ul>
            </div>

            <button type="submit" disabled={submitting || uploading} className="btn-primary w-full flex items-center justify-center gap-2">
              {submitting ? 'A submeter...' : <><Megaphone size={18} /> Submeter anúncio</>}
            </button>
            <p className="text-[10px] text-ms-gray text-center">O anúncio só vai ao ar após confirmação de pagamento e aprovação da equipa.</p>
          </form>
        )}
      </main>
    </div>
  )
}
