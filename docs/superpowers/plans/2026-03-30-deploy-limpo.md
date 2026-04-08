# GestorBet Deploy Limpo — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Organizar o projeto para deploy estático limpo, com navegação funcionando entre landing page → login → app.

**Architecture:** Site estático de 3 páginas (index, login, app) + templates de e-mail separados. Sem backend — login redireciona direto para o app (MVP).

**Tech Stack:** HTML + CSS + JS vanilla, deploy estático (Netlify / Vercel / GitHub Pages)

---

## Estrutura final de arquivos

```
gestor-bet/
├── index.html              ← landing page (era site.html)
├── login.html              ← login/cadastro (era tela-login-cadastro.html)
├── app.html                ← aplicação (era saas.html)
├── emails/
│   ├── email-deploy.html
│   ├── email-boas-vindas.html
│   └── email-primeira-compra.html
├── docs/
│   └── superpowers/plans/
│       └── 2026-03-30-deploy-limpo.md
└── CLAUDE.md
```

---

### Tarefa 1: Criar index.html (cópia de site.html)

**Arquivos:**
- Criar: `index.html` (cópia de `site.html`)

- [ ] Copiar `site.html` para `index.html`
- [ ] Verificar que o link "Entrar na plataforma" aponta para `login.html` ✓ (já está correto)

---

### Tarefa 2: Criar login.html (cópia de tela-login-cadastro.html)

**Arquivos:**
- Criar: `login.html` (cópia de `tela-login-cadastro.html`)
- Modificar: função `onLogin` para redirecionar para `app.html`

- [ ] Copiar `tela-login-cadastro.html` para `login.html`
- [ ] Alterar `onLogin` para redirecionar após login:
  ```js
  function onLogin(e) {
    e.preventDefault();
    window.location.href = 'app.html';
  }
  ```
- [ ] Alterar `onReg` para redirecionar após cadastro:
  ```js
  function onReg(e) {
    e.preventDefault();
    window.location.href = 'app.html';
  }
  ```

---

### Tarefa 3: Criar app.html (cópia de saas.html)

**Arquivos:**
- Criar: `app.html` (cópia de `saas.html`)

- [ ] Copiar `saas.html` para `app.html`

---

### Tarefa 4: Mover e-mails para pasta /emails

**Arquivos:**
- Criar: `emails/email-deploy.html`
- Criar: `emails/email-boas-vindas.html`
- Criar: `emails/email-primeira-compra.html`

- [ ] Copiar `email-deploy.html` → `emails/email-deploy.html`
- [ ] Copiar `email boas-vindas.html` → `emails/email-boas-vindas.html`
- [ ] Copiar `email primeira compra.html` → `emails/email-primeira-compra.html`

---

### Tarefa 5: Atualizar CLAUDE.md

- [ ] Atualizar lista de arquivos no CLAUDE.md com a nova estrutura

---

## Arquivos a ignorar no deploy
- `site.html` (substituído por `index.html`)
- `saas.html` (substituído por `app.html`)
- `tela-login-cadastro.html` (substituído por `login.html`)
- `gestorbet_v3 (1).html` (versão antiga)
- `email boas-vindas.html` (movido para /emails)
- `email primeira compra.html` (movido para /emails)
- `email-deploy.html` (movido para /emails)
