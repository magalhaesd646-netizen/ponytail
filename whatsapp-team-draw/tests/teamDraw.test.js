const test = require("node:test");
const assert = require("node:assert/strict");
const { drawTeams, parseDrawArgs } = require("../src/teamDraw");

function makePlayers(count, { goalkeepers = 0, seeds = 0 } = {}) {
  return Array.from({ length: count }, (_, i) => ({
    name: `P${i}`,
    isGoalkeeper: i < goalkeepers,
    isSeed: i >= goalkeepers && i < goalkeepers + seeds,
  }));
}

test("splits players into teams of the requested size", () => {
  const players = makePlayers(12, { goalkeepers: 2 });
  const { teams, reserves } = drawTeams(players, { teamSize: 5 });
  assert.equal(teams.length, 2);
  for (const team of teams) assert.equal(team.players.length, 5);
  assert.equal(reserves.length, 0);
});

test("assigns exactly one goalkeeper per team and excludes them from the draw pool", () => {
  const players = makePlayers(12, { goalkeepers: 2 });
  const { teams } = drawTeams(players, { teamSize: 5 });
  for (const team of teams) {
    assert.ok(team.goalkeeper);
    assert.equal(team.goalkeeper.isGoalkeeper, true);
    assert.ok(!team.players.some((p) => p.isGoalkeeper));
  }
});

test("spreads seeded players one per team before filling the rest", () => {
  const players = makePlayers(10, { goalkeepers: 2, seeds: 2 });
  const { teams } = drawTeams(players, { teamSize: 5 });
  for (const team of teams) {
    assert.equal(team.players.filter((p) => p.isSeed).length, 1);
  }
});

test("puts players that don't fit into reserves", () => {
  const players = makePlayers(13, { goalkeepers: 2 });
  const { teams, reserves } = drawTeams(players, { teamSize: 5 });
  const totalOnTeams = teams.reduce((sum, t) => sum + t.players.length, 0);
  assert.equal(totalOnTeams, 10);
  assert.equal(reserves.length, 1);
});

test("never loses or duplicates a player", () => {
  const players = makePlayers(23, { goalkeepers: 3, seeds: 4 });
  const { teams, reserves } = drawTeams(players, { teamSize: 5 });
  const allNames = [
    ...teams.flatMap((t) => (t.goalkeeper ? [t.goalkeeper.name] : [])),
    ...teams.flatMap((t) => t.players.map((p) => p.name)),
    ...reserves.map((p) => p.name),
  ].sort();
  assert.deepEqual(allNames, players.map((p) => p.name).sort());
});

test("rejects an invalid team size", () => {
  assert.throws(() => drawTeams(makePlayers(5), { teamSize: 0 }));
});

test("draws the exact number of teams requested (2 to 4)", () => {
  const players = makePlayers(20, { goalkeepers: 4 });
  for (const numberOfTeams of [2, 3, 4]) {
    const { teams } = drawTeams(players, { teamSize: 5, numberOfTeams });
    assert.equal(teams.length, numberOfTeams);
  }
});

test("parseDrawArgs defaults to team size 5 and no explicit team count", () => {
  assert.deepEqual(parseDrawArgs([]), { teamSize: 5, numberOfTeams: undefined });
});

test("parseDrawArgs reads team size and number of teams from args", () => {
  assert.deepEqual(parseDrawArgs(["6", "3"]), { teamSize: 6, numberOfTeams: 3 });
});

test("parseDrawArgs rejects an invalid team size", () => {
  assert.throws(() => parseDrawArgs(["0"]));
  assert.throws(() => parseDrawArgs(["abc"]));
});

test("parseDrawArgs rejects a number of teams outside 2-4", () => {
  assert.throws(() => parseDrawArgs(["5", "1"]));
  assert.throws(() => parseDrawArgs(["5", "5"]));
  assert.throws(() => parseDrawArgs(["5", "abc"]));
});
