'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseValue, normalizeStatistics } = require('../src/metrics');

test('parseValue lida com percentual, número, string e nulo', () => {
  assert.equal(parseValue('55%'), 55);
  assert.equal(parseValue(7), 7);
  assert.equal(parseValue('3'), 3);
  assert.equal(parseValue(null), null);
  assert.equal(parseValue('N/A'), null);
});

test('normalizeStatistics agrupa por time e mapeia os tipos conhecidos', () => {
  const response = [
    {
      team: { id: 1, name: 'Time A' },
      statistics: [
        { type: 'Shots on Goal', value: 5 },
        { type: 'Corner Kicks', value: '7' },
        { type: 'Ball Possession', value: '60%' },
        { type: 'Tipo Desconhecido', value: 99 },
      ],
    },
    {
      team: { id: 2, name: 'Time B' },
      statistics: [{ type: 'Corner Kicks', value: 3 }],
    },
  ];

  const result = normalizeStatistics(response);
  assert.deepEqual(result[1], { shotsOnGoal: 5, corners: 7, possession: 60 });
  assert.deepEqual(result[2], { corners: 3 });
});

test('normalizeStatistics ignora entradas sem resposta', () => {
  assert.deepEqual(normalizeStatistics(undefined), {});
  assert.deepEqual(normalizeStatistics([]), {});
});
