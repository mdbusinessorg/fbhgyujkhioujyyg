-- Vagas externas agregadas (scraping de boards angolanos). Propriedade do MÔ SALO.
CREATE TABLE IF NOT EXISTS external_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text,
  source_url text UNIQUE NOT NULL,
  title text,
  company text,
  location text,
  category text DEFAULT 'Outro',
  description text,
  excerpt text,
  apply_url text,
  salary text,
  posted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE external_jobs ENABLE ROW LEVEL SECURITY;

-- Leitura pública; escrita apenas via service_role (que ignora RLS).
DROP POLICY IF EXISTS "ext_jobs_select" ON external_jobs;
CREATE POLICY "ext_jobs_select" ON external_jobs FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS external_jobs_posted_at_idx ON external_jobs (posted_at DESC);
CREATE INDEX IF NOT EXISTS external_jobs_category_idx ON external_jobs (category);
