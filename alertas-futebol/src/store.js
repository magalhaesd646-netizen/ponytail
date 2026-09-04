'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data');
const ALERTS_LOG_LIMIT = 200;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// dataDir é opcional (usado pelos testes para isolar o filesystem).
function readConfig(dataDir = DEFAULT_DATA_DIR) {
  return readJson(path.join(dataDir, 'config.json'), { leagues: [], rules: [] });
}

function writeConfig(config, dataDir = DEFAULT_DATA_DIR) {
  writeJson(path.join(dataDir, 'config.json'), config);
}

// { [fixtureId]: ["ruleId:teamId", ...] } — regras já notificadas por
// partida ao vivo, para não repetir o mesmo alerta a cada rodada do monitor.
function readNotified(dataDir = DEFAULT_DATA_DIR) {
  return readJson(path.join(dataDir, 'notified.json'), {});
}

function writeNotified(state, dataDir = DEFAULT_DATA_DIR) {
  writeJson(path.join(dataDir, 'notified.json'), state);
}

function readAlertsLog(dataDir = DEFAULT_DATA_DIR) {
  return readJson(path.join(dataDir, 'alerts-log.json'), []);
}

function appendAlertLog(entry, dataDir = DEFAULT_DATA_DIR) {
  const log = readAlertsLog(dataDir);
  log.unshift(entry);
  writeJson(path.join(dataDir, 'alerts-log.json'), log.slice(0, ALERTS_LOG_LIMIT));
}

module.exports = {
  DEFAULT_DATA_DIR,
  readConfig,
  writeConfig,
  readNotified,
  writeNotified,
  readAlertsLog,
  appendAlertLog,
};
