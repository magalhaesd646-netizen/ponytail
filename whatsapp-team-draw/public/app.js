let players = [];

const rosterSection = document.getElementById("roster-section");
const resultSection = document.getElementById("result-section");
const playerList = document.getElementById("player-list");
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

function renderRoster() {
  playerList.innerHTML = "";
  players.forEach((player, index) => {
    const li = document.createElement("li");

    const number = document.createElement("span");
    number.className = "number";
    number.textContent = index + 1;
    li.appendChild(number);

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = player.name;
    li.appendChild(name);

    const star = document.createElement("button");
    star.type = "button";
    star.className = "star-toggle";
    star.textContent = "⭐";
    star.setAttribute("aria-pressed", String(player.isSeed));
    star.setAttribute("aria-label", `Marcar ${player.name} como cabeça de chave`);
    star.addEventListener("click", () => {
      player.isSeed = !player.isSeed;
      star.setAttribute("aria-pressed", String(player.isSeed));
    });
    li.appendChild(star);

    playerList.appendChild(li);
  });
}

function formatShareText(draw) {
  const lines = ["⚽ Sorteio de Times"];
  for (const team of draw.teams) {
    lines.push("", `${team.name.toUpperCase()}`, ...team.players.map((p) => `- ${p.name}${p.isSeed ? " ⭐" : ""}`));
  }
  return lines.join("\n");
}

function renderDraw(draw) {
  drawResult.innerHTML = "";
  draw.teams.forEach((team, i) => {
    const card = document.createElement("article");
    card.className = "team";

    const stripe = document.createElement("div");
    stripe.className = "team__stripe";
    stripe.style.background = `var(--team-${(i % 6) + 1})`;
    card.appendChild(stripe);

    const body = document.createElement("div");
    body.className = "team__body";

    const title = document.createElement("h3");
    title.textContent = `${team.name} · ${team.players.length}`;
    body.appendChild(title);

    const ul = document.createElement("ul");
    for (const player of team.players) {
      const li = document.createElement("li");
      li.textContent = player.name;
      if (player.isSeed) {
        const mark = document.createElement("span");
        mark.className = "seed-mark";
        mark.textContent = " ⭐";
        li.appendChild(mark);
      }
      ul.appendChild(li);
    }
    body.appendChild(ul);

    card.appendChild(body);
    drawResult.appendChild(card);
  });

  resultSection.hidden = false;
  resultSection.dataset.shareText = formatShareText(draw);
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("load-btn").addEventListener("click", () => {
  const names = parsePlayers(document.getElementById("paste-area").value);
  players = names.map((name) => ({ name, isSeed: false }));
  resultSection.hidden = true;
  rosterSection.hidden = players.length === 0;
  renderRoster();
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
  rosterSection.hidden = true;
  resultSection.hidden = true;
  playerList.innerHTML = "";
  drawResult.innerHTML = "";
});

document.getElementById("share-btn").addEventListener("click", async () => {
  const text = resultSection.dataset.shareText || "";
  if (navigator.share) {
    try {
      await navigator.share({ title: "Sorteio de Times", text });
    } catch (err) {
      if (err.name !== "AbortError") alert("Não foi possível compartilhar.");
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    alert("Texto copiado! Cole no grupo do WhatsApp.");
  } catch (err) {
    alert("Não foi possível copiar. Copie manualmente:\n\n" + text);
  }
});
