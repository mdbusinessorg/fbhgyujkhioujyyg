-- MÔ SALO — Módulo privado de Candidatura Automática (uso exclusivo do administrador)
-- Executar no Supabase SQL Editor.

-- ============================================================
-- 1. Vagas externas (criada se ainda não existir; id = slug do scraper)
-- ============================================================
CREATE TABLE IF NOT EXISTS external_jobs (
  id text primary key,
  source text,
  source_url text,
  title text not null,
  company text,
  logo_url text,
  location text,
  category text,
  description text,
  excerpt text,
  salary text,
  apply_url text,
  posted_at timestamptz,
  first_seen_at timestamptz default now(),
  has_apply boolean default false,
  is_enriched boolean default false,
  tipo_contrato text,
  modalidade text,
  requisitos text,
  beneficios text,
  score integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. Perfil estendido do candidato (Matias)
-- ============================================================
CREATE TABLE IF NOT EXISTS candidate_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  full_name text not null,
  bio_longa text not null,
  formacao text,
  certificacoes jsonb default '[]',
  skills jsonb default '[]',
  referencias jsonb default '[]',
  updated_at timestamptz default now(),
  unique(user_id)
);

-- ============================================================
-- 3. CVs disponíveis
-- ============================================================
CREATE TABLE IF NOT EXISTS candidate_cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  titulo text not null,
  cargo_alvo text not null,
  arquivo_url text not null,
  skills_cobertas jsonb default '[]',
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. Log de candidaturas disparadas
-- ============================================================
CREATE TABLE IF NOT EXISTS job_applications_log (
  id uuid primary key default gen_random_uuid(),
  external_job_id text references external_jobs(id) on delete cascade not null,
  status text not null check (status in ('enviado','sem_email','sem_match','erro','duplicado')),
  cv_usado_id uuid references candidate_cvs(id),
  email_destino text,
  assunto_email text,
  corpo_email text,
  score_match numeric,
  skills_destacadas jsonb default '[]',
  erro_detalhe text,
  created_at timestamptz default now(),
  unique(external_job_id)
);

-- ============================================================
-- 5. Configuração do módulo
-- ============================================================
CREATE TABLE IF NOT EXISTS auto_apply_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  ativo boolean default true,
  score_minimo numeric default 55,
  limite_diario integer default 15,
  email_remetente text default 'suporte@mosalo.eu.cc',
  updated_at timestamptz default now()
);

-- ============================================================
-- Activar RLS
-- ============================================================
ALTER TABLE external_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_apply_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: verifica se o utilizador autenticado é admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = public.get_auth_user_id() AND role = 'admin'
  )
$$;

-- ============================================================
-- RLS policies (admin only)
-- ============================================================
CREATE POLICY "Admin only select external_jobs" ON external_jobs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin only insert external_jobs" ON external_jobs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin only update external_jobs" ON external_jobs FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin only delete external_jobs" ON external_jobs FOR DELETE USING (public.is_admin());

CREATE POLICY "Admin only select candidate_profile" ON candidate_profile FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin only insert candidate_profile" ON candidate_profile FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin only update candidate_profile" ON candidate_profile FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin only delete candidate_profile" ON candidate_profile FOR DELETE USING (public.is_admin());

CREATE POLICY "Admin only select candidate_cvs" ON candidate_cvs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin only insert candidate_cvs" ON candidate_cvs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin only update candidate_cvs" ON candidate_cvs FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin only delete candidate_cvs" ON candidate_cvs FOR DELETE USING (public.is_admin());

CREATE POLICY "Admin only select job_applications_log" ON job_applications_log FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin only insert job_applications_log" ON job_applications_log FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin only update job_applications_log" ON job_applications_log FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin only delete job_applications_log" ON job_applications_log FOR DELETE USING (public.is_admin());

CREATE POLICY "Admin only select auto_apply_settings" ON auto_apply_settings FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin only insert auto_apply_settings" ON auto_apply_settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin only update auto_apply_settings" ON auto_apply_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin only delete auto_apply_settings" ON auto_apply_settings FOR DELETE USING (public.is_admin());

-- ============================================================
-- Seed: perfil do Matias (cria apenas se o user admin existir)
-- ============================================================
INSERT INTO candidate_profile (user_id, full_name, bio_longa, formacao, certificacoes, skills, referencias)
SELECT id, 'Matias Domingos', '', '', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb
FROM public.users
WHERE email = 'matiasdomingos158@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- Seed: configuração default
-- ============================================================
INSERT INTO auto_apply_settings (id, ativo, score_minimo, limite_diario, email_remetente)
VALUES ('00000000-0000-0000-0000-000000000001', true, 55, 15, 'suporte@mosalo.eu.cc')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Trigger opcional: chamar webhook no INSERT de external_jobs
-- Requer a extensão pg_net (habilitada por defeito no Supabase).
-- Configure o URL em: ALTER DATABASE <db> SET app.webhook_url = 'https://mosalo.eu.cc/api/process-new-job';
-- Ou configure um Database Webhook no dashboard do Supabase (preferido).
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_external_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url text;
BEGIN
  webhook_url := current_setting('app.webhook_url', true);
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;
  END IF;
  BEGIN
    PERFORM net.http_post(
      url := webhook_url,
      body := jsonb_build_object('type','INSERT','table','external_jobs','record',row_to_json(NEW))::text,
      headers := '{"Content-Type":"application/json"}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Webhook call failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_external_job ON external_jobs;
CREATE TRIGGER trg_new_external_job
AFTER INSERT ON external_jobs
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_external_job();
