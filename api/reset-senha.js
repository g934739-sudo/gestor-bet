// api/reset-senha.js — Gera token de recuperação e envia e-mail via Resend

const crypto = require('crypto');
const { sendEmail } = require('./_resend');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

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

async function buscarUsuarioPorEmail(email) {
  const alvo = email.trim().toLowerCase();
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const r = await supabase('GET', `/auth/v1/admin/users?page=${page}&per_page=${perPage}`);
    const users = r.data?.users || [];
    const achado = users.find((u) => (u.email || '').toLowerCase() === alvo);
    if (achado) return achado;
    if (users.length < perPage) break;
  }
  return null;
}

const EMAIL_RESET_TEMPLATE = `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>Redefinir sua senha — Grivo Bet</title>
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

  /* Static — no animations for universal email-client compatibility */
  .shine{background:#FFCB1F;}

  @media only screen and (max-width:620px){
    .container{width:100%!important;}
    .px-pad{padding-left:20px!important;padding-right:20px!important;}
    .h1{font-size:30px!important;}
    .btn-a{display:block!important;}
    .heropad{padding:34px 26px 0!important;}
  }
</style>
</head>
<body bgcolor="#0a0a0c" style="margin:0;padding:0;background:#0a0a0c;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0a0c;">Recebemos seu pedido de redefinição de senha. O link expira em 30 minutos.&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0c" style="background:#0a0a0c;background-image:radial-gradient(65% 45% at 50% 0%, rgba(255,203,31,0.1), transparent 62%);">
<tr><td align="center" style="padding:28px 12px 40px;">

<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

  <!-- Header -->
  <tr><td class="px-pad anim1" style="padding:8px 40px 26px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="left" class="px" style="font-size:23px;font-weight:800;letter-spacing:-0.5px;color:#f5f5f7;">Grivo<span style="color:#FFCB1F;">.</span><span style="color:#8b8b95;font-weight:400;">bet</span></td>
      <td align="right" class="mono" style="font-size:10px;letter-spacing:2px;color:#5a5a63;text-transform:uppercase;">Segurança da conta</td>
    </tr></table>
  </td></tr>

  <!-- Hero card -->
  <tr><td class="px-pad anim2" style="padding:0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#121218;border:1px solid rgba(255,255,255,0.09);border-radius:22px;overflow:hidden;">
      <tr><td class="shine" style="height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td class="heropad" style="padding:44px 44px 0;" align="center">

        <!-- Lock icon -->
        <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:24px;"><tr><td align="center">
          <div style="width:72px;height:72px;border-radius:99px;background:radial-gradient(circle,rgba(255,203,31,0.22),rgba(255,203,31,0.04));border:1px solid rgba(255,203,31,0.4);text-align:center;line-height:72px;font-size:32px;">🔒</div>
        </td></tr></table>

        <div class="mono" style="font-size:11px;letter-spacing:2.5px;color:#FFCB1F;text-transform:uppercase;margin-bottom:16px;">Redefinição de senha</div>
        <div class="h1 px" style="font-size:34px;line-height:1.06;font-weight:800;letter-spacing:-1.4px;color:#f5f5f7;">
          Vamos criar uma<br/>senha nova.
        </div>
        <p class="px" style="margin:18px auto 0;font-size:15.5px;line-height:1.62;color:#b8b8c0;max-width:420px;">
          Recebemos um pedido pra redefinir a senha da conta <strong style="color:#f5f5f7;">{{email_cliente}}</strong>. Clique no botão abaixo pra escolher uma senha nova.
        </p>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:30px 44px 18px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
          <td align="center" class="shine" style="border-radius:12px;box-shadow:0 12px 32px rgba(255,203,31,0.28);">
            <a class="btn-a px" href="{{link_reset}}" style="display:inline-block;padding:18px 40px;font-size:16px;font-weight:700;color:#0a0a0c;letter-spacing:-0.2px;border-radius:12px;">Redefinir minha senha  →</a>
          </td>
        </tr></table>
      </td></tr>

      <!-- Expiry note -->
      <tr><td style="padding:0 44px 38px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
          <td valign="middle" style="padding-right:7px;font-size:0;">
            <span class="livedot" style="display:inline-block;width:7px;height:7px;border-radius:99px;background:#FFCB1F;box-shadow:0 0 8px #FFCB1F;"></span>
          </td>
          <td valign="middle" class="mono" style="font-size:11.5px;letter-spacing:0.8px;color:#8b8b95;">Por segurança, este link expira em <strong style="color:#FFCB1F;">30 minutos</strong></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <!-- Fallback link -->
  <tr><td class="px-pad anim3" style="padding:30px 40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d12;border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
      <tr><td style="padding:20px 24px;">
        <div class="mono" style="font-size:10px;letter-spacing:1.8px;color:#8b8b95;text-transform:uppercase;margin-bottom:10px;">O botão não funcionou?</div>
        <div class="px" style="font-size:13px;line-height:1.55;color:#8b8b95;">Copie e cole este endereço no seu navegador:</div>
        <div class="mono" style="font-size:12px;line-height:1.6;color:#FFCB1F;margin-top:8px;word-break:break-all;">{{link_reset}}</div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Security note -->
  <tr><td class="px-pad anim4" style="padding:24px 40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid rgba(255,255,255,0.18);background:linear-gradient(to right,rgba(255,255,255,0.03),transparent 70%);border-radius:0 12px 12px 0;">
      <tr><td style="padding:18px 22px;">
        <div class="px" style="font-size:13.5px;line-height:1.62;color:#8b8b95;">
          <strong style="color:#d8d8dc;">Não foi você?</strong> Pode ignorar este e-mail com tranquilidade — sua senha atual continua valendo e ninguém tem acesso à sua conta. Se quiser reforçar a segurança, troque sua senha pelo painel.
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Support -->
  <tr><td class="px-pad anim5" style="padding:32px 40px 0;" align="center">
    <p class="px" style="margin:0;font-size:14px;line-height:1.6;color:#8b8b95;">
      Precisa de ajuda? <strong style="color:#f5f5f7;">Responda este e-mail</strong> e a gente resolve.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td class="px-pad" style="padding:38px 40px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;">
        <div class="px" style="font-size:19px;font-weight:800;letter-spacing:-0.5px;color:#f5f5f7;margin-bottom:10px;">Grivo<span style="color:#FFCB1F;">.</span><span style="color:#8b8b95;font-weight:400;">bet</span></div>
        <p class="px" style="margin:0 0 14px;font-size:12px;line-height:1.6;color:#5a5a63;">
          <strong style="color:#8b8b95;">A equipe Grivo Bet nunca pede sua senha</strong> por e-mail, telefone ou mensagem. Este e-mail foi enviado porque alguém solicitou a redefinição de senha da sua conta. Apostar envolve risco. Aposte com responsabilidade. Proibido para menores de 18 anos.
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

function emailReset({ email, link }) {
  return EMAIL_RESET_TEMPLATE
    .replace(/\{\{email_cliente\}\}/g, email)
    .replace(/\{\{link_reset\}\}/g, link);
}

const { withSentry } = require("./_sentry");

async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  const alvo = email.trim().toLowerCase();

  try {
    const usuario = await buscarUsuarioPorEmail(alvo);

    if (usuario) {
      const token    = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      // Invalida tokens anteriores do mesmo e-mail
      await supabase('PATCH',
        `/rest/v1/password_resets?email=eq.${encodeURIComponent(alvo)}&used=eq.false`,
        { used: true }
      );

      // Salva novo token
      await supabase('POST', '/rest/v1/password_resets', {
        email:      alvo,
        user_id:    usuario.id,
        token,
        expires_at: expiresAt,
      });

      const link = `https://grivo.bet/login?token=${token}`;
      await sendEmail({
        to:      alvo,
        subject: 'Redefinir sua senha · Grivo Bet',
        html:    emailReset({ email: alvo, link }),
      });

      console.log('[reset-senha] Token gerado e e-mail enviado para:', alvo);
    } else {
      console.log('[reset-senha] E-mail não encontrado (ignorando silenciosamente):', alvo);
    }
  } catch (err) {
    console.error('[reset-senha] Erro:', err);
    // Retorna sucesso mesmo em erro para não vazar informação
  }

  // Sempre retorna sucesso — não revelar se o e-mail existe
  return res.status(200).json({ ok: true });
};

module.exports = withSentry(handler);
