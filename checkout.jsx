// checkout.jsx — Grivo.bet professional checkout (PushinPay-ready)

const { useState, useEffect, useMemo, useRef } = React;

// ─── PLAN DATA ────────────────────────────────────────────────────────────────
const PLANS = [
  { id:"mensal",    name:"Mensal",    monthly:197, months:1,  total:197,  sub:"Cobrado mensalmente",        discount:0,   badge:null },
  { id:"semestral", name:"Semestral", monthly:147, months:6,  total:882,  sub:"R$ 882 a cada 6 meses",      discount:300, badge:"Mais escolhido" },
  { id:"anual",     name:"Anual",     monthly:117, months:12, total:1404, sub:"R$ 1.404 a cada 12 meses",   discount:960, badge:"Melhor custo" },
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

const maskCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const maskExpiry = (v) => v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2");

const detectBrand = (num) => {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(36|38|30[0-5])/.test(n)) return "Diners";
  if (/^(6011|65|64[4-9])/.test(n)) return "Elo";
  if (/^(606282|3841)/.test(n)) return "Hipercard";
  return null;
};

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
  card:   (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="2" y="6" width="20" height="14" rx="2"/><line x1="2" y1="11" x2="22" y2="11"/></svg>,
  boleto: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="5" width="18" height="14" rx="1.5"/><line x1="7" y1="9" x2="7" y2="15"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="13" y1="9" x2="13" y2="15"/><line x1="16" y1="9" x2="16" y2="15"/><line x1="18" y1="9" x2="18" y2="15"/></svg>,
  bolt:   (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>,
  star:   (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="12 2 15 9 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 9"/></svg>,
};

// ─── PIX QR ───────────────────────────────────────────────────────────────────
function PixQR({ src }) {
  if (src) {
    return <img src={src} alt="QR Code PIX" style={{ width:"100%", height:"100%", borderRadius:4 }} />;
  }
  // Skeleton enquanto carrega
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
function OrderSummary({ planId, setPlanId, paymentMethod, installments }) {
  const plan = PLANS.find((p) => p.id === planId) || PLANS[1];
  const subtotal = plan.monthly * plan.months;
  const showInstall = paymentMethod === "card" && installments > 1;
  const installValue = plan.total / installments;

  return (
    <aside className="summary summary-mobile-first">
      <div className={`summary-card ${plan.id !== "mensal" ? "featured" : ""} scale-in`}>
        {plan.badge && <span className="corner-tag">⭐ {plan.badge}</span>}
        <div className="summary-h"><span className="pip"></span>SEU PEDIDO</div>

        <div className="plan-display">
          <h3>Plano {plan.name}</h3>
          {plan.discount > 0 && (
            <span className="savings"><Ic.bolt /> Você economiza R$ {fmt(plan.discount)}</span>
          )}
        </div>

        <div className="plan-picker-label">Trocar plano</div>
        <div className="plan-pick">
          {PLANS.map((p) => (
            <button key={p.id} type="button" className={`plan-opt ${p.id === plan.id ? "active" : ""}`} onClick={() => setPlanId(p.id)}>
              <div className="plan-opt-left">
                <span className="plan-opt-name">{p.name}</span>
                <span className="plan-opt-sub">{p.months}× R$ {fmt(p.monthly)}/mês</span>
              </div>
              <div className="plan-opt-right">
                <span className="plan-opt-price">R$ {fmt(p.total)}</span>
                {p.discount > 0 && <span className="plan-opt-tag">−R$ {fmt(p.discount)}</span>}
              </div>
            </button>
          ))}
        </div>

        <div>
          <div className="summary-line"><span>Subtotal</span><strong>R$ {fmt(subtotal)}</strong></div>
          {plan.discount > 0 && <div className="summary-line discount"><span>Desconto fidelidade</span><strong style={{ color:"var(--green)" }}>−R$ {fmt(plan.discount)}</strong></div>}
          {showInstall && <div className="summary-line"><span>Parcelamento</span><strong>{installments}× sem juros</strong></div>}
        </div>

        <div className="summary-total">
          <div>
            <div className="summary-total-label">Total {showInstall ? "à vista" : "agora"}</div>
            {showInstall && <div className="summary-total-sub">{installments}× R$ {installValue.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 })}</div>}
          </div>
          <span className="summary-total-val"><span className="cur">R$</span>{fmt(plan.total)}</span>
        </div>

        <ul className="summary-feats">
          {FEATURES.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>

      <div className="testimonial scale-in" style={{ animationDelay:".1s" }}>
        <div className="testi-stars">{Array.from({ length:5 }).map((_, i) => <Ic.star key={i} />)}</div>
        <div className="testi-quote">"Em 3 semanas eu saí do feeling pro método. Hoje opero com stop loss travado e o sistema executa enquanto durmo. Vale cada centavo."</div>
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
  const initialPlan = PLANS.find((p) => p.id === params.get("plan")) ? params.get("plan") : "semestral";

  const [planId, setPlanId] = useState(initialPlan);
  const [data, setData] = useState({ name:"", email:"", cpf:"", phone:"" });
  const [pay, setPay] = useState({ method:"pix", card:"", expiry:"", cvv:"", holder:"", installments:1 });
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

  const plan = PLANS.find((p) => p.id === planId);
  const cardBrand = detectBrand(pay.card);

  // Pix timer
  useEffect(() => {
    if (!submitted || pay.method !== "pix" || paid) return;
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [submitted, pay.method, paid]);

  // Polling real do status PIX a cada 60s (limite PushinPay: 1 req/min)
  useEffect(() => {
    if (!submitted || pay.method !== "pix" || paid || !pixId) return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/consultar-pix?id=${pixId}`);
        const d = await r.json();
        if (d.status === "paid") setPaid(true);
      } catch (_) {}
    };
    poll(); // consulta imediata ao montar
    const id = setInterval(poll, 60000);
    return () => clearInterval(id);
  }, [submitted, pay.method, paid, pixId]);

  // Field validation in real time
  const fieldValid = {
    name:  data.name.trim().split(/\s+/).length >= 2,
    email: validEmail(data.email),
    cpf:   validCPFLength(data.cpf),
    phone: data.phone.replace(/\D/g, "").length >= 10,
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
    if (!fieldValid.cpf) e.cpf = "CPF inválido";
    if (!fieldValid.phone) e.phone = "Telefone inválido";
    if (pay.method === "card") {
      if (pay.card.replace(/\s/g, "").length < 13) e.card = "Número de cartão inválido";
      if (pay.expiry.length < 5) e.expiry = "Validade inválida";
      if (pay.cvv.length < 3) e.cvv = "CVV inválido";
      if (!pay.holder.trim()) e.holder = "Informe o titular do cartão";
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setTouched({ name:true, email:true, cpf:true, phone:true });
    if (Object.keys(e).length > 0) {
      const firstErr = document.querySelector(".field.error");
      if (firstErr) firstErr.scrollIntoView({ block:"center", behavior:"smooth" });
      return;
    }
    setLoading(true);

    if (pay.method === "pix") {
      try {
        const r = await fetch("/api/criar-pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value:    plan.total * 100,  // centavos
            email:    data.email,
            name:     data.name,
            plan_id:  planId,
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
        setPixCodeReal(pix.qr_code || null);
      } catch (err) {
        setPixError("Erro de conexão. Verifique sua internet e tente novamente.");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setSubmitted(true);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const pixCode = pixCodeReal || "";

  // Determine progress step
  const identDone = fieldValid.name && fieldValid.email && fieldValid.cpf && fieldValid.phone;
  const step = submitted ? 2 : (identDone ? 1 : 0);

  // ─── SUCCESS STATE ──────────────────────────────────────────────────────────
  if (submitted && paid) {
    const orderId = `GVB-${Math.floor(Math.random() * 90000 + 10000)}`;
    return (
      <>
        <TopBar />
        <div className="success-wrap">
          <div className="success-burst"></div>
          <div className="success-icon"><Ic.check /></div>
          <span className="success-eyebrow"><span style={{ width:6, height:6, borderRadius:"99px", background:"var(--green)" }}></span>Acesso liberado</span>
          <h2>Bem-vindo ao <span className="accent">Grivo Bet.</span></h2>
          <p>Seu pagamento foi confirmado. Enviamos um e-mail pra <strong>{data.email}</strong> com os dados de acesso, link do painel e o passo-a-passo pra configurar sua primeira sessão no Modo Simulação.</p>
          <div className="success-receipt">
            <div className="success-receipt-row"><span>Pedido</span><strong>#{orderId}</strong></div>
            <div className="success-receipt-row"><span>Plano</span><strong>{plan.name}</strong></div>
            <div className="success-receipt-row"><span>Método</span><strong>{pay.method === "pix" ? "Pix" : pay.method === "card" ? "Cartão de crédito" : "Boleto"}</strong></div>
            <div className="success-receipt-row"><span>Total pago</span><strong>R$ {fmt(plan.total)}</strong></div>
          </div>
          <div className="success-next">
            <a href="#" className="success-btn">Acessar o painel <span>→</span></a>
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
        {/* Page head */}
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

                <div className={`field full ${errors.email ? "error" : ""} ${touched.email && fieldValid.email ? "valid" : ""}`}>
                  <label>E-mail <span className="check">✓</span></label>
                  <input type="email" placeholder="seu@email.com"
                         value={data.email}
                         onChange={(e) => handleField("email", e.target.value)} />
                  {errors.email && <span className="field-error">⚠ {errors.email}</span>}
                </div>

                <div className={`field ${errors.cpf ? "error" : ""} ${touched.cpf && fieldValid.cpf ? "valid" : ""}`}>
                  <label>CPF <span className="check">✓</span></label>
                  <input type="text" placeholder="000.000.000-00" inputMode="numeric"
                         value={data.cpf}
                         onChange={(e) => handleField("cpf", e.target.value, maskCPF)} />
                  {errors.cpf && <span className="field-error">⚠ {errors.cpf}</span>}
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
              <p className="card-sub">Pix tem aprovação imediata e é nossa forma preferida. Cartão libera o acesso na mesma hora também.</p>

              <div className="pay-tabs">
                {[
                  ["pix",    "Pix",    "Aprovação imediata", Ic.pix],
                  ["card",   "Cartão", "Até 12× sem juros",  Ic.card],
                  ["boleto", "Boleto", "1-3 dias úteis",     Ic.boleto],
                ].map(([id, name, tag, Icon]) => (
                  <button key={id} type="button"
                          className={`pay-tab ${pay.method === id ? "active" : ""}`}
                          onClick={() => setPay((p) => ({ ...p, method: id }))}>
                    <div className="pay-tab-head">
                      <span className="pay-tab-icon"><Icon /></span>
                      <span className="pay-tab-radio"></span>
                    </div>
                    <span className="pay-tab-name">{name}</span>
                    <span className="pay-tab-tag">{tag}</span>
                  </button>
                ))}
              </div>

              {/* Method-specific pre-submit content */}
              {pay.method === "pix" && !submitted && (
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

              {pay.method === "card" && (
                <div className="fade-in field-grid">
                  <div className={`field full ${errors.card ? "error" : ""}`}>
                    <label>Número do cartão <span className="check">✓</span></label>
                    <div className="field-wrap">
                      <input type="text" placeholder="0000 0000 0000 0000" inputMode="numeric"
                             value={pay.card}
                             onChange={(e) => { setPay((p) => ({ ...p, card: maskCard(e.target.value) })); setErrors((er) => ({ ...er, card: undefined })); }} />
                      <span className={`card-brand ${cardBrand ? "show" : ""}`}>{cardBrand || ""}</span>
                    </div>
                    {errors.card && <span className="field-error">⚠ {errors.card}</span>}
                  </div>
                  <div className={`field ${errors.expiry ? "error" : ""}`}>
                    <label>Validade</label>
                    <input type="text" placeholder="MM/AA" inputMode="numeric"
                           value={pay.expiry}
                           onChange={(e) => { setPay((p) => ({ ...p, expiry: maskExpiry(e.target.value) })); setErrors((er) => ({ ...er, expiry: undefined })); }} />
                    {errors.expiry && <span className="field-error">⚠ {errors.expiry}</span>}
                  </div>
                  <div className={`field ${errors.cvv ? "error" : ""}`}>
                    <label>CVV</label>
                    <input type="text" placeholder="000" inputMode="numeric" maxLength="4"
                           value={pay.cvv}
                           onChange={(e) => { setPay((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })); setErrors((er) => ({ ...er, cvv: undefined })); }} />
                    {errors.cvv && <span className="field-error">⚠ {errors.cvv}</span>}
                  </div>
                  <div className={`field full ${errors.holder ? "error" : ""}`}>
                    <label>Nome impresso no cartão</label>
                    <input type="text" placeholder="JOSE M SILVA"
                           value={pay.holder}
                           onChange={(e) => { setPay((p) => ({ ...p, holder: e.target.value.toUpperCase() })); setErrors((er) => ({ ...er, holder: undefined })); }} />
                    {errors.holder && <span className="field-error">⚠ {errors.holder}</span>}
                  </div>
                  <div className="field full">
                    <label>Parcelas <span style={{ fontSize:10, opacity:0.7 }}>SEM JUROS</span></label>
                    <div className="installments">
                      {[1, 3, 6, 12].map((n) => {
                        const v = plan.total / n;
                        return (
                          <button key={n} type="button"
                                  className={`install-opt ${pay.installments === n ? "active" : ""}`}
                                  onClick={() => setPay((p) => ({ ...p, installments: n }))}>
                            <span className="n">{n}× sem juros</span>
                            <span className="v">R$ {v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 })}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {pay.method === "boleto" && !submitted && (
                <div className="method-info blue fade-in">
                  <div className="method-info-icon"><Ic.boleto /></div>
                  <div className="method-info-body">
                    <strong>Boleto bancário</strong>
                    <span>Compensação em 1 a 3 dias úteis. Seu acesso é liberado automaticamente assim que o pagamento for confirmado pelo banco. Pague em qualquer banco, lotérica ou app.</span>
                  </div>
                </div>
              )}

              {/* Post-submit Pix QR */}
              {pay.method === "pix" && submitted && (
                <div className="fade-in" style={{ marginTop:8 }}>
                  <div className="pix-block">
                    <div className="pix-qr-wrap">
                      <div className="pix-qr"><PixQR src={pixQrBase64} /></div>
                      <div className="pix-qr-corners"></div>
                    </div>
                    <div className="pix-info">
                      <span className={`pix-status ${paid ? "confirmed" : ""}`}>
                        <span className="dot"></span>
                        {paid ? "Pagamento confirmado" : "Aguardando pagamento"}
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
                      <div className="pix-timer-row">
                        <span className="label"><Ic.bolt /> QR Code expira em</span>
                        <span className="time">{fmtTime(timer)}</span>
                      </div>
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
                    <span>Ao continuar, você concorda com <a href="#" style={{ color:"var(--muted)", textDecoration:"underline" }}>Termos</a> e <a href="#" style={{ color:"var(--muted)", textDecoration:"underline" }}>Privacidade</a>.</span>
                    <span className="dot"></span>
                    <span>Apostar envolve risco · 18+</span>
                  </div>
                </>
              )}
            </div>
          </form>

          <OrderSummary planId={planId} setPlanId={setPlanId} paymentMethod={pay.method} installments={pay.installments} />
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CheckoutForm />);
