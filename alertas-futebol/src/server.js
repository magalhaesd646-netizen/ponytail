'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const cron = require('node-cron');

const { LEAGUES } = require('./leagues');
const { METRICS } = require('./metricsCatalog');
const store = require('./store');
const monitor = require('./monitor');
const footballApi = require('./footballApi');
const { normalizeStatistics } = require('./metrics');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/leagues', (req, res) => res.json(LEAGUES));
app.get('/api/metrics', (req, res) => res.json(METRICS));

app.get('/api/config', (req, res) => res.json(store.readConfig()));

app.post('/api/config', (req, res) => {
  const { leagues, rules } = req.body || {};
  if (!Array.isArray(leagues) || !Array.isArray(rules)) {
    return res.status(400).json({ error: 'leagues e rules precisam ser arrays' });
  }
  for (const r of rules) {
    if (!r.id || !r.metric || !r.comparator || typeof r.value !== 'number') {
      return res
        .status(400)
        .json({ error: 'Cada regra precisa de id, metric, comparator e value numérico' });
    }
  }
  const config = { leagues, rules };
  store.writeConfig(config);
  res.json(config);
});

// Prévia ao vivo (não dispara notificação, só mostra o estado atual das
// partidas nas ligas configuradas — útil pra montar/testar regras).
app.get('/api/live', async (req, res) => {
  try {
    const config = store.readConfig();
    const leagueIds = new Set((config.leagues || []).map(Number));
    const all = await footballApi.getLiveFixtures();
    const inScope = all.filter((f) => leagueIds.has(f.league.id));
    const withStats = await Promise.all(
      inScope.map(async (fixture) => {
        try {
          const statsResponse = await footballApi.getFixtureStatistics(fixture.id);
          return { fixture, stats: normalizeStatistics(statsResponse) };
        } catch (err) {
          return { fixture, stats: {}, error: err.message };
        }
      })
    );
    res.json(withStats);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/check-now', async (req, res) => {
  try {
    const result = await monitor.run();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/alerts-log', (req, res) => res.json(store.readAlertsLog()));

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Alertas de Futebol rodando em http://localhost:${PORT}`);
  });

  // Cobre o "monitor ao vivo" enquanto o servidor local estiver ligado;
  // scripts/run-monitor.js + o workflow do GitHub Actions cobrem o caso de
  // ninguém estar com `npm start` rodando.
  const cronExpr = process.env.MONITOR_CRON || '*/3 * * * *';
  cron.schedule(cronExpr, () => {
    monitor.run().catch((err) => console.error('Erro no monitor:', err.message));
  });
}

module.exports = app;
