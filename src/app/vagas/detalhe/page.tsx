'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ApplicationForm from '@/components/ApplicationForm'
import { supabase } from '@/lib/supabase'
import { MapPin, Clock, Briefcase, Star, DollarSign, ArrowLeft, GraduationCap, Building2, FileText, CheckCircle } from 'lucide-react'

interface VagaDetail {
  id: string
  titulo: string
  empresa_nome: string
  area: string
  localizacao: string
  salario: string
  prazo: string
  nivel_minimo: string
  is_prioritaria: boolean
  descricao: string
  experiencia_requerida: string
  status: string
}

export default function VagaDetalhePage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-k10-accent border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    }>
      <VagaDetalheContent />
    </Suspense>
  )
}

function VagaDetalheContent() {
  const searchParams = useSearchParams()
  const vagaId = searchParams.get('id')
  const [vaga, setVaga] = useState<VagaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (vagaId) {
      loadVaga(vagaId)
    } else {
      setNotFound(true)
      setLoading(false)
    }
  }, [vagaId])

  const loadVaga = async (id: string) => {
    const { data, error } = await supabase
      .from('vagas')
      .select('*')
      .eq('id', id)
      .single()

    if (data && !error) {
      setVaga(data)
    } else {
      setNotFound(true)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-k10-accent border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    )
  }

  if (notFound || !vaga) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-gray-600 mb-2">Vaga não encontrada</h2>
            <p className="text-gray-400 mb-4">Esta vaga pode ter sido removida ou encerrada.</p>
            <Link href="/vagas/" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft size={16} />
              Ver Todas as Vagas
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/vagas/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-k10-accent transition-colors text-sm mb-6">
            <ArrowLeft size={16} />
            Voltar às Vagas
          </Link>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-k10-accent/10 flex items-center justify-center">
                      <Building2 size={28} className="text-k10-accent" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">{vaga.empresa_nome}</p>
                      <h1 className="font-heading text-xl font-bold text-k10-primary">{vaga.titulo}</h1>
                    </div>
                  </div>
                  {vaga.is_prioritaria && (
                    <span className="badge bg-k10-accent/10 text-k10-accent flex items-center gap-1">
                      <Star size={12} fill="currentColor" />
                      Destaque
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    {vaga.localizacao}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap size={14} className="text-gray-400" />
                    {vaga.nivel_minimo}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400" />
                    {vaga.prazo}
                  </div>
                  {vaga.salario && (
                    <div className="flex items-center gap-2 text-sm text-k10-accent font-medium">
                      <DollarSign size={14} />
                      {vaga.salario}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h2 className="font-heading font-semibold text-gray-800 mb-2">Descrição</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{vaga.descricao}</p>
                </div>

                {vaga.experiencia_requerida && (
                  <div className="border-t pt-4 mt-4">
                    <h2 className="font-heading font-semibold text-gray-800 mb-2">Experiência Requerida</h2>
                    <p className="text-gray-600 text-sm">{vaga.experiencia_requerida}</p>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Briefcase size={14} />
                    <span>Área: {vaga.area}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <ApplicationForm vagaId={vaga.id} vagaTitulo={vaga.titulo} />

              <div className="card p-5">
                <h3 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <FileText size={14} />
                  Documentos Necessários
                </h3>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  <li>- Curriculum Vitae actualizado</li>
                  <li>- Cópia do diploma ou certificado</li>
                  <li>- Bilhete de Identidade</li>
                  <li>- Carta de motivação (recomendado)</li>
                </ul>
                <Link href="/guia/" className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium">
                  Ver Guia Completo do Candidato →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
