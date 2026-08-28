const test = require("node:test");
const assert = require("node:assert/strict");
const { drawTeams } = require("../src/teamDraw");

function makePlayers(count, { seeds = 0 } = {}) {
  return Array.from({ length: count }, (_, i) => ({
    name: `P${i}`,
    isSeed: i < seeds,
  }));
}

test("draws 2 teams when the list fills exactly two", () => {
  const { teams, reserves } = drawTeams(makePlayers(10), { teamSize: 5 });
  assert.equal(teams.length, 2);
  assert.deepEqual(teams.map((t) => t.players.length).sort(), [5, 5]);
  assert.equal(reserves.length, 0);
});

test("draws 3 or 4 teams automatically as the list grows", () => {
  assert.equal(drawTeams(makePlayers(13), { teamSize: 5 }).teams.length, 3);
  assert.equal(drawTeams(makePlayers(18), { teamSize: 5 }).teams.length, 4);
});

test("lets the last team be smaller instead of leaving reserves", () => {
  const { teams, reserves } = drawTeams(makePlayers(13), { teamSize: 5 });
  const sizes = teams.map((t) => t.players.length).sort((a, b) => b - a);
  assert.deepEqual(sizes, [5, 4, 4]);
  assert.equal(reserves.length, 0);
});

test("orders teams from largest to smallest", () => {
  const { teams } = drawTeams(makePlayers(13), { teamSize: 5 });
  const sizes = teams.map((t) => t.players.length);
  assert.deepEqual(sizes, [...sizes].sort((a, b) => b - a));
});

test("spreads seeded players across teams instead of stacking them", () => {
  const { teams } = drawTeams(makePlayers(20, { seeds: 4 }), { teamSize: 5 });
  for (const team of teams) {
    assert.equal(team.players.filter((p) => p.isSeed).length, 1);
  }
});

test("never loses or duplicates a player", () => {
  const players = makePlayers(23, { seeds: 4 });
  const { teams, reserves } = drawTeams(players, { teamSize: 5 });
  const allNames = [...teams.flatMap((t) => t.players.map((p) => p.name)), ...reserves.map((p) => p.name)].sort();
  assert.deepEqual(allNames, players.map((p) => p.name).sort());
});

test("rejects an invalid team size", () => {
  assert.throws(() => drawTeams(makePlayers(5), { teamSize: 0 }));
});

test("rejects an empty player list", () => {
  assert.throws(() => drawTeams([]));
});
