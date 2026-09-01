require('dotenv').config();
const fs = require('fs');
const { isValidListId, LIST_IDS } = require('../src/lists');
const { readContacts } = require('../src/store');
const { sendCampaign } = require('../src/mailer');

// Disparo manual (coletivo) via linha de comando / GitHub Actions
// workflow_dispatch. Aceita tanto variáveis de ambiente (usadas pelo
// workflow) quanto flags de linha de comando (uso local):
//   node scripts/send-campaign.js --lista=construtoras --assunto="Oi" --corpo=template.html
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([\w-]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return {
    lista: args.lista || process.env.LISTA,
    assunto: args.assunto || process.env.ASSUNTO,
    corpoArquivo: args.corpo || process.env.CORPO_ARQUIVO,
    corpoHtml: process.env.CORPO_HTML,
  };
}

async function main() {
  const { lista, assunto, corpoArquivo, corpoHtml: corpoHtmlInline } = parseArgs();

  if (!lista || !isValidListId(lista)) {
    console.error(`--lista precisa ser uma das opções: ${LIST_IDS.join(', ')}`);
    process.exit(1);
  }
  if (!assunto) {
    console.error('--assunto é obrigatório');
    process.exit(1);
  }
  if (!corpoHtmlInline && (!corpoArquivo || !fs.existsSync(corpoArquivo))) {
    console.error(
      '--corpo precisa apontar para um arquivo .html existente com o corpo do e-mail (ou defina CORPO_HTML)'
    );
    process.exit(1);
  }

  const bodyHtml = corpoHtmlInline || fs.readFileSync(corpoArquivo, 'utf8');
  const contacts = readContacts(lista);

  const campaign = await sendCampaign({
    listId: lista,
    contacts,
    subject: assunto,
    bodyHtml,
    tipo: 'manual',
  });

  console.log(
    `Disparo concluído: lista=${lista} enviados=${campaign.enviados} falhas=${campaign.falhas} de ${campaign.totalAlvo} alvo(s).`
  );
  if (campaign.falhas) {
    console.log(
      campaign.resultados
        .filter((r) => r.status === 'erro')
        .map((r) => `  - ${r.email}: ${r.erro}`)
        .join('\n')
    );
  }
}

main().catch((err) => {
  console.error('Falha no disparo:', err.message);
  process.exit(1);
});
