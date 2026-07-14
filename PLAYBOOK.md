# PLAYBOOK — Lançamento de projeto SaaS (modelo Grivo.bet)

> **Para o Claude:** este arquivo é um roteiro operacional. Quando o usuário disser
> "siga o PLAYBOOK" (ou similar) num projeto novo, você o **conduz** por estas
> etapas — não apenas descreve. Faça o **Intake** primeiro, respeite a **ordem de
> dependências**, e trate cada bloco `⚠ GUARDRAIL` como regra inviolável.
> A stack de referência é grivo.bet: HTML estático + Vercel Serverless + Supabase.
>
> **Para nós (humanos):** a versão visual e navegável deste playbook é o artifact
> "Playbook de Lançamento v2". Este `.md` é a fonte de verdade versionada.

---

## Como manter este playbook atualizado

**Este arquivo (no repo do grivo) é a FONTE DE VERDADE única.** O artifact visual e
as cópias em outros projetos (`CLAUDE.md`) são derivados — nunca o contrário.

- **Toda melhoria entra aqui primeiro.** Aprendeu uma cilada nova, trocou uma
  ferramenta, faltou um passo? Atualize este `PLAYBOOK.md`, comite, e regenere o
  artifact visual (mesmo link).
- **Aprendizado em outro projeto volta pro mestre.** Se algo novo surgir enquanto
  roda um projeto derivado, traga a melhoria de volta para cá — senão a cópia
  fica boa e o mestre envelhece.
- **Cada projeto novo copia a versão mais recente** deste arquivo (como `CLAUDE.md`).
- **Fluxo prático:** basta dizer ao Claude *"adiciona ao playbook: …"* em linguagem
  normal — ele edita o `.md`, comita e atualiza o artifact numa tacada.

---

## 0. Intake — pergunte ANTES de começar

Colete estas respostas do usuário e preencha a tabela de **Variáveis do projeto**.
Não assuma defaults sem confirmar preço, domínio e escopo.

1. **Nome e domínio** do projeto? (ex.: `grivo.bet`)
2. **Nicho / posicionamento** e há restrição de compliance? (ex.: apostas → 18+, jogo responsável)
3. **Planos e preços** (id, valor em centavos, duração em dias). Ex.: `semanal / 8700 / 7`.
4. **Identidade** — tom de voz, cores, headline/posicionamento (ex.: "método > sorte").
   Registre aqui **o que foi decidido** (o visual nasce no Claude Design, mas e-mails
   e anúncios precisam da mesma identidade — este é o lugar único de referência).
5. **Quais módulos se aplicam?** (todo projeto usa Infra + Analytics + Sentry; pagamento/e-mail/login só se vende algo online)
6. **Contas já existentes?** (Vercel, Supabase, PushinPay, Resend, domínio registrado)
7. **Vai anunciar no Meta?** Se sim, avise que o perfil/BM precisa aquecer 2–4 semanas — começar já.

---

## Variáveis do projeto (preencher no início)

| Variável | Valor | Onde é usada |
|---|---|---|
| Domínio | `_______` | webhook_url, e-mails, CTAs |
| Nome de exibição | `_______` | e-mails, título |
| GA4 Measurement ID | `G-_______` | tag no template |
| Clarity Project ID | `_______` | tag no template |
| Sentry DSN (back) + key (front) | `_______` | `_sentry.js` + loader |
| Planos (id/centavos/dias) | `_______` | `api/_plans.js` |
| Remetente de e-mail | `noreply@dominio` | `api/_resend.js` |

---

## Ordem de dependências (o mapa)

Faça **nesta ordem**. Os itens marcados 🕒 têm prazo longo — dispare no **dia 1** em paralelo, senão travam o lançamento.

```
🕒 Domínio + DNS ─────┐
🕒 Verificação Resend ─┤ (24–48h)
🕒 Perfil/BM Meta ─────┘ (2–4 semanas, se for anunciar)

Dia 1 ─► Domínio/Repo/Vercel ─► Supabase ─► Pagamento(/api) ─► E-mail
                                                    │
        Analytics ─► Sentry ─► Suporte+Legal ─► Marketing
```

Regra de dependência dura:
- **Pagamento (webhook)** exige **domínio no ar** (a PushinPay chama `dominio/api/webhook`).
- **E-mail transacional** exige **domínio verificado no Resend**.
- **Meta Ads** exige **perfil aquecido**.

---

## Módulo 00 — Estrutura de pastas & setup do Claude Code

Monte este esqueleto **antes de codar**. Regra de ouro: **na raiz fica só o que
é servido publicamente + configs; o resto vai pra `docs/`.** (Host estático serve
tudo o que está na raiz — arquivo de rascunho na raiz vira URL pública sem querer.)

```
projeto/
├── CLAUDE.md            ← briefing curto DESTE projeto (auto-carregado pelo Claude)
├── vercel.json          ← config de deploy
├── package.json
├── index.html · login.html · checkout.html · app.html · ...   ← páginas servidas
├── api/                 ← funções serverless
├── docs/                ← NÃO servido: PLAYBOOK, planejamento, rascunhos
│   └── PLAYBOOK.md
└── .claude/
    ├── settings.json        ← permissões, hooks, modelo (compartilhado, versionado)
    ├── settings.local.json  ← overrides pessoais (NÃO comitar)
    ├── skills/              ← (opcional) habilidades auto-disparadas
    └── commands/            ← (opcional) slash commands de fluxos repetidos
```

**O que criar (enxuto — o que dá retorno):**
- **`CLAUDE.md`** (raiz) — briefing curto do projeto, criado durante a obra. Deve ter:
  stack, como fazer deploy, os `⚠ GUARDRAIL` deste projeto, onde ficam env vars e
  o modelo de dados. É o que me deixa rápido e seguro em toda sessão futura.
- **`.claude/settings.json`** — permissões e configs do time (versionado).
- **`docs/`** — tudo que é referência e não deve ir pro ar.

> **⚠ GUARDRAIL — não jogue rascunho na raiz**
> Qualquer `.html` de planejamento/rascunho na raiz fica **público** (`dominio/rascunho.html`).
> Rascunhos, planejamento e este PLAYBOOK vão em `docs/`.

**O que PULAR num projeto solo/pequeno (over-engineering):**
- `.claude/agents/`, `.claude/hooks/`, `.claude/rules/` — estrutura de time grande.
  Adicione só quando houver dor real que justifique.
- Nota técnica: `.claude/rules/` **não é auto-carregado** nativamente — se um dia usar,
  referencie os arquivos a partir do `CLAUDE.md`. (Muito infográfico mistura convenção
  com feature nativa; o que é auto-carregado de fato é `CLAUDE.md`, `skills/`, `commands/`,
  `agents/` e `.mcp.json`.)

**Diferença CLAUDE.md × PLAYBOOK.md** (não confundir):
- `PLAYBOOK.md` = como **construir** um projeto novo (este arquivo). Referência de obra.
- `CLAUDE.md` = briefing de **manutenção** de um projeto pronto. Nasce durante a obra e fica.

---

## Módulo 01 — Infraestrutura & Site

**Ações**
- Registrar domínio, criar repo, conectar na Vercel (deploy automático no `git push` da `main`).
- Copiar `vercel.json` (cleanUrls + rewrites + headers CORS em `/api/*`).
- Instalar chat de suporte (LiveChat) com carregamento adiado.
- **SEO/OG básico** em cada página: `<title>`, `<meta name="description">`, tags
  Open Graph (`og:title`, `og:description`, `og:image`) e favicon. É o que faz o
  link aparecer bonito (com imagem) quando compartilhado no WhatsApp/redes.

**Reaproveitar do grivo:** `vercel.json`, `scripts/aplicar-fixes-index.js`.

> **⚠ GUARDRAIL — bundler descarta tags do `<head>`**
> O site é renderizado por bundler: o HTML real vive dentro de
> `<script type="__bundler/template">`. Tag colada no `<head>` externo é
> descartada. Injete analytics/pixel **no template**, escapando
> `</script>` → `<\/script>`. Rode `aplicar-fixes-index.js` a cada nova
> exportação do index (ela reseta os fixes).

---

## Módulo 01.5 — Produto (a parte interna do SaaS)

**A única parte NÃO copiável do playbook.** Todo o resto (infra, pagamento, e-mail,
analytics) é igual em qualquer projeto — por isso vira receita. O **produto em si**
(no grivo: estratégias, modo simulação, dashboard de banca) é **único de cada projeto**
e se constrói sob medida, não por copiar-e-colar.

**Como construir** (fluxo normal, não "seguir módulo"):
- Brainstorm das features → design → build (de preferência com testes).
- Vive em `app.html` (+ o que o produto exigir).

**Onde encaixa na ordem:**
- **Depois** do Módulo 00 (estrutura), **em paralelo** com o site de marketing (Módulo 01).
- O **"portão" é login + pagamento**: pode construir o produto enquanto o portão amadurece;
  no fim eles se conectam (pagou → libera → `app.html`).

> **⚠ GUARDRAIL — o produto precisa checar acesso**
> Não basta ter a página `app.html`; ela tem que **verificar login + plano ativo**
> (`plano_expira_em` no futuro) antes de liberar o conteúdo. Senão qualquer um acessa
> o produto sem pagar. O acesso é sempre validado no carregamento do app.

---

## Módulo 02 — Pagamentos (Pix)

**Ações**
- Copiar as funções: `criar-pix.js`, `consultar-pix.js`, `webhook-pushinpay.js`, `_plans.js`.
- Ajustar `_plans.js` com os planos do projeto e `webhook_url` com o novo domínio.
- Configurar env `PUSHINPAY_TOKEN`.

**Reaproveitar do grivo:** `api/criar-pix.js`, `api/consultar-pix.js`, `api/webhook-pushinpay.js`, `api/_plans.js`.

> **⚠ GUARDRAIL — 4 regras de pagamento (nunca omitir)**
> 1. **Preço sempre no servidor** — recalcule por `plan_id` (`_plans.js`); ignore qualquer `value` do navegador.
> 2. **Nunca confie no corpo do webhook** — confirme direto na PushinPay (`GET /transactions/{id}`) **e** confira o valor pago vs. preço do plano.
> 3. **Registre no banco ANTES de mostrar o QR** — sem o registro, o webhook não libera acesso.
> 4. **Valide o UUID** na querystring (`/^[0-9a-f-]{36}$/`) — evita injeção no PostgREST.
>
> **⚠ GUARDRAIL — serverless congela**
> Responda o webhook em <2s e processe em `waitUntil()`. Use **claim atômico**
> (`pendente→processando`) contra duplicação e uma **rede de segurança** no
> polling (`consultar-pix`) que reconcilia pagamentos órfãos. Ninguém pode
> pagar e não receber acesso.

---

## Módulo 03 — Contas & E-mail

**Ações**
- Copiar `_resend.js` + os templates inline (boas-vindas, dados de acesso).
- Copiar `reset-senha.js` + `redefinir-senha.js`.
- Verificar domínio no Resend (SPF/DKIM no DNS) 🕒 e ajustar remetente.
- Env: `RESEND_API_KEY`.

**Reaproveitar do grivo:** `api/_resend.js`, `api/reset-senha.js`, `api/redefinir-senha.js`, templates no `webhook-pushinpay.js`.

> **⚠ GUARDRAIL — ciladas de e-mail & Auth**
> - O `admin/users?email=` do Supabase **NÃO filtra** — devolve lista inteira paginada. Pagine e compare o e-mail na mão; nunca use `users[0]`.
> - Gmail quebra imagem base64; ActiveCampaign re-hospeda imagem externa → em e-mail crítico use **CSS puro** ou imagem no próprio domínio.
> - Envie e-mails **sequenciais com pausa** (~1,5s), não em paralelo, pra manter a ordem na caixa.

---

## Modelo de dados (Supabase)

Criar **antes** do módulo de pagamento.

**Tabela `pagamentos`:** `payment_id` (uuid), `email`, `name`, `plan_id`, `value` (int, centavos), `status` (`pendente`→`processando`→`pago`), `created_at`.

**Tabela `usuarios`:** `id` (uuid = `auth.users`), `email`, `nome`, `sobrenome`, `plano`, `plano_expira_em`, `senha_trocada` (bool).

- Auth nativo do Supabase (Admin API para criar usuário + senha provisória).
- **Renovação empilha:** se o plano ainda é válido, some a duração a partir da expiração atual (não de hoje).

> **⚠ GUARDRAIL — RLS ligado (senão vaza dados dos clientes)**
> O frontend usa a chave **publishable** (`sb_publishable_...`), que respeita o RLS.
> Se o **Row Level Security** não estiver ligado nas tabelas, **qualquer pessoa lê
> a tabela `usuarios` inteira** (e-mails de todos) só com a chave pública. Ligue RLS
> em `usuarios` e `pagamentos` e crie políticas mínimas (cada usuário só vê a própria
> linha; escrita só pelo backend com a service key).
> **Também:** service key **nunca** no front; segredos só na Vercel; `.env` no `.gitignore`.
>
> **Como auditar** (sem login, deve voltar `[]` mesmo com tabela cheia):
> ```
> curl "$SUPA_URL/rest/v1/usuarios?select=email&limit=5" -H "apikey: $PUBLISHABLE_KEY"
> ```
> Se voltar linhas → RLS desligado → corrija antes de qualquer coisa.

---

## Módulo 04 — Analytics & Medição

**Ações** (injetar todas no template do bundler)
- GA4 — pedir Measurement ID; eventos `purchase` + `begin_checkout` no checkout.
- Microsoft Clarity — pedir Project ID.
- Vercel Web Analytics + Speed Insights.

> **⚠ GUARDRAIL — passos de painel que a tag não resolve**
> Colar a tag não basta. Lembre o usuário de: (1) **marcar `purchase` como
> evento-chave/conversão** no GA4; (2) **ativar** Web Analytics/Speed Insights
> no dashboard da Vercel.

---

## Módulo 05 — Monitoramento de Erros

**Ações**
- Front: Loader Script do Sentry no `<head>` de todas as páginas (via template).
- Back: copiar `_sentry.js`, envolver os handlers com `withSentry()`, capturar erros do `waitUntil`.
- Env: `SENTRY_DSN`.
- Integrações de painel (usuário): Sentry ↔ GitHub, e regra de alerta Sentry → Slack (`A new issue is created` → canal).

**Reaproveitar do grivo:** `api/_sentry.js` e o padrão `withSentry(handler)`.

> **⚠ GUARDRAIL — `flush()` em serverless**
> O Sentry precisa de `await flush()` antes do retorno, senão a Vercel congela
> e o erro nunca é enviado. `withSentry()` já cuida disso.

---

## Módulo 06 — Suporte & Legal

- LiveChat, página de **Termos**, **Privacidade**.
- Se o nicho exigir: avisos **18+ / jogo responsável / CVV 188** no rodapé e e-mails.
- **LGPD:** política de privacidade deve dizer quais dados coleta, por quê, e como
  o cliente pede exclusão. Ter um contato para solicitações de dados.
- **Reembolso:** política clara. No Brasil (CDC art. 49), compra online dá **direito
  de arrependimento em 7 dias**. Deixar explícito nos Termos como funciona.

---

## Módulo 07 — Marketing & Aquisição

- ManyChat (palavras-chave + 1ª mensagem).
- UTMs em WhatsApp/e-mail.
- **Meta Pixel** — injetar o código-base (`PageView`) no template do bundler +
  eventos `InitiateCheckout` (PIX gerado) e `Purchase` (pagamento confirmado, com
  `value` em reais + `currency: BRL`), espelhando o GA4. Reinjetar via `aplicar-fixes`.
  Depois, **verificar o domínio no Gerenciador de Eventos** (necessário antes de anunciar).
- **API de Conversões (CAPI)** 🕒 — rastreamento server-side: manda o `Purchase`
  do **webhook** (backend) direto pro Meta, com `event_id` igual ao do Pixel pra
  deduplicar. Mais robusto (resiste a bloqueador/iOS). Só vale **quando for rodar
  anúncio**; precisa de token de acesso do Meta.
- Meta Ads 🕒 — ângulo **método/gestão**, nunca promessa de ganho (reprova + ban).

---

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

Nunca comitar no código.

| Variável | Serve para |
|---|---|
| `PUSHINPAY_TOKEN` | Criar/consultar cobranças Pix |
| `SUPABASE_URL` | Endereço do banco |
| `SUPABASE_SERVICE_KEY` | Gravar no back + Admin API do Auth (só backend) |
| `RESEND_API_KEY` | E-mails transacionais |
| `SENTRY_DSN` | Projeto Sentry no backend |

---

## Mapa de custos (referência)

| Serviço | Início | Passa a pagar |
|---|---|---|
| Vercel | Grátis (Hobby) | Pro ~US$20/mês |
| Supabase | Grátis | Pro ~US$25/mês (>500MB / 50k usuários) |
| PushinPay | Taxa % por Pix | Variável desde o 1º pagamento |
| Resend | Grátis (3k/mês) | ~US$20/mês |
| Sentry | Grátis (5k erros) | Volume alto |
| Clarity · GA4 | Grátis | — |
| LiveChat | Trial | ~US$20/agente/mês |
| Domínio | ~R$40/ano | Renovação anual |

---

## 🚦 Gate de lançamento (teste de fumaça antes de abrir as portas)

Não mande tráfego sem passar por TODOS. É a diferença entre "deployei" e "posso receber dinheiro".

- [ ] **1 pagamento Pix real** (valor baixo) ponta a ponta → conta criada **e** os 2 e-mails chegaram.
- [ ] **Reset de senha** testado de verdade (recebe e-mail, redefine, loga).
- [ ] **Env vars conferidas em produção** (erro nº 1: funciona local, quebra no ar por variável faltando).
- [ ] **Mobile** — abrir o site no celular; checkout e QR Code funcionam.
- [ ] **Páginas legais** (Termos/Privacidade) linkadas e abrindo; **404** funcionando.
- [ ] **RLS auditado** (ver guardrail do Modelo de dados) → tabelas não vazam sem login.
- [ ] **Sentry recebendo** (forçar 1 erro e ver cair no Slack).

---

## 🆘 Runbook de incidente (quando quebrar em produção)

Meia página de "se X, faça Y" — pra não travar às 23h.

- **Deploy novo quebrou o site** → Vercel → projeto → Deployments → deploy anterior
  que funcionava → **Instant Rollback**. Volta no ar em segundos.
- **Commit ruim** → `git revert <hash>` + push (deploy automático corrige).
- **Cliente pagou e não recebeu acesso** → a rede de segurança (`consultar-pix`)
  reconcilia sozinha em ~30s; se não, checar Sentry pelo erro e o status na tabela
  `pagamentos` (deve estar `pago`). Reprocessar é idempotente (claim atômico).
- **PushinPay/Resend/Supabase fora do ar** → o erro aparece no Sentry; comunicar
  suporte e aguardar o serviço voltar (não há fix de código).
- **Sempre:** o Sentry é o primeiro lugar pra olhar — ele diz o quê, onde e quando.

---

## Divisão de trabalho

- **Claude faz** (código): site, funções `/api`, e-mails, injeção de analytics/Sentry no template, `_plans`, `vercel.json`.
- **Usuário faz** (painéis, não automatizável): criar contas, configurar DNS, env vars na Vercel, marcar conversão no GA4, ativar Vercel Analytics, integrar Sentry↔GitHub/Slack, aquecer perfil Meta.

---

_Gerado a partir do stack real do grivo.bet. Mantê-lo atualizado a cada novo aprendizado._
