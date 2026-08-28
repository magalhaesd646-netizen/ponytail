const playerList = document.getElementById("player-list");
const drawResult = document.getElementById("draw-result");

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.status === 204 ? null : res.json();
}

function renderPlayers(players) {
  const myPlayerId = localStorage.getItem("playerId");
  playerList.innerHTML = "";
  for (const player of players) {
    const li = document.createElement("li");

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = player.name;
    li.appendChild(name);

    const isMine = player.id === myPlayerId;

    li.appendChild(makeToggle("🧤", player.isGoalkeeper, isMine, (checked) =>
      api(`/api/players/${player.id}`, { method: "PATCH", body: JSON.stringify({ isGoalkeeper: checked }) }),
    ));
    li.appendChild(makeToggle("⭐", player.isSeed, isMine, (checked) =>
      api(`/api/players/${player.id}`, { method: "PATCH", body: JSON.stringify({ isSeed: checked }) }),
    ));

    if (isMine) {
      const leave = document.createElement("button");
      leave.textContent = "Sair";
      leave.className = "secondary";
      leave.onclick = async () => {
        await api(`/api/players/${player.id}`, { method: "DELETE" });
        localStorage.removeItem("playerId");
        refresh();
      };
      li.appendChild(leave);
    }

    playerList.appendChild(li);
  }
}

function makeToggle(label, checked, enabled, onChange) {
  const wrapper = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.disabled = !enabled;
  checkbox.onchange = async () => {
    await onChange(checkbox.checked);
    refresh();
  };
  wrapper.appendChild(checkbox);
  wrapper.appendChild(document.createTextNode(label));
  return wrapper;
}

function renderDraw(draw) {
  if (!draw) {
    drawResult.textContent = "";
    return;
  }
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

async function refresh() {
  const [players, draw] = await Promise.all([api("/api/players"), api("/api/draw")]);
  renderPlayers(players);
  renderDraw(draw);
}

document.getElementById("join-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("name-input");
  const player = await api("/api/players", { method: "POST", body: JSON.stringify({ name: input.value }) });
  localStorage.setItem("playerId", player.id);
  input.value = "";
  refresh();
});

document.getElementById("draw-btn").addEventListener("click", async () => {
  const teamSize = Number(document.getElementById("team-size").value) || 5;
  try {
    await api("/api/draw", { method: "POST", body: JSON.stringify({ teamSize }) });
    refresh();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("clear-btn").addEventListener("click", async () => {
  if (!confirm("Zerar a lista de jogadores?")) return;
  await api("/api/clear", { method: "POST" });
  localStorage.removeItem("playerId");
  refresh();
});

refresh();
setInterval(refresh, 3000);
