// api/webhook-pushinpay.js — Recebe confirmação de pagamento da PushinPay

const crypto = require('crypto');
const { sendEmail } = require('./_resend');
const { getPlan } = require('./_plans');

const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_KEY;
const PUSHINPAY_TOKEN = process.env.PUSHINPAY_TOKEN;

// ─── Verifica o pagamento DIRETO na PushinPay ─────────────────────────────────
// O corpo do webhook é controlável pelo cliente; nunca confiar nele.
// Só liberamos acesso se a própria PushinPay confirmar status "paid".
async function verificarPagamentoPushinPay(id) {
  try {
    const r = await fetch(`https://api.pushinpay.com.br/api/pix/cashIn/${id}`, {
      headers: {
        'Authorization': `Bearer ${PUSHINPAY_TOKEN}`,
        'Accept': 'application/json',
      },
    });
    if (!r.ok) {
      console.error('[webhook] PushinPay consulta falhou:', r.status);
      return null;
    }
    return await r.json();
  } catch (err) {
    console.error('[webhook] Erro ao consultar PushinPay:', err);
    return null;
  }
}

// ─── Supabase helper ──────────────────────────────────────────────────────────
async function supabase(method, endpoint, body, extraHeaders = {}) {
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
    method,
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

// ─── Gerador de senha segura ──────────────────────────────────────────────────
function gerarSenha() {
  return crypto.randomBytes(10).toString('base64url').slice(0, 12);
}

// ─── Calcula data de expiração do plano ───────────────────────────────────────
function calcularExpiracao(plan_id, baseDate = new Date()) {
  const dias = plan_id === 'mensal' ? 30 : plan_id === 'semanal' ? 7 : 1;
  return new Date(baseDate.getTime() + dias * 24 * 60 * 60 * 1000).toISOString();
}

// ─── Templates de e-mail (inline) ────────────────────────────────────────────
const EMAIL_BOAS_VINDAS_HTML = `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>Bem-vindo ao Grivo Bet</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
  body{margin:0;padding:0;width:100%!important;background:#0a0a0c;}
  table{border-collapse:collapse;}
  img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;display:block;}
  a{text-decoration:none;}
  .px{font-family:'Outfit',Arial,Helvetica,sans-serif;}
  .mono{font-family:'JetBrains Mono','Courier New',monospace;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}
  @keyframes shimmer{0%{background-position:-160% 0;}100%{background-position:260% 0;}}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
  @keyframes ringGrow{0%{transform:scale(0.6);opacity:0.9;}100%{transform:scale(1.8);opacity:0;}}
  @keyframes drawline{from{stroke-dashoffset:520;}to{stroke-dashoffset:0;}}
  @keyframes barUp{from{transform:scaleY(0);}to{transform:scaleY(1);}}

  .anim1{animation:fadeUp .7s ease both;}
  .anim2{animation:fadeUp .7s ease .12s both;}
  .anim3{animation:fadeUp .7s ease .24s both;}
  .anim4{animation:fadeUp .7s ease .36s both;}
  .anim5{animation:fadeUp .7s ease .48s both;}
  .livedot{animation:pulse 1.4s ease-in-out infinite;}
  .floatcard{animation:float 5s ease-in-out infinite;}
  .shine{
    background:linear-gradient(100deg,#FFCB1F 0%,#FFCB1F 38%,#FFF4CC 50%,#FFCB1F 62%,#FFCB1F 100%);
    background-size:220% 100%;
    animation:shimmer 3.2s linear infinite;
  }
  .grow-line{stroke-dasharray:520;animation:drawline 2.2s ease-out .3s both;}

  @media only screen and (max-width:620px){
    .container{width:100%!important;}
    .px-pad{padding-left:22px!important;padding-right:22px!important;}
    .h1{font-size:33px!important;line-height:1.04!important;}
    .stack{display:block!important;width:100%!important;}
    .step-cell{padding:16px!important;}
    .heropad{padding:30px 26px 0!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0a0a0c;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0a0c;">Sua conta está ativa. Em instantes você recebe um e-mail com seus dados de acesso.&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0c;background-image:radial-gradient(65% 45% at 50% 0%, rgba(255,203,31,0.12), transparent 62%);">
<tr><td align="center" style="padding:28px 12px 40px;">

<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

  <!-- Header -->
  <tr><td class="px-pad anim1" style="padding:8px 40px 26px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="left" class="px" style="font-size:23px;font-weight:800;letter-spacing:-0.5px;color:#f5f5f7;">Grivo<span style="color:#FFCB1F;">.</span><span style="color:#8b8b95;font-weight:400;">bet</span></td>
      <td align="right">
        <table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>
          <td style="background:linear-gradient(180deg,rgba(0,230,118,0.12),rgba(0,230,118,0.05));border:1px solid rgba(0,230,118,0.35);border-radius:99px;padding:7px 14px 7px 11px;box-shadow:0 0 18px rgba(0,230,118,0.12);">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td valign="middle" style="padding-right:7px;font-size:0;line-height:0;">
                <span class="livedot" style="display:inline-block;width:8px;height:8px;border-radius:99px;background:#00E676;box-shadow:0 0 8px #00E676,0 0 2px #00E676;"></span>
              </td>
              <td valign="middle" class="mono" style="font-size:10px;letter-spacing:1.8px;color:#00E676;text-transform:uppercase;font-weight:600;">Conta ativa</td>
            </tr></table>
          </td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>

  <!-- Hero card -->
  <tr><td class="px-pad anim2" style="padding:0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#121218;border:1px solid rgba(255,255,255,0.09);border-radius:22px;overflow:hidden;">
      <tr><td class="shine" style="height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td class="heropad" style="padding:42px 44px 0;">
        <div class="mono" style="font-size:11px;letter-spacing:2.5px;color:#FFCB1F;text-transform:uppercase;margin-bottom:20px;">Bem-vindo a bordo</div>
        <div class="h1 px" style="font-size:42px;line-height:1.0;font-weight:800;letter-spacing:-1.8px;color:#f5f5f7;">
          Sua conta está ativa.<br/>Agora você aposta<br/>com <span style="color:#FFCB1F;">método</span> — não<br/>com sorte.
        </div>
        <p class="px" style="margin:24px 0 0;font-size:16px;line-height:1.62;color:#b8b8c0;">
          Boa decisão. Você tem acesso completo a <strong style="color:#f5f5f7;">8+ estratégias matemáticas</strong>, gestão de banca automatizada e o Modo Simulação ilimitado — tudo num só painel.
        </p>
      </td></tr>

      <!-- Mini animated chart -->
      <tr><td style="padding:28px 44px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d12;border:1px solid rgba(255,255,255,0.07);border-radius:14px;">
          <tr><td style="padding:18px 20px 14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td class="mono" style="font-size:10px;letter-spacing:1.5px;color:#8b8b95;text-transform:uppercase;">Banca · simulação</td>
              <td align="right" class="mono" style="font-size:12px;font-weight:700;color:#00E676;">&#9650; +58,3%</td>
            </tr></table>
            <div style="padding-top:12px;font-size:0;line-height:0;">
              <svg width="100%" height="70" viewBox="0 0 480 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#FFA200"/><stop offset="1" stop-color="#FFE082"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="58" x2="480" y2="58" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 5"/>
                <path class="grow-line" d="M4 60 C 70 54, 120 50, 170 40 S 280 34, 330 22 S 430 12, 476 6" fill="none" stroke="url(#wg)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="476" cy="6" r="4.5" fill="#FFCB1F"/>
              </svg>
            </div>
          </td></tr>
        </table>
      </td></tr>

      <!-- Próximo passo: aviso do e-mail de acesso -->
      <tr><td style="padding:28px 44px 42px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,203,31,0.07);border:1px solid rgba(255,203,31,0.28);border-radius:14px;">
          <tr><td style="padding:20px 24px;">
            <p class="px" style="margin:0;font-size:15px;line-height:1.62;color:#d8d8dc;">
              &#128233; <strong style="color:#FFCB1F;">Próximo passo:</strong> você vai receber um segundo e-mail com seu <strong style="color:#f5f5f7;">login e senha provisória</strong> para acessar o painel. Verifique também a caixa de spam.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- Primeiros passos -->
  <tr><td class="px-pad anim3" style="padding:42px 40px 4px;">
    <div class="mono" style="font-size:11px;letter-spacing:2.5px;color:#8b8b95;text-transform:uppercase;">Seus primeiros 10 minutos</div>
  </td></tr>

  <tr><td class="px-pad anim4" style="padding:18px 40px 0;">
    <!-- Step 1 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:#121218;border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
      <tr>
        <td class="step-cell" valign="top" width="66" style="padding:22px 0 22px 22px;">
          <div class="mono" style="width:40px;height:40px;background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.32);border-radius:99px;color:#FFCB1F;font-size:15px;font-weight:700;text-align:center;line-height:40px;">01</div>
        </td>
        <td class="step-cell" valign="middle" style="padding:22px 22px 22px 16px;">
          <div class="px" style="font-size:16px;font-weight:600;color:#f5f5f7;margin-bottom:4px;">Escolha sua primeira estratégia</div>
          <div class="px" style="font-size:14px;line-height:1.5;color:#8b8b95;">Martingale, Fibonacci, Oscar Grind... cada uma com lógica e nível de risco diferentes.</div>
        </td>
      </tr>
    </table>
    <!-- Step 2 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:#121218;border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
      <tr>
        <td class="step-cell" valign="top" width="66" style="padding:22px 0 22px 22px;">
          <div class="mono" style="width:40px;height:40px;background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.32);border-radius:99px;color:#FFCB1F;font-size:15px;font-weight:700;text-align:center;line-height:40px;">02</div>
        </td>
        <td class="step-cell" valign="middle" style="padding:22px 22px 22px 16px;">
          <div class="px" style="font-size:16px;font-weight:600;color:#f5f5f7;margin-bottom:4px;">Configure stop win e stop loss</div>
          <div class="px" style="font-size:14px;line-height:1.5;color:#8b8b95;">Defina onde o sistema para — e ele obedece. Sem mais "só mais uma" no impulso.</div>
        </td>
      </tr>
    </table>
    <!-- Step 3 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:#121218;border:1px solid rgba(0,230,118,0.22);border-radius:14px;">
      <tr>
        <td class="step-cell" valign="top" width="66" style="padding:22px 0 22px 22px;">
          <div class="mono" style="width:40px;height:40px;background:rgba(0,230,118,0.12);border:1px solid rgba(0,230,118,0.4);border-radius:99px;color:#00E676;font-size:15px;font-weight:700;text-align:center;line-height:40px;">03</div>
        </td>
        <td class="step-cell" valign="middle" style="padding:22px 22px 22px 16px;">
          <div class="px" style="font-size:16px;font-weight:600;color:#f5f5f7;margin-bottom:4px;">Rode no Modo Simulação</div>
          <div class="px" style="font-size:14px;line-height:1.5;color:#8b8b95;">Veja como a estratégia performa sem arriscar 1 real. Só vá pro real quando os números fizerem sentido.</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Tip banner -->
  <tr><td class="px-pad anim5" style="padding:24px 40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,203,31,0.05);border:1px solid rgba(255,203,31,0.22);border-radius:14px;">
      <tr><td style="padding:22px 24px;">
        <div class="px" style="font-size:14px;line-height:1.62;color:#d8d8dc;">
          <strong style="color:#FFCB1F;">&#9889; Dica de quem já roda há meses:</strong> não pule a simulação. Quem testa antes entende o comportamento de cada estratégia e chega no dinheiro real com método — não com sorte.
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Support -->
  <tr><td class="px-pad" style="padding:34px 40px 0;" align="center">
    <p class="px" style="margin:0;font-size:15px;line-height:1.6;color:#8b8b95;">
      Qualquer dúvida, é só responder este e-mail.<br/>A gente lê tudo.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td class="px-pad" style="padding:40px 40px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;">
        <div class="px" style="font-size:19px;font-weight:800;letter-spacing:-0.5px;color:#f5f5f7;margin-bottom:10px;">Grivo<span style="color:#FFCB1F;">.</span><span style="color:#8b8b95;font-weight:400;">bet</span></div>
        <p class="px" style="margin:0 0 14px;font-size:12px;line-height:1.6;color:#5a5a63;">
          <strong style="color:#8b8b95;">Apostar envolve risco. Aposte com responsabilidade.</strong> Proibido para menores de 18 anos. Resultados passados não garantem performance futura. O Grivo Bet é uma ferramenta de apoio à decisão; nenhuma estratégia garante lucro.
        </p>
        <p class="mono" style="margin:0;font-size:11px;letter-spacing:0.5px;color:#5a5a63;">
          18+ &middot; Jogo responsável &middot; CVV 188<br/>
          <a href="https://grivo.bet" style="color:#8b8b95;">grivo.bet</a> &nbsp;&middot;&nbsp; <a href="#" style="color:#8b8b95;">Cancelar inscrição</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

const EMAIL_DADOS_ACESSO_TEMPLATE = `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>Seus dados de acesso — Grivo Bet</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
  body{margin:0;padding:0;width:100%!important;background:#0a0a0c;}
  table{border-collapse:collapse;}
  img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;display:block;}
  a{text-decoration:none;}
  .px{font-family:'Outfit',Arial,Helvetica,sans-serif;}
  .mono{font-family:'JetBrains Mono','Courier New',monospace;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}
  @keyframes shimmer{0%{background-position:-160% 0;}100%{background-position:260% 0;}}
  @keyframes keyglow{0%,100%{box-shadow:0 0 0 rgba(255,203,31,0);}50%{box-shadow:0 0 22px rgba(255,203,31,0.22);}}
  @keyframes ringGrow{0%{transform:scale(0.55);opacity:0.9;}100%{transform:scale(1.7);opacity:0;}}

  .anim1{animation:fadeUp .7s ease both;}
  .anim2{animation:fadeUp .7s ease .12s both;}
  .anim3{animation:fadeUp .7s ease .24s both;}
  .anim4{animation:fadeUp .7s ease .36s both;}
  .anim5{animation:fadeUp .7s ease .48s both;}
  .anim6{animation:fadeUp .7s ease .6s both;}
  .livedot{animation:pulse 1.4s ease-in-out infinite;}
  .keycard{animation:keyglow 3s ease-in-out infinite;}
  .shine{
    background:linear-gradient(100deg,#FFCB1F 0%,#FFCB1F 38%,#FFF4CC 50%,#FFCB1F 62%,#FFCB1F 100%);
    background-size:220% 100%;
    animation:shimmer 3.2s linear infinite;
  }

  @media only screen and (max-width:620px){
    .container{width:100%!important;}
    .px-pad{padding-left:22px!important;padding-right:22px!important;}
    .h1{font-size:32px!important;line-height:1.05!important;}
    .stack{display:block!important;width:100%!important;}
    .cred-cell{display:block!important;width:100%!important;border-right:0!important;border-bottom:1px solid rgba(255,255,255,0.08)!important;}
    .btn-a{display:block!important;}
    .heropad{padding:32px 26px 0!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0a0a0c;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0a0c;">Seus dados de acesso ao Grivo Bet estão prontos. Guarde este e-mail com segurança.&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0c;background-image:radial-gradient(65% 45% at 50% 0%, rgba(255,203,31,0.12), transparent 62%);">
<tr><td align="center" style="padding:28px 12px 40px;">

<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

  <!-- Header -->
  <tr><td class="px-pad anim1" style="padding:8px 40px 26px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="left" class="px" style="font-size:23px;font-weight:800;letter-spacing:-0.5px;color:#f5f5f7;">Grivo<span style="color:#FFCB1F;">.</span><span style="color:#8b8b95;font-weight:400;">bet</span></td>
      <td align="right">
        <table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>
          <td style="background:linear-gradient(180deg,rgba(255,203,31,0.12),rgba(255,203,31,0.04));border:1px solid rgba(255,203,31,0.35);border-radius:99px;padding:7px 14px 7px 11px;box-shadow:0 0 18px rgba(255,203,31,0.1);">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td valign="middle" style="padding-right:7px;font-size:0;line-height:0;">
                <span class="livedot" style="display:inline-block;width:8px;height:8px;border-radius:99px;background:#FFCB1F;box-shadow:0 0 8px #FFCB1F;"></span>
              </td>
              <td valign="middle" class="mono" style="font-size:10px;letter-spacing:1.8px;color:#FFCB1F;text-transform:uppercase;font-weight:600;">Acesso liberado</td>
            </tr></table>
          </td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>

  <!-- Hero card -->
  <tr><td class="px-pad anim2" style="padding:0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#121218;border:1px solid rgba(255,255,255,0.09);border-radius:22px;overflow:hidden;">
      <tr><td class="shine" style="height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td class="heropad" style="padding:44px 44px 0;" align="center">

        <!-- Key icon -->
        <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:24px;"><tr><td align="center" style="position:relative;">
          <div style="width:72px;height:72px;border-radius:99px;background:radial-gradient(circle,rgba(255,203,31,0.22),rgba(255,203,31,0.04));border:1px solid rgba(255,203,31,0.4);text-align:center;line-height:72px;">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFCB1F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">
              <circle cx="8" cy="8" r="5"/>
              <path d="M11.5 11.5 L20 20 M17 17 l2.5 -2.5 M14.5 14.5 l2 -2"/>
            </svg>
          </div>
        </td></tr></table>

        <div class="mono" style="font-size:11px;letter-spacing:2.5px;color:#FFCB1F;text-transform:uppercase;margin-bottom:16px;">Seus dados de acesso</div>
        <div class="h1 px" style="font-size:38px;line-height:1.02;font-weight:800;letter-spacing:-1.6px;color:#f5f5f7;">
          Tudo pronto.<br/>Seu acesso está <span style="color:#FFCB1F;">ativo.</span>
        </div>
        <p class="px" style="margin:20px 0 0;font-size:16px;line-height:1.62;color:#b8b8c0;">
          Recebemos a confirmação do seu pagamento. Abaixo estão os dados pra entrar no painel do Grivo Bet. <strong style="color:#f5f5f7;">Guarde este e-mail em local seguro.</strong>
        </p>
      </td></tr>

      <!-- Credentials card -->
      <tr><td style="padding:30px 44px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="keycard" style="background:#0d0d12;border:1px solid rgba(255,203,31,0.25);border-radius:16px;">
          <tr><td style="padding:6px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <!-- Login -->
              <tr>
                <td class="cred-cell" width="50%" style="padding:22px 24px;border-right:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);" valign="top">
                  <div class="mono" style="font-size:10px;letter-spacing:1.5px;color:#8b8b95;text-transform:uppercase;margin-bottom:8px;">Login / e-mail</div>
                  <div class="px" style="font-size:15px;font-weight:600;color:#f5f5f7;word-break:break-all;">{{EMAIL}}</div>
                </td>
                <td class="cred-cell" width="50%" style="padding:22px 24px;border-bottom:1px solid rgba(255,255,255,0.08);" valign="top">
                  <div class="mono" style="font-size:10px;letter-spacing:1.5px;color:#8b8b95;text-transform:uppercase;margin-bottom:8px;">Senha provisória</div>
                  <div class="mono" style="font-size:16px;font-weight:700;color:#FFCB1F;letter-spacing:1px;">{{SENHA}}</div>
                </td>
              </tr>
              <!-- Plan -->
              <tr>
                <td colspan="2" style="padding:20px 24px;" valign="middle">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td valign="middle">
                      <div class="mono" style="font-size:10px;letter-spacing:1.5px;color:#8b8b95;text-transform:uppercase;margin-bottom:7px;">Plano ativo</div>
                      <div class="px" style="font-size:16px;font-weight:700;color:#f5f5f7;letter-spacing:-0.2px;">{{PLANO}}</div>
                    </td>
                    <td align="right" valign="middle">
                      <table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>
                        <td style="background:linear-gradient(180deg,rgba(0,230,118,0.14),rgba(0,230,118,0.05));border:1px solid rgba(0,230,118,0.4);border-radius:99px;padding:7px 14px 7px 11px;">
                          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                            <td valign="middle" style="padding-right:7px;font-size:0;line-height:0;">
                              <span class="livedot" style="display:inline-block;width:7px;height:7px;border-radius:99px;background:#00E676;box-shadow:0 0 8px #00E676;"></span>
                            </td>
                            <td valign="middle" class="mono" style="font-size:10px;letter-spacing:1.5px;color:#00E676;text-transform:uppercase;font-weight:600;">Ativo</td>
                          </tr></table>
                        </td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:28px 44px 16px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
          <td align="center" class="shine" style="border-radius:12px;box-shadow:0 12px 32px rgba(255,203,31,0.28);">
            <a class="btn-a px" href="https://www.grivo.bet/login" style="display:inline-block;padding:18px 40px;font-size:16px;font-weight:700;color:#0a0a0c;letter-spacing:-0.2px;border-radius:12px;">Entrar no painel  &rarr;</a>
          </td>
        </tr></table>
      </td></tr>

      <!-- Security note inside card -->
      <tr><td style="padding:8px 44px 40px;" align="center">
        <p class="px" style="margin:0;font-size:13px;line-height:1.55;color:#8b8b95;">
          &#128274; No primeiro acesso, o sistema vai pedir pra você <strong style="color:#d8d8dc;">criar uma senha definitiva.</strong>
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Security recommendations -->
  <tr><td class="px-pad anim3" style="padding:38px 40px 4px;">
    <div class="mono" style="font-size:11px;letter-spacing:2.5px;color:#8b8b95;text-transform:uppercase;">Recomendações de segurança</div>
  </td></tr>

  <tr><td class="px-pad anim4" style="padding:18px 40px 0;">
    <!-- Tip 1 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:#121218;border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
      <tr>
        <td valign="middle" width="60" style="padding:20px 0 20px 22px;">
          <div style="width:38px;height:38px;background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.3);border-radius:10px;text-align:center;line-height:38px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCB1F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
          </div>
        </td>
        <td valign="middle" style="padding:20px 22px 20px 14px;">
          <div class="px" style="font-size:15px;font-weight:600;color:#f5f5f7;margin-bottom:3px;">Troque a senha provisória</div>
          <div class="px" style="font-size:13.5px;line-height:1.5;color:#8b8b95;">Logo no primeiro acesso, defina uma senha forte e única que só você conheça.</div>
        </td>
      </tr>
    </table>
    <!-- Tip 2 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:#121218;border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
      <tr>
        <td valign="middle" width="60" style="padding:20px 0 20px 22px;">
          <div style="width:38px;height:38px;background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.3);border-radius:10px;text-align:center;line-height:38px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCB1F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z"/></svg>
          </div>
        </td>
        <td valign="middle" style="padding:20px 22px 20px 14px;">
          <div class="px" style="font-size:15px;font-weight:600;color:#f5f5f7;margin-bottom:3px;">Nunca compartilhe seus dados</div>
          <div class="px" style="font-size:13.5px;line-height:1.5;color:#8b8b95;">A equipe Grivo Bet jamais vai pedir sua senha por e-mail, telefone ou mensagem.</div>
        </td>
      </tr>
    </table>
    <!-- Tip 3 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:#121218;border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
      <tr>
        <td valign="middle" width="60" style="padding:20px 0 20px 22px;">
          <div style="width:38px;height:38px;background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.3);border-radius:10px;text-align:center;line-height:38px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCB1F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        </td>
        <td valign="middle" style="padding:20px 22px 20px 14px;">
          <div class="px" style="font-size:15px;font-weight:600;color:#f5f5f7;margin-bottom:3px;">Comece pelo Modo Simulação</div>
          <div class="px" style="font-size:13.5px;line-height:1.5;color:#8b8b95;">Teste qualquer estratégia sem arriscar 1 real antes de operar de verdade.</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Support -->
  <tr><td class="px-pad anim5" style="padding:30px 40px 0;" align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,203,31,0.05);border:1px solid rgba(255,203,31,0.22);border-radius:14px;">
      <tr><td style="padding:22px 24px;" align="center">
        <div class="px" style="font-size:14px;line-height:1.62;color:#d8d8dc;">
          <strong style="color:#FFCB1F;">Não consegue entrar?</strong> Responda este e-mail ou fale com nosso suporte. A gente resolve rápido.
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td class="px-pad anim6" style="padding:38px 40px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;">
        <div class="px" style="font-size:19px;font-weight:800;letter-spacing:-0.5px;color:#f5f5f7;margin-bottom:10px;">Grivo<span style="color:#FFCB1F;">.</span><span style="color:#8b8b95;font-weight:400;">bet</span></div>
        <p class="px" style="margin:0 0 14px;font-size:12px;line-height:1.6;color:#5a5a63;">
          <strong style="color:#8b8b95;">Este e-mail contém dados sensíveis de acesso.</strong> Se você não reconhece esta assinatura, ignore esta mensagem ou entre em contato com o suporte imediatamente. Apostar envolve risco. Aposte com responsabilidade. Proibido para menores de 18 anos.
        </p>
        <p class="mono" style="margin:0;font-size:11px;letter-spacing:0.5px;color:#5a5a63;">
          18+ &middot; Jogo responsável &middot; CVV 188<br/>
          <a href="https://grivo.bet" style="color:#8b8b95;">grivo.bet</a> &nbsp;&middot;&nbsp; <a href="#" style="color:#8b8b95;">Central de ajuda</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

// ─── Template: e-mail de dados de acesso ─────────────────────────────────────
function emailDadosAcesso({ email, senha, plano }) {
  return EMAIL_DADOS_ACESSO_TEMPLATE
    .replace('{{EMAIL}}', email)
    .replace('{{SENHA}}', senha)
    .replace('{{PLANO}}', plano);
}

// ─── Handler principal ────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id: rawId, status } = req.body || {};
  const id = rawId ? rawId.toLowerCase() : null;

  if (status !== 'paid') return res.status(200).json({ received: true });

  console.log('[webhook] Pagamento confirmado:', id);

  // 1. Busca registro na tabela pagamentos
  const { data: pagamentos } = await supabase('GET',
    `/rest/v1/pagamentos?payment_id=eq.${id}&limit=1`
  );

  const pagamento = Array.isArray(pagamentos) ? pagamentos[0] : null;
  if (!pagamento) {
    console.error('[webhook] Pagamento não encontrado:', id);
    return res.status(200).json({ received: true, warning: 'pagamento não encontrado' });
  }

  if (pagamento.status === 'pago') {
    return res.status(200).json({ received: true, skipped: 'já processado' });
  }

  const { email, name, plan_id } = pagamento;

  // Confirma o pagamento DIRETO na PushinPay — não confia no corpo do webhook.
  const plano = getPlan(plan_id);
  const confirmacao = await verificarPagamentoPushinPay(id);
  if (!confirmacao || confirmacao.status !== 'paid') {
    console.error('[webhook] Pagamento NÃO confirmado pela PushinPay:', id, confirmacao?.status);
    return res.status(200).json({ received: true, warning: 'pagamento não confirmado na PushinPay' });
  }
  // Confere também o valor pago contra o preço oficial do plano.
  if (plano && Number(confirmacao.value) !== plano.valueCents) {
    console.error('[webhook] Valor divergente:', id, 'pago:', confirmacao.value, 'esperado:', plano.valueCents);
    return res.status(200).json({ received: true, warning: 'valor divergente' });
  }

  const planoNome    = plano ? plano.nome : 'Teste';
  const nomeCompleto = (name || '').trim();
  const primeiroNome = nomeCompleto.split(/\s+/)[0] || 'Cliente';
  const senha        = gerarSenha();

  // 2. Cria ou atualiza usuário no Supabase Auth
  console.log('[webhook] Criando usuário Auth para:', email);
  const authResult = await supabase('POST',
    '/auth/v1/admin/users',
    { email, password: senha, email_confirm: true }
  );
  console.log('[webhook] Auth result ok:', authResult.ok, 'status:', authResult.status, 'data:', JSON.stringify(authResult.data)?.slice(0, 200));

  let userId        = authResult.data?.id;
  let planoExpiraEm = calcularExpiracao(plan_id);

  if (!authResult.ok && authResult.data?.error_code === 'email_exists') {
    const existenteResult = await supabase('GET',
      `/auth/v1/admin/users?email=${encodeURIComponent(email)}`
    );
    userId = existenteResult.data?.users?.[0]?.id;
    console.log('[webhook] Usuário já existe, id:', userId);

    if (userId) {
      await supabase('PUT', `/auth/v1/admin/users/${userId}`, { password: senha });
      console.log('[webhook] Senha atualizada no auth.users');

      const { data: usuarioAtual } = await supabase('GET',
        `/rest/v1/usuarios?id=eq.${userId}&select=plano_expira_em&limit=1`
      );
      const expiracaoAtual = usuarioAtual?.[0]?.plano_expira_em;
      const base = expiracaoAtual && new Date(expiracaoAtual) > new Date()
        ? new Date(expiracaoAtual)
        : new Date();
      planoExpiraEm = calcularExpiracao(plan_id, base);
      console.log('[webhook] Nova expiração:', planoExpiraEm);
    }
  } else if (!authResult.ok) {
    console.error('[webhook] Erro ao criar usuário Auth:', JSON.stringify(authResult.data));
  }

  // Se não conseguimos um userId, ABORTA com 500: não marca o pagamento como
  // pago (para a PushinPay re-tentar o webhook) e não envia e-mail com senha
  // que não funciona. O pagamento fica 'pendente' e pode ser reprocessado.
  if (!userId) {
    console.error('[webhook] userId indefinido — abortando sem marcar pago. id:', id);
    return res.status(500).json({ error: 'Falha ao provisionar usuário' });
  }

  // 3. Upsert na tabela usuarios
  console.log('[webhook] Upserting em usuarios, id:', userId);
  const upsertResult = await supabase(
    'POST',
    '/rest/v1/usuarios',
    {
      id:             userId,
      email,
      nome:           nomeCompleto.split(/\s+/)[0] || '',
      sobrenome:      nomeCompleto.split(/\s+/).slice(1).join(' ') || '',
      plano:          plan_id,
      senha,
      plano_expira_em: planoExpiraEm,
    },
    { 'Prefer': 'resolution=merge-duplicates,return=representation' }
  );
  console.log('[webhook] Upsert usuarios ok:', upsertResult.ok, 'status:', upsertResult.status);

  // Se o upsert falhar, também aborta sem marcar pago — mesma lógica.
  if (!upsertResult.ok) {
    console.error('[webhook] Upsert usuarios falhou — abortando sem marcar pago. status:', upsertResult.status);
    return res.status(500).json({ error: 'Falha ao gravar usuário' });
  }

  // 4. Atualiza status do pagamento
  await supabase('PATCH',
    `/rest/v1/pagamentos?payment_id=eq.${id}`,
    { status: 'pago' }
  );

  // 5. Dispara e-mails em paralelo
  console.log('[webhook] RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY);

  const dadosAcessoHtml = emailDadosAcesso({ email, senha, plano: planoNome });

  const emailResults = await Promise.allSettled([
    sendEmail({
      to:      email,
      subject: `Bem-vindo ao Grivo Bet, ${primeiroNome}!`,
      html:    EMAIL_BOAS_VINDAS_HTML,
    }),
    sendEmail({
      to:      email,
      subject: 'Seus dados de acesso · Grivo Bet',
      html:    dadosAcessoHtml,
    }),
  ]);

  emailResults.forEach((r, i) => {
    const label = i === 0 ? 'boas-vindas' : 'dados-acesso';
    if (r.status === 'fulfilled') console.log(`[webhook] email ${label}: OK`, JSON.stringify(r.value)?.slice(0, 100));
    else console.error(`[webhook] email ${label}: ERRO`, r.reason?.message || r.reason);
  });

  console.log('[webhook] Processamento completo para:', email);
  return res.status(200).json({ received: true });
};
