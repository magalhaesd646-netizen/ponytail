'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function withEnv(vars, fn) {
  const prev = {};
  for (const key of Object.keys(vars)) {
    prev[key] = process.env[key];
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const key of Object.keys(prev)) {
        if (prev[key] === undefined) delete process.env[key];
        else process.env[key] = prev[key];
      }
    });
}

test('webSearch retorna [] sem nenhum provedor configurado', async () => {
  await withEnv(
    { TAVILY_API_KEY: undefined, GOOGLE_API_KEY: undefined, GOOGLE_CSE_ID: undefined },
    async () => {
      delete require.cache[require.resolve('../src/sources/tavilySearch')];
      delete require.cache[require.resolve('../src/sources/googleSearch')];
      delete require.cache[require.resolve('../src/sources/webSearch')];
      const { webSearch, hasAnyProvider } = require('../src/sources/webSearch');
      assert.equal(hasAnyProvider(), false);
      const results = await webSearch('teste');
      assert.deepEqual(results, []);
    }
  );
});

test('tavilySearch.hasCredentials reflete TAVILY_API_KEY', async () => {
  await withEnv({ TAVILY_API_KEY: 'fake-key' }, async () => {
    delete require.cache[require.resolve('../src/sources/tavilySearch')];
    const { hasCredentials } = require('../src/sources/tavilySearch');
    assert.equal(hasCredentials(), true);
  });
  await withEnv({ TAVILY_API_KEY: undefined }, async () => {
    delete require.cache[require.resolve('../src/sources/tavilySearch')];
    const { hasCredentials } = require('../src/sources/tavilySearch');
    assert.equal(hasCredentials(), false);
  });
});
