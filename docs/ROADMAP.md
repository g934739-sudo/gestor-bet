# GestorBet — Roadmap de Lançamento

## O que desenvolver aqui no Claude

### Site
- [x] `site.html` — Landing page
- [x] `tela-login-cadastro.html` — Tela de login e cadastro
- [x] `saas.html` — Aplicação (o produto)

### E-mails
- [x] `email-deploy.html` — E-mail de marketing para leads
- [x] `email boas-vindas.html` — E-mail automático pós-cadastro
- [x] `email primeira compra.html` — E-mail automático pós-assinatura
- [x] `email-recuperacao.html` — E-mail de recuperação de senha
- [x] `email-cobranca.html` — E-mail de cobrança/renovação da assinatura

### Páginas extras
- [x] `404.html` — Página de erro
- [x] `termos.html` — Termos de uso
- [x] `privacidade.html` — Política de privacidade

---

## Conexões entre os arquivos

```
site.html
  └─→ tela-login-cadastro.html
        ├─→ [cadastro] → dispara email boas-vindas.html
        └─→ [login]    → saas.html (o app)

saas.html
  └─→ [assinar plano] → página de pagamento (externo)
        └─→ [pago] → dispara email primeira compra.html

email-deploy.html
  └─→ [CTA] → site.html ou tela-login-cadastro.html
```
