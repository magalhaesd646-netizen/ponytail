'use strict';

const axios = require('axios');

function client() {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) {
    throw new Error('FOOTBALL_API_KEY não configurada (veja .env.example).');
  }
  const useRapidApi = process.env.FOOTBALL_API_PROVIDER === 'rapidapi';
  const baseURL = useRapidApi
    ? 'https://api-football-v1.p.rapidapi.com/v3'
    : process.env.FOOTBALL_API_BASE_URL || 'https://v3.football.api-sports.io';
  const headers = useRapidApi
    ? { 'x-rapidapi-key': key, 'x-rapidapi-host': 'api-football-v1.p.rapidapi.com' }
    : { 'x-apisports-key': key };
  return axios.create({ baseURL, headers, timeout: 15000 });
}

// Todas as partidas em andamento neste momento (qualquer liga).
async function getLiveFixtures() {
  const { data } = await client().get('/fixtures', { params: { live: 'all' } });
  return data.response || [];
}

async function getFixtureStatistics(fixtureId) {
  const { data } = await client().get('/fixtures/statistics', {
    params: { fixture: fixtureId },
  });
  return data.response || [];
}

// Usado por scripts/list-leagues.js para conferir/atualizar os IDs em
// src/leagues.js.
async function listLeagues({ current = true } = {}) {
  const { data } = await client().get('/leagues', current ? { params: { current: 'true' } } : {});
  return data.response || [];
}

module.exports = { getLiveFixtures, getFixtureStatistics, listLeagues };
