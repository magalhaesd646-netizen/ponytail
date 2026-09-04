'use strict';

const ExcelJS = require('exceljs');
const { Readable } = require('stream');

function cellValueToPrimitive(cell) {
  const v = cell.value;
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('result' in v) return v.result ?? '';
    if ('richText' in v) return v.richText.map((t) => t.text).join('');
    if ('text' in v) return v.text;
    if (v.hyperlink) return v.text || v.hyperlink;
  }
  return v;
}

function looksLikeZip(buffer) {
  // Um .xlsx é um .zip por dentro — todo arquivo zip começa com "PK".
  return buffer.length > 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

// Planilhas exportadas como CSV (comum quando o link aponta pra um Google
// Sheets ou uma exportação manual) tanto podem vir separadas por vírgula
// quanto por ponto e vírgula (padrão em locais que usam vírgula decimal,
// como pt-BR) — conta os dois na primeira linha e usa o mais frequente.
function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

async function loadWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  if (looksLikeZip(buffer)) {
    await workbook.xlsx.load(buffer);
  } else {
    const text = buffer.toString('utf8');
    await workbook.csv.read(Readable.from(text), { parserOptions: { delimiter: detectDelimiter(text) } });
  }
  return workbook;
}

// Lê um Buffer de arquivo .xlsx ou .csv e devolve a aba escolhida (ou a
// primeira, se `sheetName` não existir no arquivo, ou for um CSV com uma
// única aba) como linhas de objetos, usando a primeira linha como cabeçalho.
async function parseWorkbook(buffer, sheetName) {
  const workbook = await loadWorkbook(buffer);

  const sheetNames = workbook.worksheets.map((ws) => ws.name);
  const worksheet = (sheetName && workbook.getWorksheet(sheetName)) || workbook.worksheets[0];

  const headers = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cellValueToPrimitive(cell) ?? '').trim();
  });
  const columns = headers.filter(Boolean);

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    let hasValue = false;
    headers.forEach((header, colNumber) => {
      if (!header) return;
      const value = cellValueToPrimitive(row.getCell(colNumber));
      obj[header] = value;
      if (value !== '' && value != null) hasValue = true;
    });
    if (hasValue) rows.push(obj);
  });

  return { sheetNames, sheetName: worksheet.name, columns, rows };
}

module.exports = { parseWorkbook };
