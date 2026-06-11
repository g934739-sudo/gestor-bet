// api/redefinir-senha.js — Valida token e atualiza senha via Supabase Admin API

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

async function buscarToken(token) {
  const { data } = await supabase('GET',
    `/rest/v1/password_resets?token=eq.${token}&used=eq.false&limit=1`,
    undefined,
    { 'Prefer': 'return=representation' }
  );
  return Array.isArray(data) ? data[0] : null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — valida token sem consumi-lo (usado pelo frontend ao carregar a página)
  if (req.method === 'GET') {
    const token = req.query.token;
    if (!token || !UUID_RE.test(token)) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const reset = await buscarToken(token);
    if (!reset) return res.status(404).json({ error: 'Link inválido ou já utilizado' });
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Link expirado. Solicite um novo.' });
    }

    return res.status(200).json({ ok: true });
  }

  // POST — consome token e atualiza senha
  if (req.method === 'POST') {
    const { token, nova_senha } = req.body || {};

    if (!token || !UUID_RE.test(token)) {
      return res.status(400).json({ error: 'Token inválido' });
    }
    if (!nova_senha || nova_senha.length < 8) {
      return res.status(400).json({ error: 'A senha precisa ter no mínimo 8 caracteres' });
    }

    const reset = await buscarToken(token);
    if (!reset) return res.status(404).json({ error: 'Link inválido ou já utilizado' });
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Link expirado. Solicite um novo.' });
    }

    // Atualiza senha via Admin API
    const update = await supabase('PUT',
      `/auth/v1/admin/users/${reset.user_id}`,
      { password: nova_senha }
    );

    if (!update.ok) {
      console.error('[redefinir-senha] Falha ao atualizar senha:', update.status, update.data);
      return res.status(500).json({ error: 'Falha ao atualizar senha. Tente novamente.' });
    }

    // Marca token como usado
    await supabase('PATCH',
      `/rest/v1/password_resets?token=eq.${token}`,
      { used: true }
    );

    console.log('[redefinir-senha] Senha atualizada para:', reset.email);
    return res.status(200).json({ ok: true, email: reset.email });
  }

  return res.status(405).end();
};
