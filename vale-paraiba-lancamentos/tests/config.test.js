'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');

test('OFFICIAL_SOURCE_DOMAINS inclui os sites das construtoras conhecidas e as redes sociais', () => {
  assert.ok(config.OFFICIAL_SOURCE_DOMAINS.includes('marcondescesar.com.br'));
  assert.ok(config.OFFICIAL_SOURCE_DOMAINS.includes('mrv.com.br'));
  assert.ok(config.OFFICIAL_SOURCE_DOMAINS.includes('instagram.com'));
  assert.ok(config.OFFICIAL_SOURCE_DOMAINS.includes('facebook.com'));
});

test('templates de busca incluem o qualificador de estado ", SP"', () => {
  assert.match(config.WEB_QUERY_TEMPLATE, /\{cidade\}, SP/);
  assert.match(config.OFFICIAL_SOURCES_QUERY_TEMPLATE, /\{cidade\}, SP/);
});

test('SEARCH_RECENCY é um valor válido para os provedores de busca', () => {
  assert.ok(['day', 'week', 'month', 'year'].includes(config.SEARCH_RECENCY));
});
