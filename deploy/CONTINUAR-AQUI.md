# Onde paramos — BMB PWA

Use este arquivo para retomar o trabalho. Prioridade operacional: ativar Gov.br (código já na `main`).

---

## Status geral (conferido em 21/09/2026)

| Fase | Tema | Código / Git | Migration remota | Edge Functions | Produção front |
|------|------|--------------|------------------|----------------|----------------|
| 2 | Conta de responsável (`guardian`) | **Na `main`** (`1ae7361`) | Confirmar se `20260830190000` está aplicada | — | Incluído no front (CI na `main`) |
| 3 | Assinatura via Login Único Gov.br | **Na `main`** (`1ae7361`) | `20260830200000` — aplicada (projeto `hcgqshndvnxamjpujgzs`) | **Ainda não deployadas** | UI + toggle no admin; feature **desligada** |
| — | Aprovação admin em todo cadastro | **Na `main`** (`8a9d1cf`) | `20260831233000` | — | Ativo no fluxo de cadastro |
| — | Splash PWA cinematográfico | **Na `main`** (`77793a6` — HEAD) | — | — | Último deploy esperado via Actions |

**Git agora:** branch `main` = `origin/main`, working tree limpo. Não há commits locais pendentes das fases 2/3.

**Produção (bandabmb.com.br):** o front na `main` já inclui guardian + UI Gov.br. O que **não** está em produção é a assinatura Gov.br de ponta a ponta (functions + secrets + app cadastrado + toggle).

---

## Fase 2 — Responsável (concluída e commitada)

- Role `guardian`, tabela `guardian_links`, RLS de viagem
- Admin: convite/revogação em `MemberEditDialog` → `GuardianDigitalSection`
- Portal: guardian assina; aluno menor só lê
- Login: cadastro “Sou responsável” + ativação de convites no login

**Arquivos-chave**

- `supabase/migrations/20260830190000_add_guardian_role_and_links.sql`
- `src/services/guardian-links.ts`
- `src/hooks/use-auth.tsx`, `src/pages/Login.tsx`
- `src/pages/portal/PortalAuthorizations.tsx`, `PortalLayout.tsx`, `Dashboard.tsx`
- `src/components/admin/GuardianDigitalSection.tsx`

**Ao retomar:** se o portal/admin de responsável falhar no remoto, rodar `supabase db push` (ou conferir no Dashboard se a migration `20260830190000` existe).

---

## Fase 3 — Gov.br (código na `main`, **não ativada**)

Decisão: **Login Único** (identidade verificada), **não** ICP-Brasil. Canvas continua como fallback.

### Já implementado (e versionado)

- Migration: colunas `govbr_*`, `signature_evidence`, tabela `govbr_oauth_states`, setting `govbr_signing_enabled=false`
- Edge Functions (código no repo, **ainda não deployadas**):
  - `supabase/functions/govbr-start/` — inicia OAuth PKCE
  - `supabase/functions/govbr-callback/` — valida JWT/JWKS e grava assinatura
  - `supabase/functions/_shared/govbr.ts`, `_shared/supabase.ts`
- Front: `src/services/govbr.ts`, dual CTA em `PortalAuthorizations.tsx`
- Admin: toggle em `SiteSettingsManager.tsx`
- Docs: `.env.example`, seção Gov.br em `deploy/DEPLOY.md`

### O que falta (só operação)

1. **Estudar / cadastrar app no Login Único Gov.br**
   - [Roteiro técnico](https://acesso.gov.br/roteiro-tecnico/iniciarintegracao.html)
   - Homologação em `staging` antes de produção

2. **Secrets no Supabase** (Dashboard → Edge Functions → Secrets)

   | Secret | Valor |
   |--------|--------|
   | `GOVBR_CLIENT_ID` | id da aplicação |
   | `GOVBR_CLIENT_SECRET` | secret |
   | `GOVBR_REDIRECT_URI` | `https://hcgqshndvnxamjpujgzs.supabase.co/functions/v1/govbr-callback` |
   | `GOVBR_ENV` | `staging` ou `production` |
   | `GOVBR_APP_ORIGIN` | `https://bandabmb.com.br` |

3. **Deploy das functions**

   ```bash
   supabase functions deploy govbr-start
   supabase functions deploy govbr-callback --no-verify-jwt
   ```

4. **Registrar a mesma `GOVBR_REDIRECT_URI`** no painel Gov.br

5. **Testar em staging** com um responsável vinculado e uma autorização pendente

6. **Ligar o toggle** no admin: Configurações do site → “Assinatura via Login Único Gov.br”

### Comportamento atual (sem credenciais)

- Toggle **desligado** → portal só mostra assinatura no aparelho (canvas)
- Se ligar toggle sem secrets/deploy → botão Gov.br retorna erro 503 da function

---

## Ambiente local (snapshot 21/09/2026)

Ao clonar / abrir a máquina limpa:

- `.env` pode estar ausente → copiar de `.env.example` e preencher `VITE_SUPABASE_*`
- `node_modules` pode estar ausente → `pnpm install`
- Dev server: **porta 8080** (`vite.config.ts`), não 5173

```bash
pnpm install
# criar .env a partir de .env.example
pnpm start
```

---

## Comandos úteis ao retomar

```bash
# Confirmar que a main está limpa e sincronizada
git status
git log -1 --oneline

# Typecheck
pnpm exec tsc --noEmit

# Aplicar migrations locais no remoto (se necessário)
supabase db push

# Deploy front (já automático no push na main)
# → GitHub Actions em .github/workflows/deploy.yml
```

---

## Plano de referência

Se existirem sob `.cursor/plans/`:

- Fase 2: `conta_responsavel_fase_2_*.plan.md`
- Fase 3: `govbr_login_assinatura_*.plan.md`

(Em 21/09/2026 esses planos não estavam presentes no working tree; o checklist acima é a fonte operacional.)

---

*Última atualização: 21/09/2026 — checkpoint alinhado ao Git (`main` limpa, fases 2/3 commitadas; pendência = ativação operacional Gov.br).*
