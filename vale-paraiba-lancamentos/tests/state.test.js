'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const state = require('../src/lib/state');

function tmpStatePath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vale-state-')), 'seen.json');
}

test('load retorna estado vazio quando o arquivo não existe', () => {
  const st = state.load(tmpStatePath());
  assert.deepEqual(st, { ids: {} });
});

test('markSeen + isNew + save/load fazem round-trip', () => {
  const p = tmpStatePath();
  const st = state.load(p);
  assert.equal(state.isNew(st, 'abc'), true);
  state.markSeen(st, 'abc');
  assert.equal(state.isNew(st, 'abc'), false);
  state.save(st, p);

  const reloaded = state.load(p);
  assert.equal(state.isNew(reloaded, 'abc'), false);
});

test('prune remove ids mais antigos que maxAgeDays', () => {
  const st = { ids: {} };
  const old = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
  const recent = new Date().toISOString();
  state.markSeen(st, 'old-id', old);
  state.markSeen(st, 'recent-id', recent);
  state.prune(st, 180);
  assert.equal('old-id' in st.ids, false);
  assert.equal('recent-id' in st.ids, true);
});
