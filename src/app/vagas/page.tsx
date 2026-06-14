'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import JobCard from '@/components/JobCard'
import { Search, SlidersHorizontal, MapPin, Briefcase } from 'lucide-react'
import { AREAS, NIVEIS_ACADEMICOS, PROVINCIAS_ANGOLA } from '@/lib/types'

const allJobs = [
  { id: '1', titulo: 'Analista Financeiro Sénior', empresa_nome: 'Banco BAI', area: 'Economia e Finanças', localizacao: 'Luanda', salario: '450.000 Kz', prazo: '30 Jun 2025', nivel_minimo: 'Licenciatura', is_prioritaria: true, status: 'aberta' },
  { id: '2', titulo: 'Desenvolvedor Full-Stack', empresa_nome: 'Unitel', area: 'Tecnologia da Informação', localizacao: 'Luanda', salario: '380.000 Kz', prazo: '15 Jul 2025', nivel_minimo: 'Licenciatura', is_prioritaria: false, status: 'aberta' },
  { id: '3', titulo: 'Engenheiro de Petróleo Jr.', empresa_nome: 'Sonangol', area: 'Petróleo e Gás', localizacao: 'Cabinda', salario: '600.000 Kz', prazo: '20 Jul 2025', nivel_minimo: 'Licenciatura', is_prioritaria: true, status: 'aberta' },
  { id: '4', titulo: 'Gestor de Marketing Digital', empresa_nome: 'Africell', area: 'Marketing e Comunicação', localizacao: 'Luanda', salario: '300.000 Kz', prazo: '25 Jun 2025', nivel_minimo: 'Licenciatura', is_prioritaria: false, status: 'aberta' },
  { id: '5', titulo: 'Advogado Corporativo', empresa_nome: 'FBL Advogados', area: 'Direito', localizacao: 'Luanda', salario: '500.000 Kz', prazo: '10 Jul 2025', nivel_minimo: 'Mestrado', is_prioritaria: false, status: 'aberta' },
  { id: '6', titulo: 'Enfermeiro/a Chefe', empresa_nome: 'Clínica Sagrada Esperança', area: 'Saúde', localizacao: 'Luanda', salario: '280.000 Kz', prazo: '05 Jul 2025', nivel_minimo: 'Licenciatura', is_prioritaria: true, status: 'aberta' },
  { id: '7', titulo: 'Contador Certificado', empresa_nome: 'Ernst & Young Angola', area: 'Contabilidade e Auditoria', localizacao: 'Luanda', salario: '420.000 Kz', prazo: '28 Jun 2025', nivel_minimo: 'Licenciatura', is_prioritaria: false, status: 'aberta' },
  { id: '8', titulo: 'Engenheiro Civil de Obra', empresa_nome: 'Odebrecht Angola', area: 'Construção Civil', localizacao: 'Benguela', salario: '550.000 Kz', prazo: '18 Jul 2025', nivel_minimo: 'Licenciatura', is_prioritaria: false, status: 'aberta' },
  { id: '9', titulo: 'Gestor de Recursos Humanos', empresa_nome: 'Angola Telecom', area: 'Recursos Humanos', localizacao: 'Luanda', salario: '350.000 Kz', prazo: '12 Jul 2025', nivel_minimo: 'Licenciatura', is_prioritaria: false, status: 'aberta' },
  { id: '10', titulo: 'Professor de Matemática', empresa_nome: 'Colégio Pitágoras', area: 'Educação', localizacao: 'Huambo', salario: '200.000 Kz', prazo: '30 Jun 2025', nivel_minimo: 'Licenciatura', is_prioritaria: false, status: 'aberta' },
  { id: '11', titulo: 'Designer Gráfico Sénior', empresa_nome: 'Creative Studio AO', area: 'Artes e Design', localizacao: 'Luanda', salario: '250.000 Kz', prazo: '22 Jul 2025', nivel_minimo: 'Licenciatura', is_prioritaria: false, status: 'aberta' },
  { id: '12', titulo: 'Técnico de Logística', empresa_nome: 'Maersk Angola', area: 'Logística e Transportes', localizacao: 'Luanda', salario: '320.000 Kz', prazo: '08 Jul 2025', nivel_minimo: 'Técnico Profissional', is_prioritaria: true, status: 'aberta' },
]

export default function VagasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedProvincia, setSelectedProvincia] = useState('')
  const [selectedNivel, setSelectedNivel] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredJobs = allJobs.filter((job) => {
    const matchesSearch = job.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesArea = !selectedArea || job.area === selectedArea
    const matchesProvincia = !selectedProvincia || job.localizacao === selectedProvincia
    const matchesNivel = !selectedNivel || job.nivel_minimo === selectedNivel
    return matchesSearch && matchesArea && matchesProvincia && matchesNivel
  }).sort((a, b) => (b.is_prioritaria ? 1 : 0) - (a.is_prioritaria ? 1 : 0))

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="gradient-hero py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-heading text-3xl font-bold text-white mb-2">Encontra a Tua Vaga</h1>
            <p className="text-gray-300 mb-6">Pesquisa entre centenas de oportunidades em Angola</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cargo, empresa ou palavra-chave..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:border-white/40 focus:ring-2 focus:ring-white/10 outline-none"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white py-3 px-5 rounded-xl hover:bg-white/20 transition-all"
              >
                <SlidersHorizontal size={18} />
                Filtros
              </button>
            </div>

            {showFilters && (
              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white appearance-none cursor-pointer"
                  >
                    <option value="" className="text-gray-900">Todas as áreas</option>
                    {AREAS.map((a) => (
                      <option key={a} value={a} className="text-gray-900">{a}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedProvincia}
                    onChange={(e) => setSelectedProvincia(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white appearance-none cursor-pointer"
                  >
                    <option value="" className="text-gray-900">Todas as províncias</option>
                    {PROVINCIAS_ANGOLA.map((p) => (
                      <option key={p} value={p} className="text-gray-900">{p}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={selectedNivel}
                  onChange={(e) => setSelectedNivel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white appearance-none cursor-pointer"
                >
                  <option value="" className="text-gray-900">Todos os níveis</option>
                  {NIVEIS_ACADEMICOS.map((n) => (
                    <option key={n} value={n} className="text-gray-900">{n}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-500 text-sm">{filteredJobs.length} vaga{filteredJobs.length !== 1 ? 's' : ''} encontrada{filteredJobs.length !== 1 ? 's' : ''}</p>
            {(selectedArea || selectedProvincia || selectedNivel) && (
              <button
                onClick={() => { setSelectedArea(''); setSelectedProvincia(''); setSelectedNivel('') }}
                className="text-k10-accent text-sm hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-16">
              <Search size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="font-heading text-lg font-semibold text-gray-600 mb-2">Nenhuma vaga encontrada</h3>
              <p className="text-gray-400 text-sm">Tenta ajustar os filtros ou pesquisar por outros termos</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
