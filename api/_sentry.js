// api/_sentry.js — Sentry para as funções serverless (captura de erros no backend).
const Sentry = require("@sentry/node");

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ||
    "https://3c85e302cb0e1ad8ce80f8b44c99afc6@o4511657478258688.ingest.us.sentry.io/4511657489465344",
  environment: process.env.VERCEL_ENV || "production",
  tracesSampleRate: 0, // só erros — sem performance tracing, mantém leve
});

// Envolve um handler de função serverless: captura qualquer exceção, faz flush
// (OBRIGATÓRIO em serverless — sem isso o evento não é enviado antes de a
// função congelar) e responde/relança sem quebrar o fluxo normal.
function withSentry(handler) {
  return async function (req, res) {
    try {
      return await handler(req, res);
    } catch (err) {
      try {
        Sentry.captureException(err);
        await Sentry.flush(2000);
      } catch (_) {}
      if (res && !res.headersSent) {
        try { res.status(500).json({ error: "Erro interno" }); } catch (_) {}
      }
      throw err;
    }
  };
}

// Captura um erro em processamento assíncrono (ex.: waitUntil) já com flush.
async function captureAsync(err, context) {
  try {
    if (context) Sentry.setContext("extra", context);
    Sentry.captureException(err);
    await Sentry.flush(2000);
  } catch (_) {}
}

module.exports = { Sentry, withSentry, captureAsync };
