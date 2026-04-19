# Design Spec — Landing Page + Login Page Redesign
**Data:** 2026-04-17
**Arquivos:** `index.html`, `login.html`

## Objetivo
Redesenhar do zero a landing page e a tela de login do GestorBet com identidade visual mais forte, tom comercial/persuasivo e foco em conversão. Estilo fintech moderna — limpa, confiante, energética.

---

## Identidade Visual

- **Paleta:** mantida do projeto (`#09090f` bg, `#f0c040` gold, `#1fd97a` green, `#f5445f` red)
- **Fontes:** Outfit (sans) + JetBrains Mono (mono) via Google Fonts
- **Hero:** gradiente radial sutil em gold no fundo para profundidade
- **Headlines:** Outfit 800, `clamp(56px, 6vw, 80px)`, palavras-chave em gold
- **Cards:** `border: 1px solid rgba(255,255,255,.07)`, glassmorphism leve nos elementos flutuantes
- **Ticker:** faixa animada com nomes das estratégias deslizando (scroll infinito)
- **Stack:** HTML + CSS + JS vanilla, arquivo único por página

---

## index.html — Landing Page

### Navbar (fixo)
- Logo GestorBet (mark quadrado gold + texto)
- Links: Funcionalidades · Estratégias · Planos
- Botão "Entrar" (ghost) → `login.html`
- Fundo transparente, escurece com scroll

### 1. Hero
- Layout: 2 colunas (texto esquerda, mock app direita)
- Headline: "Pare de apostar no escuro. / Gerencie sua banca como um profissional."
- Subheadline: "Estratégias automáticas, Stop Loss inteligente e dashboard em tempo real — para cassino e apostas esportivas."
- CTA primário (gold): "Começar agora — grátis por 7 dias" → `login.html`
- CTA secundário (ghost): "Ver como funciona ↓"
- Prova social inline: avatares sobrepostos + "Mais de 3.200 apostadores já usam"
- Mock do app: UI simplificada do app.html com animação float
- Fundo: gradiente radial gold sutil

### 2. Barra de Prova Social
- Fundo: `--s1`
- 4 métricas em linha: `3.200+` Apostadores ativos · `18` Estratégias · `R$ 2,4M` Gerenciados · `94%` Satisfação
- Ticker abaixo: scroll infinito com nomes de estratégias separados por `·`

### 3. Como Funciona
- 3 cards horizontais conectados por linha
- Fundo: `--s1`
- ① Escolha sua estratégia — 18+ estratégias testadas para cassino e esportivo
- ② Configure sua banca — Stop Loss, Stop Win e stake automático
- ③ Jogue com disciplina — sistema para automaticamente nos seus limites
- Ícone minimalista em gold para cada passo

### 4. Estratégias e Modos de Jogo
- Duas abas: `Cassino` | `Esportivo` com troca via JS
- Grid 3 colunas de cards com: nome, descrição 1 linha, badge de risco
  - Cassino: Martingale, Fibonacci, D'Alembert, Kelly, Paroli, Flat Bet
  - Esportivo: Value Bet, Back/Lay, Handicap Asiático, Dutching, Kelly Esportivo, Flat Esportivo
  - Badges: `Conservador` (green) / `Moderado` (gold) / `Agressivo` (red)
- Banner horizontal abaixo: fundo gold-dim, texto sobre recomendação por perfil

### 5. Features / Vantagens
- Grid 3x2 de cards com ícone SVG inline, título e descrição 1 linha
- Hover: `translateY(-4px)` + borda gold
- Features: Cálculo automático de stake · Stop Loss & Stop Win · Dashboard em tempo real · Cassino + Esportivo · 18+ estratégias · Histórico completo

### 6. Planos
- 3 cards: Starter (R$97/mês) · Pro (R$297/mês) · Elite (R$597/mês)
- Card Pro: centralizado, elevado, badge "Mais popular", borda gold
- Linhas por plano: estratégias disponíveis, sessões/mês, cassino+esportivo, suporte
- CTA: botão gold no Pro, ghost nos outros → `login.html`
- Rodapé da seção: "Pagamento seguro · Cancele quando quiser · 7 dias grátis"

### 7. Depoimentos
- 3 cards em linha
- Cada card: avatar (iniciais coloridas), nome, perfil, estrelas gold, citação
- Depoimentos focados em: controle emocional, Stop Loss, resultado consistente

### 8. CTA Final
- Fundo: `--s1`
- Headline grande: "Comece hoje. 7 dias grátis, sem cartão."
- Botão gold centralizado → `login.html`
- Linha de segurança abaixo

### 9. Footer
- Logo + links (Termos, Privacidade, Contato) + copyright
- Simples, sem excesso

---

## login.html — Login / Cadastro

### Layout
- Split 50/50 em grid
- Esquerda: identidade GestorBet — logo, tagline ("Aposte com estratégia. Vença com disciplina."), 1 dado de prova social
- Direita: formulário com abas Login / Cadastro

### Identidade (esquerda)
- Remove completamente a identidade "Vaultex" atual
- Logo GestorBet + tagline
- Prova social: "3.200+ apostadores · 18 estratégias · 7 dias grátis"
- Footer pequeno: "Acesso seguro · TLS 1.3"

### Formulário Login (direita)
- Campos: E-mail, Senha (com toggle ver/ocultar)
- Link "Esqueci a senha"
- Botão: "Acessar plataforma"
- Divisor "ou"
- Login social: Google + Facebook
- Erro inline visível

### Formulário Cadastro (direita)
- Campos: Nome, Sobrenome, E-mail, Senha (com strength bar), Plano (select)
- Checkbox termos + 18 anos
- Botão: "Criar conta"
- Divisor "ou"
- Login social: Google + Facebook

### Visual
- Mesma paleta e fontes do index.html
- Inputs com border-bottom gold no focus
- Abas com underline gold animado
- Responsivo: stacks verticalmente em mobile

---

## Responsividade
- Navbar: hamburger menu em mobile
- Hero: 1 coluna em mobile, mock escondido ou reduzido
- Grids: 1 coluna em mobile (`max-width: 768px`)
- Login split: 1 coluna em mobile, esquerda vira header compacto

---

## Critérios de Sucesso
- Identidade 100% GestorBet (zero referência a "Vaultex")
- Todas as seções do index.html implementadas na ordem definida
- Login funcional (redireciona para `app.html` ao submeter)
- Responsivo em mobile
- Sem dependências externas além das fontes Google Fonts
