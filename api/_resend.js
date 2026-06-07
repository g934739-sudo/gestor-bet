// api/_resend.js — helper compartilhado para envio de e-mails via Resend

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = 'Grivo Bet <noreply@grivo.bet>';

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }

  return res.json();
}

module.exports = { sendEmail };
