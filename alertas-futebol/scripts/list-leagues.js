'use strict';

// Lista as ligas da temporada atual na API-Football (id, nome, país) para
// conferir/corrigir os IDs cadastrados em src/leagues.js.
require('dotenv').config();
const footballApi = require('../src/footballApi');

async function main() {
  const leagues = await footballApi.listLeagues({ current: true });
  for (const entry of leagues) {
    console.log(`${entry.league.id}\t${entry.league.name}\t${entry.country.name}`);
  }
}

main().catch((err) => {
  console.error('Erro ao listar ligas:', err.message);
  process.exit(1);
});
