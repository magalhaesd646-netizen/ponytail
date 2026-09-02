const test = require("node:test");
const assert = require("node:assert/strict");
const { drawTeams, parseDrawArgs, MIN_TEAM_SIZE } = require("../src/teamDraw");

function makePlayers(count, { goalkeepers = 0, seeds = 0 } = {}) {
  return Array.from({ length: count }, (_, i) => ({
    name: `P${i}`,
    isGoalkeeper: i < goalkeepers,
    isSeed: i >= goalkeepers && i < goalkeepers + seeds,
  }));
}

test("splits players evenly when the list divides exactly", () => {
  const players = makePlayers(12, { goalkeepers: 2 });
  const { teams, reserves } = drawTeams(players, { numberOfTeams: 2 });
  assert.equal(teams.length, 2);
  for (const team of teams) assert.equal(team.players.length, 5);
  assert.equal(reserves.length, 0);
});

test("assigns exactly one goalkeeper per team and excludes them from the draw pool", () => {
  const players = makePlayers(12, { goalkeepers: 2 });
  const { teams } = drawTeams(players, { numberOfTeams: 2 });
  for (const team of teams) {
    assert.ok(team.goalkeeper);
    assert.equal(team.goalkeeper.isGoalkeeper, true);
    assert.ok(!team.players.some((p) => p.isGoalkeeper));
  }
});

test("spreads seeded players one per team before filling the rest", () => {
  const players = makePlayers(14, { goalkeepers: 2, seeds: 2 });
  const { teams } = drawTeams(players, { numberOfTeams: 2 });
  for (const team of teams) {
    assert.equal(team.players.filter((p) => p.isSeed).length, 1);
  }
});

test("never lands anyone in reserves — every player joins a team", () => {
  const players = makePlayers(18, { goalkeepers: 2 });
  const { teams, reserves } = drawTeams(players, { numberOfTeams: 3 });
  const totalOnTeams = teams.reduce((sum, t) => sum + t.players.length, 0);
  assert.equal(totalOnTeams, 16);
  assert.equal(reserves.length, 0);
});

test("puts the smaller team(s) always last, never in the middle, and never below the minimum", () => {
  // 16 outfield players across 3 teams: 6, 5, 5.
  const players = makePlayers(16);
  const { teams } = drawTeams(players, { numberOfTeams: 3 });
  const sizes = teams.map((t) => t.players.length);
  assert.deepEqual(sizes, [6, 5, 5]);
  for (const size of sizes) assert.ok(size >= MIN_TEAM_SIZE);
});

test("never loses or duplicates a player", () => {
  const players = makePlayers(23, { goalkeepers: 3, seeds: 4 });
  const { teams, reserves } = drawTeams(players, { numberOfTeams: 4 });
  const allNames = [
    ...teams.flatMap((t) => (t.goalkeeper ? [t.goalkeeper.name] : [])),
    ...teams.flatMap((t) => t.players.map((p) => p.name)),
    ...reserves.map((p) => p.name),
  ].sort();
  assert.deepEqual(allNames, players.map((p) => p.name).sort());
});

test("rejects an invalid number of teams", () => {
  assert.throws(() => drawTeams(makePlayers(20), { numberOfTeams: 0 }));
});

test("rejects a draw that would leave a team under the minimum size", () => {
  // 16 outfield players don't cover 4 teams of at least 5 (needs 20).
  const players = makePlayers(16);
  assert.throws(() => drawTeams(players, { numberOfTeams: 4 }), /Jogadores de linha insuficientes/);
});

test("draws the exact number of teams requested (2 to 4)", () => {
  const players = makePlayers(24, { goalkeepers: 4 });
  for (const numberOfTeams of [2, 3, 4]) {
    const { teams } = drawTeams(players, { numberOfTeams });
    assert.equal(teams.length, numberOfTeams);
    for (const team of teams) assert.ok(team.players.length >= MIN_TEAM_SIZE);
  }
});

test("parseDrawArgs defaults to 2 teams", () => {
  assert.deepEqual(parseDrawArgs([]), { numberOfTeams: 2 });
});

test("parseDrawArgs reads the number of teams from args", () => {
  assert.deepEqual(parseDrawArgs(["3"]), { numberOfTeams: 3 });
});

test("parseDrawArgs rejects a number of teams outside 2-4", () => {
  assert.throws(() => parseDrawArgs(["1"]));
  assert.throws(() => parseDrawArgs(["5"]));
  assert.throws(() => parseDrawArgs(["abc"]));
});
