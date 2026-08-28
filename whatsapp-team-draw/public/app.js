let players = [];

const rosterSection = document.getElementById("roster-section");
const resultSection = document.getElementById("result-section");
const playerList = document.getElementById("player-list");
const drawResult = document.getElementById("draw-result");
const goalkeepersNote = document.getElementById("goalkeepers-note");

// Lines a pasted WhatsApp message often has besides the actual roster
// (event header, address, pix key, "aguardando" list, ...). Filtered out
// so only player names make it into the checklist.
const NOISE_WORDS = [
  "confirmado", "confirmados", "confirmação", "confirmacao",
  "pelada", "racha", "society", "quadra", "campo", "estádio", "estadio",
  "local", "endereço", "endereco", "horário", "horario", "data",
  "valor", "pix", "rateio", "obs", "observação", "observacao",
  "aguardando", "espera", "lista", "grupo", "galera", "pessoal",
  "presença", "presenca", "vagas", "regras", "avisos",
];

const GOALKEEPER_PATTERN = /\(?\s*(goleiro|goleira|gol|gk)\s*\)?|🧤/i;

function looksLikeHeader(line) {
  if (/:\s*$/.test(line)) return true;
  const lower = line.toLowerCase();
  return NOISE_WORDS.some((word) => new RegExp(`\\b${word}\\b`, "i").test(lower));
}

function extractGoalkeeper(rawName) {
  const isGoalkeeper = GOALKEEPER_PATTERN.test(rawName);
  const name = rawName
    .replace(GOALKEEPER_PATTERN, "")
    .replace(/[-–—()[\]]+\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { name, isGoalkeeper };
}

function parsePlayers(text) {
  let lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length === 1 && lines[0].includes(",")) {
    lines = lines[0].split(",").map((l) => l.trim()).filter(Boolean);
  }

  return lines
    .map((line) => line.replace(/^\s*(\d+[.)-]|[-*•])\s*/, "").trim())
    .filter((line) => line && /[a-zA-ZÀ-ÿ]/.test(line) && !looksLikeHeader(line))
    .map(extractGoalkeeper)
    .filter((p) => p.name);
}

function renderRoster() {
  playerList.innerHTML = "";
  players.forEach((player, index) => {
    const li = document.createElement("li");
    li.classList.toggle("is-goalkeeper", player.isGoalkeeper);

    const number = document.createElement("span");
    number.className = "number";
    number.textContent = index + 1;
    li.appendChild(number);

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = player.name;
    li.appendChild(name);

    if (player.isGoalkeeper) {
      const chip = document.createElement("span");
      chip.className = "gk-chip";
      chip.textContent = "GOL";
      li.appendChild(chip);
    }

    const gkToggle = document.createElement("button");
    gkToggle.type = "button";
    gkToggle.className = "icon-toggle";
    gkToggle.textContent = "🧤";
    gkToggle.setAttribute("aria-pressed", String(player.isGoalkeeper));
    gkToggle.setAttribute("aria-label", `Marcar ${player.name} como goleiro`);
    gkToggle.addEventListener("click", () => {
      player.isGoalkeeper = !player.isGoalkeeper;
      renderRoster();
    });
    li.appendChild(gkToggle);

    const star = document.createElement("button");
    star.type = "button";
    star.className = "icon-toggle";
    star.textContent = "⭐";
    star.setAttribute("aria-pressed", String(player.isSeed));
    star.setAttribute("aria-label", `Marcar ${player.name} como cabeça de chave`);
    star.addEventListener("click", () => {
      player.isSeed = !player.isSeed;
      star.setAttribute("aria-pressed", String(player.isSeed));
    });
    li.appendChild(star);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-btn";
    remove.textContent = "✕";
    remove.setAttribute("aria-label", `Remover ${player.name} da lista`);
    remove.addEventListener("click", () => {
      players.splice(index, 1);
      renderRoster();
    });
    li.appendChild(remove);

    playerList.appendChild(li);
  });
}

function formatShareText(draw, goalkeepers) {
  const lines = ["⚽ Sorteio de Times"];
  for (const team of draw.teams) {
    lines.push("", team.name.toUpperCase(), ...team.players.map((p) => `- ${p.name}${p.isSeed ? " ⭐" : ""}`));
  }
  if (goalkeepers.length) {
    lines.push("", `🧤 Goleiros (fora do sorteio): ${goalkeepers.map((p) => p.name).join(", ")}`);
  }
  return lines.join("\n");
}

function renderDraw(draw, goalkeepers) {
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

  if (goalkeepers.length) {
    goalkeepersNote.hidden = false;
    goalkeepersNote.textContent = `🧤 Fora do sorteio: ${goalkeepers.map((p) => p.name).join(", ")}`;
  } else {
    goalkeepersNote.hidden = true;
  }

  document.getElementById("share-text").value = formatShareText(draw, goalkeepers);
  document.getElementById("native-share-btn").hidden = !navigator.share;

  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("load-btn").addEventListener("click", () => {
  const parsed = parsePlayers(document.getElementById("paste-area").value);
  players = parsed.map((p) => ({ name: p.name, isGoalkeeper: p.isGoalkeeper, isSeed: false }));
  resultSection.hidden = true;
  rosterSection.hidden = players.length === 0;
  renderRoster();
});

document.getElementById("draw-btn").addEventListener("click", () => {
  const teamSize = Number(document.getElementById("team-size").value) || 5;
  const goalkeepers = players.filter((p) => p.isGoalkeeper);
  const outfield = players.filter((p) => !p.isGoalkeeper);
  try {
    renderDraw(drawTeams(outfield, { teamSize }), goalkeepers);
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

document.getElementById("copy-btn").addEventListener("click", async (e) => {
  // Capture before any `await` — e.currentTarget is cleared once the
  // synchronous dispatch phase ends, so reading it after an await gives null.
  const button = e.currentTarget;
  const textarea = document.getElementById("share-text");
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    await navigator.clipboard.writeText(textarea.value);
    copied = true;
  } catch (err) {
    try {
      copied = document.execCommand("copy");
    } catch (err2) {
      copied = false;
    }
  }

  const original = button.textContent;
  button.textContent = copied ? "Copiado!" : "Texto selecionado — copie manualmente";
  setTimeout(() => {
    button.textContent = original;
  }, 2500);
});

document.getElementById("native-share-btn").addEventListener("click", async () => {
  const text = document.getElementById("share-text").value;
  try {
    await navigator.share({ title: "Sorteio de Times", text });
  } catch (err) {
    // Cancelado ou bloqueado: o texto já está visível/selecionável no campo acima.
  }
});
