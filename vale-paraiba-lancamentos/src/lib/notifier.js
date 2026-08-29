'use strict';

const nodemailer = require('nodemailer');
const { buildDigest } = require('./digest');

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.ALERT_EMAIL_TO
  );
}

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Canal de e-mail próprio — OPCIONAL. Se as variáveis de SMTP não estiverem
 * configuradas, apenas loga o resumo no console (modo "dry run"), sem
 * quebrar o pipeline. O canal padrão (sem nenhuma configuração) é o de
 * GitHub Issues, em src/lib/githubIssue.js.
 */
async function sendDigest(newItems) {
  if (!newItems.length) return { sent: false, reason: 'sem itens novos' };

  const { subject, text, html } = buildDigest(newItems);

  if (!hasSmtpConfig()) {
    console.log('[notifier] SMTP não configurado — canal de e-mail em modo dry-run (opcional).');
    return { sent: false, reason: 'SMTP não configurado (dry-run, opcional)' };
  }

  const transport = buildTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ALERT_EMAIL_TO,
    subject: `[Vale do Paraíba] ${subject}`,
    text,
    html,
  });
  return { sent: true };
}

module.exports = { sendDigest, hasSmtpConfig };
