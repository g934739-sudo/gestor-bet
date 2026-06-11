# GestorBet — Instruções do Projeto

## Sobre o projeto
GestorBet é um gestor de apostas profissional (SaaS) que roda no navegador. Permite ao apostador executar estratégias com disciplina — calculando stakes automaticamente, aplicando Stop Loss e Stop Win, e exibindo dashboard em tempo real.

**Arquivos de deploy:**
- `index.html` — landing page (entrada do site)
- `login.html` — tela de login e cadastro (redireciona para app.html)
- `app.html` — aplicação principal (gestor de sessões)
- `emails/email-deploy.html` — e-mail de captação de leads
- `emails/email-boas-vindas.html` — e-mail de boas-vindas para novos cadastros
- `emails/email-primeira-compra.html` — e-mail para novos assinantes

**Arquivos legados (não usar no deploy):**
- `site.html`, `saas.html`, `tela-login-cadastro.html` — substituídos pelos acima
- `gestorbet_v3 (1).html` — versão antiga da aplicação

## Stack
- HTML + CSS + JavaScript puro (vanilla), tudo em arquivo único
- Sem frameworks, sem build tools, sem dependências externas
- Fontes: Outfit + JetBrains Mono (Google Fonts)

## Skills disponíveis
Use as skills do Superpowers para trabalhar neste projeto:

| Skill | Quando usar |
|---|---|
| `/brainstorming` | Antes de adicionar uma feature nova |
| `/writing-plans` | Para dividir uma tarefa complexa em passos |
| `/executing-plans` | Para executar um plano já escrito |
| `/systematic-debugging` | Para investigar um bug |
| `/verification-before-completion` | Antes de entregar qualquer alteração |
| `/requesting-code-review` | Para revisar código alterado |
| `/test-driven-development` | Para desenvolver com TDD |
| `/using-git-worktrees` | Para trabalhar em branches isoladas |
| `/subagent-driven-development` | Para tarefas grandes com subagentes |
| `/dispatching-parallel-agents` | Para rodar agentes em paralelo |
| `/finishing-a-development-branch` | Para finalizar e limpar uma branch |
| `/writing-skills` | Para criar novas skills customizadas |

## Convenções
- Manter tudo em arquivo único (HTML + CSS + JS inline)
- CSS com variáveis CSS (`--gold`, `--green`, `--red`, etc.)
- Tema escuro com paleta: `#09090f` (bg), `#f0c040` (gold), `#1fd97a` (green), `#f5445f` (red)
- Textos em português (pt-BR)
- Moeda em Real (R$)
