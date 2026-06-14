import JobCard from './JobCard'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const featuredJobs = [
  {
    id: '1',
    titulo: 'Analista Financeiro Sénior',
    empresa_nome: 'Banco BAI',
    area: 'Economia e Finanças',
    localizacao: 'Luanda',
    salario: '450.000 Kz',
    prazo: '30 Jun 2025',
    nivel_minimo: 'Licenciatura',
    is_prioritaria: true,
    status: 'aberta',
  },
  {
    id: '2',
    titulo: 'Desenvolvedor Full-Stack',
    empresa_nome: 'Unitel',
    area: 'Tecnologia da Informação',
    localizacao: 'Luanda',
    salario: '380.000 Kz',
    prazo: '15 Jul 2025',
    nivel_minimo: 'Licenciatura',
    is_prioritaria: false,
    status: 'aberta',
  },
  {
    id: '3',
    titulo: 'Engenheiro de Petróleo Jr.',
    empresa_nome: 'Sonangol',
    area: 'Petróleo e Gás',
    localizacao: 'Cabinda',
    salario: '600.000 Kz',
    prazo: '20 Jul 2025',
    nivel_minimo: 'Licenciatura',
    is_prioritaria: true,
    status: 'aberta',
  },
  {
    id: '4',
    titulo: 'Gestor de Marketing Digital',
    empresa_nome: 'Africell',
    area: 'Marketing e Comunicação',
    localizacao: 'Luanda',
    salario: '300.000 Kz',
    prazo: '25 Jun 2025',
    nivel_minimo: 'Licenciatura',
    is_prioritaria: false,
    status: 'aberta',
  },
  {
    id: '5',
    titulo: 'Advogado Corporativo',
    empresa_nome: 'FBL Advogados',
    area: 'Direito',
    localizacao: 'Luanda',
    salario: '500.000 Kz',
    prazo: '10 Jul 2025',
    nivel_minimo: 'Mestrado',
    is_prioritaria: false,
    status: 'aberta',
  },
  {
    id: '6',
    titulo: 'Enfermeiro/a Chefe',
    empresa_nome: 'Clínica Sagrada Esperança',
    area: 'Saúde',
    localizacao: 'Luanda',
    salario: '280.000 Kz',
    prazo: '05 Jul 2025',
    nivel_minimo: 'Licenciatura',
    is_prioritaria: true,
    status: 'aberta',
  },
]

export default function FeaturedJobs() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="font-heading text-3xl font-bold text-k10-primary mb-2">Vagas Recentes</h2>
            <p className="text-gray-500">As melhores oportunidades do mercado angolano</p>
          </div>
          <Link href="/vagas/" className="hidden sm:flex items-center gap-1 text-k10-accent hover:underline font-medium text-sm">
            Ver todas <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredJobs.map((job) => (
            <JobCard key={job.id} {...job} />
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link href="/vagas/" className="btn-outline inline-flex items-center gap-2">
            Ver Todas as Vagas <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
