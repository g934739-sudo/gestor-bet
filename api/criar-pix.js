// api/criar-pix.js — Vercel Serverless Function
// Cria um PIX via PushinPay e registra em Supabase

const PUSHINPAY_TOKEN = process.env.PUSHINPAY_TOKEN;
const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { value, email, name, plan_id } = req.body;

  if (!value || !email || !name || !plan_id) {
    return res.status(400).json({ error: 'Campos obrigatórios: value, email, name, plan_id' });
  }

  // Chama PushinPay para criar o PIX
  let pixData;
  try {
    const pixRes = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PUSHINPAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        value,
        webhook_url: 'https://www.grivo.bet/api/webhook-pushinpay',
      }),
    });

    if (!pixRes.ok) {
      const err = await pixRes.text();
      console.error('[criar-pix] PushinPay error:', pixRes.status, err);
      return res.status(502).json({ error: 'Falha ao criar PIX na PushinPay', detail: err, httpStatus: pixRes.status });
    }

    pixData = await pixRes.json();
  } catch (err) {
    console.error('[criar-pix] Fetch error:', err);
    return res.status(502).json({ error: 'Erro de conexão com PushinPay' });
  }

  // Salva registro em Supabase
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/pagamentos`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        payment_id: pixData.id,
        email,
        name,
        plan_id,
        value,
        status: 'pendente',
      }),
    });
  } catch (err) {
    // Não bloqueia o checkout se o Supabase falhar
    console.warn('[criar-pix] Supabase insert warning:', err);
  }

  return res.status(200).json({
    id:              pixData.id,
    qr_code:         pixData.qr_code,
    qr_code_base64:  pixData.qr_code_base64,
    status:          pixData.status,
    value:           pixData.value,
  });
}
