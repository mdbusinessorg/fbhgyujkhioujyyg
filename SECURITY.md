# Segurança — MÔ SALO

Estado actual das protecções da plataforma (mosalo.eu.cc). Stack: Next.js (export estático) + Netlify Functions + Supabase.

## Checklist

| # | Item | Estado | Onde / Como |
|---|------|--------|-------------|
| 1 | HTTPS | ✅ | Netlify força HTTPS; `Strict-Transport-Security` + `upgrade-insecure-requests` no `netlify.toml` |
| 2 | Senhas com hash | ✅ | Supabase Auth (bcrypt) — nunca guardamos senhas em texto |
| 3 | MFA | 🟡 Roadmap | Supabase suporta TOTP nativo — a activar quando o plano o permitir |
| 4 | Rate Limit | ✅ | `netlify/lib/security.js` (`rateLimit`) — 10–120 req/min por IP por endpoint |
| 5 | Validação de inputs | ✅ | Campos obrigatórios + tipos verificados nas functions; `str()/isId()/isEmail()` na lib |
| 6 | Sanitização de dados | ✅ | `str()` remove control-chars/invisíveis; descrições de vagas limpas no pipeline de scraping |
| 7 | SQL Injection | ✅ | Cliente Supabase parametriza queries; sem SQL bruto interpolado; REST usa filtros tipados |
| 8 | Migrations | ✅ | `supabase/migrations/` versionadas no repo |
| 9 | Rollback | ✅ | Deploys Netlify imutáveis → "Publish deploy" anterior; `git revert` na main; ver § Recuperação |
| 10 | Controle de Acesso | ✅ | `getAuthenticatedUser` + `verifyAdmin` + `requireUser` — endpoints de escrita exigem JWT do dono |
| 11 | Expiração de sessão | ✅ | JWT Supabase (access token ~1h) + refresh token rotativo |
| 12 | Secrets | ✅ | Só em env vars Netlify/GitHub — `.env*` no `.gitignore`; nunca commitadas |
| 13 | CORS | ✅ | API consumida same-origin via `/api/*`; GET público único em `external-jobs.json` |
| 14 | Logs | ✅ | Netlify Function logs + Supabase logs + `data/` (dead URLs, scraping) |
| 15 | Backups | ✅ | Supabase backups diários (project settings); código+dados de vagas no Git |
| 16 | Criptografia | ✅ | TLS em trânsito; Postgres/Storage encriptados em repouso (Supabase) |
| 17 | Dependências | 🟡 | `npm audit fix` aplicado; restantes exigem major upgrades — ver § Dependências |
| 18 | PMP (protecção de plataforma) | ✅ | Headers CSP/XFO/nosniff/Referrer-Policy/Permissions-Policy em todas as respostas |
| 19 | Monitoramento | ✅ | Function logs Netlify + status dos workflows GitHub (scraping) |
| 20 | Plano de Recuperação | ✅ | Ver § abaixo |

## O que foi corrigido nesta revisão

- **Escrita anónima fechada**: `post-likes`, `message-requests`, `notifications` agora exigem JWT e verificam o dono do recurso (antes aceitavam qualquer `user_id`).
- **Notificações privadas**: GET devolvia a lista inteira sem autenticação — agora só o dono (ou admin) lê.
- **APIs de IA protegidas**: `ai-apply`, `ai-cv`, `ai-match`, `ai-tips`, `parse-cv` exigem login + rate limit (evita abuso da quota Groq).
- **SSRF**: `parse-cv` só busca ficheiros em `*.supabase.co` + corpo ≤ 2 MB.
- **Cron/endpoints internos trancados**: `notify-new-jobs`, `daily-triggers`, `retry-pending-jobs`, `trigger-scrape`, `trigger-notifications` só correm por agendamento Netlify (`x-nf-event: schedule` + UA Clockwork) ou `Authorization: Bearer $CRON_SECRET`.
- **Rate limit**: resposta 429 por IP em todos os endpoints sensíveis (`rateLimit` in-memory por instância; os limites do Supabase/Netlify continuam como segunda linha).
- **Headers**: HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy e CSP em `netlify.toml`.
- **Dependências**: `npm audit fix` (33→19 findings); `nodemailer@10.1.0` (funcção de auto-apply testada).

## Dependências — nota de risco

- Os advisories restantes do `next@14.2.35` atingem RSC/Server Actions/Image Optimizer — **não aplicáveis a este site porque é um export estático** (não corre servidor Next em produção). Risco residual: tempo de build. Roadmap: upgrade para `next@15/16` numa sessão dedicada com testes.
- `tailwindcss@4`, `mammoth`, `postcss-*`: apenas tooling de build — não vai no bundle de produção.

## Plano de Recuperação (DR)

1. **Site em baixo / deploy mau** → Netlify UI → Deploys → *Publish* no deploy anterior (instantâneo). Ou `git revert` + push na main.
2. **Dados Supabase** → backups automáticos diários do projecto; restauro via dashboard (Settings → Backups). Blobs Netlify: re-geráveis a partir dos dados públicos + Supabase.
3. **Vagas externas** → `public/vagas-data/*.json` versionado no Git; repovoável correndo `scripts/` + workflows `scrape-jobs.yml`.
4. **Secrets comprometidos** → rodar no painel Netlify/Supabase/GitHub; nunca existem no código.
5. **Contacto** → issues no repo ou Netlify/Supabase status pages.

## Configuração pendente (manual)

- [ ] Definir `CRON_SECRET` nas env vars do Netlify para permitir disparos manuais seguros dos jobs.
- [ ] MFA TOTP (Supabase Auth) quando quiseres oferecer 2FA aos utilizadores.
