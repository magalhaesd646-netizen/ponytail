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
 * Draws balanced teams from a player list.
 * Goalkeepers are assigned one per team and never enter the outfield draw.
 * Seeded players ("cabeças de chave") are spread one per team before the
 * rest of the pool is shuffled in, so the strongest players don't stack.
 *
 * @param {{name: string, isGoalkeeper?: boolean, isSeed?: boolean}[]} players
 * @param {{teamSize?: number, numberOfTeams?: number}} [options]
 */
function drawTeams(players, options = {}) {
  const teamSize = options.teamSize ?? 5;
  if (!Number.isInteger(teamSize) || teamSize < 1) {
    throw new Error("teamSize must be a positive integer");
  }

  const goalkeepers = players.filter((p) => p.isGoalkeeper);
  const outfield = players.filter((p) => !p.isGoalkeeper);

  const numberOfTeams = options.numberOfTeams ?? (goalkeepers.length || Math.ceil(outfield.length / teamSize) || 1);
  if (!Number.isInteger(numberOfTeams) || numberOfTeams < 1) {
    throw new Error("numberOfTeams must be a positive integer");
  }

  const shuffledGoalkeepers = shuffle(goalkeepers);
  const teamGoalkeepers = shuffledGoalkeepers.slice(0, numberOfTeams);
  const extraGoalkeepers = shuffledGoalkeepers.slice(numberOfTeams);

  const seeds = shuffle(outfield.filter((p) => p.isSeed));
  const rest = shuffle(outfield.filter((p) => !p.isSeed));

  const teams = Array.from({ length: numberOfTeams }, () => []);
  const seedResult = distribute(seeds, teams, teamSize, 0);
  const restResult = distribute([...extraGoalkeepers, ...rest], teams, teamSize, seedResult.nextIndex);

  return {
    teams: teams.map((teamPlayers, i) => ({
      name: `Time ${i + 1}`,
      goalkeeper: teamGoalkeepers[i] ?? null,
      players: teamPlayers,
    })),
    reserves: [...seedResult.reserves, ...restResult.reserves],
  };
}

const MIN_TEAMS = 2;
const MAX_TEAMS = 4;

// Parses the `!sortear [tamanho] [quantidade de times]` arguments.
// numberOfTeams is optional: when omitted, drawTeams picks it automatically
// (one per fixed goalkeeper, or enough to fit teamSize).
function parseDrawArgs(args) {
  const teamSize = args[0] !== undefined ? Number(args[0]) : 5;
  if (!Number.isInteger(teamSize) || teamSize < 1) {
    throw new Error("Tamanho de time inválido. Use: !sortear 5");
  }

  if (args[1] === undefined) {
    return { teamSize, numberOfTeams: undefined };
  }

  const numberOfTeams = Number(args[1]);
  if (!Number.isInteger(numberOfTeams) || numberOfTeams < MIN_TEAMS || numberOfTeams > MAX_TEAMS) {
    throw new Error(`Quantidade de times inválida. Escolha entre ${MIN_TEAMS} e ${MAX_TEAMS}. Use: !sortear 5 3`);
  }

  return { teamSize, numberOfTeams };
}

module.exports = { drawTeams, parseDrawArgs, MIN_TEAMS, MAX_TEAMS };
