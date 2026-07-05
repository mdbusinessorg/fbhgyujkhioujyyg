import { redirect } from 'next/navigation'

export function generateStaticParams() {
  return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((id) => ({ id }))
}

export default function VagaIdPage({ params }: { params: { id: string } }) {
  redirect(`/vagas/detalhe/?id=${params.id}`)
}
