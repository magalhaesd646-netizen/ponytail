'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeResult, cleanEmpreendimentoName } = require('../src/lib/extractor');

const knownBuilders = [
  { name: 'MRV Engenharia', aliases: ['mrv'], isAlsoIncorporadora: true },
];

test('cleanEmpreendimentoName corta sufixos de marketing/portal', () => {
  assert.equal(
    cleanEmpreendimentoName('Residencial Alfa - a partir de R$ 300.000 | Viva Real'),
    'Residencial Alfa'
  );
  assert.equal(cleanEmpreendimentoName('Residencial Beta'), 'Residencial Beta');
  assert.equal(cleanEmpreendimentoName(''), null);
});

test('normalizeResult identifica construtora conhecida pelo alias', () => {
  const raw = {
    title: 'Residencial Alfa - Lançamento MRV em São José dos Campos',
    link: 'https://example.com/imovel/1',
    city: 'São José dos Campos',
    sourceType: 'google-web',
    sourceLabel: 'Google',
  };
  const result = normalizeResult(raw, knownBuilders);
  assert.equal(result.empreendimento, 'Residencial Alfa');
  assert.equal(result.construtora, 'MRV Engenharia');
  assert.equal(result.incorporadora, 'MRV Engenharia');
  assert.equal(result.construtoraIdentificada, true);
});

test('normalizeResult retorna construtora nula quando não reconhece nenhuma builder conhecida', () => {
  const raw = {
    title: 'Residencial Gama - novo empreendimento',
    link: 'https://example.com/imovel/2',
    city: 'Jacareí',
    sourceType: 'portal',
    sourceLabel: 'Viva Real',
  };
  const result = normalizeResult(raw, knownBuilders);
  assert.equal(result.construtora, null);
  assert.equal(result.incorporadora, null);
  assert.equal(result.construtoraIdentificada, false);
});

test('normalizeResult gera o mesmo id para a mesma cidade/fonte/url', () => {
  const raw = {
    title: 'X',
    link: 'https://example.com/imovel/3',
    city: 'Taubaté',
    sourceType: 'portal',
  };
  const a = normalizeResult(raw, knownBuilders);
  const b = normalizeResult(raw, knownBuilders);
  assert.equal(a.id, b.id);
});
