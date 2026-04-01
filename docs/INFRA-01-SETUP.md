# INFRA-01: Migrar app para app.getaura.com.br

## Passo 1 — Cloudflare Pages (Dashboard)

1. Acesse https://dash.cloudflare.com > Pages
2. **Create a project** > Connect to Git > Selecione `CaioAlexanderx/aura-site`
3. Build settings:
   - Build command: (deixar vazio — repo ja tem os arquivos prontos)
   - Build output directory: `/` (raiz do repo)
   - Root directory: `/`
4. Deploy

## Passo 2 — Custom Domains

Na pagina do projeto Cloudflare Pages:

1. Aba **Custom domains** > Add domain
2. Adicionar: `getaura.com.br` → Cloudflare adiciona o CNAME automaticamente
3. Adicionar: `app.getaura.com.br` → CNAME para o mesmo Pages project
4. Aguardar SSL provisionar (1-5 minutos)

## Passo 3 — DNS (Cloudflare Dashboard)

No painel DNS do dominio getaura.com.br, verificar:

| Type  | Name | Content                          | Proxy |
|-------|------|----------------------------------|-------|
| CNAME | @    | aura-site.pages.dev              | ON    |
| CNAME | app  | aura-site.pages.dev              | ON    |
| CNAME | www  | getaura.com.br                   | ON    |
| A     | api  | (Railway IP ou CNAME)            | ON    |

Se `@` ja aponta para outro lugar (ex: Workers), deletar o registro antigo.

## Passo 4 — Atualizar Railway ALLOWED_ORIGINS

No Railway, adicionar os novos dominios:
```
ALLOWED_ORIGINS=https://getaura.com.br,https://app.getaura.com.br,https://www.getaura.com.br
```

## Passo 5 — Atualizar API_URL no frontend

Nenhuma acao necessaria. O api.ts ja usa a URL do Railway diretamente:
```
https://aura-backend-production-f805.up.railway.app/api/v1
```

Quando tiver dominio custom para a API (ex: api.getaura.com.br):
1. Adicionar CNAME `api` apontando para o Railway
2. Atualizar EXPO_PUBLIC_API_URL no deploy

## Passo 6 — Verificar

1. https://getaura.com.br → site institucional (index.html)
2. https://getaura.com.br/app/ → Expo app (login/demo)
3. https://app.getaura.com.br → redirect para /app/ (via _redirects)
4. API: curl https://aura-backend-production-f805.up.railway.app/health

## Arquitetura final

```
getaura.com.br
├── /                → index.html (site institucional)
├── /privacidade     → privacidade.html
├── /hardware        → hardware.html
├── /dpa             → dpa.html
├── /app/            → Expo web app (login, dashboard, etc)
└── /app/_expo/*     → Assets estaticos (cache immutable)

app.getaura.com.br   → alias para getaura.com.br/app/

api (Railway)        → aura-backend-production-f805.up.railway.app
```
