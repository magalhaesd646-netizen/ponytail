'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const store = require('../src/store');

function tmpDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'alertas-futebol-'));
}

test('readConfig devolve padrão vazio quando não existe arquivo', () => {
  const dir = tmpDataDir();
  assert.deepEqual(store.readConfig(dir), { leagues: [], rules: [] });
});

test('writeConfig + readConfig fazem round-trip', () => {
  const dir = tmpDataDir();
  const config = { leagues: [39, 140], rules: [{ id: 'r1', metric: 'corners' }] };
  store.writeConfig(config, dir);
  assert.deepEqual(store.readConfig(dir), config);
});

test('notified state faz round-trip', () => {
  const dir = tmpDataDir();
  assert.deepEqual(store.readNotified(dir), {});
  store.writeNotified({ 100: ['r1:1'] }, dir);
  assert.deepEqual(store.readNotified(dir), { 100: ['r1:1'] });
});

test('appendAlertLog empilha do mais novo pro mais antigo e limita o tamanho', () => {
  const dir = tmpDataDir();
  store.appendAlertLog({ message: 'primeiro' }, dir);
  store.appendAlertLog({ message: 'segundo' }, dir);
  const log = store.readAlertsLog(dir);
  assert.equal(log.length, 2);
  assert.equal(log[0].message, 'segundo');
});
