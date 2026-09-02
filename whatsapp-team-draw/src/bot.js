const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { drawTeams, parseDrawArgs } = require("./teamDraw");
const store = require("./store");

const client = new Client({ authStrategy: new LocalAuth() });

client.on("qr", (qr) => qrcode.generate(qr, { small: true }));
client.on("ready", () => console.log("Bot conectado ao WhatsApp."));

function formatList(players) {
  if (players.length === 0) return "Lista vazia. Mande !entrar para participar.";
  return players
    .map((p, i) => {
      const tags = [p.isGoalkeeper && "🧤", p.isSeed && "⭐"].filter(Boolean).join(" ");
      return `${i + 1}. ${p.name}${tags ? " " + tags : ""}`;
    })
    .join("\n");
}

function formatDraw({ teams, reserves }) {
  const teamsText = teams
    .map((team) => {
      const goalkeeper = team.goalkeeper ? `🧤 ${team.goalkeeper.name}` : "🧤 (sem goleiro fixo)";
      const players = team.players.map((p) => `- ${p.name}${p.isSeed ? " ⭐" : ""}`).join("\n");
      return `*${team.name}*\n${goalkeeper}\n${players}`;
    })
    .join("\n\n");
  const reservesText = reserves.length ? `\n\n*Reservas:*\n${reserves.map((p) => `- ${p.name}`).join("\n")}` : "";
  return `${teamsText}${reservesText}`;
}

client.on("message", async (message) => {
  const chat = await message.getChat();
  const contact = await message.getContact();
  const chatId = chat.id._serialized;
  const senderId = contact.id._serialized;
  const senderName = contact.pushname || contact.number;
  const [command, ...args] = message.body.trim().split(/\s+/);

  switch (command) {
    case "!entrar":
      message.reply(
        store.addPlayer(chatId, senderId, senderName) ? `${senderName} entrou na lista.` : "Você já está na lista.",
      );
      break;

    case "!sair":
      message.reply(store.removePlayer(chatId, senderId) ? `${senderName} saiu da lista.` : "Você não estava na lista.");
      break;

    case "!goleiro": {
      const isGoalkeeper = store.toggleFlag(chatId, senderId, "isGoalkeeper");
      if (isGoalkeeper === null) return message.reply("Entre na lista primeiro com !entrar.");
      message.reply(isGoalkeeper ? `${senderName} agora é goleiro fixo.` : `${senderName} não é mais goleiro fixo.`);
      break;
    }

    case "!cabeca": {
      const isSeed = store.toggleFlag(chatId, senderId, "isSeed");
      if (isSeed === null) return message.reply("Entre na lista primeiro com !entrar.");
      message.reply(isSeed ? `${senderName} agora é cabeça de chave.` : `${senderName} não é mais cabeça de chave.`);
      break;
    }

    case "!lista":
      message.reply(formatList(store.getChatPlayers(chatId)));
      break;

    case "!limpar":
      store.clearChat(chatId);
      message.reply("Lista zerada.");
      break;

    case "!sortear": {
      try {
        const { teamSize, numberOfTeams } = parseDrawArgs(args);
        const result = drawTeams(store.getChatPlayers(chatId), { teamSize, numberOfTeams });
        message.reply(formatDraw(result));
      } catch (err) {
        message.reply(`Não deu pra sortear: ${err.message}`);
      }
      break;
    }

    case "!ajuda":
      message.reply(
        [
          "!entrar - entra na lista",
          "!sair - sai da lista",
          "!goleiro - marca/desmarca você como goleiro fixo",
          "!cabeca - marca/desmarca você como cabeça de chave",
          "!lista - mostra a lista atual",
          "!sortear [tamanho] [quantidade de times] - sorteia os times (padrão: 5 por time; quantidade de times de 2 a 4, calculada automaticamente se omitida)",
          "!limpar - zera a lista",
        ].join("\n"),
      );
      break;
  }
});

client.initialize();
