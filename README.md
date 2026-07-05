# K10 Opportunities

Plataforma de recrutamento inteligente angolana. Conecta talentos às melhores oportunidades com IA, vagas filtradas por área e comunidade profissional.

## Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **IA**: Groq API + Gemini API (dicas de perfil, revisão de CV)
- **Deploy**: Netlify (static export)

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Homepage com hero, categorias, vagas recentes, preços |
| `/vagas/` | Pesquisa e filtragem de vagas |
| `/vagas/[id]/` | Detalhe de uma vaga |
| `/guia/` | Guia do candidato angolano (documentos, dicas, CV ATS) |
| `/auth/login/` | Login |
| `/auth/registar/` | Registo (candidato ou recrutador) |
| `/dashboard/candidato/` | Painel do candidato |
| `/dashboard/recrutador/` | Painel do recrutador |
| `/dashboard/admin/` | Painel do administrador |

## Setup Local

```bash
npm install
npm run dev
```

## Variáveis de Ambiente

Criar ficheiro `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://gwnjigmsuqasvotsksmk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

## Base de Dados

Executar o SQL em `supabase/schema.sql` no Supabase SQL Editor para criar todas as tabelas.

## Build para Produção

```bash
npm run build
```

Os ficheiros estáticos são gerados na pasta `out/`, prontos para deploy no Netlify.

## Contacto

- Email: matiasdomingos158@gmail.com
- Telefone: +244 934 859 240
- Angola, 2024
