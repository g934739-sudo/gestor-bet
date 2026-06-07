// api/consultar-pix.js — Vercel Serverless Function
// Consulta o status de um PIX pelo Supabase (atualizado pelo webhook da PushinPay)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Parâmetro id obrigatório' });

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/pagamentos?payment_id=eq.${id}&select=status&limit=1`,
      {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Accept':        'application/json',
        },
      }
    );

    const rows = await r.json();
    const pagamento = Array.isArray(rows) ? rows[0] : null;

    if (!pagamento) return res.status(404).json({ status: 'not_found' });

    // Mapeia status do Supabase para o padrão esperado pelo frontend
    const status = pagamento.status === 'pago' ? 'paid' : pagamento.status;
    return res.status(200).json({ status });
  } catch (err) {
    console.error('[consultar-pix] Supabase error:', err);
    return res.status(502).json({ error: 'Erro ao consultar status' });
  }
};
