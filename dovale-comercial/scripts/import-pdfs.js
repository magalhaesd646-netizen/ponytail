const fs = require('fs');
const path = require('path');
const { LIST_IDS } = require('../src/lists');
const { mergeContacts, readProcessedFiles, writeProcessedFiles } = require('../src/store');
const { extractCandidatesFromPdf } = require('../src/pdfExtract');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Importa PDFs colocados manualmente em uploads/<lista>/ (ex: anexados
// direto pelo GitHub, sem precisar rodar o servidor local). Idempotente:
// um arquivo só é processado uma vez, controlado por data/processed-files.json.
async function main() {
  const processed = readProcessedFiles();
  let anyChange = false;

  for (const listId of LIST_IDS) {
    const dir = path.join(UPLOADS_DIR, listId);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf'));

    for (const file of files) {
      const key = `${listId}/${file}`;
      if (processed[key]) continue;

      const buffer = fs.readFileSync(path.join(dir, file));
      const candidatos = await extractCandidatesFromPdf(buffer, file);
      const result = mergeContacts(listId, candidatos);
      processed[key] = { importadoEm: new Date().toISOString(), ...result };
      anyChange = true;
      console.log(
        `Importado ${file} (${listId}): ${result.added} novo(s), ${result.updated} atualizado(s), ${result.total} no total.`
      );
    }
  }

  if (anyChange) writeProcessedFiles(processed);
  else console.log('Nenhum PDF novo para importar.');
}

main().catch((err) => {
  console.error('Falha ao importar PDFs:', err.message);
  process.exit(1);
});
