'use strict';

const fs = require('fs');
const path = require('path');
const { TABS } = require('./config');
const { fetchWorkbook } = require('./lib/oneDrive');
const { parseWorkbook } = require('./lib/parseWorkbook');

const DATA_DIR = path.join(__dirname, '..', 'web', 'data');

async function runTab(tab) {
  const shareUrl = process.env[tab.envVar];
  const sheetName = process.env[tab.sheetNameEnvVar] || undefined;
  const outPath = path.join(DATA_DIR, `${tab.id}.json`);

  if (!shareUrl) {
    fs.writeFileSync(
      outPath,
      JSON.stringify({ configured: false, updatedAt: null, columns: [], rows: [] }, null, 2) + '\n',
      'utf8'
    );
    console.log(`[${tab.id}] ${tab.envVar} não configurado, pulando.`);
    return;
  }

  try {
    const buffer = await fetchWorkbook(shareUrl);
    const { columns, rows, sheetName: usedSheet, sheetNames } = await parseWorkbook(buffer, sheetName);
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        { configured: true, updatedAt: new Date().toISOString(), sheetName: usedSheet, sheetNames, columns, rows },
        null,
        2
      ) + '\n',
      'utf8'
    );
    console.log(`[${tab.id}] ${rows.length} linha(s) atualizada(s) (aba "${usedSheet}").`);
  } catch (err) {
    console.error(`[${tab.id}] falha ao atualizar: ${err.message}`);
    // Se já existe um dado bom de uma execução anterior, preserva ele em vez
    // de apagar o painel por causa de uma falha pontual de rede/link.
    if (!fs.existsSync(outPath)) {
      fs.writeFileSync(
        outPath,
        JSON.stringify(
          { configured: true, updatedAt: null, error: err.message, columns: [], rows: [] },
          null,
          2
        ) + '\n',
        'utf8'
      );
    }
  }
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const tab of TABS) {
    await runTab(tab);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
