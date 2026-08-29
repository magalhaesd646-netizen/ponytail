'use strict';

const nodemailer = require('nodemailer');

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

function formatItemText(item) {
  const linhas = [
    `• ${item.empreendimento || '(nome não identificado)'}`,
    `  Cidade: ${item.cidade || '-'}`,
    `  Construtora: ${item.construtora || 'não identificada automaticamente'}`,
    `  Incorporadora: ${item.incorporadora || 'não identificada automaticamente'}`,
  ];
  if (item.emailContato) {
    linhas.push(`  E-mail (${item.emailContato.departamento}): ${item.emailContato.email}`);
  } else {
    linhas.push('  E-mail: não encontrado automaticamente');
  }
  linhas.push(`  Fonte: ${item.sourceLabel || item.sourceType} — ${item.url}`);
  return linhas.join('\n');
}

function formatItemHtml(item) {
  const emailLine = item.emailContato
    ? `<b>E-mail (${item.emailContato.departamento}):</b> <a href="mailto:${item.emailContato.email}">${item.emailContato.email}</a>`
    : '<b>E-mail:</b> não encontrado automaticamente';
  return `
    <li style="margin-bottom:16px;">
      <div style="font-weight:600;font-size:15px;">${item.empreendimento || '(nome não identificado)'}</div>
      <div>Cidade: ${item.cidade || '-'}</div>
      <div>Construtora: ${item.construtora || 'não identificada automaticamente'}</div>
      <div>Incorporadora: ${item.incorporadora || 'não identificada automaticamente'}</div>
      <div>${emailLine}</div>
      <div>Fonte: <a href="${item.url}">${item.sourceLabel || item.sourceType}</a></div>
    </li>`;
}

function buildDigest(newItems) {
  const subject = `[Vale do Paraíba] ${newItems.length} novo(s) lançamento(s) imobiliário(s)`;
  const text = [
    `Foram encontrados ${newItems.length} lançamento(s) novo(s):`,
    '',
    ...newItems.map(formatItemText),
  ].join('\n\n');
  const html = `
    <p>Foram encontrados <b>${newItems.length}</b> lançamento(s) novo(s):</p>
    <ul style="padding-left:18px;">${newItems.map(formatItemHtml).join('')}</ul>
  `;
  return { subject, text, html };
}

/**
 * Envia um e-mail de alerta com os lançamentos novos encontrados na
 * execução. Se as variáveis de SMTP não estiverem configuradas, apenas
 * loga o resumo no console (modo "dry run") — útil para testar o
 * pipeline sem enviar e-mail de verdade.
 */
async function sendDigest(newItems) {
  if (!newItems.length) return { sent: false, reason: 'sem itens novos' };

  const { subject, text, html } = buildDigest(newItems);

  if (!hasSmtpConfig()) {
    console.log('[notifier] SMTP não configurado — modo dry-run. Resumo do e-mail que seria enviado:');
    console.log(`Assunto: ${subject}\n`);
    console.log(text);
    return { sent: false, reason: 'SMTP não configurado (dry-run)' };
  }

  const transport = buildTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ALERT_EMAIL_TO,
    subject,
    text,
    html,
  });
  return { sent: true };
}

module.exports = { sendDigest, buildDigest, hasSmtpConfig };
