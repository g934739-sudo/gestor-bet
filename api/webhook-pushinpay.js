// api/webhook-pushinpay.js — Recebe confirmação de pagamento da PushinPay

const crypto = require('crypto');
const { waitUntil } = require('@vercel/functions');
const { sendEmail } = require('./_resend');
const { getPlan } = require('./_plans');

const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_KEY;
const PUSHINPAY_TOKEN = process.env.PUSHINPAY_TOKEN;

// ─── Verifica o pagamento DIRETO na PushinPay ─────────────────────────────────
// O corpo do webhook é controlável pelo cliente; nunca confiar nele.
// Só liberamos acesso se a própria PushinPay confirmar status "paid".
// Rota de consulta: GET /api/transactions/{id} (aceita id em minúsculas).
async function verificarPagamentoPushinPay(id) {
  try {
    const r = await fetch(`https://api.pushinpay.com.br/api/transactions/${id}`, {
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

// ─── Busca usuário no Auth pelo e-mail ────────────────────────────────────────
// ATENÇÃO: GET /admin/users?email= NÃO filtra de verdade — devolve a lista
// inteira (paginada). É preciso paginar e comparar o e-mail manualmente,
// senão pegamos o usuário errado (users[0]) e mexemos na conta de outra pessoa.
async function buscarUsuarioPorEmail(email) {
  const alvo = email.trim().toLowerCase();
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const r = await supabase('GET', `/auth/v1/admin/users?page=${page}&per_page=${perPage}`);
    const users = r.data?.users || [];
    const achado = users.find((u) => (u.email || '').toLowerCase() === alvo);
    if (achado) return achado;
    if (users.length < perPage) break; // última página
  }
  return null;
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
const EMAIL_BOAS_VINDAS_TEMPLATE = `<!doctype html>
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

  /* Static — no animations for universal email-client compatibility */
  .shine{background:#FFCB1F;}

  @media only screen and (max-width:620px){
    .container{width:100%!important;}
    .px-pad{padding-left:22px!important;padding-right:22px!important;}
    .h1{font-size:33px!important;line-height:1.04!important;}
    .stack{display:block!important;width:100%!important;}
    .step-cell{padding:16px!important;}
    .btn-a{display:block!important;}
    .heropad{padding:30px 26px 0!important;}
  }
</style>
</head>
<body bgcolor="#0a0a0c" style="margin:0;padding:0;background:#0a0a0c;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0a0c;">Sua conta está ativa. Comece pelo Modo Simulação — teste qualquer estratégia sem arriscar 1 real.&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0c" style="background:#0a0a0c;background-image:radial-gradient(65% 45% at 50% 0%, rgba(255,203,31,0.12), transparent 62%);">
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
          Boa decisão, {{nome_cliente}}. Você tem acesso completo a <strong style="color:#f5f5f7;">8+ estratégias matemáticas</strong>, gestão de banca automatizada e o Modo Simulação ilimitado — tudo num só painel.
        </p>
        <div class="mono" style="margin:18px 0 0;font-size:11px;letter-spacing:1px;color:#8b8b95;text-transform:uppercase;">
          Plano <span style="color:#FFCB1F;font-weight:700;">{{plano}}</span> &middot; ativo desde {{data_assinatura}}
        </div>
      </td></tr>

      <!-- Mini animated chart -->
      <tr><td style="padding:28px 44px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d12;border:1px solid rgba(255,255,255,0.07);border-radius:14px;">
          <tr><td style="padding:18px 20px 14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td class="mono" style="font-size:10px;letter-spacing:1.5px;color:#8b8b95;text-transform:uppercase;">Banca · simulação</td>
              <td align="right" class="mono" style="font-size:12px;font-weight:700;color:#00E676;">▲ +58,3%</td>
            </tr></table>
            <div style="padding-top:12px;font-size:0;line-height:0;">
              <img src="https://grivo.bet/email-assets/email-chart-boasvindas.png" width="100%" alt="Banca em simulação subindo +58,3%" style="display:block;width:100%;height:auto;border:0;" />
            </div>
          </td></tr>
        </table>
      </td></tr>

      <!-- Aviso: dados de acesso em e-mail separado -->
      <tr><td style="padding:28px 44px 42px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,203,31,0.06);border:1px solid rgba(255,203,31,0.3);border-radius:14px;">
          <tr>
            <td valign="middle" width="62" style="padding:22px 0 22px 22px;">
              <table role="presentation" width="42" height="42" cellpadding="0" cellspacing="0" style="background:rgba(255,203,31,0.14);border:1px solid rgba(255,203,31,0.4);border-radius:11px;"><tr><td align="center" valign="middle" style="font-size:20px;line-height:1;">✉️</td></tr></table>
            </td>
            <td valign="middle" style="padding:22px 24px 22px 16px;">
              <div class="px" style="font-size:15.5px;font-weight:700;color:#FFCB1F;margin-bottom:4px;">Seus dados de acesso chegam em um segundo e-mail</div>
              <div class="px" style="font-size:14px;line-height:1.55;color:#d8d8dc;">Você vai receber seu <strong style="color:#f5f5f7;">login e senha provisória</strong> em uma mensagem separada. Não chegou? Olhe o spam.</div>
            </td>
          </tr>
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
          <strong style="color:#FFCB1F;">⚡ Dica de quem já roda há meses:</strong> não pule a simulação. Quem testa antes entende o comportamento de cada estratégia e chega no dinheiro real com método — não com sorte.
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
          18+ · Jogo responsável · CVV 188<br/>
          <a href="https://grivo.bet" style="color:#8b8b95;">grivo.bet</a> &nbsp;·&nbsp; <a href="#" style="color:#8b8b95;">Cancelar inscrição</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;

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

  /* Static — no animations for universal email-client compatibility */
  .shine{background:#FFCB1F;}

  @media only screen and (max-width:620px){
    .container{width:100%!important;}
    .px-pad{padding-left:22px!important;padding-right:22px!important;}
    .h1{font-size:32px!important;line-height:1.05!important;}
    .stack{display:block!important;width:100%!important;}
    .cred-cell{display:block!important;width:100%!important;border-right:0!important;border-bottom:1px solid rgba(255,255,255,0.08)!important;}
    .cred-cell:last-child{border-bottom:0!important;}
    .btn-a{display:block!important;}
    .heropad{padding:32px 26px 0!important;}
  }
</style>
</head>
<body bgcolor="#0a0a0c" style="margin:0;padding:0;background:#0a0a0c;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0a0c;">Seus dados de acesso ao Grivo Bet estão prontos. Guarde este e-mail com segurança.&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0c" style="background:#0a0a0c;background-image:radial-gradient(65% 45% at 50% 0%, rgba(255,203,31,0.12), transparent 62%);">
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
          <table role="presentation" width="72" height="72" cellpadding="0" cellspacing="0" style="border-radius:99px;background:radial-gradient(circle,rgba(255,203,31,0.22),rgba(255,203,31,0.04));border:1px solid rgba(255,203,31,0.4);"><tr><td align="center" valign="middle" style="font-size:32px;line-height:1;">🔑</td></tr></table>
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
                <td class="cred-cell" width="50%" style="padding:22px 24px;border-right:1px solid rgba(255,255,255,0.08);" valign="top">
                  <div class="mono" style="font-size:10px;letter-spacing:1.5px;color:#8b8b95;text-transform:uppercase;margin-bottom:8px;">Login / e-mail</div>
                  <div class="px" style="font-size:15px;font-weight:600;color:#f5f5f7;word-break:break-all;">{{EMAIL}}</div>
                </td>
                <td class="cred-cell" width="50%" style="padding:22px 24px;" valign="top">
                  <div class="mono" style="font-size:10px;letter-spacing:1.5px;color:#8b8b95;text-transform:uppercase;margin-bottom:8px;">Senha provisória</div>
                  <div class="mono" style="font-size:16px;font-weight:700;color:#FFCB1F;letter-spacing:1px;">{{SENHA}}</div>
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
            <a class="btn-a px" href="https://grivo.bet/login" style="display:inline-block;padding:18px 40px;font-size:16px;font-weight:700;color:#0a0a0c;letter-spacing:-0.2px;border-radius:12px;">Entrar no painel  →</a>
          </td>
        </tr></table>
      </td></tr>

      <!-- Security note inside card -->
      <tr><td style="padding:8px 44px 40px;" align="center">
        <p class="px" style="margin:0;font-size:13px;line-height:1.55;color:#8b8b95;">
          🔒 No primeiro acesso, o sistema vai pedir pra você <strong style="color:#d8d8dc;">criar uma senha definitiva.</strong>
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
          <table role="presentation" width="38" height="38" cellpadding="0" cellspacing="0" style="background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.3);border-radius:10px;"><tr><td align="center" valign="middle" style="font-size:18px;line-height:1;">🔒</td></tr></table>
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
          <table role="presentation" width="38" height="38" cellpadding="0" cellspacing="0" style="background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.3);border-radius:10px;"><tr><td align="center" valign="middle" style="font-size:18px;line-height:1;">🛡️</td></tr></table>
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
          <table role="presentation" width="38" height="38" cellpadding="0" cellspacing="0" style="background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.3);border-radius:10px;"><tr><td align="center" valign="middle" style="font-size:18px;line-height:1;">🎯</td></tr></table>
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
          18+ · Jogo responsável · CVV 188<br/>
          <a href="https://grivo.bet" style="color:#8b8b95;">grivo.bet</a> &nbsp;·&nbsp; <a href="#" style="color:#8b8b95;">Central de ajuda</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;

// ─── Template: e-mail de boas-vindas ─────────────────────────────────────────
function emailBoasVindas({ nome, userId, plano }) {
  const idMembro = (userId || '').slice(-4).toUpperCase() || '····';
  const dataAssinatura = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return EMAIL_BOAS_VINDAS_TEMPLATE
    .replace('{{nome_cliente}}', nome || 'Membro')
    .replace('{{id_membro}}', idMembro)
    .replace('{{plano}}', plano)
    .replace('{{data_assinatura}}', dataAssinatura);
}

// ─── Template: e-mail de dados de acesso ─────────────────────────────────────
function emailDadosAcesso({ email, senha }) {
  return EMAIL_DADOS_ACESSO_TEMPLATE
    .replace('{{EMAIL}}', email)
    .replace('{{SENHA}}', senha);
}

// ─── Handler principal ────────────────────────────────────────────────────────
const { withSentry, captureAsync } = require("./_sentry");

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id: rawId, status } = req.body || {};

  // Respond to PushinPay immediately — their webhook timeout is 2 s and our
  // processing (several Supabase + email calls) takes longer than that.
  // waitUntil() é obrigatório: sem ele a Vercel CONGELA a função assim que a
  // resposta é enviada e o processamento nunca termina.
  res.status(200).json({ received: true });

  if (status !== 'paid' || !rawId) return;

  const id = rawId.toLowerCase();
  console.log('[webhook] Pagamento confirmado, processando async:', id);

  waitUntil(
    processPayment(id).catch(async (err) => { console.error('[webhook] processPayment erro não tratado:', err); await captureAsync(err, { fn: 'webhook.processPayment', id }); })
  );
};

async function processPayment(id) {
  // 1. Busca registro na tabela pagamentos
  const { data: pagamentos } = await supabase('GET',
    `/rest/v1/pagamentos?payment_id=eq.${id}&limit=1`
  );

  const pagamento = Array.isArray(pagamentos) ? pagamentos[0] : null;
  if (!pagamento) {
    console.error('[webhook] Pagamento não encontrado:', id);
    return;
  }

  if (pagamento.status === 'pago') {
    console.log('[webhook] Já processado, ignorando:', id);
    return;
  }

  // Claim atômico: só UMA execução processa este pagamento. O webhook e a
  // reconciliação (consultar-pix) podem disparar ao mesmo tempo; quem mudar
  // 'pendente' -> 'processando' primeiro vence (lock de linha do Postgres).
  // As demais execuções saem aqui — evita usuário e e-mails duplicados.
  const claim = await supabase('PATCH',
    `/rest/v1/pagamentos?payment_id=eq.${id}&status=eq.pendente`,
    { status: 'processando' },
    { 'Prefer': 'return=representation' }
  );
  if (!Array.isArray(claim.data) || claim.data.length === 0) {
    console.log('[webhook] Já em processamento por outra execução, ignorando:', id);
    return;
  }
  // Se algo abaixo impedir a conclusão, devolve a 'pendente' para nova tentativa.
  const reverterPendente = () => supabase('PATCH',
    `/rest/v1/pagamentos?payment_id=eq.${id}&status=eq.processando`,
    { status: 'pendente' }
  );

  const { email, name, plan_id } = pagamento;

  // Confirma o pagamento DIRETO na PushinPay — não confia no corpo do webhook.
  const plano = getPlan(plan_id);
  const confirmacao = await verificarPagamentoPushinPay(id);
  if (!confirmacao) {
    console.error('[webhook] Não foi possível consultar a PushinPay:', id);
    await reverterPendente();
    return;
  }
  if (confirmacao.status !== 'paid') {
    console.error('[webhook] Pagamento NÃO confirmado pela PushinPay:', id, confirmacao.status);
    await reverterPendente();
    return;
  }
  // Confere também o valor pago contra o preço oficial do plano.
  if (plano && Number(confirmacao.value) !== plano.valueCents) {
    console.error('[webhook] Valor divergente:', id, 'pago:', confirmacao.value, 'esperado:', plano.valueCents);
    await reverterPendente();
    return;
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
    const existente = await buscarUsuarioPorEmail(email);
    userId = existente?.id;
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

  if (!userId) {
    console.error('[webhook] userId indefinido — abortando sem marcar pago. id:', id);
    await reverterPendente();
    return;
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
      plano_expira_em: planoExpiraEm,
      senha_trocada:  false,
    },
    { 'Prefer': 'resolution=merge-duplicates,return=representation' }
  );
  console.log('[webhook] Upsert usuarios ok:', upsertResult.ok, 'status:', upsertResult.status);

  if (!upsertResult.ok) {
    console.error('[webhook] Upsert usuarios falhou. status:', upsertResult.status);
    await reverterPendente();
    return;
  }

  // 4. Atualiza status do pagamento
  await supabase('PATCH',
    `/rest/v1/pagamentos?payment_id=eq.${id}`,
    { status: 'pago' }
  );

  // 5. Dispara e-mails em paralelo
  console.log('[webhook] RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY);

  const boasVindasHtml  = emailBoasVindas({ nome: nomeCompleto || primeiroNome, userId, plano: planoNome });
  const dadosAcessoHtml = emailDadosAcesso({ email, senha });

  // Envia SEQUENCIALMENTE para garantir a ordem de chegada: boas-vindas
  // primeiro, dados de acesso depois. Em paralelo a ordem era aleatória.
  const enviarComLog = async (label, opts) => {
    try {
      const r = await sendEmail(opts);
      console.log(`[webhook] email ${label}: OK`, JSON.stringify(r)?.slice(0, 100));
    } catch (err) {
      console.error(`[webhook] email ${label}: ERRO`, err?.message || err);
    }
  };

  await enviarComLog('boas-vindas', {
    to:      email,
    subject: 'Você está dentro — Grivo Bet',
    html:    boasVindasHtml,
  });

  // Pequena pausa para o provedor processar na ordem certa antes do 2º e-mail.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  await enviarComLog('dados-acesso', {
    to:      email,
    subject: 'Seus dados de acesso · Grivo Bet',
    html:    dadosAcessoHtml,
  });

  console.log('[webhook] Processamento completo para:', email);
}

module.exports = withSentry(handler);

// Reaproveitados pela rede de segurança em consultar-pix.js (reconciliação).
// O webhook continua sendo o handler default para a sua própria rota.
module.exports.processPayment = processPayment;
module.exports.verificarPagamentoPushinPay = verificarPagamentoPushinPay;
