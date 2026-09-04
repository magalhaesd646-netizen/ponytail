'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const { parseWorkbook } = require('../src/lib/parseWorkbook');

async function buildWorkbookBuffer(sheets) {
  const workbook = new ExcelJS.Workbook();
  for (const [name, rows] of Object.entries(sheets)) {
    const sheet = workbook.addWorksheet(name);
    if (rows.length) {
      sheet.addRow(Object.keys(rows[0]));
      for (const row of rows) sheet.addRow(Object.values(row));
    }
  }
  return workbook.xlsx.writeBuffer();
}

test('parseWorkbook reads the first sheet by default', async () => {
  const buffer = await buildWorkbookBuffer({
    Planilha1: [{ Unidade: '101', Status: 'Concluída' }, { Unidade: '102', Status: 'Pendente' }],
  });

  const result = await parseWorkbook(buffer);

  assert.deepEqual(result.columns, ['Unidade', 'Status']);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].Unidade, '101');
  assert.equal(result.sheetName, 'Planilha1');
});

test('parseWorkbook reads the requested sheet by name, falling back to the first one', async () => {
  const buffer = await buildWorkbookBuffer({
    Resumo: [{ x: '1' }],
    Detalhes: [{ Unidade: '201', Vistoria: 'Ok' }],
  });

  const found = await parseWorkbook(buffer, 'Detalhes');
  assert.equal(found.sheetName, 'Detalhes');
  assert.deepEqual(found.columns, ['Unidade', 'Vistoria']);

  const fallback = await parseWorkbook(buffer, 'NaoExiste');
  assert.equal(fallback.sheetName, 'Resumo');
});
