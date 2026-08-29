'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_STATE_PATH = path.join(__dirname, '..', '..', 'data', 'seen.json');
const PRUNE_AFTER_DAYS = 180;

function load(statePath = DEFAULT_STATE_PATH) {
  try {
    const raw = fs.readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.ids) return parsed;
    return { ids: {} };
  } catch {
    return { ids: {} };
  }
}

function save(state, statePath = DEFAULT_STATE_PATH) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function isNew(state, id) {
  return !Object.prototype.hasOwnProperty.call(state.ids, id);
}

function markSeen(state, id, when = new Date().toISOString()) {
  state.ids[id] = when;
}

// Remove entradas antigas para o arquivo de estado não crescer para sempre.
function prune(state, maxAgeDays = PRUNE_AFTER_DAYS) {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  for (const [id, isoDate] of Object.entries(state.ids)) {
    if (new Date(isoDate).getTime() < cutoff) {
      delete state.ids[id];
    }
  }
  return state;
}

module.exports = { load, save, isNew, markSeen, prune, DEFAULT_STATE_PATH };
