// api/webhook-pushinpay.js — Recebe confirmação de pagamento da PushinPay

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const { sendEmail } = require('./_resend');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ─── Supabase helper ──────────────────────────────────────────────────────────
async function supabase(method, endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
    method,
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
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

// ─── Template: e-mail de primeiro acesso ─────────────────────────────────────
function emailPrimeiroAcesso({ nome, email, senha, plano }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Seus dados de acesso · Grivo Bet</title></head>
<body style="margin:0;padding:0;background:#09090f;font-family:'Outfit',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090f;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#0f0f18;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:560px;width:100%;">
      <tr><td style="padding:32px 36px 0;">
        <p style="margin:0;font-size:22px;font-weight:800;color:#f5f5f7;letter-spacing:-0.5px;">Grivo<span style="color:#f0c040;">.</span>bet</p>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#f5f5f7;letter-spacing:-0.5px;">Seus dados de acesso</h1>
        <p style="margin:0;font-size:15px;color:#8b8b95;line-height:1.6;">Olá, <strong style="color:#f5f5f7;">${nome}</strong>! Sua assinatura do plano <strong style="color:#f0c040;">${plano}</strong> está ativa. Use os dados abaixo para acessar o painel.</p>
      </td></tr>
      <tr><td style="padding:24px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a22;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
          <tr><td style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 4px;font-size:11px;color:#5a5a63;text-transform:uppercase;letter-spacing:0.1em;font-family:monospace;">E-mail</p>
            <p style="margin:0;font-size:15px;color:#f5f5f7;font-weight:600;font-family:monospace;">${email}</p>
          </td></tr>
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 4px;font-size:11px;color:#5a5a63;text-transform:uppercase;letter-spacing:0.1em;font-family:monospace;">Senha de acesso</p>
            <p style="margin:0;font-size:22px;color:#f0c040;font-weight:800;font-family:monospace;letter-spacing:0.05em;">${senha}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#5a5a63;">Recomendamos alterar sua senha após o primeiro acesso.</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 36px 28px;" align="center">
        <a href="https://grivo.bet/login" style="display:inline-block;padding:16px 36px;background:#f0c040;color:#0a0a0c;font-size:15px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">Acessar o painel →</a>
      </td></tr>
      <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:12px;color:#5a5a63;text-align:center;">Em caso de dúvidas, responda este e-mail · <a href="https://grivo.bet" style="color:#8b8b95;">grivo.bet</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Handler principal ────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id: rawId, status } = req.body || {};
  const id = rawId ? rawId.toLowerCase() : null;

  // Só processa pagamentos confirmados
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

  // Idempotência — ignora se já processado
  if (pagamento.status === 'pago') {
    return res.status(200).json({ received: true, skipped: 'já processado' });
  }

  const { email, name, plan_id } = pagamento;
  const planoNome = plan_id === 'mensal' ? 'Mensal' : 'Semanal';
  const primeiroNome = name.split(' ')[0];

  // 2. Gera senha e cria usuário no Supabase Auth
  const senha = gerarSenha();
  const { ok: criouUser, data: userData } = await supabase('POST',
    '/auth/v1/admin/users',
    { email, password: senha, email_confirm: true }
  );

  let userId = userData?.id;

  // Se usuário já existe, busca o id existente
  if (!criouUser && userData?.code === 'email_exists') {
    const { data: existente } = await supabase('GET',
      `/auth/v1/admin/users?email=${encodeURIComponent(email)}`
    );
    userId = existente?.users?.[0]?.id;
    console.log('[webhook] Usuário já existe, usando id existente:', userId);
  } else if (!criouUser) {
    console.error('[webhook] Erro ao criar usuário:', userData);
  }

  // 3. Insere/atualiza na tabela usuarios
  if (userId) {
    await supabase('POST', '/rest/v1/usuarios', {
      id:      userId,
      email,
      nome:    name.split(' ')[0],
      sobrenome: name.split(' ').slice(1).join(' ') || '',
      plano:   plan_id,
    });
  }

  // 4. Atualiza status do pagamento
  await supabase('PATCH',
    `/rest/v1/pagamentos?payment_id=eq.${id}`,
    { status: 'pago' }
  );

  // 5. Lê HTML do e-mail de boas-vindas
  let boasVindasHtml = '';
  try {
    boasVindasHtml = fs.readFileSync(
      path.join(process.cwd(), 'emails', 'email-boas-vindas.html'), 'utf8'
    );
  } catch (e) {
    console.warn('[webhook] email-boas-vindas.html não encontrado');
  }

  // 6. Dispara e-mails em paralelo
  await Promise.allSettled([
    boasVindasHtml && sendEmail({
      to:      email,
      subject: `Bem-vindo ao Grivo Bet, ${primeiroNome}!`,
      html:    boasVindasHtml,
    }),
    sendEmail({
      to:      email,
      subject: 'Seus dados de acesso · Grivo Bet',
      html:    emailPrimeiroAcesso({ nome: primeiroNome, email, senha, plano: planoNome }),
    }),
  ]);

  console.log('[webhook] Processamento completo para:', email);
  return res.status(200).json({ received: true });
};
