// api/consultar-pix.js — Consulta o status de um PIX no Supabase
// (atualizado pelo webhook da PushinPay) + REDE DE SEGURANÇA:
// se o webhook falhar e o pagamento ficar preso em 'pendente' mesmo já
// estando pago, o próprio polling do checkout reconcilia — confirma na
// PushinPay e dispara o processamento (idempotente). Garante que ninguém
// pague e não receba os dados de acesso.

const { waitUntil } = require('@vercel/functions');
const { processPayment, verificarPagamentoPushinPay } = require('./webhook-pushinpay');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function supa(method, qs, body, extraHeaders = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/pagamentos${qs}`, {
    method,
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Parâmetro id obrigatório' });

  // Aceita apenas UUID — evita injeção de parâmetros PostgREST via querystring.
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }
  const pid = id.toLowerCase(); // payment_id é gravado em minúsculas

  try {
    const r = await supa('GET', `?payment_id=eq.${pid}&select=status,created_at&limit=1`);
    const rows = await r.json();
    const pagamento = Array.isArray(rows) ? rows[0] : null;
    if (!pagamento) return res.status(404).json({ status: 'not_found' });

    let status = pagamento.status;
    const ageMs = Date.now() - new Date(pagamento.created_at).getTime();

    // Recupera um processamento travado (função morta no meio): após 2 min
    // ainda 'processando', volta para 'pendente' para ser reconciliado.
    if (status === 'processando' && ageMs > 120000) {
      await supa('PATCH', `?payment_id=eq.${pid}&status=eq.processando`, { status: 'pendente' });
      status = 'pendente';
    }

    // Rede de segurança: pagamento preso em 'pendente' por mais de 30s
    // (tempo de sobra para o webhook ter agido). Confirma na PushinPay.
    if (status === 'pendente' && ageMs > 30000) {
      const conf = await verificarPagamentoPushinPay(pid);
      if (conf && conf.status === 'paid') {
        // Claim atômico: só um request muda 'pendente' -> 'processando'
        // (o filtro status=eq.pendente garante exclusão mútua no Postgres),
        // evitando processar/enviar e-mails em duplicado.
        const claimRes = await supa(
          'PATCH',
          `?payment_id=eq.${pid}&status=eq.pendente`,
          { status: 'processando' },
          { 'Prefer': 'return=representation' }
        );
        const claimed = await claimRes.json();
        if (Array.isArray(claimed) && claimed.length > 0) {
          console.log('[consultar-pix] Reconciliando pagamento órfão:', pid);
          waitUntil(
            processPayment(pid).catch(async (err) => {
              console.error('[consultar-pix] Reconciliação falhou, revertendo p/ pendente:', err);
              try {
                await supa('PATCH', `?payment_id=eq.${pid}&status=eq.processando`, { status: 'pendente' });
              } catch (_) {}
            })
          );
        }
        status = 'processando';
      }
    }

    // Mapeia para o padrão esperado pelo frontend ('paid' = confirmado).
    return res.status(200).json({ status: status === 'pago' ? 'paid' : status });
  } catch (err) {
    console.error('[consultar-pix] erro:', err);
    return res.status(502).json({ error: 'Erro ao consultar status' });
  }
};
