let players = [];

const playerList = document.getElementById("player-list");
const drawControls = document.getElementById("draw-controls");
const drawResult = document.getElementById("draw-result");

function parsePlayers(text) {
  let lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 1 && lines[0].includes(",")) {
    lines = lines[0].split(",").map((l) => l.trim()).filter(Boolean);
  }

  return lines
    .map((line) => line.replace(/^\s*(\d+[.)-]|[-*•])\s*/, "").trim())
    .filter(Boolean);
}

function renderPlayers() {
  playerList.innerHTML = "";
  players.forEach((player, index) => {
    const li = document.createElement("li");

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = player.name;
    li.appendChild(name);

    li.appendChild(makeToggle("🧤 Goleiro", player.isGoalkeeper, (checked) => {
      players[index].isGoalkeeper = checked;
    }));
    li.appendChild(makeToggle("⭐ Cabeça de chave", player.isSeed, (checked) => {
      players[index].isSeed = checked;
    }));

    playerList.appendChild(li);
  });
}

function makeToggle(label, checked, onChange) {
  const wrapper = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.onchange = () => onChange(checkbox.checked);
  wrapper.appendChild(checkbox);
  wrapper.appendChild(document.createTextNode(label));
  return wrapper;
}

function renderDraw(draw) {
  drawResult.innerHTML = "";
  for (const team of draw.teams) {
    const div = document.createElement("div");
    div.className = "team";
    const title = document.createElement("h3");
    title.textContent = `${team.name} — 🧤 ${team.goalkeeper ? team.goalkeeper.name : "(sem goleiro fixo)"}`;
    div.appendChild(title);
    const ul = document.createElement("ul");
    for (const player of team.players) {
      const li = document.createElement("li");
      li.textContent = `${player.name}${player.isSeed ? " ⭐" : ""}`;
      ul.appendChild(li);
    }
    div.appendChild(ul);
    drawResult.appendChild(div);
  }
  if (draw.reserves.length) {
    const title = document.createElement("h3");
    title.textContent = "Reservas";
    drawResult.appendChild(title);
    const ul = document.createElement("ul");
    for (const player of draw.reserves) {
      const li = document.createElement("li");
      li.textContent = player.name;
      ul.appendChild(li);
    }
    drawResult.appendChild(ul);
  }
}

document.getElementById("load-btn").addEventListener("click", () => {
  const names = parsePlayers(document.getElementById("paste-area").value);
  players = names.map((name) => ({ name, isGoalkeeper: false, isSeed: false }));
  drawResult.innerHTML = "";
  drawControls.hidden = players.length === 0;
  renderPlayers();
});

document.getElementById("draw-btn").addEventListener("click", () => {
  const teamSize = Number(document.getElementById("team-size").value) || 5;
  try {
    renderDraw(drawTeams(players, { teamSize }));
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("clear-btn").addEventListener("click", () => {
  players = [];
  document.getElementById("paste-area").value = "";
  drawControls.hidden = true;
  playerList.innerHTML = "";
  drawResult.innerHTML = "";
});
