'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  slugify,
  hashId,
  extractEmails,
  textMentionsCity,
  textMentionsRealEstateLaunch,
} = require('../src/lib/text');

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

test('textMentionsRealEstateLaunch aceita texto com vocabulário imobiliário', () => {
  assert.equal(textMentionsRealEstateLaunch('Novo empreendimento com apartamentos de 2 dormitórios'), true);
  assert.equal(textMentionsRealEstateLaunch('Construtora e Incorporadora em Taubaté'), true);
  assert.equal(textMentionsRealEstateLaunch('Lotes à venda, banheiro e suíte'), true);
});

test('textMentionsRealEstateLaunch rejeita conteúdo sem relação com imóveis (vaga, evento, clima)', () => {
  assert.equal(textMentionsRealEstateLaunch('5ª Etapa Campeonato Vale Paraibano 2026'), false);
  assert.equal(textMentionsRealEstateLaunch('Previsão do tempo em São Bento do Sapucaí'), false);
  assert.equal(textMentionsRealEstateLaunch('Gerente de vendas - vaga de emprego'), false);
  assert.equal(textMentionsRealEstateLaunch(''), false);
});

test('textMentionsRealEstateLaunch rejeita aluguel/locação mesmo citando apartamento', () => {
  assert.equal(textMentionsRealEstateLaunch('Apartamento 3 dormitórios para alugar em Jacareí'), false);
  assert.equal(textMentionsRealEstateLaunch('Imóvel disponível para locação'), false);
});

test('textMentionsRealEstateLaunch rejeita vaga de emprego mesmo citando incorporação', () => {
  assert.equal(textMentionsRealEstateLaunch('Gerente de Incorporação e Novos Negócios'), false);
  assert.equal(textMentionsRealEstateLaunch('Analista de Construtora - vaga em Pindamonhangaba'), false);
});
