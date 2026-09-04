'use strict';

// Ligas principais pré-cadastradas com os IDs da API-Football. Os IDs são
// estáveis na API, mas confira/corrija com `npm run list-leagues` antes de
// depender deles — essa lista é um ponto de partida, não a fonte da verdade.
const LEAGUES = [
  { id: 39, name: 'Premier League', country: 'Inglaterra' },
  { id: 140, name: 'La Liga', country: 'Espanha' },
  { id: 135, name: 'Serie A', country: 'Itália' },
  { id: 78, name: 'Bundesliga', country: 'Alemanha' },
  { id: 61, name: 'Ligue 1', country: 'França' },
  { id: 2, name: 'UEFA Champions League', country: 'Europa' },
  { id: 3, name: 'UEFA Europa League', country: 'Europa' },
  { id: 71, name: 'Brasileirão Série A', country: 'Brasil' },
  { id: 72, name: 'Brasileirão Série B', country: 'Brasil' },
  { id: 13, name: 'CONMEBOL Libertadores', country: 'América do Sul' },
  { id: 94, name: 'Primeira Liga', country: 'Portugal' },
  { id: 88, name: 'Eredivisie', country: 'Países Baixos' },
  { id: 253, name: 'MLS', country: 'Estados Unidos' },
  { id: 262, name: 'Liga MX', country: 'México' },
  { id: 307, name: 'Saudi Pro League', country: 'Arábia Saudita' },
];

module.exports = { LEAGUES };
