'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'
import { ArrowLeft, Copy, Upload, CheckCircle, Clock, CreditCard, Smartphone, Shield } from 'lucide-react'

export default function PremiumCheckout() {
  const [session, setSession] = useState<any>(null)
  const [userId, setUserId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [existingRequest, setExistingRequest] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s) { router.push('/auth/login/'); return }
      setSession(s)

      const { data: user } = await supabase.from('users').select('id').eq('email', s.user.email).single()
      if (user) {
        setUserId(user.id)
        const { data: req } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (req) setExistingRequest(req)
      }
    }
    init()
  }, [router])

  const copyNumber = () => {
    navigator.clipboard.writeText('926115429')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `payment-proofs/${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file)
    if (error) { alert('Erro ao enviar: ' + error.message); setUploading(false); return }
    const url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
    setProofUrl(url)
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!proofUrl) { alert('Envie o comprovativo primeiro'); return }
    const { error } = await supabase.from('payment_requests').insert({
      user_id: userId,
      plan: 'premium_3d',
      amount: 500,
      phone_used: '926115429',
      proof_file_url: proofUrl,
      transaction_reference: reference || null,
      status: 'pending',
      payment_method: 'manual',
    })
    if (error) { alert('Erro: ' + error.message); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Pedido Enviado!</h1>
          <p className="text-sm text-gray-600 mb-6">O teu comprovativo foi recebido. O acesso Premium será activado em até 24h após aprovação pelo admin.</p>
          <Link href="/" className="inline-block bg-[#1A56FF] text-white px-6 py-3 rounded-xl font-medium text-sm">Voltar ao Início</Link>
        </div>
      </div>
    )
  }

  if (existingRequest && existingRequest.status === 'pending') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Pedido em Análise</h1>
          <p className="text-sm text-gray-600 mb-6">Já tens um pedido de pagamento pendente. Aguarda a aprovação do admin (até 24h).</p>
          <Link href="/" className="inline-block bg-[#1A56FF] text-white px-6 py-3 rounded-xl font-medium text-sm">Voltar ao Início</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-50">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1"><ArrowLeft size={20} /></button>
          <h1 className="font-semibold text-gray-900">Premium</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Price Card */}
        <div className="bg-gradient-to-br from-[#1A56FF] to-[#6C47FF] rounded-2xl p-6 text-white text-center">
          <Shield size={32} className="mx-auto mb-3 opacity-80" />
          <h2 className="text-lg font-bold mb-1">Acesso Premium</h2>
          <p className="text-3xl font-black">500 Kz</p>
          <p className="text-white/70 text-sm mt-1">3 dias de acesso completo</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 rounded-lg p-2">Candidaturas ilimitadas</div>
            <div className="bg-white/10 rounded-lg p-2">Ver todos os contactos</div>
            <div className="bg-white/10 rounded-lg p-2">Mensagens directas</div>
            <div className="bg-white/10 rounded-lg p-2">Perfil em destaque</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Smartphone size={18} className="text-[#1A56FF]" /> Como pagar
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#EEF0FF] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#1A56FF] font-bold text-xs">1</span>
              </div>
              <p className="text-sm text-gray-700">Abre o app <strong>Multicaixa Express</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#EEF0FF] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#1A56FF] font-bold text-xs">2</span>
              </div>
              <div>
                <p className="text-sm text-gray-700">Transfere <strong>500 Kz</strong> para:</p>
                <button onClick={copyNumber} className="mt-1 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors">
                  <span className="text-lg font-bold text-gray-900">926 115 429</span>
                  <Copy size={14} className="text-gray-400" />
                  {copied && <span className="text-xs text-green-600">Copiado!</span>}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#EEF0FF] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#1A56FF] font-bold text-xs">3</span>
              </div>
              <p className="text-sm text-gray-700">Tira <strong>print/foto do comprovativo</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#EEF0FF] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#1A56FF] font-bold text-xs">4</span>
              </div>
              <p className="text-sm text-gray-700">Envia abaixo</p>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Upload size={18} className="text-[#1A56FF]" /> Enviar Comprovativo
          </h3>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Referência da transação (opcional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: 123456789"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1A56FF]/20 focus:border-[#1A56FF] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Comprovativo (imagem ou PDF)</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-[#1A56FF]/40 transition-colors">
              <input type="file" accept="image/*,.pdf" onChange={handleUploadProof} className="hidden" />
              {uploading ? (
                <span className="text-sm text-gray-500">A enviar...</span>
              ) : proofUrl ? (
                <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Comprovativo enviado</span>
              ) : (
                <span className="text-sm text-gray-400 flex items-center gap-1"><Upload size={16} /> Clica para enviar</span>
              )}
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!proofUrl || uploading}
            className="w-full bg-[#1A56FF] text-white py-3.5 rounded-xl font-medium text-sm disabled:opacity-50 hover:bg-[#1445DD] transition-colors"
          >
            Submeter Pagamento
          </button>
        </div>
      </div>
    </div>
  )
}
