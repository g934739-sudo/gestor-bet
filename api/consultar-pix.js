// api/consultar-pix.js — Vercel Serverless Function
// Consulta o status de um PIX via PushinPay

const PUSHINPAY_TOKEN = process.env.PUSHINPAY_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Parâmetro id obrigatório' });

  try {
    const pixRes = await fetch(`https://api.pushinpay.com.br/api/pix/cashIn/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PUSHINPAY_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (pixRes.status === 404) {
      return res.status(404).json({ status: 'not_found' });
    }

    if (!pixRes.ok) {
      const err = await pixRes.text();
      console.error('[consultar-pix] PushinPay error:', err);
      return res.status(502).json({ error: 'Falha ao consultar PIX' });
    }

    const data = await pixRes.json();
    return res.status(200).json({ status: data.status });
  } catch (err) {
    console.error('[consultar-pix] Fetch error:', err);
    return res.status(502).json({ error: 'Erro de conexão com PushinPay' });
  }
}
