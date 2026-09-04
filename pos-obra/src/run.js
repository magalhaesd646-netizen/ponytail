'use strict';

const fs = require('fs');
const path = require('path');
const { TABS } = require('./config');
const { fetchWorkbook } = require('./lib/fetchSheet');
const { parseWorkbook } = require('./lib/parseWorkbook');

const DATA_DIR = path.join(__dirname, '..', 'web', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Arquivo subido manualmente (uploads/<id>.xlsx) tem prioridade sobre o link
// de planilha: é o caminho recomendado quando o tenant do OneDrive/SharePoint
// não permite acesso anônimo de verdade (só automação/OAuth resolveria isso).
async function getWorkbookBuffer(tab) {
  const uploadPath = path.join(UPLOADS_DIR, `${tab.id}.xlsx`);
  if (fs.existsSync(uploadPath)) {
    return { buffer: fs.readFileSync(uploadPath), source: `uploads/${tab.id}.xlsx` };
  }

  const shareUrl = process.env[tab.envVar];
  if (shareUrl) {
    return { buffer: await fetchWorkbook(shareUrl), source: 'link da planilha' };
  }

  return null;
}

// Se já existe um dado bom de uma execução anterior, preserva ele em vez de
// apagar o painel por causa de uma falha pontual de rede/link/arquivo.
function writeErrorUnlessAlreadyGood(outPath, err) {
  console.error(err.message);
  if (!fs.existsSync(outPath)) {
    fs.writeFileSync(
      outPath,
      JSON.stringify({ configured: true, updatedAt: null, error: err.message, columns: [], rows: [] }, null, 2) + '\n',
      'utf8'
    );
  }
}

async function runTab(tab) {
  const sheetName = process.env[tab.sheetNameEnvVar] || undefined;
  const outPath = path.join(DATA_DIR, `${tab.id}.json`);

  let found;
  try {
    found = await getWorkbookBuffer(tab);
  } catch (err) {
    writeErrorUnlessAlreadyGood(outPath, new Error(`[${tab.id}] falha ao atualizar: ${err.message}`));
    return;
  }

  if (!found) {
    fs.writeFileSync(
      outPath,
      JSON.stringify({ configured: false, updatedAt: null, columns: [], rows: [] }, null, 2) + '\n',
      'utf8'
    );
    console.log(`[${tab.id}] nem uploads/${tab.id}.xlsx nem ${tab.envVar} configurados, pulando.`);
    return;
  }

  try {
    const { columns, rows, sheetName: usedSheet, sheetNames } = await parseWorkbook(found.buffer, sheetName);
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        { configured: true, updatedAt: new Date().toISOString(), sheetName: usedSheet, sheetNames, columns, rows },
        null,
        2
      ) + '\n',
      'utf8'
    );
    console.log(`[${tab.id}] ${rows.length} linha(s) atualizada(s) via ${found.source} (aba "${usedSheet}").`);
  } catch (err) {
    writeErrorUnlessAlreadyGood(outPath, new Error(`[${tab.id}] falha ao atualizar: ${err.message}`));
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
