const path = require('path');

const STANDARD_FONT_DATA_URL =
  path.join(require.resolve('pdfjs-dist/package.json'), '..', 'standard_fonts') + path.sep;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?55[\s.-]?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/;
const COMPANY_HINTS =
  /ltda|s\/a|s\.a\.|construtora|incorporadora|advogados|advocacia|administradora|condom[ií]nio|engenharia/i;

// ponytail: heurística simples baseada em regex por linha — não entende
// tabelas complexas nem PDFs escaneados (imagem). Teto: listas com layout
// muito irregular exigem edição manual na tela de revisão antes de importar.
function extractCandidatesFromText(text, origemArquivo) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates = [];
  const seenEmails = new Set();

  for (const line of lines) {
    const emailMatch = line.match(EMAIL_RE);
    if (!emailMatch) continue;
    const email = emailMatch[0].toLowerCase();
    if (seenEmails.has(email)) continue;
    seenEmails.add(email);

    let rest = line.replace(emailMatch[0], ' ');
    const phoneMatch = rest.match(PHONE_RE);
    const telefone = phoneMatch ? phoneMatch[0].trim() : '';
    if (phoneMatch) rest = rest.replace(phoneMatch[0], ' ');

    const fields = rest
      .split(/\s{2,}|\t|\||;|,(?=\s|$)/)
      .map((f) => f.trim())
      .filter(Boolean);

    let nome = '';
    let empresa = '';
    if (fields.length >= 2) {
      nome = fields[0];
      empresa = fields.slice(1).join(' ');
    } else if (fields.length === 1) {
      if (COMPANY_HINTS.test(fields[0])) empresa = fields[0];
      else nome = fields[0];
    }

    candidates.push({
      nome,
      empresa,
      email,
      telefone,
      cidade: '',
      origemArquivo,
      importadoEm: new Date().toISOString(),
      status: 'ativo',
    });
  }

  return candidates;
}

// Reconstrói o texto de uma página preservando "colunas": muitos PDFs de
// lista (Excel/Sheets exportado, tabelas do Word) não têm espaços literais
// entre células, só posicionamento — então um salto grande de posição X
// vira separador de campo (2+ espaços), do jeito que extractCandidatesFromText
// espera. Espaços literais (comuns em texto corrido) também são medidos pela
// largura, já que o pdf.js funde espaços consecutivos em um único item.
function lineTextFromItems(items) {
  let text = '';
  let prevEndX = null;
  for (const item of items) {
    const fontSize = Math.hypot(item.transform[0], item.transform[1]) || 10;
    const wordSpace = fontSize * 0.35;
    const columnGap = fontSize * 1.2;
    const isWhitespace = item.str.trim() === '';

    if (isWhitespace) {
      text += item.width > wordSpace * 1.8 ? '  ' : ' ';
    } else {
      if (prevEndX !== null) {
        const gap = item.transform[4] - prevEndX;
        if (gap > columnGap) text += '  ';
        else if (gap > wordSpace) text += ' ';
      }
      text += item.str;
    }
    prevEndX = item.transform[4] + item.width;

    if (item.hasEOL) {
      text += '\n';
      prevEndX = null;
    }
  }
  return text;
}

// pdfjs-dist v4+ é ESM; require() fica em CJS então importamos dinamicamente.
async function extractTextFromPdf(buffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;

  let text = '';
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += lineTextFromItems(content.items) + '\n';
  }
  return text;
}

async function extractCandidatesFromPdf(buffer, origemArquivo) {
  const text = await extractTextFromPdf(buffer);
  return extractCandidatesFromText(text, origemArquivo);
}

module.exports = { extractCandidatesFromPdf, extractCandidatesFromText };
