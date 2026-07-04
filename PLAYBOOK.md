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

## 0. Intake — pergunte ANTES de começar

Colete estas respostas do usuário e preencha a tabela de **Variáveis do projeto**.
Não assuma defaults sem confirmar preço, domínio e escopo.

1. **Nome e domínio** do projeto? (ex.: `grivo.bet`)
2. **Nicho / posicionamento** e há restrição de compliance? (ex.: apostas → 18+, jogo responsável)
3. **Planos e preços** (id, valor em centavos, duração em dias). Ex.: `semanal / 8700 / 7`.
4. **Quais módulos se aplicam?** (todo projeto usa Infra + Analytics + Sentry; pagamento/e-mail/login só se vende algo online)
5. **Contas já existentes?** (Vercel, Supabase, PushinPay, Resend, domínio registrado)
6. **Vai anunciar no Meta?** Se sim, avise que o perfil/BM precisa aquecer 2–4 semanas — começar já.

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

## Módulo 01 — Infraestrutura & Site

**Ações**
- Registrar domínio, criar repo, conectar na Vercel (deploy automático no `git push` da `main`).
- Copiar `vercel.json` (cleanUrls + rewrites + headers CORS em `/api/*`).
- Instalar chat de suporte (LiveChat) com carregamento adiado.

**Reaproveitar do grivo:** `vercel.json`, `scripts/aplicar-fixes-index.js`.

> **⚠ GUARDRAIL — bundler descarta tags do `<head>`**
> O site é renderizado por bundler: o HTML real vive dentro de
> `<script type="__bundler/template">`. Tag colada no `<head>` externo é
> descartada. Injete analytics/pixel **no template**, escapando
> `</script>` → `<\/script>`. Rode `aplicar-fixes-index.js` a cada nova
> exportação do index (ela reseta os fixes).

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

---

## Módulo 07 — Marketing & Aquisição

- ManyChat (palavras-chave + 1ª mensagem).
- UTMs em WhatsApp/e-mail.
- Meta Pixel (injetar no template quando a conta liberar).
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

## Divisão de trabalho

- **Claude faz** (código): site, funções `/api`, e-mails, injeção de analytics/Sentry no template, `_plans`, `vercel.json`.
- **Usuário faz** (painéis, não automatizável): criar contas, configurar DNS, env vars na Vercel, marcar conversão no GA4, ativar Vercel Analytics, integrar Sentry↔GitHub/Slack, aquecer perfil Meta.

---

_Gerado a partir do stack real do grivo.bet. Mantê-lo atualizado a cada novo aprendizado._
