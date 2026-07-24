import {
  Briefcase,
  Monitor,
  Stethoscope,
  Scale,
  Banknote,
  GraduationCap,
  Wrench,
  HardHat,
  Megaphone,
  Truck,
  Utensils,
  ChefHat,
  Phone,
  Hammer,
  Zap,
  BarChart3,
} from 'lucide-react'

const normalize = (text?: string | null) => (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function getAreaIcon(area?: string | null) {
  const t = normalize(area)
  if (t.includes('ti') || t.includes('tecnologia') || t.includes('informatica') || t.includes('software') || t.includes('programador') || t.includes('developer') || t.includes('web') || t.includes('digital')) return Monitor
  if (t.includes('saude') || t.includes('medico') || t.includes('enfermagem') || t.includes('farmacia') || t.includes('clinica') || t.includes('biomedico')) return Stethoscope
  if (t.includes('direito') || t.includes('advogad') || t.includes('juridic') || t.includes('legal')) return Scale
  if (t.includes('financas') || t.includes('contabili') || t.includes('banc') || t.includes('economia') || t.includes('gestao') || t.includes('administracao')) return Banknote
  if (t.includes('educacao') || t.includes('professor') || t.includes('ensino') || t.includes('pedagogia')) return GraduationCap
  if (t.includes('engenharia') || t.includes('mecanico') || t.includes('electr') || t.includes('mecanica') || t.includes('tecnico')) return Wrench
  if (t.includes('construcao') || t.includes('obra') || t.includes('civil') || t.includes('arquitecto') || t.includes('pedreiro')) return HardHat
  if (t.includes('marketing') || t.includes('comunicacao') || t.includes('publicidade') || t.includes('social media')) return Megaphone
  if (t.includes('logistica') || t.includes('transporte') || t.includes('motorista') || t.includes('armazem')) return Truck
  if (t.includes('hotelaria') || t.includes('restauracao') || t.includes('cozinha') || t.includes('chef') || t.includes('camareira')) return ChefHat
  if (t.includes('call center') || t.includes('atendimento') || t.includes('secretariado') || t.includes('recepcao')) return Phone
  if (t.includes('comercial') || t.includes('vendas') || t.includes('negocios')) return BarChart3
  if (t.includes('eletricista') || t.includes('energia') || t.includes('electric')) return Zap
  if (t.includes('marceneiro') || t.includes('carpinteiro') || t.includes('serralheiro')) return Hammer
  return Briefcase
}

export function AreaIcon({ area, size = 12, className = '' }: { area?: string | null; size?: number; className?: string }) {
  const Icon = getAreaIcon(area)
  return <Icon size={size} className={className} />
}
