'use strict';

require('dotenv').config();
const footballApi = require('./footballApi');
const { normalizeStatistics } = require('./metrics');
const { evaluateFixtureAlerts } = require('./rules');
const { sendAlert } = require('./notifier');
const store = require('./store');

const MAX_FIXTURES = Number(process.env.MAX_FIXTURES_PER_RUN || 15);

// Uma rodada completa: busca partidas ao vivo nas ligas configuradas,
// busca estatísticas de cada uma, avalia as regras e notifica o que ainda
// não tiver sido notificado para aquela partida.
async function run() {
  const config = store.readConfig();
  const leagueIds = new Set((config.leagues || []).map(Number));
  if (!leagueIds.size || !(config.rules || []).length) {
    return { skipped: true, reason: 'sem ligas ou regras configuradas' };
  }

  const allLive = await footballApi.getLiveFixtures();
  const liveInScope = allLive
    .filter((f) => leagueIds.has(f.league.id))
    .slice(0, MAX_FIXTURES);

  const notifiedState = store.readNotified();
  const nextNotifiedState = {};
  let alertsSent = 0;

  for (const fixture of liveInScope) {
    const alreadyKeys = new Set(notifiedState[fixture.id] || []);

    let statsByTeamId;
    try {
      const statsResponse = await footballApi.getFixtureStatistics(fixture.id);
      statsByTeamId = normalizeStatistics(statsResponse);
    } catch (err) {
      console.error(`Falha ao buscar estatísticas da partida ${fixture.id}:`, err.message);
      nextNotifiedState[fixture.id] = Array.from(alreadyKeys);
      continue;
    }

    const alerts = evaluateFixtureAlerts(fixture, statsByTeamId, config.rules, alreadyKeys);
    for (const alert of alerts) {
      const { message, results } = await sendAlert(alert, fixture);
      store.appendAlertLog({
        timestamp: new Date().toISOString(),
        fixtureId: fixture.id,
        message,
        results,
      });
      alertsSent += 1;
      alreadyKeys.add(alert.key);
    }

    nextNotifiedState[fixture.id] = Array.from(alreadyKeys);
  }

  store.writeNotified(nextNotifiedState);
  return { skipped: false, liveFixtures: liveInScope.length, alertsSent };
}

module.exports = { run };
