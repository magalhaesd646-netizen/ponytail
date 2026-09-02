const nodemailer = require('nodemailer');
const { appendCampaign } = require('./store');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// SMTP genérico (funciona com Titan Email, Gmail/Workspace ou qualquer
// outro provedor) — configurável via .env, sem serviço hardcoded.
function getTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('SMTP_USER e SMTP_PASS precisam estar configurados (veja .env.example).');
  }
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.titan.email',
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass },
  });
}

// Substitui {{nome}}, {{empresa}}, {{cidade}}, {{email}} pelo dado do contato.
function renderTemplate(template, contact) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => contact[key] || '');
}

async function sendCampaign({ listId, contacts, subject, bodyHtml, tipo, scheduleId }) {
  const transport = getTransport();
  const user = process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || user;
  const signature = (process.env.EMAIL_SIGNATURE || '').replace(/\\n/g, '\n');
  const delayMs = Number(process.env.SEND_DELAY_MS || 4000);
  const dailyLimit = Number(process.env.SEND_DAILY_LIMIT || 400);

  const targets = contacts.filter((c) => c.status === 'ativo' && c.email).slice(0, dailyLimit);
  const results = [];

  for (let i = 0; i < targets.length; i += 1) {
    const contact = targets[i];
    const html =
      renderTemplate(bodyHtml, contact) +
      (signature ? `<br><br><pre style="font-family:inherit">${signature}</pre>` : '');
    const unsubscribeSubject = encodeURIComponent(`Descadastrar ${contact.email}`);
    try {
      await transport.sendMail({
        from: `${fromName} <${user}>`,
        to: contact.email,
        subject: renderTemplate(subject, contact),
        html,
        headers: {
          'List-Unsubscribe': `<mailto:${user}?subject=${unsubscribeSubject}>`,
        },
      });
      results.push({ contatoId: contact.id, email: contact.email, status: 'enviado' });
    } catch (err) {
      results.push({
        contatoId: contact.id,
        email: contact.email,
        status: 'erro',
        erro: err.message,
      });
    }
    if (i < targets.length - 1) await sleep(delayMs);
  }

  const campaign = {
    id: `camp_${Date.now()}`,
    listId,
    tipo: tipo || 'manual',
    scheduleId: scheduleId || null,
    assunto: subject,
    criadoEm: new Date().toISOString(),
    totalAlvo: contacts.filter((c) => c.status === 'ativo' && c.email).length,
    enviados: results.filter((r) => r.status === 'enviado').length,
    falhas: results.filter((r) => r.status === 'erro').length,
    resultados: results,
  };
  appendCampaign(campaign);
  return campaign;
}

module.exports = { sendCampaign, renderTemplate, getTransport };
