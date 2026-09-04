'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateFixtureAlerts } = require('../src/rules');

function makeFixture(overrides = {}) {
  return {
    id: 100,
    league: { id: 39, name: 'Premier League' },
    teams: {
      home: { id: 1, name: 'Time A' },
      away: { id: 2, name: 'Time B' },
    },
    ...overrides,
  };
}

test('dispara alerta quando a estatística cruza o limiar (>=)', () => {
  const fixture = makeFixture();
  const stats = { 1: { shotsOnGoal: 6 }, 2: { shotsOnGoal: 2 } };
  const rules = [{ id: 'r1', metric: 'shotsOnGoal', comparator: 'gte', value: 5 }];

  const alerts = evaluateFixtureAlerts(fixture, stats, rules, new Set());
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].teamId, 1);
  assert.equal(alerts[0].key, 'r1:1');
});

test('não dispara quando a estatística não cruza o limiar', () => {
  const fixture = makeFixture();
  const stats = { 1: { shotsOnGoal: 3 }, 2: { shotsOnGoal: 2 } };
  const rules = [{ id: 'r1', metric: 'shotsOnGoal', comparator: 'gte', value: 5 }];

  assert.deepEqual(evaluateFixtureAlerts(fixture, stats, rules, new Set()), []);
});

test('respeita o escopo (mandante/visitante)', () => {
  const fixture = makeFixture();
  const stats = { 1: { corners: 10 }, 2: { corners: 10 } };
  const rules = [{ id: 'r1', metric: 'corners', comparator: 'gte', value: 8, scope: 'away' }];

  const alerts = evaluateFixtureAlerts(fixture, stats, rules, new Set());
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].teamId, 2);
});

test('ignora regra de outra liga', () => {
  const fixture = makeFixture();
  const stats = { 1: { corners: 10 }, 2: { corners: 10 } };
  const rules = [{ id: 'r1', metric: 'corners', comparator: 'gte', value: 8, leagueId: 140 }];

  assert.deepEqual(evaluateFixtureAlerts(fixture, stats, rules, new Set()), []);
});

test('não repete alerta já notificado', () => {
  const fixture = makeFixture();
  const stats = { 1: { corners: 10 }, 2: { corners: 1 } };
  const rules = [{ id: 'r1', metric: 'corners', comparator: 'gte', value: 8 }];

  const alerts = evaluateFixtureAlerts(fixture, stats, rules, new Set(['r1:1']));
  assert.deepEqual(alerts, []);
});

test('comparador eq só dispara em igualdade exata', () => {
  const fixture = makeFixture();
  const stats = { 1: { redCards: 1 }, 2: { redCards: 0 } };
  const rules = [{ id: 'r1', metric: 'redCards', comparator: 'eq', value: 1 }];

  const alerts = evaluateFixtureAlerts(fixture, stats, rules, new Set());
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].teamId, 1);
});
