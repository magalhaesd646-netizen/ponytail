'use strict';

// Estatísticas de partida que podem virar regra de alerta, na mesma chave
// usada por src/metrics.js (normalizeStatistics) e src/rules.js.
const METRICS = [
  { key: 'shotsOnGoal', label: 'Chutes a gol' },
  { key: 'shotsTotal', label: 'Finalizações totais' },
  { key: 'corners', label: 'Escanteios' },
  { key: 'possession', label: 'Posse de bola (%)' },
  { key: 'yellowCards', label: 'Cartões amarelos' },
  { key: 'redCards', label: 'Cartões vermelhos' },
  { key: 'fouls', label: 'Faltas' },
  { key: 'offsides', label: 'Impedimentos' },
  { key: 'saves', label: 'Defesas do goleiro' },
];

function metricLabel(key) {
  const metric = METRICS.find((m) => m.key === key);
  return metric ? metric.label : key;
}

module.exports = { METRICS, metricLabel };
