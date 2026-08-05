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
      <div className={`card p-5 hover:-translate-y-1 cursor-pointer relative group shadow-ios-sm hover:shadow-ios ${is_prioritaria ? 'border-ms-blue/20 bg-ms-purple-light/50' : ''}`}>
        {is_prioritaria && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-ms-blue/10 text-ms-blue flex items-center gap-1">
              <Star size={10} fill="currentColor" />
              Destaque
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-ms-gray/70 mb-3">
          <Clock size={12} />
          <span>{prazo}</span>
          <span className="mx-1">•</span>
          <span>{nivel_minimo}</span>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-ms-purple-light flex items-center justify-center flex-shrink-0">
            <Building size={20} className="text-ms-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ms-gray text-xs mb-0.5">{empresa_nome}</p>
            <h3 className="font-semibold text-ms-dark text-sm leading-snug">{titulo}</h3>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-ms-gray/70">
            <MapPin size={12} />
            {localizacao}
          </div>
          {salario && (
            <span className="text-ms-blue font-semibold text-sm">{salario}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-ms-border/50">
          <span className="badge bg-ms-surface text-ms-blue text-xs">{area}</span>
          <span className="text-ms-blue text-xs font-semibold group-hover:underline">Candidatar →</span>
        </div>
      </div>
    </Link>
  )
}
