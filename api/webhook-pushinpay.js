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

// ─── Template: e-mail de dados de acesso ─────────────────────────────────────
function emailDadosAcesso({ email, senha, plano }) {
  let html = '';
  try {
    html = fs.readFileSync(
      path.join(process.cwd(), 'emails', 'email-dados-acesso.html'), 'utf8'
    );
  } catch (e) {
    console.warn('[webhook] email-dados-acesso.html não encontrado');
    return null;
  }
  return html
    .replace('{{EMAIL}}', email)
    .replace('{{SENHA}}', senha)
    .replace('{{PLANO}}', plano);
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
      html:    emailDadosAcesso({ email, senha, plano: planoNome }),
    }),
  ]);

  console.log('[webhook] Processamento completo para:', email);
  return res.status(200).json({ received: true });
};
