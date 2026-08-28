// In-memory player list per chat. Restarting the bot clears open lists —
// acceptable since a list only lives for one matchday's roster collection.
const chats = new Map();

function getChatPlayers(chatId) {
  if (!chats.has(chatId)) chats.set(chatId, []);
  return chats.get(chatId);
}

function addPlayer(chatId, id, name) {
  const players = getChatPlayers(chatId);
  if (players.some((p) => p.id === id)) return false;
  players.push({ id, name, isGoalkeeper: false, isSeed: false });
  return true;
}

function removePlayer(chatId, id) {
  const players = getChatPlayers(chatId);
  const index = players.findIndex((p) => p.id === id);
  if (index === -1) return false;
  players.splice(index, 1);
  return true;
}

function toggleFlag(chatId, id, flag) {
  const player = getChatPlayers(chatId).find((p) => p.id === id);
  if (!player) return null;
  player[flag] = !player[flag];
  return player[flag];
}

function clearChat(chatId) {
  chats.set(chatId, []);
}

module.exports = { getChatPlayers, addPlayer, removePlayer, toggleFlag, clearChat };
