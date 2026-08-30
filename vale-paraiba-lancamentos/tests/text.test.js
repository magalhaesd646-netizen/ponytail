'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { slugify, hashId, extractEmails, textMentionsCity } = require('../src/lib/text');

test('slugify remove acentos e espaços', () => {
  assert.equal(slugify('São José dos Campos'), 'sao-jose-dos-campos');
  assert.equal(slugify('Taubaté'), 'taubate');
});

test('hashId é determinístico e sensível à ordem das partes', () => {
  assert.equal(hashId('a', 'b', 'c'), hashId('a', 'b', 'c'));
  assert.notEqual(hashId('a', 'b'), hashId('b', 'a'));
});

test('extractEmails encontra e-mails únicos e ignora falsos positivos de imagem (ex.: icon@2x.png)', () => {
  const html = `
    contato: suprimentos@construtora.com.br, também compras@construtora.com.br
    duplicado suprimentos@construtora.com.br
    background: url(icon@2x.png);
  `;
  const emails = extractEmails(html);
  assert.deepEqual(emails.sort(), ['compras@construtora.com.br', 'suprimentos@construtora.com.br'].sort());
});

test('textMentionsCity é tolerante a acento/maiúscula e detecta a cidade certa', () => {
  assert.equal(textMentionsCity('Lançamento em São José dos Campos, SP', 'São José dos Campos'), true);
  assert.equal(textMentionsCity('LANÇAMENTO EM SAO JOSE DOS CAMPOS', 'São José dos Campos'), true);
  assert.equal(textMentionsCity('novo empreendimento em taubate - sp', 'Taubaté'), true);
});

test('textMentionsCity retorna false quando a cidade não aparece no texto', () => {
  assert.equal(textMentionsCity('Lançamento em Curitiba, PR', 'Cruzeiro'), false);
  assert.equal(textMentionsCity('', 'Taubaté'), false);
  assert.equal(textMentionsCity('Lançamento em Taubaté', ''), false);
});
