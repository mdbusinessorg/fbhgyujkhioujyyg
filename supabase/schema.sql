-- K10 Opportunities — Esquema da Base de Dados (Supabase/PostgreSQL)
-- Executar este SQL no Supabase SQL Editor para criar todas as tabelas
-- Se já existirem tabelas de execuções anteriores, este script é seguro (usa IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  nome text NOT NULL,
  role text NOT NULL CHECK (role IN ('candidato', 'recrutador', 'admin')),
  avatar_url text,
  telefone text,
  aprovado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  area text DEFAULT '',
  nivel_academico text DEFAULT '',
  experiencias text DEFAULT '',
  competencias text[] DEFAULT '{}',
  score_completude integer DEFAULT 0,
  bio text,
  localizacao text,
  documentos text[]
);

CREATE TABLE IF NOT EXISTS vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recrutador_id uuid REFERENCES users(id) ON DELETE CASCADE,
  empresa_nome text NOT NULL,
  titulo text NOT NULL,
  descricao text NOT NULL,
  area text NOT NULL,
  nivel_minimo text NOT NULL,
  experiencia_requerida text,
  salario text,
  localizacao text NOT NULL,
  prazo text NOT NULL,
  status text DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_analise', 'encerrada')),
  is_prioritaria boolean DEFAULT false,
  visualizacoes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id uuid REFERENCES vagas(id) ON DELETE CASCADE,
  candidato_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'enviada' CHECK (status IN ('enviada', 'em_analise', 'aprovada', 'recusada')),
  mensagem text,
  data_candidatura timestamptz DEFAULT now(),
  UNIQUE(vaga_id, candidato_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plano text NOT NULL CHECK (plano IN ('trial', 'premium', 'recrutador')),
  valor integer DEFAULT 0,
  status text DEFAULT 'pendente' CHECK (status IN ('ativa', 'expirada', 'pendente')),
  data_inicio timestamptz DEFAULT now(),
  data_fim timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS cupoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('percentagem', 'valor_fixo', 'trial_estendido')),
  valor integer NOT NULL,
  validade timestamptz NOT NULL,
  usos_maximos integer DEFAULT 100,
  usos_actuais integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  area text NOT NULL,
  nivel_academico text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid REFERENCES grupos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar o admin principal
-- NOTA: este registo terá um uuid gerado pelo banco. O Supabase Auth gera um uuid
-- diferente para o mesmo email. A função get_auth_user_id() resolve essa diferença
-- nas políticas RLS, mapeando o email do JWT para o id da tabela public.users.
INSERT INTO users (email, nome, role, aprovado)
VALUES ('matiasdomingos158@gmail.com', 'Administrador K10', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Activar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: devolve o id da tabela public.users correspondente ao
-- utilizador autenticado, baseado no email do JWT. Assim as políticas RLS
-- funcionam mesmo quando o id da tabela public.users não coincide com auth.uid().
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

-- ===================== USERS =====================
-- SELECT: qualquer pessoa pode consultar (necessário para trabalho-rapido e listagens públicas)
CREATE POLICY "Users visíveis publicamente" ON users FOR SELECT USING (true);
-- UPDATE: próprio utilizador ou admin
CREATE POLICY "Users podem editar o próprio" ON users FOR UPDATE USING (id = public.get_auth_user_id());
CREATE POLICY "Admin pode editar qualquer user" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);
-- INSERT: permitido durante registo; a aplicação insere o id do auth.user
CREATE POLICY "Users inseríveis durante registo" ON users FOR INSERT WITH CHECK (true);
-- DELETE: apenas admin
CREATE POLICY "Admin pode apagar users" ON users FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);

-- ===================== PROFILES =====================
CREATE POLICY "Profiles visíveis para autenticados" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Profiles editáveis pelo próprio" ON profiles FOR UPDATE USING (user_id = public.get_auth_user_id());
CREATE POLICY "Profiles inseríveis pelo próprio" ON profiles FOR INSERT WITH CHECK (user_id = public.get_auth_user_id());
CREATE POLICY "Profiles apagáveis pelo próprio" ON profiles FOR DELETE USING (user_id = public.get_auth_user_id());

-- ===================== VAGAS =====================
-- Vagas visíveis publicamente (mesmo sem login)
CREATE POLICY "Vagas visíveis publicamente" ON vagas FOR SELECT USING (true);
-- Recrutadores aprovados podem criar vagas
CREATE POLICY "Recrutadores podem criar vagas" ON vagas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'recrutador' AND aprovado = true)
);
-- Recrutador pode editar as suas vagas
CREATE POLICY "Recrutadores podem editar vagas próprias" ON vagas FOR UPDATE USING (recrutador_id = public.get_auth_user_id());
-- Admin pode editar qualquer vaga
CREATE POLICY "Admin pode editar vagas" ON vagas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);
-- Admin pode apagar vagas
CREATE POLICY "Admin pode apagar vagas" ON vagas FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);

-- ===================== CANDIDATURAS =====================
CREATE POLICY "Candidaturas visíveis para candidato" ON candidaturas FOR SELECT USING (candidato_id = public.get_auth_user_id());
-- Recrutadores vêem candidaturas das suas vagas
CREATE POLICY "Recrutadores vêem candidaturas" ON candidaturas FOR SELECT USING (
  EXISTS (SELECT 1 FROM vagas WHERE vagas.id = candidaturas.vaga_id AND vagas.recrutador_id = public.get_auth_user_id())
);
-- Admin vê todas
CREATE POLICY "Admin vê todas candidaturas" ON candidaturas FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);
CREATE POLICY "Candidatos podem candidatar-se" ON candidaturas FOR INSERT WITH CHECK (candidato_id = public.get_auth_user_id());
-- Recrutadores podem atualizar status
CREATE POLICY "Recrutadores atualizam candidaturas" ON candidaturas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM vagas WHERE vagas.id = candidaturas.vaga_id AND vagas.recrutador_id = public.get_auth_user_id())
);
-- Admin pode atualizar qualquer candidatura
CREATE POLICY "Admin atualiza candidaturas" ON candidaturas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);

-- ===================== SUBSCRIPTIONS =====================
CREATE POLICY "Subscriptions visíveis para próprio" ON subscriptions FOR SELECT USING (user_id = public.get_auth_user_id());
CREATE POLICY "Admin vê todas subscriptions" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);
CREATE POLICY "Subscriptions inseríveis" ON subscriptions FOR INSERT WITH CHECK (user_id = public.get_auth_user_id());
CREATE POLICY "Admin pode editar subscriptions" ON subscriptions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);

-- ===================== CUPOES =====================
CREATE POLICY "Cupoes visíveis" ON cupoes FOR SELECT USING (true);
CREATE POLICY "Admin gere cupoes" ON cupoes FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);

-- ===================== GRUPOS =====================
CREATE POLICY "Grupos visíveis" ON grupos FOR SELECT USING (true);
CREATE POLICY "Admin gere grupos" ON grupos FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = public.get_auth_user_id() AND role = 'admin')
);

-- ===================== MENSAGENS =====================
CREATE POLICY "Mensagens visíveis para membros" ON mensagens FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users podem enviar mensagens" ON mensagens FOR INSERT WITH CHECK (user_id = public.get_auth_user_id());
