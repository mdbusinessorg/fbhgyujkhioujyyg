import Link from 'next/link'
import { MapPin, Clock, Briefcase, Star, DollarSign } from 'lucide-react'

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
    <Link href={`/vagas/${id}/`}>
      <div className={`card p-5 hover:-translate-y-1 cursor-pointer relative ${is_prioritaria ? 'border-k10-gold border-2 shadow-k10-gold/20' : ''}`}>
        {is_prioritaria && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-k10-gold/10 text-k10-gold flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              Destaque
            </span>
          </div>
        )}
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-k10-primary/5 flex items-center justify-center flex-shrink-0">
            <Briefcase size={22} className="text-k10-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 truncate">{titulo}</h3>
            <p className="text-gray-500 text-sm mb-3">{empresa_nome}</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="badge-info">{area}</span>
              <span className="badge bg-gray-100 text-gray-600">{nivel_minimo}</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {localizacao}
              </span>
              {salario && (
                <span className="flex items-center gap-1">
                  <DollarSign size={12} />
                  {salario}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {prazo}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
