# Deploy Banda BMB — bandabmb.com.br (Vultr + Nginx + GitHub Actions)

Objetivo: publicar o PWA em produção **sem alterar** a aplicação que já roda no mesmo VPS.

Isolamento:

- pasta exclusiva: `/var/www/bandabmb`
- site Nginx exclusivo: `bandabmb.com.br`
- usuário SSH de deploy com acesso só a essa pasta (recomendado)
- a app antiga continua nos `server_name` / pastas atuais

---

## Visão geral

```text
Registro.br (DNS A → IP do Vultr)
        ↓
Nginx (server block só da BMB)
        ↓
/var/www/bandabmb  ← rsync do GitHub Actions (push na main)
        ↓
Supabase Auth (Site URL = https://bandabmb.com.br)
```

---

## Passo 1 — DNS no Registro.br

No painel do domínio `bandabmb.com.br`:

| Tipo | Nome               | Valor                       | TTL  |
| ---- | ------------------ | --------------------------- | ---- |
| A    | `@` (ou em branco) | **IP público do VPS Vultr** | 3600 |
| A    | `www`              | **mesmo IP**                | 3600 |

Aguarde a propagação (pode levar de minutos a algumas horas).

Teste:

```bash
nslookup bandabmb.com.br
```

---

## Passo 2 — Preparar o VPS (uma vez, via SSH)

Conecte no Vultr:

```bash
ssh usuario@IP_DO_VPS
```

### 2.1 Pasta do site (não mexa nas pastas da app atual)

```bash
sudo mkdir -p /var/www/bandabmb
sudo chown -R $USER:www-data /var/www/bandabmb
sudo chmod -R 775 /var/www/bandabmb
```

### 2.2 Site Nginx isolado

```bash
sudo nano /etc/nginx/sites-available/bandabmb.com.br
```

Cole o conteúdo de `deploy/nginx-bandabmb.conf` deste repositório.

Ative **somente** este site:

```bash
sudo ln -sf /etc/nginx/sites-available/bandabmb.com.br /etc/nginx/sites-enabled/bandabmb.com.br
sudo nginx -t
sudo systemctl reload nginx
```

> Se `nginx -t` falhar, **não** dê reload. Corrija o arquivo novo — os outros sites não devem ser editados.

### 2.3 HTTPS (Let's Encrypt)

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bandabmb.com.br -d www.bandabmb.com.br
```

Isso altera **apenas** o server block da BMB (quando o certbot reconhece o `server_name`).

### 2.4 Chave SSH de deploy (recomendada)

No seu PC (PowerShell/Git Bash):

```bash
ssh-keygen -t ed25519 -C "github-deploy-bandabmb" -f ./bandabmb_deploy -N ""
```

No VPS, adicione a chave **pública** em `~/.ssh/authorized_keys` do usuário de deploy.

A chave **privada** vai para o secret `VPS_SSH_KEY` no GitHub (nunca commitar).

---

## Passo 3 — Secrets no GitHub

Repositório → **Settings → Secrets and variables → Actions → New repository secret**

| Secret                          | Valor                                          |
| ------------------------------- | ---------------------------------------------- |
| `VPS_HOST`                      | IP do Vultr (ex.: `45.x.x.x`)                  |
| `VPS_USER`                      | usuário SSH (ex.: `ubuntu` / `root` / deploy)  |
| `VPS_SSH_KEY`                   | conteúdo completo da chave **privada**         |
| `VPS_PATH`                      | `/var/www/bandabmb` (opcional; já é o default) |
| `VITE_SUPABASE_URL`             | `https://hcgqshndvnxamjpujgzs.supabase.co`     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | chave publishable do Supabase                  |

---

## Passo 4 — Supabase Auth (obrigatório para e-mail de recuperação)

Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://bandabmb.com.br`
- **Redirect URLs** (adicione):
  - `https://bandabmb.com.br/**`
  - `https://www.bandabmb.com.br/**`
  - `http://localhost:8080/**` (manter para desenvolvimento)

Sem isso, o link do e-mail continua apontando para localhost.

---

## Passo 5 — Publicar

1. Faça commit/push na `main` (ou rode o workflow manualmente em Actions).
2. O workflow:
   - instala deps
   - faz `pnpm build` com secrets do Supabase
   - envia `dist/` via `rsync` para `/var/www/bandabmb`
   - recarrega o Nginx
3. Abra `https://bandabmb.com.br`

---

## Checklist de segurança (não afetar a app atual)

- [ ] Não editar configs Nginx de outros `server_name`
- [ ] Não sobrescrever pastas `/var/www/...` da app antiga
- [ ] Não reiniciar serviços desnecessários (`systemctl restart` amplo)
- [ ] Preferir `nginx -t` + `reload` (graceful)
- [ ] Deploy só em `/var/www/bandabmb`

---

## Troubleshooting

| Problema                      | O que checar                                         |
| ----------------------------- | ---------------------------------------------------- |
| Domínio não abre              | DNS A no Registro.br + firewall 80/443 no Vultr      |
| 502 / página errada           | `server_name` e `root` do site BMB                   |
| SPA dá 404 em `/login`        | `try_files ... /index.html` no Nginx                 |
| E-mail de senha com localhost | Site URL / Redirect URLs no Supabase                 |
| Actions falha no rsync        | `VPS_SSH_KEY`, `authorized_keys`, permissão da pasta |

---

## O que eu (assistente) preciso de você para executar remotamente

1. **IP público** do VPS Vultr
2. Usuário SSH e forma de acesso (chave ou senha) — ou você roda o Passo 2 e me confirma
3. Confirmação de que o DNS já aponta para o IP

Com isso, seguimos: DNS → Nginx → SSL → secrets → primeiro deploy → ajuste Supabase.

---

## Gov.br — assinatura de viagem (Edge Functions)

Fluxo separado do deploy do front. Só ative em produção após credenciais oficiais do Login Único.

### 1. Migration

```bash
supabase db push
# ou aplicar supabase/migrations/20260830200000_govbr_travel_signature.sql no projeto remoto
```

### 2. Secrets no Supabase (Dashboard → Edge Functions → Secrets)

| Secret | Exemplo |
| ------ | ------- |
| `GOVBR_CLIENT_ID` | id da aplicação cadastrada no Gov.br |
| `GOVBR_CLIENT_SECRET` | secret da aplicação |
| `GOVBR_REDIRECT_URI` | `https://<project-ref>.supabase.co/functions/v1/govbr-callback` |
| `GOVBR_ENV` | `staging` (homologação) ou `production` |
| `GOVBR_APP_ORIGIN` | `https://bandabmb.com.br` |

### 3. Deploy das functions

```bash
supabase functions deploy govbr-start --no-verify-jwt=false
supabase functions deploy govbr-callback --no-verify-jwt
```

### 4. Cadastro no Gov.br

Registrar a mesma `GOVBR_REDIRECT_URI` na aplicação do Login Único.

### 5. Ativar no admin

Painel → Configurações do site → **Assinatura via Login Único Gov.br** (toggle).

Enquanto não houver credenciais, o toggle pode ficar desligado; responsáveis continuam assinando no aparelho (canvas).

