function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Round-robins `pool` into `teams`, skipping any team already at `teamSize`.
// Players that don't fit anywhere (all teams full) land in reserves.
function distribute(pool, teams, teamSize, startIndex) {
  const reserves = [];
  let index = startIndex;
  for (const player of pool) {
    let skipped = 0;
    while (teams[index % teams.length].length >= teamSize && skipped < teams.length) {
      index++;
      skipped++;
    }
    if (skipped >= teams.length) {
      reserves.push(player);
    } else {
      teams[index % teams.length].push(player);
      index++;
    }
  }
  return { nextIndex: index, reserves };
}

/**
 * Draws balanced teams from a player list. Seeded players ("cabeças de
 * chave") are spread one per team before the rest of the pool is shuffled
 * in, so the strongest players don't stack on one side.
 *
 * The number of teams is derived from how many players fit per team
 * (ceil(total / teamSize)), so a game can land on 2, 3 or 4 teams and the
 * shortest one just ends up with fewer players instead of anyone sitting
 * out as a "reserve".
 *
 * @param {{name: string, isSeed?: boolean}[]} players
 * @param {{teamSize?: number, numberOfTeams?: number}} [options]
 */
function drawTeams(players, options = {}) {
  if (players.length === 0) {
    throw new Error("Adicione jogadores antes de sortear.");
  }

  const teamSize = options.teamSize ?? 5;
  if (!Number.isInteger(teamSize) || teamSize < 1) {
    throw new Error("O número de jogadores por time precisa ser um inteiro positivo.");
  }

  const numberOfTeams = options.numberOfTeams ?? Math.max(1, Math.ceil(players.length / teamSize));
  if (!Number.isInteger(numberOfTeams) || numberOfTeams < 1) {
    throw new Error("O número de times precisa ser um inteiro positivo.");
  }

  const seeds = shuffle(players.filter((p) => p.isSeed));
  const rest = shuffle(players.filter((p) => !p.isSeed));

  const teams = Array.from({ length: numberOfTeams }, () => []);
  const seedResult = distribute(seeds, teams, teamSize, 0);
  const restResult = distribute(rest, teams, teamSize, seedResult.nextIndex);

  // Largest team first, so a short-handed team naturally reads as "the last one".
  const orderedTeams = teams
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((teamPlayers, i) => ({ name: `Time ${i + 1}`, players: teamPlayers }));

  return {
    teams: orderedTeams,
    reserves: [...seedResult.reserves, ...restResult.reserves],
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { drawTeams };
} else {
  window.drawTeams = drawTeams;
}
