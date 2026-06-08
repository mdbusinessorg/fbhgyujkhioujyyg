# 🏥 Clínica Bem Estar

Aplicação web full-stack de gestão clínica — landing page pública + portais com controlo de acesso por papel (**Administração**, **Área Clínica**, **Portal do Paciente**).

Construída com **Next.js 14 (App Router)**, **Tailwind CSS**, **Framer Motion**, **Prisma ORM** e **PostgreSQL (Supabase)**, autenticação **NextAuth.js (JWT)**, automações com **node-cron** e notificações por email com **Nodemailer**.

---

## ✨ Funcionalidades

### Pública
- Landing page moderna (hero, serviços, sobre, estatísticas animadas, formulário de contacto/marcação) — conteúdo em português.
- Marcação de consulta pública (cria conta de paciente automaticamente).

### Administração (`/admin`)
- Visão geral com KPIs: consultas (hoje/semana/mês), receita recebida vs. pendente vs. em atraso, nº de pacientes/médicos.
- Painel de alertas: pagamentos pendentes, consultas perdidas, perfis incompletos.
- Gestão de pacientes (ativar/desativar), médicos (criar/gerir), consultas (criar/confirmar/concluir/cancelar).
- Acompanhamento de pagamentos + geração de faturas.
- Registo de auditoria pesquisável (quem fez o quê e quando).
- Exportação de relatórios em CSV (pacientes, pagamentos, consultas).

### Área Clínica (`/doctor`)
- Agenda diária/semanal de consultas.
- Ficha do paciente com histórico, métricas (gráficos), alergias e condições crónicas.
- Espaço clínico: notas de consulta, prescrições, pedidos de exame, plano de tratamento, mensagens ao paciente.
- Marcar consulta como concluída (gera pagamento pendente).

### Portal do Paciente (`/patient`)
- Onboarding de perfil de saúde (DOB, género, morada, tipo sanguíneo, alergias, condições crónicas, contacto de emergência).
- Auto-registo de métricas (peso, altura, pressão, glicemia) com **deteção automática de valores anormais** e alerta ao médico.
- Consultas, receitas (com dias restantes), exames (com upload de resultados), pagamentos (com faturas), plano de tratamento.
- Notificações in-app.

### Automações (`npm run cron`)
- **08:00** — lembretes de consultas do dia seguinte (in-app + email).
- **09:00** — marcar pagamentos em atraso (>30 dias) e alertar a administração.
- **Segunda 09:00** — relatório semanal para a administração.
- **08:30** — alertas de renovação de receita (3 dias antes de terminar).

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Framer Motion, Recharts |
| Backend | Next.js API Routes (Node.js) |
| ORM / DB | Prisma + PostgreSQL (Supabase) |
| Auth | NextAuth.js (Credentials + JWT), bcrypt |
| Validação | Zod |
| Automações | node-cron |
| Email | Nodemailer |

---

## 🚀 Começar

### 1. Pré-requisitos
- Node.js 18+ (recomendado 20+)
- Uma base de dados PostgreSQL (ex.: [Supabase](https://supabase.com))

### 2. Instalar
```bash
npm install
```

### 3. Configurar ambiente
```bash
cp .env.example .env
```
Preencha o `.env` (ver secção [Variáveis de ambiente](#-variáveis-de-ambiente)).

### 4. Base de dados
```bash
# cria o schema na base de dados
npm run db:push

# popula com dados de demonstração realistas
npm run db:seed
```

### 5. Arrancar
```bash
npm run dev
```
Aceda a [http://localhost:3000](http://localhost:3000).

Para as automações (opcional, noutro terminal):
```bash
npm run cron            # agenda os jobs
npm run cron -- --run-now   # executa todos os jobs uma vez (teste)
```

---

## 🔑 Contas de demonstração

Após `npm run db:seed` (palavra-passe: **`demo1234`**):

| Papel | Email |
|---|---|
| Administração | `admin@clinicabemestar.pt` |
| Médico | `medico@clinicabemestar.pt` |
| Paciente | `paciente@clinicabemestar.pt` |

---

## 🔐 Variáveis de ambiente

Ver `.env.example`. Principais:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Pooler de transações do Postgres (runtime). |
| `DIRECT_URL` | Pooler de sessão (migrações Prisma). |
| `NEXTAUTH_URL` | URL base da app (ex.: `http://localhost:3000`). |
| `NEXTAUTH_SECRET` | Segredo do NextAuth (`openssl rand -base64 32`). |
| `SMTP_*` / `EMAIL_FROM` | Configuração de email. Vazio = emails registados na consola. |
| `NEXT_PUBLIC_SUPABASE_*` | Cliente Supabase (storage). |

---

## 📜 Scripts

| Script | Ação |
|---|---|
| `npm run dev` | Servidor de desenvolvimento. |
| `npm run build` | Build de produção (`prisma generate` + `next build`). |
| `npm run start` | Servidor de produção. |
| `npm run lint` | ESLint. |
| `npm run db:push` | Sincroniza o schema Prisma com a base de dados. |
| `npm run db:seed` | Popula dados de demonstração. |
| `npm run cron` | Inicia o worker de automações. |

---

## 🛡️ Segurança & Produção

- Validação de entrada com **Zod** em todas as rotas/formulários.
- Palavras-passe com **bcrypt**; sessões **JWT**.
- **Guardas de papel** no `middleware.ts` e em cada rota protegida.
- **Registo de auditoria** em todas as operações de escrita.
- Responsivo (telemóvel/tablet/desktop), estados de carregamento e tratamento de erros.

---

## 📁 Estrutura

```
app/            # rotas (públicas, admin, doctor, patient) + API routes
components/     # UI (landing, dashboard, doctor, patient, ui)
lib/            # auth, prisma, validações, auditoria, email, notificações, utils
prisma/         # schema + seed
worker/         # automações node-cron
```

---

## ☁️ Deploy

- **Frontend/API**: [Vercel](https://vercel.com) (importe o repositório e configure as variáveis de ambiente).
- **Base de dados**: [Supabase](https://supabase.com) (use o pooler de transações no `DATABASE_URL`).
- **Worker cron**: execute `npm run cron` num serviço persistente (ex.: Railway) — Vercel não mantém processos cron longos.
