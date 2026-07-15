# CLAUDE.md — Grivo.bet

Briefing do projeto para o Claude. Para o roteiro replicável de lançamento
(usado ao criar **projetos novos**), veja `PLAYBOOK.md` — este arquivo é só sobre
o grivo em si.

## O que é
SaaS de gestão de banca para apostadores (tema dark + dourado, posicionamento
"método > sorte", +18/jogo responsável). Planos: **semanal R$87 / mensal R$147**,
pagos via **Pix (PushinPay)**. Domínio: grivo.bet (Vercel).

## Stack
- **Frontend:** HTML estático; checkout em React via Babel no navegador (`checkout.jsx`). Sem build.
- **Backend:** Vercel Serverless Functions em `api/` (Node).
- **Dados/Auth:** Supabase — tabelas `usuarios` e `pagamentos` + Auth nativo.
- **E-mail:** Resend · **Erros:** Sentry (front + back) · **Analytics:** GA4 (gtag direto, sem GTM) + Clarity + Vercel + Meta Pixel.

## Deploy
`git push` na `main` → a Vercel auto-deploya (projeto "gestor-bet" → grivo.bet).
**Só comitar/pushar quando o usuário pedir.** Mensagens/UI/commits em português.

## Guardrails (não violar)
- **Bundler:** `index.html` é client-rendered; o HTML real vive em
  `<script type="__bundler/template">`. Tag no `<head>` externo é **descartada** — injetar
  no template escapando `</script>` → `<\/script>`. Ao subir nova versão do site,
  rodar `scripts/aplicar-fixes-index.js` (reaplica links, analytics, Pixel, Sentry, LiveChat).
- **Pagamento:** preço sempre recalculado no servidor (`api/_plans.js`); nunca confiar no
  corpo do webhook (confirmar na PushinPay + conferir valor); `waitUntil` + claim atômico
  (`pendente→processando`) + rede de segurança em `consultar-pix`. Ninguém paga sem receber acesso.
- **Supabase:** RLS ligado (o front usa a **publishable key**). A **service key** só no backend, nunca no front.
- **Acesso ao produto:** `app.html` checa `plano_expira_em`; se expirado → `checkout.html?expired=1`.
  Login é permanente; o que expira é o acesso. Renovação é manual (novo Pix empilha o período).
- **Serverless:** sempre `await flush()` (Sentry) / `waitUntil()` antes da função retornar — senão a Vercel congela.

## Onde ficam as coisas
- `api/` — funções (criar-pix, consultar-pix, webhook-pushinpay, reset-senha, redefinir-senha).
  Helpers: `api/_plans.js`, `api/_resend.js`, `api/_sentry.js`.
- **Segredos** (`PUSHINPAY_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`, `SENTRY_DSN`):
  **na Vercel** (Settings → Environment Variables), **não** no repo.
- `PLAYBOOK.md` — roteiro de lançamento + histórico das decisões e ciladas.
