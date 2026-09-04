'use strict';

const { metricLabel } = require('./metricsCatalog');

const COMPARATORS = {
  gte: (a, b) => a >= b,
  lte: (a, b) => a <= b,
  eq: (a, b) => a === b,
};

const COMPARATOR_SYMBOL = { gte: '≥', lte: '≤', eq: '=' };

// fixture: objeto de partida da API-Football (precisa de .id, .league.id,
// .teams.home/.away com {id, name}).
// statsByTeamId: { [teamId]: { metricKey: number } } (ver metrics.js).
// rules: [{ id, metric, comparator, value, leagueId?, scope? }]
//   - leagueId ausente/null = regra vale para qualquer liga selecionada.
//   - scope 'home' | 'away' | 'either' (padrão 'either').
// alreadyNotified: Set opcional de chaves "ruleId:teamId" já notificadas
//   nesta partida (para não repetir o mesmo alerta a cada rodada).
function evaluateFixtureAlerts(fixture, statsByTeamId, rules, alreadyNotified) {
  const alerts = [];
  const applicable = (rules || []).filter(
    (r) => r.leagueId == null || r.leagueId === fixture.league.id
  );
  const sides = [
    { side: 'home', team: fixture.teams.home },
    { side: 'away', team: fixture.teams.away },
  ];

  for (const rule of applicable) {
    const compare = COMPARATORS[rule.comparator];
    if (!compare) continue;
    for (const { side, team } of sides) {
      if (rule.scope && rule.scope !== 'either' && rule.scope !== side) continue;
      const stats = statsByTeamId[team.id];
      if (!stats) continue;
      const value = stats[rule.metric];
      if (value === null || value === undefined) continue;
      if (!compare(value, rule.value)) continue;

      const key = `${rule.id}:${team.id}`;
      if (alreadyNotified && alreadyNotified.has(key)) continue;

      alerts.push({
        key,
        ruleId: rule.id,
        fixtureId: fixture.id,
        teamId: team.id,
        teamName: team.name,
        side,
        metric: rule.metric,
        metricLabel: metricLabel(rule.metric),
        value,
        comparator: rule.comparator,
        comparatorSymbol: COMPARATOR_SYMBOL[rule.comparator] || rule.comparator,
        threshold: rule.value,
      });
    }
  }

  return alerts;
}

module.exports = { COMPARATORS, COMPARATOR_SYMBOL, evaluateFixtureAlerts };
