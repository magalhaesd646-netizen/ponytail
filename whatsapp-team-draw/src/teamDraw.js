const MIN_TEAMS = 2;
const MAX_TEAMS = 4;

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Splits `total` players across `numberOfTeams` as evenly as possible, with
// any team that ends up smaller always coming last (never in the middle).
function computeCapacities(total, numberOfTeams) {
  const base = Math.floor(total / numberOfTeams);
  const remainder = total % numberOfTeams;
  return Array.from({ length: numberOfTeams }, (_, i) => (i < remainder ? base + 1 : base));
}

// Round-robins `pool` into `teams`, skipping any team already at its capacity.
// Players that don't fit anywhere (all teams full) land in reserves — this
// shouldn't happen when capacities sum to at least pool.length.
function distribute(pool, teams, capacities, startIndex) {
  const reserves = [];
  let index = startIndex;
  for (const player of pool) {
    let skipped = 0;
    while (teams[index % teams.length].length >= capacities[index % teams.length] && skipped < teams.length) {
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
 * Draws balanced teams from a player list into a fixed number of teams.
 * Goalkeepers are assigned one per team and never enter the outfield draw.
 * Seeded players ("cabeças de chave") are spread one per team before the
 * rest of the pool is shuffled in, so the strongest players don't stack.
 * Every player lands on a team (no reserves): when the list doesn't divide
 * evenly, the smaller team(s) are always the last one(s) — the last team
 * may end up with fewer players than the others.
 *
 * @param {{name: string, isGoalkeeper?: boolean, isSeed?: boolean}[]} players
 * @param {{numberOfTeams: number}} options
 */
function drawTeams(players, options = {}) {
  const numberOfTeams = options.numberOfTeams;
  if (!Number.isInteger(numberOfTeams) || numberOfTeams < 1) {
    throw new Error("numberOfTeams must be a positive integer");
  }

  const goalkeepers = players.filter((p) => p.isGoalkeeper);
  const outfield = players.filter((p) => !p.isGoalkeeper);

  const shuffledGoalkeepers = shuffle(goalkeepers);
  const teamGoalkeepers = shuffledGoalkeepers.slice(0, numberOfTeams);
  const extraGoalkeepers = shuffledGoalkeepers.slice(numberOfTeams);

  const seeds = shuffle(outfield.filter((p) => p.isSeed));
  const rest = shuffle(outfield.filter((p) => !p.isSeed));

  const pool = [...extraGoalkeepers, ...rest];
  const capacities = computeCapacities(seeds.length + pool.length, numberOfTeams);

  const teams = Array.from({ length: numberOfTeams }, () => []);
  const seedResult = distribute(seeds, teams, capacities, 0);
  const restResult = distribute(pool, teams, capacities, seedResult.nextIndex);

  return {
    teams: teams.map((teamPlayers, i) => ({
      name: `Time ${i + 1}`,
      goalkeeper: teamGoalkeepers[i] ?? null,
      players: teamPlayers,
    })),
    reserves: [...seedResult.reserves, ...restResult.reserves],
  };
}

// Parses the `!sortear <quantidade de times>` argument (2 a 4). Defaults to
// 2 teams when omitted.
function parseDrawArgs(args) {
  const numberOfTeams = args[0] !== undefined ? Number(args[0]) : MIN_TEAMS;
  if (!Number.isInteger(numberOfTeams) || numberOfTeams < MIN_TEAMS || numberOfTeams > MAX_TEAMS) {
    throw new Error(`Quantidade de times inválida. Escolha entre ${MIN_TEAMS} e ${MAX_TEAMS}. Use: !sortear 3`);
  }
  return { numberOfTeams };
}

module.exports = { drawTeams, parseDrawArgs, MIN_TEAMS, MAX_TEAMS };
