-- MÔ SALO — Funcionalidades sociais: pedidos de mensagem, publicações e likes
-- Executar no Supabase SQL Editor: https://supabase.com/dashboard/project/gwnjigmsuqasvotsksmk/sql/new
-- Correr DEPOIS de `fix-rls-policies.sql` (ou reexecutar tudo).

-- Função auxiliar já vem do fix-rls-policies.sql, mas deixamos aqui para segurança
CREATE OR REPLACE FUNCTION public.get_auth_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_id uuid;
BEGIN
  user_email := auth.jwt() ->> 'email';
  IF user_email IS NULL THEN
    RETURN auth.uid();
  END IF;
  SELECT id INTO user_id FROM public.users WHERE email = user_email LIMIT 1;
  RETURN COALESCE(user_id, auth.uid());
END;
$$;

-- ===================== TABELAS SOCIAIS =====================
CREATE TABLE IF NOT EXISTS message_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Activar RLS
ALTER TABLE message_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Garantir RLS em conversations e mensagens (caso ainda não tenha)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- ===================== MESSAGE REQUESTS =====================
DROP POLICY IF EXISTS "Message requests visíveis para envolvidos" ON message_requests;
DROP POLICY IF EXISTS "Message requests inseríveis pelo remetente" ON message_requests;
DROP POLICY IF EXISTS "Message requests aceitáveis pelo destinatário" ON message_requests;
DROP POLICY IF EXISTS "Message requests apagáveis pelos envolvidos" ON message_requests;

CREATE POLICY "Message requests visíveis para envolvidos" ON message_requests FOR SELECT USING (
  requester_id = public.get_auth_user_id() OR recipient_id = public.get_auth_user_id()
);
CREATE POLICY "Message requests inseríveis pelo remetente" ON message_requests FOR INSERT WITH CHECK (
  requester_id = public.get_auth_user_id()
);
CREATE POLICY "Message requests aceitáveis pelo destinatário" ON message_requests FOR UPDATE USING (
  recipient_id = public.get_auth_user_id() OR requester_id = public.get_auth_user_id()
);
CREATE POLICY "Message requests apagáveis pelos envolvidos" ON message_requests FOR DELETE USING (
  requester_id = public.get_auth_user_id() OR recipient_id = public.get_auth_user_id()
);

-- ===================== POSTS =====================
DROP POLICY IF EXISTS "Posts visíveis publicamente" ON posts;
DROP POLICY IF EXISTS "Posts inseríveis pelo autor" ON posts;
DROP POLICY IF EXISTS "Posts editáveis pelo autor" ON posts;
DROP POLICY IF EXISTS "Posts apagáveis pelo autor" ON posts;
DROP POLICY IF EXISTS "Posts apagáveis pelo admin" ON posts;

CREATE POLICY "Posts visíveis publicamente" ON posts FOR SELECT USING (true);
CREATE POLICY "Posts inseríveis pelo autor" ON posts FOR INSERT WITH CHECK (
  user_id = public.get_auth_user_id()
);
CREATE POLICY "Posts editáveis pelo autor" ON posts FOR UPDATE USING (
  user_id = public.get_auth_user_id() OR
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);
CREATE POLICY "Posts apagáveis pelo autor" ON posts FOR DELETE USING (
  user_id = public.get_auth_user_id() OR
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);

-- ===================== POST LIKES =====================
DROP POLICY IF EXISTS "Post likes visíveis para todos" ON post_likes;
DROP POLICY IF EXISTS "Post likes inseríveis pelo próprio" ON post_likes;
DROP POLICY IF EXISTS "Post likes apagáveis pelo próprio" ON post_likes;

CREATE POLICY "Post likes visíveis para todos" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Post likes inseríveis pelo próprio" ON post_likes FOR INSERT WITH CHECK (
  user_id = public.get_auth_user_id()
);
CREATE POLICY "Post likes apagáveis pelo próprio" ON post_likes FOR DELETE USING (
  user_id = public.get_auth_user_id()
);

-- ===================== CONVERSATIONS =====================
DROP POLICY IF EXISTS "Conversations visíveis para participantes" ON conversations;
DROP POLICY IF EXISTS "Conversations inseríveis por participantes" ON conversations;
DROP POLICY IF EXISTS "Conversations editáveis por participantes" ON conversations;
DROP POLICY IF EXISTS "Conversations apagáveis por participantes" ON conversations;

CREATE POLICY "Conversations visíveis para participantes" ON conversations FOR SELECT USING (
  participant_1_id = public.get_auth_user_id() OR participant_2_id = public.get_auth_user_id()
);
CREATE POLICY "Conversations inseríveis por participantes" ON conversations FOR INSERT WITH CHECK (
  participant_1_id = public.get_auth_user_id() OR participant_2_id = public.get_auth_user_id()
);
CREATE POLICY "Conversations editáveis por participantes" ON conversations FOR UPDATE USING (
  participant_1_id = public.get_auth_user_id() OR participant_2_id = public.get_auth_user_id()
);
CREATE POLICY "Conversations apagáveis por participantes" ON conversations FOR DELETE USING (
  participant_1_id = public.get_auth_user_id() OR participant_2_id = public.get_auth_user_id()
);

-- ===================== MENSAGENS (reforçado) =====================
DROP POLICY IF EXISTS "Mensagens visíveis para membros" ON mensagens;
DROP POLICY IF EXISTS "Users podem enviar mensagens" ON mensagens;
DROP POLICY IF EXISTS "Mensagens apagáveis pelos participantes" ON mensagens;

CREATE POLICY "Mensagens visíveis para membros" ON mensagens FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1_id = public.get_auth_user_id() OR participant_2_id = public.get_auth_user_id()
  )
);
CREATE POLICY "Users podem enviar mensagens" ON mensagens FOR INSERT WITH CHECK (
  user_id = public.get_auth_user_id() AND
  conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1_id = public.get_auth_user_id() OR participant_2_id = public.get_auth_user_id()
  )
);
CREATE POLICY "Mensagens apagáveis pelos participantes" ON mensagens FOR DELETE USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1_id = public.get_auth_user_id() OR participant_2_id = public.get_auth_user_id()
  )
);
