require('dotenv').config();
const { runDueSchedules } = require('../src/scheduler');

// Chamado pelo workflow do GitHub Actions (cron) — funciona mesmo que
// ninguém esteja com o servidor local rodando. Idempotente: só dispara
// agendamentos cujo horário previsto ainda não foi executado.
runDueSchedules()
  .then((campaigns) => {
    if (!campaigns.length) {
      console.log('Nenhum agendamento devido agora.');
      return;
    }
    let anyFailure = false;
    for (const c of campaigns) {
      console.log(
        `Disparo agendado enviado: lista=${c.listId} assunto="${c.assunto}" enviados=${c.enviados} falhas=${c.falhas}`
      );
      if (c.falhas) anyFailure = true;
    }
    // Sem isso o passo do GitHub Actions aparece verde mesmo com o envio
    // 100% falho (ex: credencial do Gmail rejeitada).
    if (anyFailure) process.exitCode = 1;
  })
  .catch((err) => {
    console.error('Falha ao rodar agendador:', err.message);
    process.exit(1);
  });
