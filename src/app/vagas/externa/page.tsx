'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, MapPin, Clock, Linkedin, Send } from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'
import Logo from '@/components/Logo'

function ExternaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = searchParams.get('id')
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!jobId) { setLoading(false); return }
      try {
        const res = await fetch(`/vagas-data/${encodeURIComponent(jobId)}.json`, { cache: 'no-store' })
        if (res.ok) setJob(await res.json())
      } catch {
        // ignore — handled by not-found state below
      }
      setLoading(false)
    }
    load()
  }, [jobId])

  const getTimeAgo = (date: string) => {
    if (!date) return ''
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days <= 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 30) return `Há ${days} dias`
    return new Date(date).toLocaleDateString('pt-PT')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-ms-gray mb-4">Vaga não encontrada</p>
          <Link href="/vagas/" className="text-ms-blue font-medium">← Voltar às vagas</Link>
        </div>
      </div>
    )
  }

  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title || '')}&location=Angola`

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Top Nav */}
      <header className="sticky top-0 bg-white border-b border-ms-border z-50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()}>
            <ArrowLeft size={20} className="text-ms-dark" />
          </button>
          <Logo variant="full" className="h-8 w-auto" />
          <button>
            <Heart size={20} className="text-ms-gray" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3">
            <CompanyLogo company={job.company} logoUrl={job.logo_url} size={56} rounded="rounded-2xl" className="border border-ms-border" />
          </div>
          <h1 className="text-xl font-bold text-ms-dark mb-1">{job.title}</h1>
          {job.company && <p className="text-sm text-ms-gray">{job.company}</p>}
          <div className="flex items-center justify-center gap-3 mt-2 flex-wrap text-sm text-ms-gray">
            {job.location && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {job.location}</span>}
            {job.posted_at && <span className="inline-flex items-center gap-1"><Clock size={14} /> {getTimeAgo(job.posted_at)}</span>}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {job.category && job.category !== 'Outro' && (
              <span className="text-[11px] px-3 py-1 rounded-full bg-ms-blue/10 text-ms-blue font-medium">{job.category}</span>
            )}
            {job.salary && (
              <span className="text-[11px] font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">{job.salary}</span>
            )}
          </div>
        </div>

        {job.description && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-ms-dark mb-2">Sobre a Vaga</h2>
            <div
              className="external-job-desc text-sm text-ms-gray leading-relaxed"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>
        )}

        <p className="text-[11px] text-ms-gray text-center mb-2">
          Vaga recolhida de fontes públicas. A candidatura é feita diretamente na fonte oficial.
        </p>
      </main>

      {/* Sticky bottom apply bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ms-border p-4 z-50">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-ms-blue text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Send size={16} /> Candidatar no site oficial
            </a>
          )}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${job.apply_url ? 'sm:flex-shrink-0' : 'flex-1'} border border-ms-border text-ms-dark font-semibold py-3 px-4 rounded-xl hover:bg-ms-surface transition-colors flex items-center justify-center gap-2`}
          >
            <Linkedin size={16} className="text-[#0A66C2]" /> Ver no LinkedIn
          </a>
        </div>
        {!job.apply_url && (
          <p className="text-[11px] text-ms-gray text-center mt-2">Link oficial indisponível — procura a vaga no LinkedIn.</p>
        )}
      </div>
    </div>
  )
}

export default function VagaExternaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <ExternaContent />
    </Suspense>
  )
}
