-- MÔ SALO — Extensão multi-candidato do módulo de Candidatura Automática
-- Executar no Supabase SQL Editor depois de auto-apply.sql.

-- 1. Adicionar configuração de remetente/SMTP ao perfil do candidato
ALTER TABLE candidate_profile
  ADD COLUMN IF NOT EXISTS email_remetente text,
  ADD COLUMN IF NOT EXISTS smtp_host text,
  ADD COLUMN IF NOT EXISTS smtp_port integer,
  ADD COLUMN IF NOT EXISTS smtp_secure boolean,
  ADD COLUMN IF NOT EXISTS smtp_user text,
  ADD COLUMN IF NOT EXISTS smtp_pass text;

-- 2. job_applications_log precisa de user_id para distinguir candidaturas de vários perfis
ALTER TABLE job_applications_log
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Preencher user_id nas candidaturas antigas (todas do Matias, dono da feature original)
UPDATE job_applications_log
SET user_id = (
  SELECT id FROM public.users WHERE email = 'matiasdomingos158@gmail.com' LIMIT 1
)
WHERE user_id IS NULL;

-- 3. Ajustar constraints: uma candidatura por vaga por candidato
ALTER TABLE job_applications_log
  DROP CONSTRAINT IF EXISTS job_applications_log_external_job_id_key;

ALTER TABLE job_applications_log
  DROP CONSTRAINT IF EXISTS job_applications_log_external_job_id_user_id_key;

ALTER TABLE job_applications_log
  ADD CONSTRAINT job_applications_log_external_job_id_user_id_key
  UNIQUE (external_job_id, user_id);

-- 4. Trigger de webhook permanece o mesmo (chama /api/process-new-job)
-- A função process-new-job trata de iterar todos os candidatos.
