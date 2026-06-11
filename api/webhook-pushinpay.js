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
<title>Você está dentro — Grivo Bet</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
  body{margin:0;padding:0;width:100%!important;background:#0a0a0c;}
  table{border-collapse:collapse;}
  img{border:0;line-height:100%;outline:none;text-decoration:none;display:block;}
  a{text-decoration:none;}
  .px{font-family:'Outfit',Arial,Helvetica,sans-serif;}
  .mono{font-family:'JetBrains Mono','Courier New',monospace;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}
  @keyframes shimmer{0%{background-position:-160% 0;}100%{background-position:260% 0;}}
  @keyframes cardSweep{0%,20%{transform:translateX(-130%) skewX(-18deg);}60%,100%{transform:translateX(330%) skewX(-18deg);}}
  @keyframes floaty{0%,100%{transform:translateY(0) rotate(-1.2deg);}50%{transform:translateY(-6px) rotate(-1.2deg);}}

  .anim1{animation:fadeUp .7s ease both;}
  .anim2{animation:fadeUp .7s ease .12s both;}
  .anim3{animation:fadeUp .7s ease .26s both;}
  .anim4{animation:fadeUp .7s ease .4s both;}
  .anim5{animation:fadeUp .7s ease .54s both;}
  .anim6{animation:fadeUp .7s ease .68s both;}
  .livedot{animation:pulse 1.4s ease-in-out infinite;}
  .member-card{animation:floaty 6s ease-in-out infinite;}
  .sweep{
    position:absolute;top:0;bottom:0;width:46%;
    background:linear-gradient(100deg,transparent,rgba(255,244,204,0.14),transparent);
    animation:cardSweep 4.6s ease-in-out infinite;
  }
  .shine{
    background:linear-gradient(100deg,#FFCB1F 0%,#FFCB1F 38%,#FFF4CC 50%,#FFCB1F 62%,#FFCB1F 100%);
    background-size:220% 100%;
    animation:shimmer 3.2s linear infinite;
  }

  @media only screen and (max-width:620px){
    .container{width:100%!important;}
    .px-pad{padding-left:20px!important;padding-right:20px!important;}
    .h1{font-size:42px!important;}
    .cardpad{padding:26px 24px!important;}
    .btn-a{display:block!important;}
    .tl-copy{padding-left:16px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0a0a0c;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0a0c;">Sua assinatura está ativa. Seu cartão de membro e os primeiros passos estão aqui dentro.&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0c;background-image:radial-gradient(70% 42% at 50% 0%, rgba(255,203,31,0.14), transparent 62%);">
<tr><td align="center" style="padding:30px 12px 44px;">

<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

  <!-- Header -->
  <tr><td class="px-pad anim1" style="padding:8px 40px 34px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="left" class="px" style="font-size:23px;font-weight:800;letter-spacing:-0.5px;color:#f5f5f7;">Grivo<span style="color:#FFCB1F;">.</span><span style="color:#8b8b95;font-weight:400;">bet</span></td>
      <td align="right" class="mono" style="font-size:10px;letter-spacing:2px;color:#5a5a63;text-transform:uppercase;">Confirmação de assinatura</td>
    </tr></table>
  </td></tr>

  <!-- Hero type -->
  <tr><td class="px-pad anim2" style="padding:0 40px;" align="center">
    <div class="mono" style="font-size:11px;letter-spacing:3px;color:#FFCB1F;text-transform:uppercase;margin-bottom:18px;">● Assinatura confirmada</div>
    <div class="h1 px" style="font-size:56px;line-height:0.96;font-weight:900;letter-spacing:-2.6px;color:#f5f5f7;">
      Você está<br/><span style="color:#FFCB1F;">dentro.</span>
    </div>
    <p class="px" style="margin:22px auto 0;font-size:16.5px;line-height:1.62;color:#b8b8c0;max-width:440px;">
      A partir de agora, suas apostas deixam de depender de sorte. Bem-vindo ao time de quem opera com <strong style="color:#f5f5f7;">método, gestão e disciplina.</strong>
    </p>
  </td></tr>

  <!-- Member card -->
  <tr><td class="px-pad anim3" style="padding:38px 40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="member-card" style="border-radius:20px;background:linear-gradient(135deg,#2a230e 0%,#16120a 45%,#0f0d08 100%);border:1px solid rgba(255,203,31,0.45);box-shadow:0 26px 60px rgba(0,0,0,0.5),0 0 40px rgba(255,203,31,0.12);">
      <tr><td style="position:relative;overflow:hidden;border-radius:20px;">
        <div class="sweep">&nbsp;</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td class="cardpad" style="padding:30px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td class="mono" style="font-size:10px;letter-spacing:2.4px;color:rgba(255,203,31,0.85);text-transform:uppercase;">Grivo Bet · Membro</td>
              <td align="right">
                <table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>
                  <td valign="middle" style="padding-right:6px;font-size:0;">
                    <span class="livedot" style="display:inline-block;width:7px;height:7px;border-radius:99px;background:#00E676;box-shadow:0 0 8px #00E676;"></span>
                  </td>
                  <td valign="middle" class="mono" style="font-size:10px;letter-spacing:1.6px;color:#00E676;text-transform:uppercase;font-weight:600;">Ativo</td>
                </tr></table>
              </td>
            </tr></table>
          </td></tr>

          <tr><td class="cardpad" style="padding:34px 32px 0;">
            <div class="px" style="font-size:26px;font-weight:700;letter-spacing:-0.8px;color:#f5f5f7;">{{nome_cliente}}</div>
            <div class="mono" style="font-size:13px;letter-spacing:3px;color:rgba(245,245,247,0.45);margin-top:8px;">GVB &nbsp;····&nbsp; ····&nbsp; {{id_membro}}</div>
          </td></tr>

          <tr><td class="cardpad" style="padding:28px 32px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <div class="mono" style="font-size:9px;letter-spacing:1.8px;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:5px;">Plano</div>
                <div class="px" style="font-size:14px;font-weight:600;color:#f5f5f7;">{{plano}}</div>
              </td>
              <td>
                <div class="mono" style="font-size:9px;letter-spacing:1.8px;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:5px;">Membro desde</div>
                <div class="px" style="font-size:14px;font-weight:600;color:#f5f5f7;">{{data_assinatura}}</div>
              </td>
              <td align="right">
                <div class="mono" style="font-size:9px;letter-spacing:1.8px;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:5px;">Estratégias</div>
                <div class="px" style="font-size:14px;font-weight:600;color:#FFCB1F;">8+ liberadas</div>
              </td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td class="px-pad anim4" style="padding:32px 40px 0;" align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
      <td align="center" class="shine" style="border-radius:12px;box-shadow:0 14px 36px rgba(255,203,31,0.3);">
        <a class="btn-a px" href="https://grivo.bet/login" style="display:inline-block;padding:19px 42px;font-size:16px;font-weight:700;color:#0a0a0c;letter-spacing:-0.2px;border-radius:12px;">Acessar Grivo Bet  &rarr;</a>
      </td>
    </tr></table>
    <div class="mono" style="font-size:11px;letter-spacing:0.5px;color:#5a5a63;margin-top:16px;">Acesso imediato · funciona no celular e no computador</div>
  </td></tr>

  <!-- Timeline: primeiros passos -->
  <tr><td class="px-pad anim5" style="padding:48px 40px 0;">
    <div class="mono" style="font-size:11px;letter-spacing:2.5px;color:#8b8b95;text-transform:uppercase;margin-bottom:22px;">Sua primeira sessão em 3 passos</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <!-- Step 1 -->
      <tr>
        <td width="44" valign="top" align="center" style="padding:0;">
          <div class="mono" style="width:36px;height:36px;border-radius:99px;background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.4);color:#FFCB1F;font-size:13px;font-weight:700;text-align:center;line-height:36px;">1</div>
          <div style="width:1px;height:46px;background:linear-gradient(to bottom,rgba(255,203,31,0.4),rgba(255,255,255,0.08));margin:6px auto 0;font-size:0;">&nbsp;</div>
        </td>
        <td class="tl-copy" valign="top" style="padding:4px 0 18px 20px;">
          <div class="px" style="font-size:16px;font-weight:600;color:#f5f5f7;margin-bottom:4px;">Escolha uma estratégia</div>
          <div class="px" style="font-size:14px;line-height:1.55;color:#8b8b95;">Martingale, Fibonacci, Oscar Grind e mais — cada uma com lógica e risco explicados em linguagem simples.</div>
        </td>
      </tr>
      <!-- Step 2 -->
      <tr>
        <td width="44" valign="top" align="center" style="padding:0;">
          <div class="mono" style="width:36px;height:36px;border-radius:99px;background:rgba(255,203,31,0.12);border:1px solid rgba(255,203,31,0.4);color:#FFCB1F;font-size:13px;font-weight:700;text-align:center;line-height:36px;">2</div>
          <div style="width:1px;height:46px;background:linear-gradient(to bottom,rgba(255,203,31,0.4),rgba(0,230,118,0.4));margin:6px auto 0;font-size:0;">&nbsp;</div>
        </td>
        <td class="tl-copy" valign="top" style="padding:4px 0 18px 20px;">
          <div class="px" style="font-size:16px;font-weight:600;color:#f5f5f7;margin-bottom:4px;">Trave seus limites</div>
          <div class="px" style="font-size:14px;line-height:1.55;color:#8b8b95;">Stop win e stop loss definidos por você — e obedecidos pelo sistema. Sem decisão no calor do momento.</div>
        </td>
      </tr>
      <!-- Step 3 -->
      <tr>
        <td width="44" valign="top" align="center" style="padding:0;">
          <div class="mono" style="width:36px;height:36px;border-radius:99px;background:rgba(0,230,118,0.12);border:1px solid rgba(0,230,118,0.45);color:#00E676;font-size:13px;font-weight:700;text-align:center;line-height:36px;">3</div>
        </td>
        <td class="tl-copy" valign="top" style="padding:4px 0 0 20px;">
          <div class="px" style="font-size:16px;font-weight:600;color:#f5f5f7;margin-bottom:4px;">Rode no Modo Simulação</div>
          <div class="px" style="font-size:14px;line-height:1.55;color:#8b8b95;">Veja a estratégia performando sem arriscar 1 real. Quando os números fizerem sentido, aí sim você decide ir pro real.</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Quote/tip -->
  <tr><td class="px-pad anim6" style="padding:40px 40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #FFCB1F;background:linear-gradient(to right,rgba(255,203,31,0.06),transparent 70%);border-radius:0 12px 12px 0;">
      <tr><td style="padding:20px 24px;">
        <div class="px" style="font-size:14.5px;line-height:1.62;color:#d8d8dc;">
          <strong style="color:#FFCB1F;">Conselho de quem já opera:</strong> não pule a simulação. É ela que separa quem aposta no escuro de quem entra no real já sabendo como a estratégia se comporta.
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Support -->
  <tr><td class="px-pad" style="padding:36px 40px 0;" align="center">
    <p class="px" style="margin:0;font-size:14.5px;line-height:1.6;color:#8b8b95;">
      Dúvida em qualquer passo? <strong style="color:#f5f5f7;">Responda este e-mail.</strong> A gente lê tudo.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td class="px-pad" style="padding:42px 40px 8px;">
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
    .cred-cell:last-child{border-bottom:0!important;}
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
            <a class="btn-a px" href="https://painel.grivo.bet/login" style="display:inline-block;padding:18px 40px;font-size:16px;font-weight:700;color:#0a0a0c;letter-spacing:-0.2px;border-radius:12px;">Entrar no painel  &rarr;</a>
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
  if (!confirmacao) {
    // Falha de rede/API ao consultar — 500 para a PushinPay re-tentar o webhook.
    console.error('[webhook] Não foi possível consultar a PushinPay:', id);
    return res.status(500).json({ error: 'falha ao verificar pagamento' });
  }
  if (confirmacao.status !== 'paid') {
    console.error('[webhook] Pagamento NÃO confirmado pela PushinPay:', id, confirmacao.status);
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

  const boasVindasHtml = emailBoasVindas({ nome: nomeCompleto || primeiroNome, userId, plano: planoNome });
  const dadosAcessoHtml = emailDadosAcesso({ email, senha });

  const emailResults = await Promise.allSettled([
    sendEmail({
      to:      email,
      subject: `Você está dentro — Grivo Bet`,
      html:    boasVindasHtml,
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
