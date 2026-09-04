'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizePosObra } = require('../src/lib/summarize');

test('summarizePosObra counts rows per Empreendimento, sorted descending', () => {
  const rows = [
    { Empreendimento: 'Mood Itaquera', Descrição: 'infiltração' },
    { Empreendimento: 'Mood Itaquera', Descrição: 'vazamento' },
    { Empreendimento: 'Gran Portinari', Descrição: 'disjuntor' },
  ];

  const summary = summarizePosObra(rows);

  assert.equal(summary.totalChamados, 3);
  assert.deepEqual(summary.porEmpreendimento, [
    { empreendimento: 'Mood Itaquera', total: 2 },
    { empreendimento: 'Gran Portinari', total: 1 },
  ]);
});

test('summarizePosObra computes percentual per família, sorted descending', () => {
  const rows = [
    { Empreendimento: 'A', Descrição: 'infiltração no banheiro' },
    { Empreendimento: 'A', Descrição: 'vazamento na cozinha' },
    { Empreendimento: 'A', Descrição: 'infiltração no teto' },
    { Empreendimento: 'A', Descrição: 'disjuntor desarmando' },
  ];

  const { porFamilia } = summarizePosObra(rows);

  assert.deepEqual(porFamilia[0], { familia: 'Hidráulica', total: 3, percentual: 75 });
  assert.deepEqual(porFamilia[1], { familia: 'Elétrica', total: 1, percentual: 25 });
});

test('summarizePosObra handles an empty row set without dividing by zero', () => {
  const summary = summarizePosObra([]);
  assert.equal(summary.totalChamados, 0);
  assert.deepEqual(summary.porEmpreendimento, []);
  assert.deepEqual(summary.porFamilia, []);
});
