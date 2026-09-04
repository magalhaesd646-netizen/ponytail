'use strict';

const ExcelJS = require('exceljs');

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

// Lê um Buffer de arquivo .xlsx e devolve a aba escolhida (ou a primeira, se
// `sheetName` não existir no arquivo) como linhas de objetos, usando a
// primeira linha da planilha como cabeçalho.
async function parseWorkbook(buffer, sheetName) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

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
