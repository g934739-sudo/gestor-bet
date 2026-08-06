// checkout.jsx — Grivo.bet professional checkout (PushinPay-ready)

const { useState, useEffect, useMemo, useRef } = React;

// ─── PLAN DATA ────────────────────────────────────────────────────────────────
const PLANS = [
  { id:"semanal", name:"Semanal", total:27,  period:"semana", periodShort:"/sem", sub:"Cobrado semanalmente",  badge:null },
  { id:"mensal",  name:"Mensal",  total:47,  period:"mês",    periodShort:"/mês", sub:"Cobrado mensalmente · melhor custo", badge:"Mais escolhido" },
];

const FEATURES = [
  "Acesso a 8+ estratégias matemáticas",
  "Modo Simulação ilimitado",
  "Gestão de banca automatizada",
  "Stop win / stop loss configuráveis",
  "Cassino + apostas esportivas",
  "Cancele quando quiser",
];

// ─── INPUT MASKS ──────────────────────────────────────────────────────────────
const maskCPF = (v) => v.replace(/\D/g, "").slice(0, 11)
  .replace(/(\d{3})(\d)/, "$1.$2")
  .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
  .replace(/\.(\d{3})(\d)/, ".$1-$2");

const maskPhone = (v) => v.replace(/\D/g, "").slice(0, 11)
  .replace(/(\d{2})(\d)/, "($1) $2")
  .replace(/(\d{5})(\d)/, "$1-$2");

const validCPFLength = (cpf) => cpf.replace(/\D/g, "").length === 11;
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const fmt = (n) => n.toLocaleString("pt-BR");

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ic = {
  shield: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z"/></svg>,
  lock:   (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  check:  (p) => <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12" strokeDasharray="50"/></svg>,
  checkSm:(p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  arrowL: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  pix:    (p) => <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" {...p}><path d="M9.4 22.6 5.7 18.9a4 4 0 0 1 0-5.7L9.4 9.5l-2-2a6 6 0 0 0 0 8.5l4.7 4.7c.4.4 1 .4 1.4 0l.3-.3a1 1 0 0 0 0-1.4l-4.4-4.4 4.4-4.4a1 1 0 0 0 0-1.4l-.3-.3a1 1 0 0 0-1.4 0L7.4 13.2a3 3 0 0 0 0 4.2l3.7 3.7-1.7 1.5z M22.5 9.5l3.7 3.7a4 4 0 0 1 0 5.7l-3.7 3.7 2 2a6 6 0 0 0 0-8.5l-4.7-4.7a1 1 0 0 0-1.4 0l-.3.3a1 1 0 0 0 0 1.4l4.4 4.4-4.4 4.4a1 1 0 0 0 0 1.4l.3.3a1 1 0 0 0 1.4 0l4.7-4.7a3 3 0 0 0 0-4.2L20.8 11l1.7-1.5z"/><circle cx="16" cy="16" r="3.5"/></svg>,
  bolt:   (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>,
  star:   (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="12 2 15 9 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 9"/></svg>,
};

// ─── PIX QR ───────────────────────────────────────────────────────────────────
function PixQR({ src }) {
  if (src) {
    return <img src={src} alt="QR Code PIX" style={{ width:"100%", height:"100%", borderRadius:4 }} />;
  }
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
      background:"#f0f0f0", borderRadius:4, flexDirection:"column", gap:8 }}>
      <div style={{ width:32, height:32, border:"3px solid #ccc", borderTopColor:"#888",
        borderRadius:"50%", animation:"spin .8s linear infinite" }}></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar() {
  const [online, setOnline] = useState(247);
  useEffect(() => {
    const id = setInterval(() => setOnline((n) => Math.max(180, n + Math.floor((Math.random() - 0.5) * 6))), 4500);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a href="index.html" className="back-link">
          <Ic.arrowL /><span>Voltar à home</span>
        </a>
        <a href="index.html" className="logo">
          <span>Grivo</span><span className="dot">.</span><span className="ext">bet</span>
        </a>
        <div className="topbar-right">
          <span className="live-counter">
            <span className="pip"></span>
            <span><b>{online}</b> pessoas no checkout agora</span>
          </span>
          <span className="secure">
            <Ic.lock /> <span>PAGAMENTO SEGURO</span>
          </span>
        </div>
      </div>
    </header>
  );
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
function Progress({ step }) {
  const steps = ["Identificação", "Pagamento", "Confirmação"];
  return (
    <div className="progress">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`progress-step ${step === i ? "active" : ""} ${step > i ? "done" : ""}`}>
            <div className="progress-num"><span>{String(i + 1).padStart(2, "0")}</span></div>
            <span className="progress-lbl">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`progress-rail ${step > i ? "done" : ""}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── ORDER SUMMARY ────────────────────────────────────────────────────────────
function OrderSummary({ planId, setPlanId }) {
  const plan = PLANS.find((p) => p.id === planId) || PLANS[1];

  return (
    <aside className="summary summary-mobile-first">
      <div className={`summary-card ${plan.id === "mensal" ? "featured" : ""} scale-in`}>
        {plan.badge && <span className="corner-tag">⭐ {plan.badge}</span>}
        <div className="summary-h"><span className="pip"></span>SEU PEDIDO</div>

        <div className="plan-display">
          <h3>Plano {plan.name}</h3>
          <span className="savings"><Ic.bolt /> Acesso completo · cancele quando quiser</span>
        </div>

        <div className="plan-picker-label">Trocar plano</div>
        <div className="plan-pick">
          {PLANS.map((p) => (
            <button key={p.id} type="button" className={`plan-opt ${p.id === plan.id ? "active" : ""}`} onClick={() => setPlanId(p.id)}>
              <div className="plan-opt-left">
                <span className="plan-opt-name">{p.name}</span>
                <span className="plan-opt-sub">por {p.period}</span>
              </div>
              <div className="plan-opt-right">
                <span className="plan-opt-price">R$ {fmt(p.total)}</span>
                {p.badge && <span className="plan-opt-tag">{p.badge}</span>}
              </div>
            </button>
          ))}
        </div>

        <div>
          <div className="summary-line"><span>Plano {plan.name}</span><strong>R$ {fmt(plan.total)}{plan.periodShort}</strong></div>
        </div>

        <div className="summary-total">
          <div>
            <div className="summary-total-label">Total agora</div>
            <div className="summary-total-sub">renova por {plan.period} · cancele quando quiser</div>
          </div>
          <span className="summary-total-val"><span className="cur">R$</span>{fmt(plan.total)}</span>
        </div>

        <ul className="summary-feats">
          {FEATURES.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>

      <div className="testimonial scale-in" style={{ animationDelay:".1s" }}>
        <div className="testi-stars">{Array.from({ length:5 }).map((_, i) => <Ic.star key={i} />)}</div>
        <div className="testi-quote">"Em 3 semanas eu saí do achismo pro método. Hoje opero com stop loss travado e o sistema executa enquanto durmo. Vale cada centavo."</div>
        <div className="testi-author">
          <div className="testi-avatar">RC</div>
          <div className="testi-info">
            <b>Rafael C.</b>
            <span>Assinante há 8 meses</span>
          </div>
        </div>
      </div>

      <div className="trust scale-in" style={{ animationDelay:".15s" }}>
        <div className="trust-row"><Ic.shield /><span><strong>Processado pela PushinPay</strong> · gateway oficial Banco Central</span></div>
        <div className="trust-row"><Ic.lock /><span>Dados criptografados em <strong>SSL/TLS 256-bit</strong></span></div>
        <div className="trust-row"><Ic.checkSm /><span><strong>Acesso liberado</strong> em segundos após a confirmação</span></div>
      </div>
    </aside>
  );
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────
function CheckoutForm() {
  const params = new URLSearchParams(window.location.search);
  const initialPlan = PLANS.find((p) => p.id === params.get("plan")) ? params.get("plan") : "mensal";

  const [planId, setPlanId] = useState(initialPlan);
  const [data, setData] = useState({ name:"", email:"", emailConfirm:"", phone:"" });
  const [pay] = useState({ method:"pix" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [timer, setTimer] = useState(15 * 60);
  const [pixId, setPixId] = useState(null);
  const [pixQrBase64, setPixQrBase64] = useState(null);
  const [pixCodeReal, setPixCodeReal] = useState(null);
  const [pixError, setPixError] = useState(null);
  const gaFiredRef = useRef(false);

  const plan = PLANS.find((p) => p.id === planId);

  // Item de e-commerce (GA4) do plano atual.
  const gaItems = () => plan ? [{ item_id: plan.id, item_name: "Plano " + plan.name, price: plan.total, quantity: 1 }] : undefined;

  // Pix timer
  useEffect(() => {
    if (!submitted || paid) return;
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [submitted, paid]);

  // Polling a cada 5s — consulta Supabase (atualizado pelo webhook da PushinPay).
  // Para quando o pagamento é confirmado OU quando o QR Code expira (timer == 0).
  useEffect(() => {
    if (!submitted || paid || !pixId || timer === 0) return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/consultar-pix?id=${pixId}`);
        const d = await r.json();
        if (d.status === "paid") setPaid(true);
      } catch (_) {}
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [submitted, paid, pixId, timer]);

  // GA4: evento de conversao "purchase" quando o pagamento e confirmado (uma vez).
  useEffect(() => {
    if (!paid || gaFiredRef.current) return;
    gaFiredRef.current = true;
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "purchase", {
        transaction_id: pixId || undefined,
        value: plan ? plan.total : undefined,
        currency: "BRL",
        items: gaItems(),
      });
    }
    // Meta Pixel: conversao "Purchase" (mesmo momento, dispara uma vez).
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "Purchase", {
        value: plan ? plan.total : undefined,
        currency: "BRL",
        content_ids: plan ? [plan.id] : undefined,
        content_type: "product",
      });
    }
  }, [paid]);

  const fieldValid = {
    name:         data.name.trim().split(/\s+/).length >= 2,
    email:        validEmail(data.email),
    emailConfirm: validEmail(data.emailConfirm) && data.emailConfirm === data.email,
    phone:        data.phone.replace(/\D/g, "").length >= 10,
  };

  const handleField = (k, v, mask) => {
    setData((d) => ({ ...d, [k]: mask ? mask(v) : v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setTouched((tt) => ({ ...tt, [k]: true }));
  };

  const validate = () => {
    const e = {};
    if (!fieldValid.name) e.name = "Informe seu nome completo";
    if (!fieldValid.email) e.email = "E-mail inválido";
    if (!fieldValid.emailConfirm) e.emailConfirm = data.emailConfirm && data.emailConfirm !== data.email ? "Os e-mails não coincidem" : "Confirme seu e-mail";
    if (!fieldValid.phone) e.phone = "Telefone inválido";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setTouched({ name:true, email:true, emailConfirm:true, phone:true });
    if (Object.keys(e).length > 0) {
      const firstErr = document.querySelector(".field.error");
      if (firstErr) firstErr.scrollIntoView({ block:"center", behavior:"smooth" });
      return;
    }
    setLoading(true);
    setPixError(null);

    try {
      const r = await fetch("/api/criar-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:   data.email,
          name:    data.name,
          plan_id: planId,  // o preço é definido no servidor a partir do plano
        }),
      });
      const pix = await r.json();
      if (!r.ok || !pix.id) {
        setPixError(pix.error || "Erro ao gerar PIX. Tente novamente.");
        setLoading(false);
        return;
      }
      setPixId(pix.id);
      setPixQrBase64(pix.qr_code_base64 || null);
      setPixCodeReal(pix.qr_code || "");
    } catch (err) {
      setPixError("Erro de conexão. Verifique sua internet e tente novamente.");
      setLoading(false);
      return;
    }

    setLoading(false);
    // GA4: intencao de compra (PIX gerado) — util pro funil visita -> checkout -> compra.
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "begin_checkout", { value: plan ? plan.total : undefined, currency: "BRL", items: gaItems() });
    }
    // Meta Pixel: intencao de compra (PIX gerado).
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "InitiateCheckout", { value: plan ? plan.total : undefined, currency: "BRL", content_ids: plan ? [plan.id] : undefined, content_type: "product" });
    }
    setSubmitted(true);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const pixCode = pixCodeReal || "";

  const identDone = fieldValid.name && fieldValid.email && fieldValid.emailConfirm && fieldValid.phone;
  const step = submitted ? 2 : (identDone ? 1 : 0);

  // ─── SUCCESS STATE ──────────────────────────────────────────────────────────
  if (submitted && paid) {
    const primeiroNome = data.name.split(" ")[0];
    return (
      <>
        <TopBar />
        <div className="success-wrap">
          <div className="success-burst"></div>
          <div className="success-icon"><Ic.check /></div>
          <span className="success-eyebrow"><span style={{ width:6, height:6, borderRadius:"99px", background:"var(--green)" }}></span>Pagamento confirmado</span>
          <h2>Bem-vindo, <span className="accent">{primeiroNome}.</span></h2>
          <p>Seu pagamento foi confirmado com sucesso. Acabamos de enviar dois e-mails para <strong>{data.email}</strong> — um de boas-vindas e outro com sua <strong>senha de primeiro acesso</strong>.</p>

          {/* Próximos passos */}
          <div style={{ margin:"28px auto 0", maxWidth:480, display:"flex", flexDirection:"column", gap:12, textAlign:"left" }}>
            {[
              { n:"01", title:"Verifique seu e-mail", desc:`Abra ${data.email} — enviamos sua senha de acesso. Confira a caixa de spam se não aparecer.` },
              { n:"02", title:"Acesse o painel", desc:"Use seu e-mail e a senha recebida para entrar. Você pode alterar a senha após o primeiro login." },
              { n:"03", title:"Configure sua primeira sessão", desc:"Escolha uma estratégia, defina sua banca e ative o Stop Loss — leva menos de 2 minutos." },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ display:"flex", gap:14, padding:"16px 18px", borderRadius:12,
                background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:11, color:"var(--accent)",
                  fontWeight:700, letterSpacing:"0.1em", minWidth:24, paddingTop:2 }}>{n}</span>
                <div>
                  <strong style={{ display:"block", fontSize:14, color:"var(--text)", marginBottom:3 }}>{title}</strong>
                  <span style={{ fontSize:13, color:"var(--muted)", lineHeight:1.5 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ margin:"28px auto 0", maxWidth:480, padding:"16px 18px", borderRadius:12,
            background:"rgba(0,230,118,0.06)", border:"1px solid rgba(0,230,118,0.2)", textAlign:"left" }}>
            <p style={{ margin:0, fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
              <strong style={{ color:"var(--green)" }}>Plano {plan.name} ativo</strong> · R$ {fmt(plan.total)}/{plan.period} · Cancele quando quiser
            </p>
          </div>

          <div className="success-next" style={{ marginTop:28 }}>
            <a href="login.html" className="success-btn">Acessar o painel <span>→</span></a>
            <a href="index.html" className="success-btn ghost">Voltar à home</a>
          </div>
          <p style={{ marginTop:36, fontSize:12, color:"var(--muted-2)" }}>
            Você receberá um recibo por e-mail. Suporte disponível dentro do painel · Cancele a qualquer momento.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <div className="wrap">
        <div className="page-head fade-in">
          <div>
            <span className="page-eyebrow">
              <span className="num">01</span><span className="rule"></span><span>Checkout seguro</span>
            </span>
            <h1>Finalize sua assinatura do <span className="accent">Grivo Bet.</span></h1>
            <p>Pagamento processado em segundos. Acesso liberado imediatamente após a confirmação — sem espera, sem letra miúda.</p>
          </div>
          <div className="head-stats">
            <div className="head-stat">
              <div className="head-stat-v">+2.000</div>
              <div className="head-stat-l">Usuários ativos</div>
            </div>
            <div className="head-stat">
              <div className="head-stat-v green">4.8<span style={{ fontSize:14, color:"var(--accent)", marginLeft:4 }}>★</span></div>
              <div className="head-stat-l">Nota média</div>
            </div>
          </div>
        </div>

        <Progress step={step} />

        <div className="grid">
          <form onSubmit={handleSubmit} noValidate>
            {/* Card 01 — Identification */}
            <div className={`card fade-in ${identDone ? "touched" : ""}`}>
              <div className="card-head">
                <h2><span className="card-num">01</span>Dados pessoais</h2>
                {identDone && <span className="card-step-pill" style={{ borderColor:"rgba(0,230,118,0.4)", color:"var(--green)" }}>✓ Completo</span>}
              </div>
              <p className="card-sub">Usamos pra emitir nota e liberar seu acesso. Não compartilhamos com terceiros.</p>

              <div className="field-grid">
                <div className={`field full ${errors.name ? "error" : ""} ${touched.name && fieldValid.name ? "valid" : ""}`}>
                  <label>Nome completo <span className="check">✓</span></label>
                  <div className="field-wrap">
                    <input type="text" placeholder="Como aparece no documento"
                           value={data.name}
                           onChange={(e) => handleField("name", e.target.value)} />
                  </div>
                  {errors.name && <span className="field-error">⚠ {errors.name}</span>}
                </div>

                <div className={`field ${errors.email ? "error" : ""} ${touched.email && fieldValid.email ? "valid" : ""}`}>
                  <label>E-mail <span className="check">✓</span></label>
                  <input type="email" placeholder="seu@email.com"
                         value={data.email}
                         onChange={(e) => handleField("email", e.target.value)} />
                  {errors.email && <span className="field-error">⚠ {errors.email}</span>}
                </div>

                <div className={`field ${errors.emailConfirm ? "error" : ""} ${touched.emailConfirm && fieldValid.emailConfirm ? "valid" : ""}`}>
                  <label>Confirme o e-mail <span className="check">✓</span></label>
                  <input type="email" placeholder="repita seu e-mail"
                         value={data.emailConfirm}
                         onPaste={(e) => e.preventDefault()}
                         onChange={(e) => handleField("emailConfirm", e.target.value)} />
                  {errors.emailConfirm && <span className="field-error">⚠ {errors.emailConfirm}</span>}
                </div>

                <div className={`field ${errors.phone ? "error" : ""} ${touched.phone && fieldValid.phone ? "valid" : ""}`}>
                  <label>WhatsApp <span className="check">✓</span></label>
                  <input type="tel" placeholder="(11) 90000-0000" inputMode="numeric"
                         value={data.phone}
                         onChange={(e) => handleField("phone", e.target.value, maskPhone)} />
                  {errors.phone && <span className="field-error">⚠ {errors.phone}</span>}
                </div>
              </div>
            </div>

            {/* Card 02 — Payment */}
            <div className="card fade-in" style={{ animationDelay:".06s" }}>
              <div className="card-head">
                <h2><span className="card-num">02</span>Forma de pagamento</h2>
                <span className="card-step-pill">PushinPay</span>
              </div>
              <p className="card-sub">Pagamento via Pix — aprovação imediata e acesso liberado automaticamente em segundos.</p>

              {!submitted && (
                <div className="method-info fade-in">
                  <div className="method-info-icon"><Ic.bolt /></div>
                  <div className="method-info-body">
                    <strong>Pix Instantâneo · liberação na hora</strong>
                    <span>Geramos um QR Code e código copia-e-cola. Você paga pelo app do seu banco e o sistema libera o acesso automaticamente em segundos.</span>
                    <div className="bank-row">
                      <span className="bank-pill">Nubank</span>
                      <span className="bank-pill">Itaú</span>
                      <span className="bank-pill">Bradesco</span>
                      <span className="bank-pill">Caixa</span>
                      <span className="bank-pill">BB</span>
                      <span className="bank-pill">+ todos os bancos</span>
                    </div>
                  </div>
                </div>
              )}

              {submitted && (
                <div className="fade-in" style={{ marginTop:8 }}>
                  <div className="pix-block">
                    <div className="pix-qr-wrap">
                      <div className="pix-qr"><PixQR src={pixQrBase64} /></div>
                      <div className="pix-qr-corners"></div>
                    </div>
                    <div className="pix-info">
                      <span className={`pix-status ${paid ? "confirmed" : ""}`}>
                        <span className="dot"></span>
                        {paid ? "Pagamento confirmado" : (timer === 0 ? "QR Code expirado" : "Aguardando pagamento")}
                      </span>
                      <div className="pix-instruct">
                        Escaneie o <strong>QR Code</strong> no app do seu banco ou use o código <strong>copia e cola</strong> abaixo. Liberação automática em segundos.
                      </div>
                      <div className="pix-copy">
                        <span className="pix-copy-text">{pixCode}</span>
                        <button type="button" className={`pix-copy-btn ${pixCopied ? "copied" : ""}`}
                                onClick={() => { navigator.clipboard.writeText(pixCode); setPixCopied(true); setTimeout(() => setPixCopied(false), 2200); }}>
                          {pixCopied ? "Copiado!" : "Copiar código"}
                        </button>
                      </div>
                      {timer > 0 ? (
                        <div className="pix-timer-row">
                          <span className="label"><Ic.bolt /> QR Code expira em</span>
                          <span className="time">{fmtTime(timer)}</span>
                        </div>
                      ) : (
                        <button type="button" className="pix-copy-btn"
                                style={{ marginTop:12, width:"100%" }}
                                onClick={() => { setSubmitted(false); setPaid(false); setPixId(null); setPixQrBase64(null); setPixCodeReal(null); setTimer(15 * 60); }}>
                          Gerar novo QR Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {pixError && (
                <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(255,59,92,.1)",
                  border:"1px solid rgba(255,59,92,.3)", color:"var(--red)", fontSize:13,
                  fontWeight:500, marginTop:16 }}>
                  ⚠ {pixError}
                </div>
              )}

              {!submitted && (
                <>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "Processando..." : <><Ic.lock /> Pagar R$ {fmt(plan.total)} <span className="arr">→</span></>}
                  </button>
                  <div className="submit-meta">
                    <span>Ao continuar, você concorda com <a href="termos.html" style={{ color:"var(--muted)", textDecoration:"underline" }}>Termos</a> e <a href="privacidade.html" style={{ color:"var(--muted)", textDecoration:"underline" }}>Privacidade</a>.</span>
                    <span className="dot"></span>
                    <span>Apostar envolve risco · 18+</span>
                  </div>
                </>
              )}
            </div>
          </form>

          <OrderSummary planId={planId} setPlanId={setPlanId} />
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CheckoutForm />);
