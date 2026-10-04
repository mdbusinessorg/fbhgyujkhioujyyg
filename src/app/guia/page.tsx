import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AppHeader from '@/components/AppHeader'

export default function GuiaPage() {
  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <div className="max-w-3xl mx-auto px-4 pt-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ms-gray hover:text-ms-blue"><ArrowLeft size={14} /> Voltar ao início</Link>
      </div>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-ms-dark mb-4">Guia de Utilização</h1>
        <div className="space-y-4 text-sm text-ms-gray">
          <p>Bem-vindo ao MÔ SALO! Aqui encontras as melhores oportunidades de emprego em Angola.</p>
          <h2 className="text-lg font-semibold text-ms-dark mt-6">Para Candidatos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cria a tua conta e completa o teu perfil</li>
            <li>Pesquisa vagas por área, localização ou empresa</li>
            <li>Candidata-te com um clique</li>
            <li>Acompanha o estado das tuas candidaturas</li>
          </ul>
          <h2 className="text-lg font-semibold text-ms-dark mt-6">Para Recrutadores</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Regista-te como recrutador e aguarda aprovação</li>
            <li>Publica vagas e gere candidatos</li>
            <li>Acede aos CVs dos candidatos</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
