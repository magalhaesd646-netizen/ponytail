'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyFamilia } = require('../src/lib/classify');

test('classifyFamilia identifies Hidráulica from leak/plumbing keywords', () => {
  assert.equal(classifyFamilia({ Descrição: 'possível infiltração no teto do banheiro' }), 'Hidráulica');
  assert.equal(classifyFamilia({ 'Descrição de Atendimento': 'vaso sanitário vazando' }), 'Hidráulica');
});

test('classifyFamilia identifies Elétrica from wiring/fixture keywords', () => {
  assert.equal(classifyFamilia({ Descrição: 'disjuntor desarmando toda hora' }), 'Elétrica');
  assert.equal(classifyFamilia({ 'Descrição do chamado': 'tomada da cozinha sem energia' }), 'Elétrica');
});

test('classifyFamilia identifies Esquadrias from door/window keywords', () => {
  assert.equal(classifyFamilia({ Descrição: 'fechadura da porta emperrada' }), 'Esquadrias (portas/janelas)');
});

test('classifyFamilia falls back to Outros with no keyword match', () => {
  assert.equal(classifyFamilia({ Descrição: 'solicitação administrativa qualquer' }), 'Outros');
});

test('classifyFamilia checks all configured text fields, not just one', () => {
  assert.equal(classifyFamilia({ Descrição: '', 'Parecer Técnico': 'trocado o plafon queimado' }), 'Elétrica');
});
