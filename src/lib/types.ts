export type UserRole = 'candidato' | 'recrutador' | 'admin'

export type JobStatus = 'aberta' | 'em_analise' | 'encerrada'

export type ApplicationStatus = 'enviada' | 'em_analise' | 'aprovada' | 'recusada'

export type SubscriptionPlan = 'trial' | 'premium' | 'recrutador'

export interface User {
  id: string
  email: string
  nome: string
  role: UserRole
  avatar_url?: string
  telefone?: string
  created_at: string
  aprovado: boolean
}

export interface Profile {
  id: string
  user_id: string
  area: string
  nivel_academico: string
  experiencias: string
  competencias: string[]
  score_completude: number
  bio?: string
  localizacao?: string
  documentos?: string[]
}

export interface Vaga {
  id: string
  recrutador_id: string
  empresa_nome: string
  titulo: string
  descricao: string
  area: string
  nivel_minimo: string
  experiencia_requerida: string
  salario?: string
  localizacao: string
  prazo: string
  status: JobStatus
  is_prioritaria: boolean
  created_at: string
  candidaturas_count?: number
  visualizacoes?: number
}

export interface Candidatura {
  id: string
  vaga_id: string
  candidato_id: string
  status: ApplicationStatus
  data_candidatura: string
  mensagem?: string
  vaga?: Vaga
  candidato?: User & { profile?: Profile }
}

export interface Subscription {
  id: string
  user_id: string
  plano: SubscriptionPlan
  valor: number
  status: 'ativa' | 'expirada' | 'pendente'
  data_inicio: string
  data_fim: string
}

export interface AdminStats {
  total_usuarios: number
  total_candidatos: number
  total_recrutadores: number
  total_vagas: number
  total_candidaturas: number
  recrutadores_pendentes: number
  subscricoes_ativas: number
}

export const AREAS = [
  'Economia e Finanças',
  'Engenharia',
  'Tecnologia da Informação',
  'Direito',
  'Saúde',
  'Educação',
  'Marketing e Comunicação',
  'Administração',
  'Petróleo e Gás',
  'Construção Civil',
  'Recursos Humanos',
  'Contabilidade e Auditoria',
  'Logística e Transportes',
  'Hotelaria e Turismo',
  'Agricultura',
  'Artes e Design',
]

export const NIVEIS_ACADEMICOS = [
  'Ensino Médio',
  'Técnico Profissional',
  'Licenciatura',
  'Mestrado',
  'Doutoramento',
]

export const PROVINCIAS_ANGOLA = [
  'Luanda',
  'Benguela',
  'Huambo',
  'Huíla',
  'Cabinda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Namibe',
  'Uíge',
  'Zaire',
  'Kwanza Norte',
  'Kwanza Sul',
  'Moxico',
  'Cuando Cubango',
  'Cunene',
  'Bié',
  'Bengo',
]
