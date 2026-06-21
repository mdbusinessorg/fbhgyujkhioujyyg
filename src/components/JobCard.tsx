import Link from 'next/link'
import { MapPin, Clock, Briefcase, Star, Building } from 'lucide-react'

interface JobCardProps {
  id: string
  titulo: string
  empresa_nome: string
  area: string
  localizacao: string
  salario?: string
  prazo: string
  nivel_minimo: string
  is_prioritaria: boolean
  status: string
}

export default function JobCard({
  id,
  titulo,
  empresa_nome,
  area,
  localizacao,
  salario,
  prazo,
  nivel_minimo,
  is_prioritaria,
}: JobCardProps) {
  return (
    <Link href={`/vagas/detalhe/?id=${id}`}>
      <div className={`card p-5 hover:-translate-y-1 cursor-pointer relative group ${is_prioritaria ? 'border-indigo-200 border-2 bg-indigo-50/30' : ''}`}>
        {is_prioritaria && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-indigo-100 text-indigo-700 flex items-center gap-1">
              <Star size={10} fill="currentColor" />
              Destaque
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <Clock size={12} />
          <span>{prazo}</span>
          <span className="mx-1">•</span>
          <span>{nivel_minimo}</span>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
            <Building size={20} className="text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs mb-0.5">{empresa_nome}</p>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{titulo}</h3>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={12} />
            {localizacao}
          </div>
          {salario && (
            <span className="text-indigo-600 font-semibold text-sm">{salario}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <span className="badge bg-indigo-50 text-indigo-600 text-xs">{area}</span>
          <span className="text-indigo-600 text-xs font-medium group-hover:underline">Candidatar →</span>
        </div>
      </div>
    </Link>
  )
}
