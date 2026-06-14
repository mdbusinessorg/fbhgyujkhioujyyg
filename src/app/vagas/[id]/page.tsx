import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { MapPin, Clock, Briefcase, Star, DollarSign, ArrowLeft, GraduationCap, Building2, Send, FileText, CheckCircle } from 'lucide-react'

export function generateStaticParams() {
  return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((id) => ({ id }))
}

const jobsData: Record<string, {
  titulo: string; empresa_nome: string; area: string; localizacao: string;
  salario: string; prazo: string; nivel_minimo: string; is_prioritaria: boolean;
  descricao: string; requisitos: string[]; responsabilidades: string[];
  experiencia_requerida: string; tipo_contrato: string;
}> = {
  '1': {
    titulo: 'Analista Financeiro Sénior', empresa_nome: 'Banco BAI', area: 'Economia e Finanças',
    localizacao: 'Luanda', salario: '450.000 Kz', prazo: '30 Jun 2025', nivel_minimo: 'Licenciatura',
    is_prioritaria: true, tipo_contrato: 'Tempo Inteiro', experiencia_requerida: '3-5 anos',
    descricao: 'O Banco BAI procura um Analista Financeiro Sénior para integrar a equipa de análise e planeamento financeiro. O candidato será responsável pela elaboração de relatórios financeiros, análise de investimentos e apoio à tomada de decisão estratégica.',
    requisitos: ['Licenciatura em Economia, Finanças ou Gestão', 'Mínimo 3 anos de experiência em análise financeira', 'Domínio de Excel avançado e ferramentas de BI', 'Conhecimento de normativos do BNA', 'Capacidade analítica e atenção ao detalhe', 'Fluência em Português (Inglês é uma vantagem)'],
    responsabilidades: ['Elaborar relatórios financeiros mensais e trimestrais', 'Analisar indicadores de performance financeira', 'Apoiar na elaboração do orçamento anual', 'Monitorizar riscos financeiros e propor mitigações', 'Preparar apresentações para a administração'],
  },
  '2': {
    titulo: 'Desenvolvedor Full-Stack', empresa_nome: 'Unitel', area: 'Tecnologia da Informação',
    localizacao: 'Luanda', salario: '380.000 Kz', prazo: '15 Jul 2025', nivel_minimo: 'Licenciatura',
    is_prioritaria: false, tipo_contrato: 'Tempo Inteiro', experiencia_requerida: '2-4 anos',
    descricao: 'A Unitel procura um Desenvolvedor Full-Stack para trabalhar em projectos digitais inovadores. O candidato vai desenvolver e manter aplicações web e mobile que servem milhões de utilizadores angolanos.',
    requisitos: ['Licenciatura em Engenharia Informática ou similar', 'Experiência com React, Node.js e bases de dados SQL/NoSQL', 'Conhecimento de APIs REST e arquitetura de microserviços', 'Experiência com metodologias ágeis', 'Git e ferramentas de CI/CD'],
    responsabilidades: ['Desenvolver novas funcionalidades para aplicações web', 'Manter e optimizar código existente', 'Colaborar com designers e product managers', 'Participar em revisões de código', 'Documentar soluções técnicas'],
  },
  '3': {
    titulo: 'Engenheiro de Petróleo Jr.', empresa_nome: 'Sonangol', area: 'Petróleo e Gás',
    localizacao: 'Cabinda', salario: '600.000 Kz', prazo: '20 Jul 2025', nivel_minimo: 'Licenciatura',
    is_prioritaria: true, tipo_contrato: 'Tempo Inteiro', experiencia_requerida: '1-3 anos',
    descricao: 'A Sonangol está a recrutar um Engenheiro de Petróleo Júnior para a sua operação em Cabinda. O candidato participará em projectos de exploração e produção, trabalhando com equipas multidisciplinares.',
    requisitos: ['Licenciatura em Engenharia de Petróleo ou Geologia', 'Conhecimento de software de simulação de reservatórios', 'Disponibilidade para trabalhar em regime de rotação', 'Capacidade de trabalhar em equipa multicultural', 'Carta de condução'],
    responsabilidades: ['Apoiar na análise de dados de produção', 'Participar em operações de campo', 'Elaborar relatórios técnicos', 'Monitorizar indicadores de produção', 'Colaborar com equipas de engenharia sénior'],
  },
}

export default function VagaDetalhe({ params }: { params: { id: string } }) {
  const job = jobsData[params.id]

  if (!job) {
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
              Voltar às Vagas
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
        <div className="gradient-hero py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/vagas/" className="inline-flex items-center gap-1 text-gray-300 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft size={16} />
              Voltar às vagas
            </Link>
            <div className="flex items-start justify-between gap-4">
              <div>
                {job.is_prioritaria && (
                  <span className="badge bg-k10-gold/20 text-k10-gold mb-3 inline-flex items-center gap-1">
                    <Star size={12} fill="currentColor" />
                    Vaga em Destaque
                  </span>
                )}
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">{job.titulo}</h1>
                <div className="flex flex-wrap items-center gap-3 text-gray-300 text-sm">
                  <span className="flex items-center gap-1"><Building2 size={14} />{job.empresa_nome}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} />{job.localizacao}</span>
                  <span className="flex items-center gap-1"><Clock size={14} />Prazo: {job.prazo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h2 className="font-heading font-semibold text-lg mb-3">Descrição da Vaga</h2>
                <p className="text-gray-600 leading-relaxed">{job.descricao}</p>
              </div>

              <div className="card p-6">
                <h2 className="font-heading font-semibold text-lg mb-3">Responsabilidades</h2>
                <ul className="space-y-2">
                  {job.responsabilidades.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                      <CheckCircle size={16} className="text-k10-green mt-0.5 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-6">
                <h2 className="font-heading font-semibold text-lg mb-3">Requisitos</h2>
                <ul className="space-y-2">
                  {job.requisitos.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                      <FileText size={16} className="text-k10-accent mt-0.5 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="card p-5 space-y-4">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Salário</span>
                  <p className="font-semibold text-lg text-k10-primary flex items-center gap-1">
                    <DollarSign size={18} className="text-k10-green" />
                    {job.salario}/mês
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Área</span>
                  <p className="font-medium text-gray-700 flex items-center gap-1">
                    <Briefcase size={16} className="text-k10-accent" />
                    {job.area}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Formação Mínima</span>
                  <p className="font-medium text-gray-700 flex items-center gap-1">
                    <GraduationCap size={16} className="text-blue-500" />
                    {job.nivel_minimo}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Experiência</span>
                  <p className="font-medium text-gray-700">{job.experiencia_requerida}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Contrato</span>
                  <p className="font-medium text-gray-700">{job.tipo_contrato}</p>
                </div>
              </div>

              <Link href="/auth/registar/" className="btn-primary w-full flex items-center justify-center gap-2">
                <Send size={18} />
                Candidatar-me
              </Link>

              <div className="card p-4 bg-blue-50 border-blue-100">
                <h3 className="font-semibold text-sm text-blue-800 mb-2">Documentos necessários</h3>
                <ul className="text-xs text-blue-700 space-y-1">
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
