# Onde paramos — BMB PWA (ago/2026)

Use este arquivo para retomar o trabalho depois de estudar a integração Gov.br.

---

## Status geral

| Fase | Tema | Código | Migration remota | Commit |
|------|------|--------|------------------|--------|
| 2 | Conta de responsável (`guardian`) | Pronto localmente | `20260830190000` — verificar se aplicada | **Não commitado** |
| 3 | Assinatura via Login Único Gov.br | Pronto localmente | `20260830200000` — **aplicada** no projeto `hcgqshndvnxamjpujgzs` | **Não commitado** |

**Produção (bandabmb.com.br):** ainda não reflete estas mudanças até `git commit` + `push` na `main` (e deploy das Edge Functions).

---

## Fase 2 — Responsável (concluída no código)

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

---

## Fase 3 — Gov.br (infra pronta, **não ativada**)

Decisão: **Login Único** (identidade verificada), **não** ICP-Brasil. Canvas continua como fallback.

### Já implementado

- Migration: colunas `govbr_*`, `signature_evidence`, tabela `govbr_oauth_states`, setting `govbr_signing_enabled=false`
- Edge Functions (código local, **ainda não deployadas**):
  - `supabase/functions/govbr-start/` — inicia OAuth PKCE
  - `supabase/functions/govbr-callback/` — valida JWT/JWKS e grava assinatura
  - `supabase/functions/_shared/govbr.ts`, `_shared/supabase.ts`
- Front: `src/services/govbr.ts`, dual CTA em `PortalAuthorizations.tsx`
- Admin: toggle em `SiteSettingsManager.tsx`
- Docs: `.env.example`, seção Gov.br em `deploy/DEPLOY.md`

### O que falta quando você voltar

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

7. **Commit + push** de todo o working tree (fases 2 e 3 ainda locais)

### Comportamento atual (sem credenciais)

- Toggle **desligado** → portal só mostra assinatura no aparelho (canvas)
- Se ligar toggle sem secrets → botão Gov.br retorna erro 503 da function

---

## Comandos úteis ao retomar

```bash
# Ver o que falta commitar
git status

# Typecheck
pnpm exec tsc --noEmit

# Aplicar migrations locais no remoto (se necessário)
supabase db push

# Deploy front (após commit na main)
# → GitHub Actions em .github/workflows/deploy.yml
```

---

## Plano de referência (não editar)

- Fase 2: `.cursor/plans/conta_responsavel_fase_2_*.plan.md`
- Fase 3: `.cursor/plans/govbr_login_assinatura_*.plan.md`

---

*Última atualização: 30/08/2026 — pausa antes de cadastro Gov.br e deploy das Edge Functions.*
