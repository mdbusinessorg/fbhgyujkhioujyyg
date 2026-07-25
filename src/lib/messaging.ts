import { supabase } from '@/lib/supabase'
import { social } from '@/lib/social'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

async function findOrCreateConversation(userId1: string, userId2: string) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant_1_id.eq.${userId1},participant_2_id.eq.${userId2}),and(participant_1_id.eq.${userId2},participant_2_id.eq.${userId1})`)
    .maybeSingle()

  if (existing) return existing

  const { data: conv } = await supabase
    .from('conversations')
    .insert({ participant_1_id: userId1, participant_2_id: userId2 })
    .select('id')
    .single()

  return conv
}

export async function startOrRequestConversation(
  currentUserId: string,
  otherId: string,
  router: AppRouterInstance,
) {
  const existingConv = await findOrCreateConversation(currentUserId, otherId)
  if (existingConv) {
    router.push(`/mensagens/?conv=${existingConv.id}`)
    return
  }

  const connection = await social.getConnectionBetween(currentUserId, otherId)

  if (connection) {
    if (connection.status === 'pending') {
      if (connection.requester_id === currentUserId) {
        alert('Já enviaste um pedido de network. Aguarda aceitação.')
        return
      }
      try {
        const result = await social.updateConnection(connection.id, 'accepted')
        const conv = await findOrCreateConversation(currentUserId, otherId)
        if (conv) router.push(`/mensagens/?conv=${conv.id}`)
        if (result.conversation_id) router.push(`/mensagens/?conv=${result.conversation_id}`)
      } catch {}
      return
    }

    if (connection.status === 'rejected') {
      alert('O utilizador recusou o teu pedido de network anteriormente.')
      return
    }

    const conv = await findOrCreateConversation(currentUserId, otherId)
    if (conv) router.push(`/mensagens/?conv=${conv.id}`)
    return
  }

  try {
    const { data: u } = await supabase
      .from('users')
      .select('id, nome, avatar_url, role')
      .eq('id', currentUserId)
      .single()

    await social.createConnection({
      requester_id: currentUserId,
      recipient_id: otherId,
      requester: u || { id: currentUserId, nome: 'Utilizador', role: 'candidato' },
    })
    alert('Pedido de network enviado. Quando for aceite, poderás conversar.')
  } catch (err: any) {
    alert('Erro ao enviar pedido de network: ' + (err.message || 'tenta de novo'))
  }
}
