'use strict';

// Mapeia o texto de "type" que a API-Football devolve em
// /fixtures/statistics para as chaves usadas em metricsCatalog.js/rules.js.
const TYPE_TO_KEY = {
  'Shots on Goal': 'shotsOnGoal',
  'Shots off Goal': 'shotsOffGoal',
  'Total Shots': 'shotsTotal',
  'Blocked Shots': 'shotsBlocked',
  'Shots insidebox': 'shotsInsideBox',
  'Shots outsidebox': 'shotsOutsideBox',
  Fouls: 'fouls',
  'Corner Kicks': 'corners',
  Offsides: 'offsides',
  'Ball Possession': 'possession',
  'Yellow Cards': 'yellowCards',
  'Red Cards': 'redCards',
  'Goalkeeper Saves': 'saves',
  'Total passes': 'passesTotal',
  'Passes accurate': 'passesAccurate',
  'Passes %': 'passesPct',
};

function parseValue(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return raw;
  const str = String(raw).trim();
  if (!str) return null;
  const num = Number(str.endsWith('%') ? str.slice(0, -1) : str);
  return Number.isNaN(num) ? null : num;
}

// statisticsResponse: resposta crua de GET /fixtures/statistics?fixture=ID
// (array de { team: {id, name}, statistics: [{type, value}] }).
// Devolve { [teamId]: { shotsOnGoal: 5, corners: 3, possession: 55, ... } }.
function normalizeStatistics(statisticsResponse) {
  const byTeam = {};
  for (const entry of statisticsResponse || []) {
    const teamId = entry.team && entry.team.id;
    if (teamId == null) continue;
    const stats = {};
    for (const s of entry.statistics || []) {
      const key = TYPE_TO_KEY[s.type];
      if (!key) continue;
      stats[key] = parseValue(s.value);
    }
    byTeam[teamId] = stats;
  }
  return byTeam;
}

module.exports = { TYPE_TO_KEY, parseValue, normalizeStatistics };
