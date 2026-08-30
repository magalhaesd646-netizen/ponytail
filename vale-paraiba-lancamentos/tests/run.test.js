'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { orderedCitiesForToday, makeQueryBudget, filterRelevantResults } = require('../src/run');

test('orderedCitiesForToday mantém as prioritárias sempre primeiro', () => {
  const cities = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const ordered = orderedCitiesForToday(cities, 3);
  assert.deepEqual(ordered.slice(0, 3), ['A', 'B', 'C']);
  assert.deepEqual([...ordered].sort(), [...cities].sort());
});

test('orderedCitiesForToday preserva a lista inteira quando não há mais que as prioritárias', () => {
  const cities = ['A', 'B'];
  assert.deepEqual(orderedCitiesForToday(cities, 3), cities);
});

test('makeQueryBudget respeita o limite máximo', () => {
  const budget = makeQueryBudget(2);
  assert.equal(budget.hasRoom(), true);
  budget.consume();
  assert.equal(budget.hasRoom(), true);
  budget.consume();
  assert.equal(budget.hasRoom(), false);
  assert.equal(budget.used(), 2);
});

test('filterRelevantResults descarta resultados que não citam a cidade buscada', () => {
  const results = [
    { title: 'Lançamento em Taubaté, SP', snippet: 'apartamentos novos' },
    { title: 'Lançamento em Curitiba, PR', snippet: 'apartamentos novos' },
    { title: 'Novo empreendimento', snippet: 'em Taubaté, próximo ao centro' },
  ];
  const filtered = filterRelevantResults(results, 'Taubaté');
  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((r) => `${r.title} ${r.snippet}`.includes('Taubaté')));
});
