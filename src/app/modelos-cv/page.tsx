import type { Metadata } from 'next'
import CvBuilder from '@/components/CvBuilder'

export const metadata: Metadata = {
  title: 'Modelos de CV — MÔ SALO',
  description: 'Gera o teu CV em Word ou PDF a partir do perfil. Modelos profissionais e compatíveis com ATS.',
}

export default function ModelosCvPage() {
  return <CvBuilder />
}
