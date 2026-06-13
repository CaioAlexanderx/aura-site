# Aura — Reformulação do Site v3.1 · Roadmap de Execução

> Documento mestre da reformulação do **getaura.com.br** (site v3).
> Status, decisões e **instruções técnicas por etapa**, com a execução dividida
> por tier de modelo (**[Opus]** = arquitetura / integração / ambiguidade;
> **[Sonnet]** = implementação bem-especificada / mecânica).
> Última atualização: **09/06/2026** · **v3.1 — merge com as decisões estratégicas de posicionamento**.

---

## 🧭 Decisões estratégicas (merge 09/06) — o "porquê" que rege a execução

Camada de posicionamento fechada em conversa, baixada sobre o roadmap de execução. Quando houver conflito entre uma tarefa antiga e algo aqui, **isto manda**.

1. **Beachhead = Aura Negócio.** O carro-chefe (varejo geral) é a porta de entrada e o motor de aquisição. A home lidera **100% com a história de fiado do Negócio**: *"o sistema da loja que vende fiado — e cobra sozinho pelo WhatsApp"*. Studio e Dojô são profundidade, não manchete.
2. **Duas verticais, inclusas sem custo.** Negócio (base) + **Studio** (personalizados/gráfica) + **Dojô** (karatê). **Food foi removido** (ver Fase 1). As verticais entram **sem valor adicional** nos planos Negócio/Expansão — isso é diferencial a comunicar ("escolha sua especialização sem pagar a mais"), não um detalhe.
3. **Preço como arma.** Substituir o headline **"Pague pelo que usa"** (que vende a mensagem do inimigo) por **"Seu preço não sobe porque você vendeu mais"** — ataque direto à dor nº1 documentada (Bling/Tiny/Conta Azul cobram por volume).
4. **IA fora do site** (decisão da Fase 1 mantida): não opera ainda → não divulgar. Não entra nas 3 camadas de diferencial até operar de verdade.
5. **Diferenciais em 3 camadas, não em grade plana.** Parar de listar feature nivelada; ancorar cada uma numa dor com nome:
   - **Cunha (por que trocar agora):** crediário/fiado + cobrança automática WhatsApp · troca no caixa · grade de tamanhos · preço fixo · suporte humano em português.
   - **Profundidade (por que ficar):** PDV/NFC-e · fiscal (NF-e/NFC-e/NFS-e/SAT) · financeiro (DRE/conciliação) · estoque. *(sem IA)*
   - **Expansão (por que crescer):** Canal Digital/loja digital · HUB Social · multi-CNPJ consolidado · conferidor de taxas de maquininha (Expansão) · marketplaces ML/Shopee (Studio).
6. **Promessa não entregue sai do ar:** remover qualquer claim de **"funciona offline"** do marketing até a contingência real existir (mesma lógica que removeu a IA).
7. **Ativo cross-vertical:** o motor de cobrança automática (`due_date`/régua) serve o **crediário do Negócio** *e* a **anuidade/mensalidade do Dojô** com código único — fintech embutida atravessando verticais. Vale na narrativa interna e na tese de investidor.

---

## 0. Contexto e repositórios

Três repos lado a lado em `C:\Users\Caio\Documents\Aura\`:

| Repo | O que é | Stack / Deploy |
|---|---|---|
| `aura-site` | Marketing (este repo) | HTML/CSS/JS vanilla · **Cloudflare Worker standalone** (`wrangler.jsonc`: `main=src/worker.js`, `assets="./"`) |
| `aura-app` | Produto | React Native / Expo · `app.getaura.com.br` |
| `aura-backend` | API | Node/Express + Postgres (Supabase) + Redis · **Railway** · GitHub `CaioAlexanderx/Aura-backend` (privado) |

- **Backend prod:** `https://aura-backend-production-f805.up.railway.app` (API base `/api/v1`).
- **Supabase:** projeto `hawtujkztrjpvvkihowb` ("Aura", sa-east-1).
- ⚠️ O `aura-backend` local costuma ficar **muito atrás** do remoto — sempre `git fetch` antes de assumir o que existe.

### Regra de trabalho (definida pelo usuário)
- **Página NOVA / refino de DESIGN visual → o usuário faz** (no Claude Design/Code), pra manter qualidade de design.
- **Claude (esta sessão) faz:** conteúdo/copy, dados (`plans-data.js` etc.), integrações/backend, SEO, `sitemap`/`_redirects`, e **briefs de design** claros em vez de produzir HTML/CSS visual direto.

### Convenções de branch / deploy
- **aura-site:** trabalho na branch `feat/site-v3-reformulacao`. Deploy = `wrangler deploy` (publica Worker **+ assets estáticos juntos**). **Site v3 está SEGURADO** (não deployado) até o design fechar.
- **aura-backend:** convenção do repo = **feature branch → PR → squash merge → Railway auto-deploy do `main`**. Nunca commit direto no main.

### Status legend
✅ feito · 🟡 parcial / pendência · ⬜ a fazer · ⚠️ decisão/bloqueio

---

## 1. Fase 0 — Prep & limpeza ✅
- ✅ Branch `feat/site-v3-reformulacao` criada.
- ✅ Removidos (git rm): pasta legada `/site/`, `precos.html`, `beauty.html`, `pet.html`, `odonto.html`.
- ⬜ **[Sonnet]** Considerar adicionar `.gitignore` com `.claude/settings.local.json` (o `.claude/` hoje fica fora do git, sem ignore explícito).

### 1.1 Higiene técnica / SEO (merge v3.1) — fazer junto, independe do design
Itens de fundação que o audit do site ao vivo pegou e que não dependem do redesign visual:
- ⬜ **[Sonnet]** **Apex → www:** garantir 301 limpo de `getaura.com.br` → `www.getaura.com.br` (no audit, o apex voltou vazio). Confirmar regra no Worker (`src/worker.js`) e/ou `_redirects`.
- ⬜ **[Sonnet]** **Meta description + OG tags** em **todas** as páginas (no v2 o `<head>` só tinha viewport+title → preview pelado no WhatsApp/Google). Padronizar `og:title`, `og:description`, `og:image`, `twitter:card`. *(Imagem OG = item [Usuário/Design].)*
- ⬜ **[Sonnet]** **Analytics + Search Console + sitemap** ativos (sitemap.xml já existe; falta verificação do Search Console e tag de analytics).
- ⬜ **[Sonnet/Copy]** **Caça ao claim "funciona offline"**: grep no v3 (`index.html`, `produto.html`, `negocio.html`) e remover/ajustar onde aparecer, até a contingência real existir.

---

## 2. Fase 1 — Verticais ✅ (com pendências de DESIGN e ajuste v3.1)

**Commit base:** `4089d29` na branch `feat/site-v3-reformulacao`.

### Decisões fechadas (atualizadas v3.1)
- **Verticais finais (v3.1):** **Negócio/Varejo** (carro-chefe + beachhead) + **Aura Studio** (magenta `#E11D74`) + **Aura Dojô** (oxblood `#b8463a`, tema "Shoji"). **~~Food~~ REMOVIDO** (ver 1.2). Beauty/Pet/Odonto já removidos.
- Aura Dojô tem sub-segmento **Aura Karate** (parceiro **FPKT**, **JKA em breve**), design system próprio "Shoji/Kinari" (material em `C:\Users\Caio\Downloads\Aura Karate\`).
- **Preços (fonte da verdade):** Essencial **R$89**, Negócio **R$169**, Expansão **R$269** (cheios, sem centavos).
- **Empacotamento:** as verticais (Studio/Dojô) são **incluídas** nos planos Negócio e Expansão — **não** são add-on. Essencial = base/varejo. *(Reforço v3.1: comunicar a inclusão como diferencial.)*
- **IA: NÃO divulgar no site** (ainda não opera). Removida de todo o marketing.

Feito: `css/verticals.css`, `js/chrome.js`, `js/plans-data.js` + `js/plans-render.js`, `index.html`, `segmentos.html`, `negocio.html`, `produto.html`, `planos.html`, `sobre.html`, `sitemap.xml`, `_redirects`, páginas novas `studio.html` + `dojo.html`. Marketing 100% sem IA e sem verticais antigas.

### 1.2 ⚠️→✅ Remoção do Food (decisão v3.1, confirmada)
Aplicar a decisão "apenas 2 verticais (Studio + Dojô)". Tarefas:
- ⬜ **[Sonnet]** `git rm food.html`. Adicionar em `_redirects`: `/food.html /  301` (e `/food / 301` se houver pretty-URL). Sem 404.
- ⬜ **[Sonnet]** Remover Food de: grid de verticais (`index.html`, `segmentos.html`), `js/chrome.js` (menu), `sitemap.xml`, qualquer card/link em `produto.html`/`planos.html`.
- ⬜ **[Sonnet]** Remover/arquivar `css` e assets específicos de Food (tema/cor) se isolados.
- ⬜ **[Opus]** Na **Fase 5** (features marketing), retirar **Food KDS** do escopo de divulgação.
- ⬜ **[Usuário]** Confirmar que nenhuma campanha/anúncio ativo aponta pra `/food`.

### 1.3 Narrativa do beachhead na home (merge v3.1) — copy
A home hoje lista verticais; precisa **liderar com o fiado do Negócio**. Split de trabalho: Claude escreve a copy/brief, usuário aplica o visual.
- ⬜ **[Claude/Copy]** Brief de hero da home com o ângulo de fiado (rascunho aprovado): H1 *"O sistema da loja que vende fiado — e cobra sozinho pelo WhatsApp."* + sub que cita troca no caixa e grade (o que Kyte/Bling deixam na mão) + suporte humano + preço fixo. CTAs: primário `Começar grátis` (→ `/comecar`), secundário `Chamar no WhatsApp`.
- ⬜ **[Claude/Copy]** Reorganizar a seção de features (`produto.html`/home) nas **3 camadas** (cunha/profundidade/expansão) em vez da grade plana de pilares — Studio/Dojô abaixo da dobra.
- ⬜ **[Usuário]** Aplicar o visual do hero e das 3 camadas.

### 1.4 Headline de preço (merge v3.1) — copy
- ⬜ **[Sonnet/Copy]** Substituir **"Pague pelo que usa"** por **"Seu preço não sobe porque você vendeu mais"** em `planos.html` e onde mais aparecer (grep). Subtexto: *"Escolha o plano pelo tamanho da operação — e acabou. Sem cobrança por pedido, sem surpresa no fim do mês."*

### 🟡 Pendências de DESIGN da Fase 1 (→ usuário / Claude Design)
1. ⬜ **[Usuário]** Refino visual de `studio.html` e `dojo.html` (criadas pelo Claude). Dojô tem seção "Shoji" em papel com `<style>` embutido — checar contraste do nav escuro sobre fundo claro.
2. ⬜ **[Usuário]** **Logo FPKT:** salvar PNG oficial em `assets/karate/fpkt.png` e trocar o badge textual "FPKT" no `dojo.html` (`.sj-partner .badge-fpkt`) por `<img>`. Idem JKA quando vier.
3. ⬜ **[Usuário]** Validar grid de verticais em `index.html` agora com **2 verticais + Negócio** (era 3-col com Food; revalidar layout/responsividade sem o Food).
4. ⬜ **[Usuário — APROVADO]** Enxugar o preview de planos do `index.html` de **5 tiles → 3 tiles**. Bloco hardcoded com `grid-template-columns: repeat(5,1fr)` na seção `data-screen-label="planos-preview"`. **Abordagem (mantém visual atual):** `grid→repeat(3,1fr)`; manter Essencial; manter o tile featured violeta (era "Negócio · Vertical", já com dots e R$169) renomeando p/ **"Negócio"** + link `#negocio`; manter o tile com dots (era "Expansão · Vertical", R$269) renomeando p/ **"Expansão"** + link `#expansao`; **remover** os 2 tiles "plain" sem dots. (index NÃO carrega plans-data/plans-render; `.plan-card` é CSS local do planos.html — por isso editar o bloco hardcoded, não migrar componente.)

> `termos.html`/`privacidade.html`: menções de IA/odonto são **cláusulas jurídicas** — não editar sem revisão legal.

---

## 3. Fase 2 — Formulário → CRM + WhatsApp

**Arquitetura:** o site posta no próprio Worker do Cloudflare (`/api/contact`, mesma origem, zero CORS). O Worker repassa o lead pro backend server-side com token secreto (`x-site-token`) e mantém Resend como registro/fallback.

### 3.1 Backend ✅ DEPLOYADO
- **PR #173** mergeado (squash) → `main` `b26df97`, Railway auto-deployou.
- `src/routes/leadsPublic.js` (novo): `POST /api/v1/public/leads`. Auth `x-site-token === env.SITE_LEADS_TOKEN`; em prod sem token → **503** (falha fechada). Honeypot `_empresa`/`honeypot`. Insere em `sales_leads` (source='site', status='new', expected_plan) + 1 `lead_interaction` (extras: email/empresa/cargo/tipo/mensagem). Transação via `pool.connect`, rate-limit 60/min.
- `src/routes/index.js`: monta `/public/leads`. `src/config/env.js`: add `SITE_LEADS_TOKEN`.
- **SEM migration** (extras vão na interaction; CRM é phone-centric).

### 3.2 Site (Worker) ✅ COMMITADO, ⬜ não deployado
- **Commit:** `f0d0b70` na branch v3.
- `src/worker.js`: `handleContact` → `forwardLeadToCrm()` (primário, header `x-site-token`, timeout 8s) + Resend (registro/fallback). Lê `env.SITE_LEADS_TOKEN` e `env.AURA_API_URL`.
- `index.html`: form do hero agora **real** (`data-form="contact"`, names, honeypot, `.form-error`/`.form-success`, botão "Prefiro o WhatsApp").
- `css/site.css`: estados `.form-success`/`.form-error` (+ `.show`).

### 3.3 Secrets ✅
- `SITE_LEADS_TOKEN` **setado pelo usuário no Railway E no Cloudflare** (mesmo valor; guardado na memória do agente, **fora do repo**).

### 3.4 Teste e2e ✅ PASSOU
POST prod `/api/v1/public/leads`: token correto → **201** `{ok,id}`; token errado → **401**; honeypot → **200** sem id. Row confirmada no Supabase (`sales_leads` source='site' + `lead_interaction` author='Site'). Lead de teste `d29f4e87-b530-4593-83b0-419172553e46`.

### 🟡 Pendências da Fase 2
1. ⬜ **[Usuário]** Apagar o lead de teste `"TESTE e2e Fase 2 (apagar)"` (`d29f4e87…`) do ProspecaoAdmin.
2. ⬜ **[Usuário / deploy]** O **form live só funciona após `wrangler deploy` do v3** (segurado por design). Secret do Cloudflare já pronto. Opcional setar `AURA_API_URL` (tem fallback no código).

---

## 4. Fase 3 — Checkout Trial `/comecar` ✅ (frontend + backend verificados; falta só o deploy do site)

**Objetivo:** auto-cadastro com **trial gratuito sem pagamento**. O visitante cria a conta da empresa e entra no app com o teste rodando.

### 4.1 Decisões fechadas (usuário)
- **Trial: SEMPRE 7 dias.**
- **Plano: SEMPRE Negócio** (usuário NÃO escolhe). → passo "escolher plano" **sai**.
- **Fluxo final = 2 passos:** `CNPJ → Criar conta → ✅ sucesso (redireciona pro app logado)`.
- Gancho de valor: *"7 dias do plano Negócio completo. Grátis, sem cartão."*
- **(Reforço v3.1)** A **vertical NÃO é escolhida no checkout** — coerente com `register` (não aceita `plan`, vertical nunca auto-ativa). A escolha de especialização (Studio/Dojô) é apresentada no **marketing** (`planos.html`, como inclusa) e ativada **dentro do app**, depois. Nada de seletor de vertical no `/comecar`.

### 4.2 Contratos de API (verificados no `main` do backend)

**`POST /api/v1/onboarding/cnpj-lookup`** — body `{cnpj}`
→ `{legal_name, trade_name, company_size, rf_situation, address_street/number/complement/district/city/state/zip, cnae_principal{code}, cnaes_secundarios[], suggested_vertical, is_mei, is_active}`.
Erros: **400** inválido · **422** irregular na RF · **404** não encontrado · **429** limite (10 lookups/h por IP, via Redis).

**`POST /api/v1/auth/register`** — body `{name, email, password(≥8), company_name, phone, cnpj, access_code, terms_accepted(OBRIGATÓRIO), terms_version}`
→ cria `user` + `company` (+ member 'owner') + **JWT**. Retorna user e token.
⚠️ **Não aceita `plan` do cliente** e **só cria trial se o `access_code` tiver `trial_days`** (senão `plan='essencial'`, `trial_ends_at=null`).
⚠️ `suggested_vertical` é só referência p/ pitch — **vertical NUNCA ativa automaticamente**.

### 4.3 Tarefas — ordem de execução

#### T3.1 ✅ FEITO E VERIFICADO — Backend: trial 7d no plano Negócio
Access code **`COMECAR`** existe em prod: `type='trial'`, `plan='negocio'`, `trial_days=7`, `discount_pct=0`, `max_uses=1.000.000`, `is_active=true`, `expires_at=null`. **e2e (09/06):** `POST /auth/register` com `access_code=COMECAR` → `201`, `company.plan='negocio'`, `trial_active=true`, `trial_ends_at` = +7 dias, `code_applied={trial,negocio,7}`. Conta de teste apagada (users/companies/company_members) e `uses` resetado p/ 0. `js/comecar.js` já manda `ACCESS_CODE="COMECAR"`. **Nada a fazer.**

<details><summary>Plano original (mantido p/ histórico)</summary>

O register não dá o trial/plano que queremos. **Resolver assim (preferência: sem deploy de código):**
1. Inspecionar o schema de `access_codes` (colunas e **CHECK de `type`**) via Supabase MCP ou migrations.
2. Criar **1 access code público** — `code` ex. `COMECAR`, `type` não-referral válido, `plan='negocio'`, `trial_days=7`, `discount_pct=0`, `max_uses` alto (ex. 1.000.000), `is_active=true`, `expires_at=null`.
   - O register já mapeia `access_code → plan + trial_days` e cria `trial_ends_at = now + trial_days`. Conta `uses` (por isso `max_uses` alto).
   - ⚠️ Garantir que `type` escolhido **não dispara** o ramo de `referrals` (só `type==='referral'` insere referral).
3. **Se** o schema/regra não permitir essa via, então **alternativa [Opus]:** PR no backend adicionando suporte a `plan` + trial padrão no auto-cadastro (flag tipo `self_serve:true` no body do register), com migration/guarda. Seguir convenção de branch→PR→merge.
4. Documentar qual via foi usada e o `code` final (atualizar este doc + memória).

4. Documentar qual via foi usada e o `code` final (atualizar este doc + memória).
</details>

#### T3.2 ✅ FEITO (fallback v1) — Handoff de sessão pós-register
`js/comecar.js` no sucesso redireciona pra `APP_LOGIN + "?email=<email>&from=comecar"` (login do app com e-mail pré-preenchido) — o fallback aceitável previsto. *(Melhoria futura opcional: usar o JWT/refresh retornado pelo register pra logar direto, sem passar pela tela de login. Não bloqueia o lançamento.)*

#### T3.3 ⬜ [Usuário / Claude Design] — Página `comecar.html` (visual)
Brief completo na seção 4.4. Designer monta o esqueleto visual + ganchos; **não escreve JS de integração**.

#### T3.4 ⬜ [Opus] — `js/comecar.js` (wizard + integração)
Lógica do wizard de 2 passos:
- Máscara de CNPJ; validação client-side; estados loading/erro por passo.
- Passo 1: chama `cnpj-lookup`, trata 400/422/404/429, preenche o card de confirmação (`data-field="legal_name|trade_name|city_uf"`), guarda `company_name = trade_name || legal_name` e o `cnpj`. Link "não tenho CNPJ" → pula pro passo 2 com cadastro manual de empresa.
- Passo 2: valida senha ≥8 e `terms_accepted`; monta o body do `register` **incluindo `access_code` do T3.1** + `terms_version` (versão vigente dos Termos) + `cnpj`/`company_name`.
- Sucesso → tela de sucesso + handoff do T3.2.
- Mostrar/esconder passos por `[data-step]`; barra de progresso.

#### T3.5 ⬜ [Sonnet] — SEO / roteamento
- `comecar.html` na raiz. Adicionar em `_redirects`: `/comecar.html /comecar 301`.
- Adicionar `/comecar` ao `sitemap.xml`.
- `<title>`/`<meta description>` (copy abaixo). Garantir `data-screen-label="Comecar"`.
- CTA "Começar agora" / "Teste grátis" na nav e nos CTAs principais apontando p/ `/comecar` (`js/chrome.js` + páginas) — **[Sonnet]**, mas confirmar com usuário onde colocar. *(v3.1: este é o CTA primário do hero do beachhead — ver 1.3.)*

#### T3.6 ⬜ [Sonnet] — Copy (PRONTA, aplicar)
Já redigida — só inserir nos lugares certos.

### 4.4 BRIEF DE DESIGN — `comecar.html` (entregar ao Claude Design)

**Scaffolding (copiar de `planos.html`):**
```html
<head>
  <link rel="stylesheet" href="/css/tokens.css?v=2">
  <link rel="stylesheet" href="/css/site.css?v=2">
  <link rel="stylesheet" href="/css/verticals.css?v=2">
  <style> /* CSS local do /comecar */ </style>
</head>
<body data-screen-label="Comecar">
  <div data-mount="nav"></div>
  <!-- wizard (2 passos + sucesso) -->
  <div data-mount="footer"></div>
  <div data-mount="wa"></div>
  <script src="/js/plans-data.js"></script>
  <script src="/js/chrome.js"></script>
  <script src="/js/comecar.js"></script>  <!-- Claude escreve -->
  <script src="/js/site.js"></script>
</body>
```
- Tokens/cores do site (violeta `#7c3aed`→`#6d28d9`, fundo `#060816`/`#03050f`, claro `#f5f1ff`). Card destaque = estética de `.plan-card.featured`.
- **Mobile-first**: 1 passo por tela, botão grande, inputs `font-size ≥ 16px` (evita zoom no iOS).
- `.form-error`/`.form-success` já existem no `site.css`.

**Ganchos no DOM (cada passo num container; áreas de erro/resultado já presentes mesmo que `hidden`):**
```html
<section data-step="cnpj">
  <input name="cnpj" id="cnpj" inputmode="numeric">
  <button data-action="cnpj-lookup">Continuar</button>
  <a data-action="skip-cnpj">Ainda não tenho CNPJ / sou autônomo</a>
  <div class="form-error" data-error="cnpj"></div>
  <div data-cnpj-result hidden>
    <span data-field="legal_name"></span>
    <span data-field="trade_name"></span>
    <span data-field="city_uf"></span>
    <button data-action="confirm-cnpj">Confirmar e continuar</button>
  </div>
</section>
<section data-step="conta" hidden>
  <input name="name"><input name="email" type="email">
  <input name="phone" type="tel"><input name="password" type="password">
  <label><input name="terms_accepted" type="checkbox"> Li e aceito os Termos e a Privacidade</label>
  <button data-action="register">Criar conta e começar</button>
  <div class="form-error" data-error="register"></div>
</section>
<section data-step="sucesso" hidden> ... </section>
```
Se preferir outros nomes de `data-*`, mande a versão final que o JS adapta.

**Barra de progresso:** 2 passos (1 CNPJ · 2 Conta).

**COPY (texto final):**
- Hero fixo: **"7 dias do plano Negócio completo. Grátis, sem cartão."**
- Passo 1 título: **"Vamos começar pelo seu CNPJ"** · sub: *"A gente puxa os dados da Receita pra adiantar seu cadastro. Leva 2 segundos."*
- Passo 2 título: **"Falta pouco. Crie seu acesso."** · sub: *"Seu teste de 7 dias no plano Negócio começa agora."*
- Botões: "Continuar" / "Confirmar e continuar" / "Criar conta e começar".
- Link login: *"Já tem conta? Entrar"* → app.
- Sucesso: **"🎉 Conta criada! Seu teste do Negócio está rodando. Redirecionando pro Aura…"**
- `<title>`: *"Começar grátis · Aura — 7 dias do plano Negócio"* · `<meta description>`: *"Crie sua conta Aura e teste o plano Negócio completo por 7 dias. Sem cartão, sem compromisso."*

---

## 5. Fase 4 — Mobile-first ⬜
Auditar e reescrever responsividade onde precisar (o site já tem breakpoints, mas mobile-first "de verdade" é meta explícita).
- ⬜ **[Opus]** Auditoria: rodar em viewport mobile, mapear quebras por página (hero do index, grid de verticais **(agora 2 verticais)**, tabela de planos, páginas novas studio/dojo, novo `/comecar`). Entregar lista priorizada.
- ⬜ **[Sonnet]** Aplicar correções bem-especificadas da auditoria (cada item = arquivo + breakpoint + mudança).
- ⬜ **[Usuário]** Refinos visuais que envolvam decisão de design.

---

## 6. Fase 5 — Novas features (marketing) ⬜
Divulgar features que já existem no produto (**SEM IA**), organizadas pelas **3 camadas de diferencial** (ver decisão estratégica 5):

- **Cunha:** **Crediário (fiado) + cobrança automática WhatsApp**, **troca no caixa**, **grade de tamanhos**, **preço fixo**, **suporte humano**.
- **Profundidade:** PDV/NFC-e, fiscal, financeiro (DRE/conciliação), estoque.
- **Expansão:** **Studio** (customização/impressão: KDS, configurador, aprovação de arte, marketplaces ML/Shopee, loja digital), **Dojô/Karatê** (praticantes, faixas, exames, certificados, **anuidades PIX**), **omnichannel** (Canal Digital, HUB Social).

> **Removido do escopo (v3.1):** ~~Food KDS~~ (vertical Food saiu — ver 1.2).

- ⬜ **[Opus]** Levantar no `aura-app`/`aura-backend` o que de fato está operando em cada feature (não prometer o que não existe). Entregar matriz feature × status. **Confirmar que o claim de offline não retorna aqui.**
- ⬜ **[Sonnet]** Produzir copy/seções por feature conforme a matriz aprovada, já enquadradas na camada correta (cunha/profundidade/expansão).
- ⬜ **[Usuário]** Páginas/seções novas e visual.

---

## 7. Fase 6 — Prova social & fundo de funil ⬜ (merge v3.1)
Depois que a base converte (home reposicionada + checkout no ar), encher de prova e capturar busca de fundo de funil.
- ⬜ **[Usuário/Claude]** **Prova social:** 3 depoimentos + 1 case com números + vídeo de 60s do PDV real. (Claude estrutura/copy; usuário grava/aprova.)
- ⬜ **[Claude/Copy + Usuário/visual]** **Página comparativa "Aura vs. Bling / Kyte / Nex"** nas lacunas documentadas: troca no caixa, grade, fiado com cobrança, suporte humano, **preço fixo vs. cobrança por volume/pedido**.
- ⬜ **[Claude/Copy + Usuário/visual]** **Landing pages de fundo de funil:** (a) *"sistema para loja com crediário que cobra sozinho pelo WhatsApp"*; (b) *"PDV para loja de roupas com grade de tamanhos e troca no caixa"*. São as features que usuários de Kyte/Bling reclamam que faltam e que a Aura já tem.
- ⬜ **[Claude/Copy]** **Blog 2 posts/mês** ancorado nas dores: "como cobrar fiado sem perder o cliente", "quanto sua maquininha desconta de verdade", "NFC-e pra MEI".

---

## 8. Apêndice — fatos-chave
- **Planos (single source):** `js/plans-data.js` (`window.AURA_PLANS`): essencial 89 / negocio 169 (featured, "Mais escolhido") / expansao 269. **Verticais (Studio/Dojô) incluídas em negocio/expansao, sem custo.**
- **Backend `PLAN_PRICES`:** `src/routes/admin.js`; enum `plan_type = essencial|negocio|expansao`.
- **CRM:** `sales_leads` + `lead_interactions`. Admin UI = `components/admin/crm/ProspecaoAdmin.tsx`; serviço `services/crmApi.ts`. Lead do site = `source='site'`, `status='new'`.
- **Secret `SITE_LEADS_TOKEN`:** setado em Railway + Cloudflare; valor **não** versionado (memória do agente).
- **Stash preservado** no `aura-backend`: `stash@{0}` ("wip importData acentos") — alteração cosmética, restaurar ou dropar.
- **Ambiente local:** sem `wrangler`/`railway`/`gh` instalados (só `npx`). `git push` e GitHub via MCP funcionam. Secrets de Railway/Cloudflare só o usuário seta.
- **Motor de cobrança automática (`due_date`/régua):** compartilhado entre crediário do Negócio e anuidade/mensalidade do Dojô — código único, dois usos.

### Mapa rápido Opus vs Sonnet
- **[Opus]** T3.1 (trial/access_code), T3.2 (handoff de sessão), T3.4 (`js/comecar.js`), auditoria mobile (F4), matriz de features (F5), levantamento de fundo de funil (F6), qualquer alternativa que exija PR no backend.
- **[Sonnet]** Higiene/SEO (1.1: apex 301, meta/OG, analytics, caça-offline), remoção do Food (1.2), headline de preço (1.4), T3.5 (SEO/redirects/sitemap/CTAs), T3.6 (aplicar copy), correções mecânicas da auditoria mobile, copy por feature (F5), comparativo/LPs/blog (F6, copy), `.gitignore`.
- **[Claude/Copy]** Hero do beachhead (1.3), reorganização em 3 camadas, copy de comparativo/LPs/blog (F6).
- **[Usuário / Claude Design]** Toda página nova e refino visual (Fase 1 pendências, `comecar.html`, Fases 4/5/6 visuais), gravação de depoimentos/vídeo.

### Changelog
- **v3.2 (sessão 3, 09/06):** auditoria de estado pós-trabalho do usuário. **Recuperado index do git** (estava zerado — `git reset` restaurou do HEAD `f7ff9a3`, nada perdido). **Fase 3 backend verificada e2e** (access code `COMECAR` → trial negocio/7d, conta de teste limpa). Confirmado já-feito: Food removido + redirect `/food→/segmentos` (1.2), headline de preço (1.4), claim offline fora (1.1), apex→www 301 no worker (1.1), analytics 16 págs + OG/meta/canonical 100% (0.1/1.1). Itens 1.1/1.2/1.4 e T3.1/T3.2/T3.4 fechados. **Restante real:** copy beachhead 3-camadas (1.3, se ainda quiser), refinos de design (Fase 1), Fase 4/5/6 conforme prioridade, e o `wrangler deploy` do v3 + apagar lead de teste (Fase 2).
- **v3.1 (09/06):** merge com decisões estratégicas de posicionamento. Food removido (3→2 verticais). Beachhead = Negócio/fiado na home. Headline de preço trocado. Diferenciais em 3 camadas. Higiene/SEO (apex/meta/OG/analytics/offline) formalizada na Fase 0.1. Nova Fase 6 (prova social + fundo de funil). `/comecar` reforçado como plan-fixed sem seletor de vertical.

---

## 9. LOG DE EXECUÇÃO — 09/06/2026 (sessão Fable, v3.2)

### Direção de voz (nova, definida pelo usuário)
Comunicação **descontraída e levemente agressiva**: certeza de que é o melhor produto, melhor custo-benefício, gama completa de features que a concorrência não chega perto. Aplicada em home/produto/planos; replicar nas Fases 5/6.

### Feito nesta sessão
- **0 (.gitignore):** ✅ `.claude/settings.local.json`.
- **1.1 Higiene/SEO:** ✅ apex→www 301 no `src/worker.js` (⚠️ conferir no Cloudflare que o apex está roteado pro Worker — se o DNS do apex não aponta, o audit continua "vazio"). ✅ meta description + canonical + OG/twitter em TODAS as páginas (og-image.png já existia na raiz). ✅ sitemap/robots migrados pra `www.` + `/comecar`. ✅ caça-offline (index, negocio) limpa. ⬜ [Usuário] tag de analytics + verificação Search Console.
- **1.2 Food:** ✅ `git rm food.html`; `/food` e `/food.html` → 301 `/segmentos`; removido de nav (chrome.js + index), grid, marquee, hero showcase, segmentos, planos (dots/tabela/FAQ), studio/negocio/dojo v-others, verticals.css, sitemap.
- **1.3 Hero beachhead:** ✅ aplicado direto (design tasks autorizadas): H1 fiado + sub (troca/grade/suporte/preço fixo), CTA primário `Começar grátis`→`/comecar`, WhatsApp secundário. ✅ features da home reorganizadas nas 3 camadas (cunha/profundidade/expansão) com copy no tom novo.
- **1.4 Headline preço:** ✅ planos.html (H1+meta+lead) e preview da home.
- **Preview de planos 5→3 tiles:** ✅ conforme aprovação (featured "Negócio", "Expansão" com dots 2 cores, plains removidos).
- **Grid verticais:** ✅ 2 colunas (Studio+Dojô) + Negócio featured full-width.
- **Página Dojô:** ✅ substituída pela versão nova (zip), com logo FPKT real em `/assets/karate/logo-fpkt.png` + selo. Sem Food, URLs limpas, OG/canonical www.
- **T3.1:** ✅ access code **`COMECAR`** criado em prod (id `e0dbd510-b58e-4f50-97b5-09382415733e`): type=trial, plan=negocio, trial_days=7, discount 0, max_uses 1.000.000, sem expiração. Register valida is_active/max_uses/expires_at; só type=referral dispara referral. Via sem deploy de backend.
- **T3.2:** ✅ investigado: app web hidrata sessão de `localStorage` (`aura_token`/`aura_refresh_token`) na origem `app.getaura.com.br` → site não consegue injetar sessão cross-origin sem rota SSO. **v1 = fallback do roadmap:** redirect pro login com `?email=` pré-preenchido. Patch aplicado em `aura-app/app/(auth)/login.tsx` (lê `email` via useLocalSearchParams) — **não commitado** (branch `fix/karate-belts-followups` tem WIP de terceiros; commit/deploy com o usuário). Até o app deployar, o redirect funciona e o param é só ignorado.
- **T3.3:** ✅ `comecar.html` integrado do zip (paths raiz, termos/privacidade linkados, OG/canonical, driver demo removido).
- **T3.4:** ✅ `js/comecar.js`: máscaras CNPJ/fone, validação DV do CNPJ, cnpj-lookup (400/404/422/429 com mensagens no tom), skip sem CNPJ (company_name = nome do dono), register com `access_code: 'COMECAR'` + `terms_version: 'v2'` (Termos v2 de 21/05), 409 e-mail existente, sucesso → redirect `app.getaura.com.br/login?email=…&from=comecar`.
- **T3.5:** ✅ `/comecar.html→/comecar` 301, sitemap, CTAs de nav (chrome.js + index + produto + negocio) → `/comecar`.
- **Sobre:** ✅ 4→3 produtos (manifesto, pilares, números, meta).

### ⚠️ Checklist de deploy (usuário)
1. **`ALLOWED_ORIGINS` no Railway precisa incluir `https://www.getaura.com.br`** — sem isso o navegador bloqueia cnpj-lookup/register do `/comecar` por CORS (proxy via Worker foi descartado de propósito: mataria o rate-limit por IP do register, 10/15min).
2. Conferir roteamento do **apex** no Cloudflare (custom domain do Worker).
3. Commit/deploy do patch de login do **aura-app** (prefill `?email=`).
4. Apagar lead de teste `d29f4e87…` (pendência antiga da Fase 2).
5. Analytics + Search Console.
6. `wrangler deploy` quando o design fechar — form da home e `/comecar` só funcionam live depois disso.

### Rate-limits relevantes (verificados no backend)
- cnpj-lookup: 20/h por IP (CGNAT móvel pode dar 429 legítimo — o link "sem CNPJ" cobre).
- register: 10/15min por IP. Global: 300/min.
