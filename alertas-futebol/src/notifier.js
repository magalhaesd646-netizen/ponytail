'use strict';

require('dotenv').config();
const nodemailer = require('nodemailer');
const axios = require('axios');

function formatMessage(alert, fixture) {
  const { teams, league, goals, fixture: fx } = fixture;
  const scoreHome = goals && goals.home != null ? goals.home : '?';
  const scoreAway = goals && goals.away != null ? goals.away : '?';
  const minute = fx && fx.status && fx.status.elapsed != null ? ` (${fx.status.elapsed}')` : '';
  return (
    `⚽ ${alert.teamName}: ${alert.metricLabel} = ${alert.value} ` +
    `(${alert.comparatorSymbol} ${alert.threshold})\n` +
    `${teams.home.name} ${scoreHome} x ${scoreAway} ${teams.away.name} — ${league.name}${minute}`
  );
}

function getMailTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass },
  });
}

// Envia o alerta pelos canais configurados (e-mail e/ou webhook). Cada
// canal falha de forma independente — um erro no SMTP não impede o
// webhook de sair, e vice-versa.
async function sendAlert(alert, fixture) {
  const message = formatMessage(alert, fixture);
  const results = {};

  const transport = getMailTransport();
  const to = process.env.ALERT_EMAIL_TO;
  if (transport && to) {
    try {
      await transport.sendMail({
        from: `${process.env.FROM_NAME || 'Alertas de Futebol'} <${process.env.SMTP_USER}>`,
        to,
        subject: `Alerta de futebol: ${alert.teamName} — ${alert.metricLabel}`,
        text: message,
      });
      results.email = 'enviado';
    } catch (err) {
      results.email = `erro: ${err.message}`;
    }
  }

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      // "content" (Discord) e "text" (Slack) juntos cobrem os dois formatos
      // mais comuns de webhook de entrada sem precisar de configuração extra.
      await axios.post(webhookUrl, { content: message, text: message });
      results.webhook = 'enviado';
    } catch (err) {
      results.webhook = `erro: ${err.message}`;
    }
  }

  if (!transport && !webhookUrl) {
    results.aviso = 'nenhum canal configurado (SMTP_* ou ALERT_WEBHOOK_URL) — alerta não foi entregue';
  }

  return { message, results };
}

module.exports = { formatMessage, sendAlert };
