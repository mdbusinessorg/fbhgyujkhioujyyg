-- K10 Opportunities — Esquema da Base de Dados (Supabase/PostgreSQL)
-- Executar este SQL no Supabase SQL Editor para criar todas as tabelas

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

-- RLS (Row Level Security) básico
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública para vagas
CREATE POLICY "Vagas visíveis publicamente" ON vagas FOR SELECT USING (true);

-- Políticas de leitura para utilizadores autenticados
CREATE POLICY "Users podem ver o próprio perfil" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users podem editar o próprio perfil" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles visíveis para o próprio" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Profiles editáveis pelo próprio" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Profiles inseríveis pelo próprio" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidaturas visíveis para o candidato" ON candidaturas FOR SELECT USING (auth.uid() = candidato_id);
CREATE POLICY "Candidaturas inseríveis pelo candidato" ON candidaturas FOR INSERT WITH CHECK (auth.uid() = candidato_id);

CREATE POLICY "Subscriptions visíveis para o próprio" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
