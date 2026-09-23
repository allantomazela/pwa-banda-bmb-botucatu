# Templates de e-mail — Auth BMB

Arquivos usados pelo Supabase Auth (GoTrue):

| Arquivo | Uso no Dashboard / config |
|---|---|
| `confirmation.html` | **Confirm signup** — confirma e-mail + avisa que o cadastro aguarda aprovação do admin |
| `recovery.html` | **Reset password** — link para `/redefinir-senha` |
| `pending-approval.html` | Texto de referência (mesmo aviso de análise). Em produção o aviso já está no `confirmation.html` |

## Local

Configurado em `supabase/config.toml` (`auth.email.template.*`).

## Produção no Free: Resend como SMTP (obrigatório para editar templates)

No plano Free, sem SMTP próprio o Dashboard **bloqueia** a edição dos templates. Configure o Resend primeiro; depois cole os HTMLs.

### 1. Conta e domínio no Resend

1. Crie conta em [resend.com](https://resend.com) (plano Free).
2. **Domains → Add Domain** (ex.: `bandabmb.com.br` ou o domínio oficial da banda).
3. No provedor DNS (Registro.br, Cloudflare, etc.), cadastre os registros que o Resend mostrar (em geral SPF + DKIM; às vezes DMARC).
4. Espere o status **Verified**.
5. **API Keys → Create** → copie a chave `re_...` (será a senha SMTP).

**DNS — o que esperar:** o Resend lista os valores exatos na tela do domínio. Não invente registros; copie host/tipo/valor dali. Remetente sugerido após verificação: `noreply@seudominio.com.br`.

### 2. SMTP no Supabase

**Authentication → Emails → SMTP Settings** (ou Auth → SMTP):

| Campo | Valor |
|--------|--------|
| Enable Custom SMTP | ligado |
| Sender email | `noreply@seudominio.com.br` |
| Sender name | `Banda Marcial de Botucatu` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | API key `re_...` |

Salve. Docs: [Resend + Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp) · [Supabase Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

### 3. Colar templates (só depois do SMTP)

**Authentication → Email Templates**

1. **Confirm signup** — assunto: `BMB — Confirme seu e-mail (cadastro aguarda aprovação)` · corpo: HTML de `confirmation.html`
2. **Reset password** — assunto: `BMB — Redefinir sua senha` · corpo: HTML de `recovery.html`

### 4. URL Configuration (obrigatório — senão o reset abre a Home)

Em **Authentication → URL Configuration**:

- **Site URL:** `https://bandabmb.com.br`
- **Redirect URLs** (adicione **todas**; se faltar `/redefinir-senha`, o Auth cai no Site URL = Home):
  - `https://bandabmb.com.br/**`
  - `https://bandabmb.com.br/redefinir-senha`
  - `https://bandabmb.com.br/recuperar-senha`
  - `https://bandabmb.com.br/login`
  - (local) `http://localhost:8080/**`

Salve e peça um **novo** e-mail de reset (links antigos podem ainda apontar para a Home).

### 4.1 Expiração do link (OTP)

O tempo do link de recuperação/confirmação é o **Email OTP expiration**:

- **Local:** `supabase/config.toml` → `auth.email.otp_expiry = 14400` (4 horas)
- **Produção (Dashboard):** **Authentication → Sign In / Providers → Email** → **Email OTP expiration** = `14400`

Depois de alterar o HTML de recovery, cole de novo o template **Reset password** no Dashboard.

### 5. Testar

1. Cadastro com e-mail real → e-mail de confirmação.
2. Esqueci minha senha → e-mail de recuperação.
3. Conferir também em **Resend → Emails** e pasta de spam.

Se o rate limit do Auth com SMTP custom for baixo (~30/h), ajuste em **Authentication → Rate Limits**.

## Variáveis GoTrue

`{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .Data.full_name }}`.
