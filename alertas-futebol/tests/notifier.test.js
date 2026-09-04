'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatMessage } = require('../src/notifier');

test('formatMessage monta o texto do alerta com placar e minuto', () => {
  const alert = {
    teamName: 'Time A',
    metricLabel: 'Escanteios',
    value: 9,
    comparatorSymbol: '≥',
    threshold: 8,
  };
  const fixture = {
    teams: { home: { name: 'Time A' }, away: { name: 'Time B' } },
    league: { name: 'Premier League' },
    goals: { home: 1, away: 0 },
    fixture: { status: { elapsed: 63 } },
  };

  const message = formatMessage(alert, fixture);
  assert.match(message, /Escanteios = 9 \(≥ 8\)/);
  assert.match(message, /Time A 1 x 0 Time B — Premier League \(63'\)/);
});

test('formatMessage lida com placar ausente', () => {
  const alert = {
    teamName: 'Time A',
    metricLabel: 'Posse de bola (%)',
    value: 65,
    comparatorSymbol: '≥',
    threshold: 60,
  };
  const fixture = {
    teams: { home: { name: 'Time A' }, away: { name: 'Time B' } },
    league: { name: 'La Liga' },
    goals: { home: null, away: null },
    fixture: { status: {} },
  };

  const message = formatMessage(alert, fixture);
  assert.match(message, /Time A \? x \? Time B/);
});
