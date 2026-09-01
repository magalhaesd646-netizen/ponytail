const parser = require('cron-parser');
const { readSchedules, writeSchedules, readContacts } = require('./store');
const { sendCampaign } = require('./mailer');

// Um agendamento está "devido" quando a última execução prevista do cron
// (a última ocorrência <= agora) é mais recente que a última vez que
// realmente rodamos. Cobre tanto o cron em processo (server.js) quanto a
// checagem única disparada pelo GitHub Actions (scripts/run-scheduler.js).
function isDue(schedule, now = new Date()) {
  if (!schedule.ativo) return false;
  let interval;
  try {
    interval = parser.parseExpression(schedule.cronExpr, { currentDate: now, utc: true });
  } catch {
    return false; // cron inválido: nunca dispara, evita quebrar os demais
  }
  const lastScheduledFire = interval.prev().toDate();
  const lastRun = schedule.ultimaExecucao ? new Date(schedule.ultimaExecucao) : null;
  return !lastRun || lastScheduledFire > lastRun;
}

async function runDueSchedules(now = new Date()) {
  const schedules = readSchedules();
  const ranCampaigns = [];
  for (const schedule of schedules) {
    if (!isDue(schedule, now)) continue;
    const contacts = readContacts(schedule.listId);
    const campaign = await sendCampaign({
      listId: schedule.listId,
      contacts,
      subject: schedule.assunto,
      bodyHtml: schedule.corpoHtml,
      tipo: 'agendado',
      scheduleId: schedule.id,
    });
    schedule.ultimaExecucao = now.toISOString();
    ranCampaigns.push(campaign);
  }
  if (ranCampaigns.length) writeSchedules(schedules);
  return ranCampaigns;
}

module.exports = { isDue, runDueSchedules };
