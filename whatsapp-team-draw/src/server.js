const express = require("express");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { drawTeams } = require("./teamDraw");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

let players = [];
let lastDraw = null;

function findPlayer(id) {
  return players.find((p) => p.id === id);
}

app.get("/api/players", (req, res) => res.json(players));

app.post("/api/players", (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 40);
  if (!name) return res.status(400).json({ error: "Nome é obrigatório." });
  const player = { id: crypto.randomUUID(), name, isGoalkeeper: false, isSeed: false };
  players.push(player);
  res.status(201).json(player);
});

app.patch("/api/players/:id", (req, res) => {
  const player = findPlayer(req.params.id);
  if (!player) return res.status(404).json({ error: "Jogador não encontrado." });
  if (typeof req.body?.isGoalkeeper === "boolean") player.isGoalkeeper = req.body.isGoalkeeper;
  if (typeof req.body?.isSeed === "boolean") player.isSeed = req.body.isSeed;
  res.json(player);
});

app.delete("/api/players/:id", (req, res) => {
  const index = players.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Jogador não encontrado." });
  players.splice(index, 1);
  res.status(204).end();
});

app.post("/api/clear", (req, res) => {
  players = [];
  lastDraw = null;
  res.status(204).end();
});

app.get("/api/draw", (req, res) => res.json(lastDraw));

app.post("/api/draw", (req, res) => {
  const teamSize = Number(req.body?.teamSize) || 5;
  if (!Number.isInteger(teamSize) || teamSize < 1) {
    return res.status(400).json({ error: "Tamanho de time inválido." });
  }
  try {
    lastDraw = drawTeams(players, { teamSize });
    res.json(lastDraw);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
  console.log(`Servidor rodando na porta ${PORT}.`);
  console.log("Compartilhe um destes links com o pessoal (mesma rede Wi-Fi):");
  for (const address of addresses) console.log(`  http://${address}:${PORT}`);
  console.log(`  http://localhost:${PORT} (só nesta máquina)`);
});
