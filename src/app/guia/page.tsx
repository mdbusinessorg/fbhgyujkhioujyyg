import Link from 'next/link'
import { ArrowLeft, Briefcase } from 'lucide-react'

export default function GuiaPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-ms-border z-50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/"><ArrowLeft size={20} className="text-ms-dark" /></Link>
          <span className="font-bold text-lg text-ms-blue">MÔ SALO</span>
          <div className="w-5" />
        </div>
      </header>
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
