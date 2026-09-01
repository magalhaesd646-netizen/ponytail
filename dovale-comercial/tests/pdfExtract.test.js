const test = require('node:test');
const assert = require('node:assert/strict');
const { extractCandidatesFromText } = require('../src/pdfExtract');

test('extrai nome, empresa, e-mail e telefone de linhas tabulares', () => {
  const text = [
    'Fulano de Tal   Construtora Alfa Ltda   fulano@alfa.com.br   (12) 3456-7890',
    'Sicrano da Silva   Beta Incorporadora   sicrano@beta.com   12 98765-4321',
    'contato@gama.com.br', // linha só com e-mail, sem outros campos
  ].join('\n');

  const candidates = extractCandidatesFromText(text, 'teste.pdf');

  assert.equal(candidates.length, 3);
  assert.equal(candidates[0].nome, 'Fulano de Tal');
  assert.equal(candidates[0].empresa, 'Construtora Alfa Ltda');
  assert.equal(candidates[0].email, 'fulano@alfa.com.br');
  assert.equal(candidates[0].telefone, '(12) 3456-7890');
  assert.equal(candidates[2].email, 'contato@gama.com.br');
  assert.equal(candidates[2].nome, '');
});

test('não duplica quando o mesmo e-mail aparece mais de uma vez', () => {
  const text = 'a@a.com\na@a.com\nb@b.com';
  const candidates = extractCandidatesFromText(text, 'teste.pdf');
  assert.equal(candidates.length, 2);
});
