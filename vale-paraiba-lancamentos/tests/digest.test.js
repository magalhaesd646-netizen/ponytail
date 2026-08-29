'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDigest, subjectFor } = require('../src/lib/digest');

const sampleItems = [
  {
    empreendimento: 'Residencial Alfa',
    cidade: 'São José dos Campos',
    construtora: 'MRV Engenharia',
    incorporadora: 'MRV Engenharia',
    emailContato: { email: 'suprimentos@mrv.com.br', departamento: 'provável depto. técnico/suprimentos (contém "suprimentos")' },
    sourceLabel: 'Google',
    url: 'https://example.com/alfa',
  },
  {
    empreendimento: 'Residencial Beta',
    cidade: 'Jacareí',
    construtora: null,
    incorporadora: null,
    emailContato: null,
    sourceType: 'portal',
    url: 'https://example.com/beta',
  },
];

test('subjectFor inclui a contagem de itens', () => {
  assert.match(subjectFor(sampleItems), /^2 novo\(s\)/);
});

test('buildDigest gera text, html e markdown com todos os empreendimentos', () => {
  const { text, html, markdown } = buildDigest(sampleItems);
  for (const format of [text, html, markdown]) {
    assert.match(format, /Residencial Alfa/);
    assert.match(format, /Residencial Beta/);
  }
  assert.match(text, /suprimentos@mrv\.com\.br/);
  assert.match(html, /mailto:suprimentos@mrv\.com\.br/);
  assert.match(markdown, /\[Google\]\(https:\/\/example\.com\/alfa\)/);
  assert.match(markdown, /não encontrado automaticamente/);
});

test('buildDigest lida com item sem construtora/incorporadora/e-mail', () => {
  const { text } = buildDigest([sampleItems[1]]);
  assert.match(text, /não identificada automaticamente/);
  assert.match(text, /não encontrado automaticamente/);
});
