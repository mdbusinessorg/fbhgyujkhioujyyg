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

-- ===================== USERS =====================
-- Todos autenticados podem ver users (para navbar, listagens)
CREATE POLICY "Users visíveis para autenticados" ON users FOR SELECT USING (true);
-- Users podem editar o próprio perfil
CREATE POLICY "Users podem editar o próprio" ON users FOR UPDATE USING (auth.uid() = id);
-- Permitir inserir user durante registo (service role ou próprio)
CREATE POLICY "Users inseríveis durante registo" ON users FOR INSERT WITH CHECK (true);
-- Admin pode apagar users
CREATE POLICY "Admin pode apagar users" ON users FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ===================== PROFILES =====================
CREATE POLICY "Profiles visíveis para autenticados" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles editáveis pelo próprio" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Profiles inseríveis" ON profiles FOR INSERT WITH CHECK (true);

-- ===================== VAGAS =====================
-- Vagas visíveis publicamente (mesmo sem login)
CREATE POLICY "Vagas visíveis publicamente" ON vagas FOR SELECT USING (true);
-- Recrutadores aprovados podem criar vagas
CREATE POLICY "Recrutadores podem criar vagas" ON vagas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'recrutador' AND aprovado = true)
);
-- Recrutador pode editar as suas vagas
CREATE POLICY "Recrutadores podem editar vagas próprias" ON vagas FOR UPDATE USING (recrutador_id = auth.uid());
-- Admin pode editar qualquer vaga
CREATE POLICY "Admin pode editar vagas" ON vagas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ===================== CANDIDATURAS =====================
CREATE POLICY "Candidaturas visíveis para candidato" ON candidaturas FOR SELECT USING (auth.uid() = candidato_id);
-- Recrutadores vêem candidaturas das suas vagas
CREATE POLICY "Recrutadores vêem candidaturas" ON candidaturas FOR SELECT USING (
  EXISTS (SELECT 1 FROM vagas WHERE vagas.id = candidaturas.vaga_id AND vagas.recrutador_id = auth.uid())
);
-- Admin vê todas
CREATE POLICY "Admin vê todas candidaturas" ON candidaturas FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Candidatos podem candidatar-se" ON candidaturas FOR INSERT WITH CHECK (auth.uid() = candidato_id);
-- Recrutadores podem atualizar status
CREATE POLICY "Recrutadores atualizam candidaturas" ON candidaturas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM vagas WHERE vagas.id = candidaturas.vaga_id AND vagas.recrutador_id = auth.uid())
);

-- ===================== SUBSCRIPTIONS =====================
CREATE POLICY "Subscriptions visíveis para próprio" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Admin vê todas
CREATE POLICY "Admin vê todas subscriptions" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Subscriptions inseríveis" ON subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin pode editar subscriptions" ON subscriptions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ===================== CUPOES =====================
CREATE POLICY "Cupoes visíveis" ON cupoes FOR SELECT USING (true);
CREATE POLICY "Admin gere cupoes" ON cupoes FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ===================== GRUPOS =====================
CREATE POLICY "Grupos visíveis" ON grupos FOR SELECT USING (true);
CREATE POLICY "Admin gere grupos" ON grupos FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ===================== MENSAGENS =====================
CREATE POLICY "Mensagens visíveis para membros" ON mensagens FOR SELECT USING (true);
CREATE POLICY "Users podem enviar mensagens" ON mensagens FOR INSERT WITH CHECK (auth.uid() = user_id);
