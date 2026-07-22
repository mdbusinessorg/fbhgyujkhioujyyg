import { supabase } from '@/lib/supabase'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export async function startOrRequestConversation(
  currentUserId: string,
  otherId: string,
  router: AppRouterInstance,
) {
  // 1. Conversa já existe?
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant_1_id.eq.${currentUserId},participant_2_id.eq.${otherId}),and(participant_1_id.eq.${otherId},participant_2_id.eq.${currentUserId})`)
    .maybeSingle()

  if (existing) {
    router.push(`/mensagens/?conv=${existing.id}`)
    return
  }

  // 2. Pedidos em ambas as direcções
  const { data: outgoing } = await supabase
    .from('message_requests')
    .select('id, status')
    .eq('requester_id', currentUserId)
    .eq('recipient_id', otherId)
    .maybeSingle()

  if (outgoing) {
    if (outgoing.status === 'pending') {
      alert('Já enviaste um pedido. Aguarda aceitação.')
      return
    }
    // accepted: criar conversa
    const { data: conv } = await supabase
      .from('conversations')
      .insert({ participant_1_id: currentUserId, participant_2_id: otherId })
      .select('id')
      .single()
    if (conv) router.push(`/mensagens/?conv=${conv.id}`)
    return
  }

  const { data: incoming } = await supabase
    .from('message_requests')
    .select('id, status')
    .eq('requester_id', otherId)
    .eq('recipient_id', currentUserId)
    .maybeSingle()

  if (incoming) {
    if (incoming.status === 'rejected') {
      alert('O utilizador recusou o contacto anteriormente.')
      return
    }
    // Aceitar automaticamente pedido entrante
    await supabase.from('message_requests').update({ status: 'accepted' }).eq('id', incoming.id)
    const { data: conv } = await supabase
      .from('conversations')
      .insert({ participant_1_id: currentUserId, participant_2_id: otherId })
      .select('id')
      .single()
    if (conv) router.push(`/mensagens/?conv=${conv.id}`)
    return
  }

  // 3. Criar novo pedido
  const { error } = await supabase
    .from('message_requests')
    .insert({ requester_id: currentUserId, recipient_id: otherId, status: 'pending' })

  if (error) {
    alert('Erro ao pedir contacto: ' + error.message)
  } else {
    alert('Pedido de mensagem enviado. Quando for aceite, poderás conversar.')
  }
}
