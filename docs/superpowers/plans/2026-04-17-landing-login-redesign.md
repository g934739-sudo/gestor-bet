# Landing Page + Login Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar do zero `index.html` (landing page) e `login.html` (login/cadastro) com identidade GestorBet forte, foco em conversão e estilo fintech moderna.

**Architecture:** Cada página é um arquivo HTML único com CSS inline no `<style>` e JS inline no `<script>`. Sem frameworks, sem build tools. O plano implementa seção por seção, cada uma em commit separado para facilitar revisão e rollback.

**Tech Stack:** HTML5, CSS3 (variáveis CSS, grid, flexbox, animações), JavaScript vanilla, Google Fonts (Outfit + JetBrains Mono)

**Spec:** `docs/superpowers/specs/2026-04-17-landing-login-redesign.md`

---

> **Nota sobre testes:** Este projeto é HTML/CSS/JS vanilla sem framework de testes. O "teste" de cada tarefa é abrir o arquivo no navegador (`open index.html`) e verificar visualmente que a seção renderiza corretamente antes de commitar.

---

### Task 1: index.html — Base, CSS Variables e Navbar

**Files:**
- Modify (rewrite completo): `index.html`

- [ ] **Step 1: Substituir index.html pelo esqueleto base**

Substitua o conteúdo completo de `index.html` por:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GestorBet — Gerencie sua banca como um profissional</title>
<meta name="description" content="Estratégias automáticas, Stop Loss inteligente e dashboard em tempo real para cassino e apostas esportivas.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg:         #09090f;
  --s1:         #0f0f18;
  --s2:         #141420;
  --s3:         #1a1a28;
  --gold:       #f0c040;
  --gold-dim:   rgba(240,192,64,.12);
  --gold-line:  rgba(240,192,64,.25);
  --green:      #1fd97a;
  --green-dim:  rgba(31,217,122,.10);
  --green-line: rgba(31,217,122,.25);
  --red:        #f5445f;
  --red-dim:    rgba(245,68,95,.08);
  --red-line:   rgba(245,68,95,.20);
  --text:       #f2f2f5;
  --text2:      #9090a8;
  --muted:      #505068;
  --border:     rgba(255,255,255,.07);
  --border2:    rgba(255,255,255,.12);
  --r: 'Outfit', sans-serif;
  --m: 'JetBrains Mono', monospace;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; overflow-x: hidden; }
body { background: var(--bg); color: var(--text); font-family: var(--r); overflow-x: hidden; -webkit-font-smoothing: antialiased; }

/* ── NAVBAR ── */
#nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 500;
  height: 68px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 48px;
  transition: background .35s, border-color .35s;
  border-bottom: 1px solid transparent;
}
#nav.scrolled {
  background: rgba(9,9,15,.95);
  backdrop-filter: blur(24px);
  border-bottom-color: var(--border2);
}
.nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.nav-mark {
  width: 34px; height: 34px; background: var(--gold); border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; font-weight: 900; color: #000; font-family: var(--m);
}
.nav-name { font-size: 19px; font-weight: 800; letter-spacing: -.3px; color: var(--text); }
.nav-name em { color: var(--gold); font-style: normal; }
.nav-links { display: flex; gap: 32px; }
.nav-links a { font-size: 14px; font-weight: 500; color: var(--text2); text-decoration: none; transition: color .2s; }
.nav-links a:hover { color: var(--text); }
.nav-right { display: flex; align-items: center; gap: 12px; }
.nav-login {
  padding: 9px 22px; border: 1px solid var(--border2); border-radius: 8px;
  color: var(--text2); font-size: 13px; font-weight: 500; text-decoration: none;
  transition: border-color .2s, color .2s;
}
.nav-login:hover { border-color: var(--gold); color: var(--gold); }
.nav-cta {
  padding: 9px 22px; background: var(--gold); color: #000;
  font-size: 13px; font-weight: 700; border-radius: 8px; text-decoration: none;
  transition: filter .2s;
}
.nav-cta:hover { filter: brightness(1.08); }

@media (max-width: 768px) {
  #nav { padding: 0 20px; }
  .nav-links { display: none; }
}
</style>
</head>
<body>

<nav id="nav">
  <a href="#" class="nav-logo">
    <div class="nav-mark">G</div>
    <span class="nav-name">Gestor<em>Bet</em></span>
  </a>
  <div class="nav-links">
    <a href="#features">Funcionalidades</a>
    <a href="#strategies">Estratégias</a>
    <a href="#plans">Planos</a>
  </div>
  <div class="nav-right">
    <a href="login.html" class="nav-login">Entrar</a>
    <a href="login.html" class="nav-cta">Começar grátis</a>
  </div>
</nav>

<script>
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
});
</script>
</body>
</html>
```

- [ ] **Step 2: Verificar no navegador**

```bash
open index.html
```

Esperado: navbar visível com logo GestorBet, links e botões. Ao scrollar (adicione conteúdo temporário alto para testar), fundo escurece.

- [ ] **Step 3: Commitar**

```bash
git add index.html
git commit -m "feat: index.html — base + navbar"
```

---

### Task 2: index.html — Hero Section

**Files:**
- Modify: `index.html` (adicionar seção hero dentro do `<body>`, antes do `<script>`)

- [ ] **Step 1: Adicionar CSS do hero no `<style>`**

Dentro do `<style>`, após os estilos do navbar, adicione:

```css
/* ── HERO ── */
#hero {
  min-height: 100vh;
  padding: 120px 48px 80px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  position: relative;
}
#hero::before {
  content: '';
  position: fixed;
  top: -20%;
  left: -10%;
  width: 60%;
  height: 80%;
  background: radial-gradient(ellipse at center, rgba(240,192,64,.06) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}
.hero-content { position: relative; z-index: 1; }
.hero-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px;
  background: var(--green-dim); border: 1px solid var(--green-line); border-radius: 100px;
  font-family: var(--m); font-size: 10px; color: var(--green);
  letter-spacing: .1em; text-transform: uppercase;
  margin-bottom: 28px;
}
.pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: blink 1.6s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

.hero-h {
  font-size: clamp(44px, 5.5vw, 72px);
  font-weight: 900;
  line-height: 1.04;
  letter-spacing: -.5px;
  margin-bottom: 22px;
}
.hero-h em { color: var(--gold); font-style: normal; display: block; }
.hero-p {
  font-size: 18px; color: var(--text2); line-height: 1.72;
  margin-bottom: 36px; max-width: 480px;
}
.hero-btns { display: flex; gap: 12px; align-items: center; margin-bottom: 40px; flex-wrap: wrap; }
.btn-gold {
  padding: 16px 36px; background: var(--gold); color: #000;
  font-family: var(--r); font-weight: 700; font-size: 15px; border-radius: 10px;
  text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
  transition: filter .2s, transform .2s;
  box-shadow: 0 0 0 0 rgba(240,192,64,.4);
  animation: goldpulse 2.8s ease-in-out infinite;
}
@keyframes goldpulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(240,192,64,.3); }
  50%      { box-shadow: 0 0 0 14px rgba(240,192,64,0); }
}
.btn-gold:hover { filter: brightness(1.07); transform: translateY(-1px); animation: none; }
.btn-ghost {
  padding: 16px 28px; background: transparent; color: var(--text2);
  border: 1px solid var(--border2); border-radius: 10px;
  text-decoration: none; font-size: 14px; font-weight: 500;
  display: inline-flex; align-items: center; gap: 6px; transition: all .2s;
}
.btn-ghost:hover { border-color: var(--gold); color: var(--gold); }
.hero-social { display: flex; align-items: center; gap: 14px; }
.avatars { display: flex; }
.avatars span {
  width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
  margin-left: -10px;
}
.avatars span:first-child { margin-left: 0; }
.hero-social-txt { font-size: 13px; color: var(--text2); }
.hero-social-txt strong { color: var(--text); }

/* APP MOCK */
.hero-mock { position: relative; z-index: 1; display: flex; justify-content: center; }
.mock {
  width: 100%; max-width: 520px;
  background: var(--s1); border: 1px solid var(--border2); border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 48px 96px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04);
  animation: float 4.5s ease-in-out infinite;
}
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.mock-bar {
  padding: 10px 14px; background: rgba(0,0,0,.3); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 8px;
}
.mock-dots { display: flex; gap: 5px; }
.mock-dot { width: 9px; height: 9px; border-radius: 50%; }
.mock-url {
  flex: 1; margin: 0 10px; background: rgba(255,255,255,.04);
  border: 1px solid var(--border); border-radius: 5px;
  padding: 4px 10px; font-family: var(--m); font-size: 9px; color: var(--muted);
}
.mock-live { font-family: var(--m); font-size: 9px; color: var(--green); display: flex; align-items: center; gap: 4px; }
.mock-live::before { content:''; width: 5px; height: 5px; border-radius: 50%; background: var(--green); animation: blink 1.2s infinite; }
.mock-inner { padding: 20px; }
.mock-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.mock-strat-label { font-family: var(--m); font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: .12em; margin-bottom: 4px; }
.mock-strat-name { font-size: 16px; font-weight: 700; color: var(--gold); }
.mock-badge { padding: 4px 10px; background: var(--green-dim); border: 1px solid var(--green-line); border-radius: 100px; font-family: var(--m); font-size: 9px; color: var(--green); }
.mock-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.mock-stat { background: var(--s2); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
.mock-stat-l { font-family: var(--m); font-size: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 4px; }
.mock-stat-v { font-size: 18px; font-weight: 700; }
.mock-stat-v.g { color: var(--green); }
.mock-stat-v.gold { color: var(--gold); }
.mock-bets { display: flex; flex-direction: column; gap: 6px; }
.mock-bet { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--s2); border: 1px solid var(--border); border-radius: 8px; font-size: 11px; }
.mock-bet-n { color: var(--text2); }
.mock-bet-v { font-weight: 600; }
.mock-bet-v.g { color: var(--green); }
.mock-bet-v.r { color: var(--red); }

@media (max-width: 768px) {
  #hero { grid-template-columns: 1fr; padding: 100px 20px 60px; gap: 48px; }
  .hero-mock { display: none; }
}
```

- [ ] **Step 2: Adicionar HTML do hero no `<body>`, após `</nav>` e antes do `<script>`**

```html
<section id="hero">
  <div class="hero-content">
    <div class="hero-pill">
      <span class="pill-dot"></span>
      Cassino &amp; Apostas Esportivas
    </div>
    <h1 class="hero-h">
      Pare de apostar<br>no escuro.
      <em>Gerencie sua banca<br>como um profissional.</em>
    </h1>
    <p class="hero-p">Estratégias automáticas, Stop Loss inteligente e dashboard em tempo real — para cassino e apostas esportivas.</p>
    <div class="hero-btns">
      <a href="login.html" class="btn-gold">Começar agora — 7 dias grátis →</a>
      <a href="#how" class="btn-ghost">Ver como funciona ↓</a>
    </div>
    <div class="hero-social">
      <div class="avatars">
        <span style="background:#6366f1">RM</span>
        <span style="background:#ec4899">JS</span>
        <span style="background:#f59e0b">KL</span>
        <span style="background:#10b981">PT</span>
      </div>
      <span class="hero-social-txt"><strong>+3.200</strong> apostadores já usam</span>
    </div>
  </div>

  <div class="hero-mock">
    <div class="mock">
      <div class="mock-bar">
        <div class="mock-dots">
          <div class="mock-dot" style="background:#f5445f"></div>
          <div class="mock-dot" style="background:#f0c040"></div>
          <div class="mock-dot" style="background:#1fd97a"></div>
        </div>
        <div class="mock-url">gestorbet.app</div>
        <div class="mock-live">AO VIVO</div>
      </div>
      <div class="mock-inner">
        <div class="mock-header">
          <div>
            <div class="mock-strat-label">Estratégia ativa</div>
            <div class="mock-strat-name">Fibonacci</div>
          </div>
          <div class="mock-badge">● Sessão ativa</div>
        </div>
        <div class="mock-stats">
          <div class="mock-stat">
            <div class="mock-stat-l">Banca</div>
            <div class="mock-stat-v gold">R$1.240</div>
          </div>
          <div class="mock-stat">
            <div class="mock-stat-l">Lucro</div>
            <div class="mock-stat-v g">+R$240</div>
          </div>
          <div class="mock-stat">
            <div class="mock-stat-l">ROI</div>
            <div class="mock-stat-v g">+24%</div>
          </div>
        </div>
        <div class="mock-bets">
          <div class="mock-bet"><span class="mock-bet-n">Aposta #12</span><span class="mock-bet-v g">+R$64</span></div>
          <div class="mock-bet"><span class="mock-bet-n">Aposta #11</span><span class="mock-bet-v r">-R$32</span></div>
          <div class="mock-bet"><span class="mock-bet-n">Aposta #10</span><span class="mock-bet-v g">+R$32</span></div>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verificar no navegador**

```bash
open index.html
```

Esperado: hero com 2 colunas — texto à esquerda com headline, CTAs e avatares; mock do app à direita com animação de float. Gradiente gold sutil no fundo.

- [ ] **Step 4: Commitar**

```bash
git add index.html
git commit -m "feat: index.html — hero section"
```

---

### Task 3: index.html — Barra de Prova Social + Ticker

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Adicionar CSS no `<style>`**

```css
/* ── SOCIAL PROOF BAR ── */
#proof {
  background: var(--s1);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 40px 48px;
}
.proof-metrics {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 24px; max-width: 960px; margin: 0 auto 32px;
  text-align: center;
}
.proof-metric-v {
  font-size: clamp(28px, 3vw, 40px); font-weight: 800;
  color: var(--gold); font-family: var(--m); margin-bottom: 4px;
}
.proof-metric-l { font-size: 13px; color: var(--text2); }

/* TICKER */
.ticker-wrap { overflow: hidden; border-top: 1px solid var(--border); padding-top: 24px; }
.ticker-track {
  display: flex; gap: 40px; width: max-content;
  animation: ticker 30s linear infinite;
}
.ticker-wrap:hover .ticker-track { animation-play-state: paused; }
@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.ticker-item {
  font-family: var(--m); font-size: 11px;
  color: var(--muted); letter-spacing: .1em; text-transform: uppercase;
  white-space: nowrap; display: flex; align-items: center; gap: 40px;
}
.ticker-item::after { content: '·'; color: var(--gold); font-size: 16px; }

@media (max-width: 768px) {
  #proof { padding: 32px 20px; }
  .proof-metrics { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 2: Adicionar HTML após `</section>` do hero**

```html
<section id="proof">
  <div class="proof-metrics">
    <div>
      <div class="proof-metric-v">3.200+</div>
      <div class="proof-metric-l">Apostadores ativos</div>
    </div>
    <div>
      <div class="proof-metric-v">18</div>
      <div class="proof-metric-l">Estratégias disponíveis</div>
    </div>
    <div>
      <div class="proof-metric-v">R$2,4M</div>
      <div class="proof-metric-l">Gerenciados na plataforma</div>
    </div>
    <div>
      <div class="proof-metric-v">94%</div>
      <div class="proof-metric-l">Taxa de satisfação</div>
    </div>
  </div>
  <div class="ticker-wrap">
    <div class="ticker-track" id="ticker">
      <!-- itens duplicados para loop contínuo -->
    </div>
  </div>
</section>
```

- [ ] **Step 3: Adicionar JS do ticker antes do `</script>` final**

```javascript
(function() {
  const strategies = [
    'Martingale','Fibonacci','D\'Alembert','Kelly Criterion',
    'Anti-Martingale','Labouchère','Paroli','1-3-2-6',
    'Flat Bet','Value Bet','Back & Lay','Dutching',
    'Handicap Asiático','Kelly Esportivo','Soros','Oscar\'s Grind'
  ];
  const track = document.getElementById('ticker');
  const doubled = [...strategies, ...strategies];
  track.innerHTML = doubled.map(s =>
    `<span class="ticker-item">${s}</span>`
  ).join('');
})();
```

- [ ] **Step 4: Verificar no navegador**

Esperado: barra com 4 métricas em gold, ticker animado com nomes de estratégias deslizando. Pausa ao passar o mouse.

- [ ] **Step 5: Commitar**

```bash
git add index.html
git commit -m "feat: index.html — social proof bar + ticker"
```

---

### Task 4: index.html — Como Funciona

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Adicionar CSS no `<style>`**

```css
/* ── HOW IT WORKS ── */
#how {
  padding: 96px 48px;
  max-width: 1100px; margin: 0 auto;
}
.section-label {
  font-family: var(--m); font-size: 10px; color: var(--gold);
  text-transform: uppercase; letter-spacing: .18em;
  margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
}
.section-label::before { content: ''; width: 24px; height: 1px; background: var(--gold); }
.section-h {
  font-size: clamp(32px, 4vw, 48px); font-weight: 800;
  line-height: 1.1; margin-bottom: 64px; max-width: 520px;
}
.section-h em { color: var(--gold); font-style: normal; }

.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; position: relative; }
.steps::before {
  content: '';
  position: absolute; top: 32px; left: calc(16.66% + 24px); right: calc(16.66% + 24px);
  height: 1px; background: linear-gradient(90deg, var(--gold-line), var(--gold-line));
}
.step { padding: 0 32px; position: relative; }
.step-num {
  width: 64px; height: 64px; border-radius: 16px;
  background: var(--gold-dim); border: 1px solid var(--gold-line);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--m); font-size: 22px; font-weight: 700; color: var(--gold);
  margin-bottom: 24px; position: relative; z-index: 1;
  background: var(--bg);
}
.step-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
.step-desc { font-size: 14px; color: var(--text2); line-height: 1.7; }

@media (max-width: 768px) {
  #how { padding: 64px 20px; }
  .steps { grid-template-columns: 1fr; gap: 40px; }
  .steps::before { display: none; }
  .step { padding: 0; }
}
```

- [ ] **Step 2: Adicionar HTML após a seção `#proof`**

```html
<section id="how">
  <div class="section-label">Como funciona</div>
  <h2 class="section-h">Três passos para<br><em>apostar com disciplina</em></h2>
  <div class="steps">
    <div class="step">
      <div class="step-num">01</div>
      <h3 class="step-title">Escolha sua estratégia</h3>
      <p class="step-desc">Selecione entre 18+ estratégias testadas — Martingale, Fibonacci, Kelly e muito mais. Funciona para cassino e apostas esportivas.</p>
    </div>
    <div class="step">
      <div class="step-num">02</div>
      <h3 class="step-title">Configure sua banca</h3>
      <p class="step-desc">Defina seu capital inicial, Stop Loss e Stop Win. O GestorBet calcula automaticamente o stake ideal para cada aposta.</p>
    </div>
    <div class="step">
      <div class="step-num">03</div>
      <h3 class="step-title">Jogue com disciplina</h3>
      <p class="step-desc">Acompanhe cada aposta em tempo real no dashboard. O sistema para automaticamente quando seus limites são atingidos.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verificar no navegador**

Esperado: 3 cards em grid com numeração gold, linha conectando os números, descrições claras.

- [ ] **Step 4: Commitar**

```bash
git add index.html
git commit -m "feat: index.html — como funciona section"
```

---

### Task 5: index.html — Estratégias e Modos de Jogo

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Adicionar CSS no `<style>`**

```css
/* ── STRATEGIES ── */
#strategies {
  padding: 96px 48px;
  background: var(--s1);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.strategies-inner { max-width: 1100px; margin: 0 auto; }
.strat-tabs { display: flex; gap: 4px; margin-bottom: 40px; background: var(--s2); border-radius: 10px; padding: 4px; width: fit-content; }
.strat-tab {
  padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer;
  font-family: var(--r); font-size: 14px; font-weight: 600;
  color: var(--text2); background: transparent;
  transition: background .2s, color .2s;
}
.strat-tab.active { background: var(--bg); color: var(--text); }
.strat-panel { display: none; }
.strat-panel.active { display: block; }
.strat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
.strat-card {
  background: var(--bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 20px; transition: border-color .2s, transform .2s;
}
.strat-card:hover { border-color: var(--border2); transform: translateY(-2px); }
.strat-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.strat-card-name { font-size: 15px; font-weight: 700; }
.strat-risk {
  padding: 3px 9px; border-radius: 100px;
  font-family: var(--m); font-size: 9px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .08em;
}
.strat-risk.low  { background: var(--green-dim); color: var(--green); border: 1px solid var(--green-line); }
.strat-risk.mid  { background: var(--gold-dim);  color: var(--gold);  border: 1px solid var(--gold-line); }
.strat-risk.high { background: var(--red-dim);   color: var(--red);   border: 1px solid var(--red-line); }
.strat-card-desc { font-size: 13px; color: var(--text2); line-height: 1.6; }
.strat-banner {
  background: var(--gold-dim); border: 1px solid var(--gold-line); border-radius: 12px;
  padding: 20px 28px; display: flex; align-items: center; justify-content: space-between; gap: 24px;
}
.strat-banner-txt { font-size: 14px; color: var(--text2); }
.strat-banner-txt strong { color: var(--text); }
.strat-banner-link {
  padding: 10px 22px; background: var(--gold); color: #000;
  font-size: 13px; font-weight: 700; border-radius: 8px;
  text-decoration: none; white-space: nowrap; transition: filter .2s;
}
.strat-banner-link:hover { filter: brightness(1.08); }

@media (max-width: 768px) {
  #strategies { padding: 64px 20px; }
  .strat-grid { grid-template-columns: 1fr; }
  .strat-banner { flex-direction: column; }
}
```

- [ ] **Step 2: Adicionar HTML após a seção `#how`**

```html
<section id="strategies">
  <div class="strategies-inner">
    <div class="section-label">Estratégias e modos</div>
    <h2 class="section-h" style="margin-bottom:32px">Cassino ou esportivo.<br><em>Você escolhe o jogo.</em></h2>

    <div class="strat-tabs">
      <button class="strat-tab active" onclick="switchStrat('casino',this)">🎰 Cassino</button>
      <button class="strat-tab" onclick="switchStrat('sport',this)">⚽ Esportivo</button>
    </div>

    <div id="strat-casino" class="strat-panel active">
      <div class="strat-grid">
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Martingale</span><span class="strat-risk high">Agressivo</span></div>
          <p class="strat-card-desc">Dobra a aposta após cada perda para recuperar no próximo acerto.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Fibonacci</span><span class="strat-risk mid">Moderado</span></div>
          <p class="strat-card-desc">Segue a sequência de Fibonacci para ajustar o stake com menor risco.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">D'Alembert</span><span class="strat-risk low">Conservador</span></div>
          <p class="strat-card-desc">Aumenta e diminui o stake gradualmente após cada resultado.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Kelly Criterion</span><span class="strat-risk mid">Moderado</span></div>
          <p class="strat-card-desc">Calcula o stake ideal com base na vantagem matemática da aposta.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Paroli</span><span class="strat-risk mid">Moderado</span></div>
          <p class="strat-card-desc">Anti-Martingale: dobra após vitórias, protegendo o bankroll em sequências ruins.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Flat Bet</span><span class="strat-risk low">Conservador</span></div>
          <p class="strat-card-desc">Stake fixo em todas as apostas. Ideal para medir edge sem variação.</p>
        </div>
      </div>
    </div>

    <div id="strat-sport" class="strat-panel">
      <div class="strat-grid">
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Value Bet</span><span class="strat-risk mid">Moderado</span></div>
          <p class="strat-card-desc">Identifica apostas onde a odd oferece mais valor do que a probabilidade real.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Back & Lay</span><span class="strat-risk mid">Moderado</span></div>
          <p class="strat-card-desc">Opera nos dois lados do mercado para garantir lucro independente do resultado.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Handicap Asiático</span><span class="strat-risk low">Conservador</span></div>
          <p class="strat-card-desc">Equaliza o jogo com vantagem/desvantagem de gols para eliminar o empate.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Dutching</span><span class="strat-risk low">Conservador</span></div>
          <p class="strat-card-desc">Distribui o stake entre múltiplos resultados para garantir lucro igual em cada um.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Kelly Esportivo</span><span class="strat-risk mid">Moderado</span></div>
          <p class="strat-card-desc">Aplica Kelly Criterion adaptado para odds esportivas e margem das casas.</p>
        </div>
        <div class="strat-card">
          <div class="strat-card-top"><span class="strat-card-name">Flat Esportivo</span><span class="strat-risk low">Conservador</span></div>
          <p class="strat-card-desc">Stake fixo por aposta esportiva. Base para qualquer análise de longo prazo.</p>
        </div>
      </div>
    </div>

    <div class="strat-banner">
      <p class="strat-banner-txt"><strong>Não sabe qual estratégia usar?</strong> O GestorBet recomenda com base no seu perfil de risco e histórico de apostas.</p>
      <a href="login.html" class="strat-banner-link">Descobrir meu perfil →</a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Adicionar JS das abas antes do `</script>` final**

```javascript
function switchStrat(id, el) {
  document.querySelectorAll('.strat-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.strat-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('strat-' + id).classList.add('active');
}
```

- [ ] **Step 4: Verificar no navegador**

Esperado: seção com abas Cassino/Esportivo funcionando, grid de 6 cards com badges de risco coloridos, banner gold no rodapé.

- [ ] **Step 5: Commitar**

```bash
git add index.html
git commit -m "feat: index.html — strategies section"
```

---

### Task 6: index.html — Features / Vantagens

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Adicionar CSS no `<style>`**

```css
/* ── FEATURES ── */
#features {
  padding: 96px 48px;
  max-width: 1100px; margin: 0 auto;
}
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.feat-card {
  background: var(--s1); border: 1px solid var(--border); border-radius: 14px;
  padding: 28px; transition: border-color .2s, transform .2s;
}
.feat-card:hover { border-color: var(--gold-line); transform: translateY(-4px); }
.feat-icon {
  width: 48px; height: 48px; border-radius: 12px;
  background: var(--gold-dim); border: 1px solid var(--gold-line);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; margin-bottom: 16px;
}
.feat-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.feat-desc { font-size: 13px; color: var(--text2); line-height: 1.7; }

@media (max-width: 768px) {
  #features { padding: 64px 20px; }
  .features-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Adicionar HTML após a seção `#strategies`**

```html
<section id="features">
  <div class="section-label">Funcionalidades</div>
  <h2 class="section-h">Tudo que você precisa<br><em>em um lugar só</em></h2>
  <div class="features-grid">
    <div class="feat-card">
      <div class="feat-icon">⚡</div>
      <h3 class="feat-title">Cálculo automático de stake</h3>
      <p class="feat-desc">Nunca calcule manualmente de novo. O sistema determina o valor exato de cada aposta com base na sua banca e estratégia.</p>
    </div>
    <div class="feat-card">
      <div class="feat-icon">🛑</div>
      <h3 class="feat-title">Stop Loss & Stop Win</h3>
      <p class="feat-desc">Proteja sua banca com limites inteligentes. A sessão para automaticamente ao atingir o teto de perda ou lucro.</p>
    </div>
    <div class="feat-card">
      <div class="feat-icon">📊</div>
      <h3 class="feat-title">Dashboard em tempo real</h3>
      <p class="feat-desc">Visualize lucro, sequências, ROI e evolução da banca em tempo real. Sem planilhas, sem anotações manuais.</p>
    </div>
    <div class="feat-card">
      <div class="feat-icon">🎯</div>
      <h3 class="feat-title">Cassino + Esportivo</h3>
      <p class="feat-desc">Uma única ferramenta para os dois mundos. Mude entre modos com um clique, mantendo o histórico unificado.</p>
    </div>
    <div class="feat-card">
      <div class="feat-icon">📈</div>
      <h3 class="feat-title">18+ estratégias testadas</h3>
      <p class="feat-desc">Das conservadoras às agressivas, todas as principais estratégias de gestão de banca implementadas e prontas para usar.</p>
    </div>
    <div class="feat-card">
      <div class="feat-icon">🔒</div>
      <h3 class="feat-title">Histórico completo</h3>
      <p class="feat-desc">Todas as suas sessões salvas e analisadas. Identifique padrões, revise erros e evolua sua performance.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verificar no navegador**

Esperado: grid 3x2 de cards com ícone, título e descrição. Hover eleva o card com borda gold.

- [ ] **Step 4: Commitar**

```bash
git add index.html
git commit -m "feat: index.html — features section"
```

---

### Task 7: index.html — Planos

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Adicionar CSS no `<style>`**

```css
/* ── PLANS ── */
#plans {
  padding: 96px 48px;
  background: var(--s1);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.plans-inner { max-width: 1000px; margin: 0 auto; }
.plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; margin-bottom: 28px; }
.plan-card {
  background: var(--bg); border: 1px solid var(--border); border-radius: 16px;
  padding: 32px; position: relative; transition: border-color .2s;
}
.plan-card.featured {
  border-color: var(--gold-line);
  box-shadow: 0 0 0 1px var(--gold-line), 0 24px 48px rgba(240,192,64,.08);
  transform: translateY(-8px);
}
.plan-badge {
  position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
  background: var(--gold); color: #000;
  padding: 4px 16px; border-radius: 100px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
}
.plan-name { font-size: 14px; font-weight: 600; color: var(--text2); margin-bottom: 16px; text-transform: uppercase; letter-spacing: .1em; font-family: var(--m); }
.plan-price { margin-bottom: 24px; }
.plan-price-v { font-size: 48px; font-weight: 800; color: var(--text); line-height: 1; }
.plan-price-v sup { font-size: 22px; vertical-align: top; margin-top: 10px; color: var(--text2); }
.plan-price-period { font-size: 13px; color: var(--muted); margin-top: 4px; }
.plan-divider { height: 1px; background: var(--border); margin-bottom: 20px; }
.plan-features { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
.plan-features li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text2); }
.plan-features li::before { content: '✓'; color: var(--green); font-weight: 700; font-size: 13px; flex-shrink: 0; }
.plan-features li.off { color: var(--muted); }
.plan-features li.off::before { content: '×'; color: var(--muted); }
.plan-btn-gold {
  display: block; width: 100%; padding: 14px;
  background: var(--gold); color: #000;
  font-family: var(--r); font-size: 14px; font-weight: 700;
  border: none; border-radius: 10px; cursor: pointer;
  text-decoration: none; text-align: center;
  transition: filter .2s;
}
.plan-btn-gold:hover { filter: brightness(1.08); }
.plan-btn-ghost {
  display: block; width: 100%; padding: 14px;
  background: transparent; color: var(--text2);
  font-family: var(--r); font-size: 14px; font-weight: 600;
  border: 1px solid var(--border2); border-radius: 10px; cursor: pointer;
  text-decoration: none; text-align: center;
  transition: border-color .2s, color .2s;
}
.plan-btn-ghost:hover { border-color: var(--gold); color: var(--gold); }
.plans-security {
  display: flex; align-items: center; justify-content: center; gap: 24px;
  font-size: 13px; color: var(--muted); flex-wrap: wrap;
}
.plans-security span { display: flex; align-items: center; gap: 6px; }
.plans-security span::before { content: '🔒'; font-size: 12px; }

@media (max-width: 768px) {
  #plans { padding: 64px 20px; }
  .plans-grid { grid-template-columns: 1fr; }
  .plan-card.featured { transform: none; }
}
```

- [ ] **Step 2: Adicionar HTML após a seção `#features`**

```html
<section id="plans">
  <div class="plans-inner">
    <div class="section-label">Planos</div>
    <h2 class="section-h">Escolha o plano<br><em>ideal para você</em></h2>
    <div class="plans-grid">

      <div class="plan-card">
        <div class="plan-name">Starter</div>
        <div class="plan-price">
          <div class="plan-price-v"><sup>R$</sup>97</div>
          <div class="plan-price-period">por mês</div>
        </div>
        <div class="plan-divider"></div>
        <ul class="plan-features">
          <li>6 estratégias disponíveis</li>
          <li>30 sessões por mês</li>
          <li>Cassino + Esportivo</li>
          <li>Dashboard em tempo real</li>
          <li>Suporte por e-mail</li>
          <li class="off">Estratégias avançadas</li>
          <li class="off">Sessões ilimitadas</li>
        </ul>
        <a href="login.html" class="plan-btn-ghost">Começar grátis</a>
      </div>

      <div class="plan-card featured">
        <div class="plan-badge">Mais popular</div>
        <div class="plan-name">Pro</div>
        <div class="plan-price">
          <div class="plan-price-v"><sup>R$</sup>297</div>
          <div class="plan-price-period">por mês</div>
        </div>
        <div class="plan-divider"></div>
        <ul class="plan-features">
          <li>18 estratégias completas</li>
          <li>Sessões ilimitadas</li>
          <li>Cassino + Esportivo</li>
          <li>Dashboard em tempo real</li>
          <li>Suporte prioritário</li>
          <li>Histórico completo</li>
          <li>Relatórios de performance</li>
        </ul>
        <a href="login.html" class="plan-btn-gold">Começar grátis →</a>
      </div>

      <div class="plan-card">
        <div class="plan-name">Elite</div>
        <div class="plan-price">
          <div class="plan-price-v"><sup>R$</sup>597</div>
          <div class="plan-price-period">por mês</div>
        </div>
        <div class="plan-divider"></div>
        <ul class="plan-features">
          <li>18+ estratégias + customizadas</li>
          <li>Sessões ilimitadas</li>
          <li>Cassino + Esportivo</li>
          <li>Dashboard em tempo real</li>
          <li>Suporte VIP 24/7</li>
          <li>Histórico completo</li>
          <li>Estratégias personalizadas</li>
        </ul>
        <a href="login.html" class="plan-btn-ghost">Começar grátis</a>
      </div>

    </div>
    <div class="plans-security">
      <span>Pagamento 100% seguro</span>
      <span>Cancele quando quiser</span>
      <span>7 dias grátis sem cartão</span>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verificar no navegador**

Esperado: 3 cards, Pro centralizado e elevado com badge "Mais popular" e borda gold. Linha de segurança abaixo.

- [ ] **Step 4: Commitar**

```bash
git add index.html
git commit -m "feat: index.html — plans section"
```

---

### Task 8: index.html — Depoimentos, CTA Final e Footer

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Adicionar CSS no `<style>`**

```css
/* ── TESTIMONIALS ── */
#testimonials {
  padding: 96px 48px;
  max-width: 1100px; margin: 0 auto;
}
.testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.testi-card {
  background: var(--s1); border: 1px solid var(--border); border-radius: 14px;
  padding: 28px; display: flex; flex-direction: column; gap: 16px;
}
.testi-stars { color: var(--gold); font-size: 14px; letter-spacing: 2px; }
.testi-quote { font-size: 14px; color: var(--text2); line-height: 1.8; flex: 1; }
.testi-quote::before { content: '"'; color: var(--gold); font-size: 24px; line-height: 0; vertical-align: -8px; margin-right: 4px; }
.testi-author { display: flex; align-items: center; gap: 12px; }
.testi-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.testi-name { font-size: 14px; font-weight: 600; }
.testi-role { font-size: 12px; color: var(--muted); }

/* ── CTA FINAL ── */
#cta-final {
  padding: 96px 48px;
  background: var(--s1);
  border-top: 1px solid var(--border);
  text-align: center;
}
.cta-h {
  font-size: clamp(36px, 4.5vw, 56px); font-weight: 900;
  line-height: 1.1; margin-bottom: 16px;
}
.cta-h em { color: var(--gold); font-style: normal; }
.cta-sub { font-size: 17px; color: var(--text2); margin-bottom: 40px; }
.cta-security { margin-top: 20px; font-size: 13px; color: var(--muted); }

/* ── FOOTER ── */
footer {
  padding: 40px 48px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
}
.footer-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
.footer-logo-mark { width: 28px; height: 28px; background: var(--gold); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; color: #000; font-family: var(--m); }
.footer-logo-text { font-size: 16px; font-weight: 800; color: var(--text2); }
.footer-logo-text em { color: var(--gold); font-style: normal; }
.footer-links { display: flex; gap: 24px; }
.footer-links a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color .2s; }
.footer-links a:hover { color: var(--text2); }
.footer-copy { font-size: 12px; color: var(--muted); }

@media (max-width: 768px) {
  #testimonials { padding: 64px 20px; }
  .testi-grid { grid-template-columns: 1fr; }
  #cta-final { padding: 64px 20px; }
  footer { padding: 32px 20px; flex-direction: column; align-items: flex-start; }
}
```

- [ ] **Step 2: Adicionar HTML após a seção `#plans`**

```html
<section id="testimonials">
  <div class="section-label">Depoimentos</div>
  <h2 class="section-h">O que dizem nossos<br><em>apostadores</em></h2>
  <div class="testi-grid">
    <div class="testi-card">
      <div class="testi-stars">★★★★★</div>
      <p class="testi-quote">Antes eu perdia o controle toda vez que entrava numa sequência ruim. Com o Stop Loss automático, isso acabou. Minha banca cresceu 40% em 3 meses.</p>
      <div class="testi-author">
        <div class="testi-avatar" style="background:#6366f1">RM</div>
        <div>
          <div class="testi-name">Rafael M.</div>
          <div class="testi-role">Apostador esportivo há 3 anos</div>
        </div>
      </div>
    </div>
    <div class="testi-card">
      <div class="testi-stars">★★★★★</div>
      <p class="testi-quote">O GestorBet mudou minha abordagem no cassino. Uso Fibonacci e nunca mais fui além do meu limite. É a disciplina que eu não conseguia ter sozinho.</p>
      <div class="testi-author">
        <div class="testi-avatar" style="background:#ec4899">JS</div>
        <div>
          <div class="testi-name">Juliana S.</div>
          <div class="testi-role">Jogadora de roleta e bacará</div>
        </div>
      </div>
    </div>
    <div class="testi-card">
      <div class="testi-stars">★★★★★</div>
      <p class="testi-quote">Profissional de apostas há 5 anos e nunca tive uma ferramenta assim. O dashboard em tempo real e o histórico completo mudaram minha análise completamente.</p>
      <div class="testi-author">
        <div class="testi-avatar" style="background:#10b981">PT</div>
        <div>
          <div class="testi-name">Pedro T.</div>
          <div class="testi-role">Trader esportivo profissional</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="cta-final">
  <h2 class="cta-h">Comece hoje.<br><em>7 dias grátis, sem cartão.</em></h2>
  <p class="cta-sub">Junte-se a mais de 3.200 apostadores que já gerenciam sua banca com inteligência.</p>
  <a href="login.html" class="btn-gold" style="display:inline-flex">Criar conta grátis →</a>
  <p class="cta-security">🔒 Pagamento seguro · Cancele quando quiser</p>
</section>

<footer>
  <a href="#" class="footer-logo">
    <div class="footer-logo-mark">G</div>
    <span class="footer-logo-text">Gestor<em>Bet</em></span>
  </a>
  <div class="footer-links">
    <a href="termos.html">Termos de Uso</a>
    <a href="privacidade.html">Privacidade</a>
    <a href="mailto:contato@gestorbet.app">Contato</a>
  </div>
  <span class="footer-copy">© 2026 GestorBet. Todos os direitos reservados.</span>
</footer>
```

- [ ] **Step 3: Verificar no navegador**

Esperado: depoimentos em 3 cards, CTA final centralizado com headline grande, footer simples com logo, links e copyright.

- [ ] **Step 4: Commitar**

```bash
git add index.html
git commit -m "feat: index.html — testimonials, CTA final e footer"
```

---

### Task 9: login.html — Rewrite Completo

**Files:**
- Modify (rewrite completo): `login.html`

- [ ] **Step 1: Substituir login.html pelo novo conteúdo**

Substitua o conteúdo completo de `login.html` por:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GestorBet — Entrar ou Cadastrar</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg:         #09090f;
  --s1:         #0f0f18;
  --s2:         #141420;
  --gold:       #f0c040;
  --gold-dim:   rgba(240,192,64,.12);
  --gold-line:  rgba(240,192,64,.25);
  --green:      #1fd97a;
  --green-dim:  rgba(31,217,122,.10);
  --green-line: rgba(31,217,122,.25);
  --red:        #f5445f;
  --text:       #f2f2f5;
  --text2:      #9090a8;
  --muted:      #505068;
  --border:     rgba(255,255,255,.07);
  --border2:    rgba(255,255,255,.12);
  --r: 'Outfit', sans-serif;
  --m: 'JetBrains Mono', monospace;
}
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body { min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--r); -webkit-font-smoothing: antialiased; }

.wrap {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

/* LEFT */
.left {
  background: var(--s1);
  border-right: 1px solid var(--border);
  padding: 48px 56px;
  display: flex; flex-direction: column; justify-content: space-between;
  position: relative; overflow: hidden;
}
.left::before {
  content: '';
  position: absolute; top: -20%; left: -20%;
  width: 80%; height: 80%;
  background: radial-gradient(ellipse, rgba(240,192,64,.07) 0%, transparent 65%);
  pointer-events: none;
}
.left-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.left-mark { width: 36px; height: 36px; background: var(--gold); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #000; font-family: var(--m); }
.left-name { font-size: 20px; font-weight: 800; color: var(--text); }
.left-name em { color: var(--gold); font-style: normal; }
.left-main { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 48px 0; }
.left-h { font-size: clamp(28px, 3vw, 40px); font-weight: 800; line-height: 1.15; margin-bottom: 16px; }
.left-h em { color: var(--gold); font-style: normal; }
.left-sub { font-size: 15px; color: var(--text2); line-height: 1.7; margin-bottom: 40px; max-width: 340px; }
.left-proof { display: flex; flex-direction: column; gap: 12px; }
.left-proof-item { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--text2); }
.left-proof-item::before { content: '✓'; color: var(--green); font-weight: 700; }
.left-footer { font-family: var(--m); font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .12em; }

/* RIGHT */
.right {
  padding: 48px 56px;
  display: flex; flex-direction: column; justify-content: center;
}
.right-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); text-decoration: none; margin-bottom: 40px; transition: color .2s; }
.right-back:hover { color: var(--text2); }

/* TABS */
.tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 32px; }
.tab {
  background: none; border: none; cursor: pointer;
  font-family: var(--r); font-size: 15px; font-weight: 600;
  color: var(--muted); padding: 0 0 14px; margin-right: 28px;
  position: relative; transition: color .2s;
}
.tab::after {
  content: '';
  position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
  background: var(--gold); transform: scaleX(0); transform-origin: left;
  transition: transform .25s ease;
}
.tab.active { color: var(--text); }
.tab.active::after { transform: scaleX(1); }

/* FORMS */
.form { display: none; }
.form.active { display: block; }
.field { margin-bottom: 18px; }
.label { display: block; font-size: 12px; font-weight: 600; color: var(--text2); margin-bottom: 8px; letter-spacing: .04em; }
.input {
  width: 100%; background: var(--s1); border: 1px solid var(--border2);
  border-radius: 10px; color: var(--text);
  font-family: var(--r); font-size: 14px;
  padding: 12px 16px; outline: none;
  transition: border-color .2s, box-shadow .2s;
  appearance: none;
}
.input::placeholder { color: var(--muted); }
.input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(240,192,64,.1); }
.input-wrap { position: relative; }
.input-wrap .input { padding-right: 44px; }
.eye {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  cursor: pointer; font-size: 16px; opacity: .4; transition: opacity .2s;
  user-select: none; color: var(--text); background: none; border: none;
}
.eye:hover { opacity: .8; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
select.input { cursor: pointer; }
select.input option { background: #1a1a28; color: var(--text); }

/* Strength bar */
.str-bar { display: flex; gap: 4px; margin-top: 8px; }
.str-seg { flex: 1; height: 2px; background: var(--border); border-radius: 2px; transition: background .3s; }
.str-seg.w { background: var(--red); }
.str-seg.m { background: var(--gold); }
.str-seg.g { background: var(--green); }

.forgot { display: block; text-align: right; font-size: 12px; color: var(--muted); text-decoration: none; margin: -8px 0 20px; transition: color .2s; }
.forgot:hover { color: var(--gold); }

/* Checkbox */
.chk-row { display: flex; gap: 10px; align-items: flex-start; margin: 4px 0 20px; }
.chk-row input[type="checkbox"] {
  appearance: none; width: 16px; height: 16px; min-width: 16px;
  border: 1px solid var(--border2); background: var(--s1); border-radius: 4px;
  cursor: pointer; position: relative; margin-top: 2px; transition: border-color .2s;
}
.chk-row input:checked { border-color: var(--gold); background: var(--gold-dim); }
.chk-row input:checked::after {
  content: ''; position: absolute; left: 4px; top: 1px;
  width: 5px; height: 9px; border: 2px solid var(--gold);
  border-top: none; border-left: none; transform: rotate(45deg);
}
.chk-label { font-size: 13px; color: var(--text2); line-height: 1.6; }
.chk-label a { color: var(--text2); text-decoration: underline; text-underline-offset: 2px; transition: color .2s; }
.chk-label a:hover { color: var(--gold); }

/* Buttons */
.btn-submit {
  width: 100%; padding: 14px;
  background: var(--gold); color: #000;
  font-family: var(--r); font-size: 15px; font-weight: 700;
  border: none; border-radius: 10px; cursor: pointer;
  transition: filter .2s, transform .15s;
}
.btn-submit:hover { filter: brightness(1.08); transform: translateY(-1px); }
.btn-submit:active { transform: translateY(0); }

/* Divider */
.divider { display: flex; align-items: center; gap: 14px; margin: 20px 0; }
.div-line { flex: 1; height: 1px; background: var(--border); }
.div-txt { font-size: 12px; color: var(--muted); }

/* Social */
.socials { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.soc-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px; background: var(--s1); border: 1px solid var(--border2);
  border-radius: 10px; color: var(--text2);
  font-family: var(--r); font-size: 13px; font-weight: 500;
  cursor: pointer; text-decoration: none;
  transition: border-color .2s, color .2s;
}
.soc-btn:hover { border-color: var(--border2); color: var(--text); }
.soc-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

/* Error */
.err-msg { display: none; font-size: 13px; color: var(--red); padding: 10px 14px; background: rgba(245,68,95,.08); border: 1px solid rgba(245,68,95,.2); border-radius: 8px; margin-bottom: 16px; }

@media (max-width: 768px) {
  .wrap { grid-template-columns: 1fr; }
  .left { padding: 32px 24px; border-right: none; border-bottom: 1px solid var(--border); }
  .left-main { padding: 32px 0; }
  .left-proof { display: none; }
  .right { padding: 32px 24px; }
  .right-back { margin-bottom: 24px; }
  .row2 { grid-template-columns: 1fr; }
}
</style>
</head>
<body>

<div class="wrap">

  <div class="left">
    <a href="index.html" class="left-logo">
      <div class="left-mark">G</div>
      <span class="left-name">Gestor<em>Bet</em></span>
    </a>

    <div class="left-main">
      <h1 class="left-h">Aposte com estratégia.<br><em>Vença com disciplina.</em></h1>
      <p class="left-sub">Gestão de banca profissional para cassino e apostas esportivas. 18+ estratégias, Stop Loss automático e dashboard em tempo real.</p>
      <div class="left-proof">
        <div class="left-proof-item">Mais de 3.200 apostadores ativos</div>
        <div class="left-proof-item">18 estratégias testadas e validadas</div>
        <div class="left-proof-item">7 dias grátis, sem cartão de crédito</div>
        <div class="left-proof-item">Cancele quando quiser</div>
      </div>
    </div>

    <div class="left-footer">Acesso seguro · TLS 1.3</div>
  </div>

  <div class="right">
    <a href="index.html" class="right-back">← Voltar ao site</a>

    <div class="tabs">
      <button class="tab active" onclick="goTab('login', this)">Entrar</button>
      <button class="tab" onclick="goTab('register', this)">Cadastrar</button>
    </div>

    <!-- LOGIN -->
    <form id="form-login" class="form active" onsubmit="onLogin(event)">
      <div class="err-msg" id="err-login">E-mail ou senha inválidos.</div>

      <div class="field">
        <label class="label">E-mail</label>
        <input class="input" type="email" placeholder="seu@email.com" required>
      </div>

      <div class="field">
        <label class="label">Senha</label>
        <div class="input-wrap">
          <input class="input" type="password" id="lp" placeholder="••••••••" required>
          <button type="button" class="eye" onclick="togglePass('lp', this)">👁</button>
        </div>
      </div>

      <a href="#" class="forgot">Esqueci a senha</a>

      <button type="submit" class="btn-submit">Acessar plataforma</button>

      <div class="divider">
        <div class="div-line"></div>
        <span class="div-txt">ou continue com</span>
        <div class="div-line"></div>
      </div>

      <div class="socials">
        <a href="#" class="soc-btn">
          <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </a>
        <a href="#" class="soc-btn">
          <svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </a>
      </div>
    </form>

    <!-- CADASTRO -->
    <form id="form-register" class="form" onsubmit="onReg(event)">
      <div class="row2">
        <div class="field">
          <label class="label">Nome</label>
          <input class="input" type="text" placeholder="João" required>
        </div>
        <div class="field">
          <label class="label">Sobrenome</label>
          <input class="input" type="text" placeholder="Silva" required>
        </div>
      </div>

      <div class="field">
        <label class="label">E-mail</label>
        <input class="input" type="email" placeholder="seu@email.com" required>
      </div>

      <div class="field">
        <label class="label">Senha</label>
        <div class="input-wrap">
          <input class="input" type="password" id="rp" placeholder="Mínimo 8 caracteres" oninput="checkStr(this.value)" required>
          <button type="button" class="eye" onclick="togglePass('rp', this)">👁</button>
        </div>
        <div class="str-bar">
          <div class="str-seg" id="s1"></div>
          <div class="str-seg" id="s2"></div>
          <div class="str-seg" id="s3"></div>
          <div class="str-seg" id="s4"></div>
        </div>
      </div>

      <div class="field">
        <label class="label">Plano</label>
        <select class="input" required>
          <option value="" disabled selected>Selecionar plano</option>
          <option>Starter — R$97/mês</option>
          <option>Pro — R$297/mês</option>
          <option>Elite — R$597/mês</option>
        </select>
      </div>

      <div class="chk-row">
        <input type="checkbox" id="terms" required>
        <label class="chk-label" for="terms">Concordo com os <a href="termos.html">Termos de Uso</a> e confirmo ter 18+ anos.</label>
      </div>

      <button type="submit" class="btn-submit">Criar conta grátis</button>

      <div class="divider">
        <div class="div-line"></div>
        <span class="div-txt">ou continue com</span>
        <div class="div-line"></div>
      </div>

      <div class="socials">
        <a href="#" class="soc-btn">
          <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </a>
        <a href="#" class="soc-btn">
          <svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </a>
      </div>
    </form>

  </div>
</div>

<script>
function goTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('form-' + id).classList.add('active');
}

function togglePass(id, btn) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

function checkStr(v) {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  ['s1','s2','s3','s4'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.className = 'str-seg';
    if (i < s) el.classList.add(s <= 1 ? 'w' : s <= 2 ? 'm' : 'g');
  });
}

function onLogin(e) {
  e.preventDefault();
  window.location.href = 'app.html';
}

function onReg(e) {
  e.preventDefault();
  window.location.href = 'app.html';
}
</script>
</body>
</html>
```

- [ ] **Step 2: Verificar no navegador**

```bash
open login.html
```

Esperado: layout split 50/50 — esquerda com identidade GestorBet (logo, tagline, checklist verde, "Vaultex" completamente removido), direita com abas Entrar/Cadastrar funcionando, inputs com focus gold, strength bar na senha, botão de submit gold. Responsivo em mobile.

- [ ] **Step 3: Commitar**

```bash
git add login.html
git commit -m "feat: login.html — rewrite completo com identidade GestorBet"
```

---

### Task 10: Revisão Final Cross-Page

**Files:**
- Read: `index.html`, `login.html`

- [ ] **Step 1: Verificar todos os links entre páginas**

Abrir no navegador e testar:
- `index.html` → clicar em "Começar agora", "Entrar", todos os CTAs → deve abrir `login.html`
- `login.html` → clicar em "← Voltar ao site" e no logo → deve abrir `index.html`
- `login.html` → submeter login → deve abrir `app.html`
- `login.html` → submeter cadastro → deve abrir `app.html`
- `index.html` → links do footer (termos.html, privacidade.html) → devem existir

- [ ] **Step 2: Verificar responsividade**

Redimensionar o navegador para `< 768px` e verificar:
- `index.html`: navbar sem links, hero em 1 coluna, mock oculto, grids em 1 coluna
- `login.html`: layout em 1 coluna, esquerda vira header compacto

- [ ] **Step 3: Verificar identidade**

Pesquisar em `login.html` pela string "Vaultex" — deve retornar 0 resultados:

```bash
grep -i "vaultex" login.html && echo "FALHOU" || echo "OK"
```

Esperado: `OK`

- [ ] **Step 4: Commitar revisão final**

```bash
git add index.html login.html
git commit -m "chore: revisão final cross-page — links, responsividade, identidade"
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Navbar com scroll behavior
- ✅ Hero 2 colunas + mock + avatares + CTAs
- ✅ Gradiente radial gold no hero
- ✅ Barra de 4 métricas
- ✅ Ticker animado com estratégias
- ✅ Como funciona — 3 passos
- ✅ Estratégias com abas Cassino/Esportivo + badges de risco
- ✅ Banner gold na seção de estratégias
- ✅ 6 features em grid 3x2 com hover
- ✅ 3 planos com Pro destacado
- ✅ Linha de segurança nos planos
- ✅ 3 depoimentos
- ✅ CTA final
- ✅ Footer com links
- ✅ login.html split 50/50
- ✅ Identidade GestorBet no lado esquerdo (sem Vaultex)
- ✅ Formulários login e cadastro funcionais
- ✅ Toggle de senha + strength bar
- ✅ Responsividade em ambas as páginas
- ✅ Redirecionamento para app.html

**Placeholders:** nenhum encontrado.

**Consistência de nomes:** `switchStrat` definido na Task 5 e usado no HTML da Task 5. `goTab`, `togglePass`, `checkStr`, `onLogin`, `onReg` definidos e usados no login.html (Task 9). Sem divergências.
