-- K10 Opportunities — CORRECÇÃO DE POLÍTICAS RLS
-- Executar no Supabase SQL Editor: https://supabase.com/dashboard/project/gwnjigmsuqasvotsksmk/sql/new
-- Este script corrige as políticas para permitir registo, login e acesso admin

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Vagas visíveis publicamente" ON vagas;
DROP POLICY IF EXISTS "Users podem ver o próprio perfil" ON users;
DROP POLICY IF EXISTS "Users podem editar o próprio perfil" ON users;
DROP POLICY IF EXISTS "Profiles visíveis para o próprio" ON profiles;
DROP POLICY IF EXISTS "Profiles editáveis pelo próprio" ON profiles;
DROP POLICY IF EXISTS "Profiles inseríveis pelo próprio" ON profiles;
DROP POLICY IF EXISTS "Candidaturas visíveis para o candidato" ON candidaturas;
DROP POLICY IF EXISTS "Candidaturas inseríveis pelo candidato" ON candidaturas;
DROP POLICY IF EXISTS "Subscriptions visíveis para o próprio" ON subscriptions;

-- Remover novas políticas (caso já existam de tentativa anterior)
DROP POLICY IF EXISTS "Users visíveis para autenticados" ON users;
DROP POLICY IF EXISTS "Users podem editar o próprio" ON users;
DROP POLICY IF EXISTS "Users inseríveis durante registo" ON users;
DROP POLICY IF EXISTS "Admin pode apagar users" ON users;
DROP POLICY IF EXISTS "Profiles visíveis para autenticados" ON profiles;
DROP POLICY IF EXISTS "Profiles editáveis pelo próprio" ON profiles;
DROP POLICY IF EXISTS "Profiles inseríveis" ON profiles;
DROP POLICY IF EXISTS "Recrutadores podem criar vagas" ON vagas;
DROP POLICY IF EXISTS "Recrutadores podem editar vagas próprias" ON vagas;
DROP POLICY IF EXISTS "Admin pode editar vagas" ON vagas;
DROP POLICY IF EXISTS "Candidaturas visíveis para candidato" ON candidaturas;
DROP POLICY IF EXISTS "Recrutadores vêem candidaturas" ON candidaturas;
DROP POLICY IF EXISTS "Admin vê todas candidaturas" ON candidaturas;
DROP POLICY IF EXISTS "Candidatos podem candidatar-se" ON candidaturas;
DROP POLICY IF EXISTS "Recrutadores atualizam candidaturas" ON candidaturas;
DROP POLICY IF EXISTS "Subscriptions visíveis para próprio" ON subscriptions;
DROP POLICY IF EXISTS "Admin vê todas subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Subscriptions inseríveis" ON subscriptions;
DROP POLICY IF EXISTS "Admin pode editar subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Cupoes visíveis" ON cupoes;
DROP POLICY IF EXISTS "Admin gere cupoes" ON cupoes;
DROP POLICY IF EXISTS "Grupos visíveis" ON grupos;
DROP POLICY IF EXISTS "Admin gere grupos" ON grupos;
DROP POLICY IF EXISTS "Mensagens visíveis para membros" ON mensagens;
DROP POLICY IF EXISTS "Users podem enviar mensagens" ON mensagens;

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
CREATE POLICY "Users visíveis para autenticados" ON users FOR SELECT USING (true);
CREATE POLICY "Users podem editar o próprio" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin pode editar qualquer user" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users inseríveis durante registo" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin pode apagar users" ON users FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ===================== PROFILES =====================
CREATE POLICY "Profiles visíveis para autenticados" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles editáveis pelo próprio" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Profiles inseríveis" ON profiles FOR INSERT WITH CHECK (true);

-- ===================== VAGAS =====================
CREATE POLICY "Vagas visíveis publicamente" ON vagas FOR SELECT USING (true);
CREATE POLICY "Recrutadores podem criar vagas" ON vagas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'recrutador' AND aprovado = true)
);
CREATE POLICY "Recrutadores podem editar vagas próprias" ON vagas FOR UPDATE USING (recrutador_id = auth.uid());
CREATE POLICY "Admin pode editar vagas" ON vagas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ===================== CANDIDATURAS =====================
CREATE POLICY "Candidaturas visíveis para candidato" ON candidaturas FOR SELECT USING (auth.uid() = candidato_id);
CREATE POLICY "Recrutadores vêem candidaturas" ON candidaturas FOR SELECT USING (
  EXISTS (SELECT 1 FROM vagas WHERE vagas.id = candidaturas.vaga_id AND vagas.recrutador_id = auth.uid())
);
CREATE POLICY "Admin vê todas candidaturas" ON candidaturas FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Candidatos podem candidatar-se" ON candidaturas FOR INSERT WITH CHECK (auth.uid() = candidato_id);
CREATE POLICY "Recrutadores atualizam candidaturas" ON candidaturas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM vagas WHERE vagas.id = candidaturas.vaga_id AND vagas.recrutador_id = auth.uid())
);

-- ===================== SUBSCRIPTIONS =====================
CREATE POLICY "Subscriptions visíveis para próprio" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
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
