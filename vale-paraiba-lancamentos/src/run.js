'use strict';

require('dotenv').config();

const { CITIES, WEB_QUERY_TEMPLATE, SOCIAL_QUERY_TEMPLATE } = require('./config');
const { googleSearch } = require('./sources/googleSearch');
const { searchPortalsForCity } = require('./sources/portalScraper');
const { normalizeResult } = require('./lib/extractor');
const { findTechEmail } = require('./lib/emailFinder');
const { sendDigest } = require('./lib/notifier');
const state = require('./lib/state');

const DEFAULT_GOOGLE_DAILY_QUERY_BUDGET = 90;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A cota gratuita da Google Custom Search API é de 100 buscas/dia. Cada
// cidade consome até 2 buscas (web + redes sociais); o orçamento garante que
// nunca estouramos a cota mesmo com todas as cidades do Vale do Paraíba
// configuradas, e prioriza sempre as primeiras cidades da lista (São José
// dos Campos, Jacareí e Taubaté vêm primeiro em CITIES por padrão).
function makeQueryBudget(max) {
  let used = 0;
  return {
    hasRoom: () => used < max,
    consume: () => {
      used += 1;
    },
    used: () => used,
  };
}

async function collectRawResultsForCity(city, budget) {
  const raw = [];

  const portalListings = await searchPortalsForCity(city);
  for (const listing of portalListings) {
    raw.push({ ...listing, sourceType: 'portal', sourceLabel: listing.sourceLabel });
  }

  if (budget.hasRoom()) {
    const webQuery = WEB_QUERY_TEMPLATE.replace('{cidade}', city);
    const webResults = await googleSearch(webQuery);
    budget.consume();
    for (const r of webResults) {
      raw.push({ ...r, city, sourceType: 'google-web', sourceLabel: 'Google' });
    }
  }

  if (budget.hasRoom()) {
    const socialQuery = SOCIAL_QUERY_TEMPLATE.replace('{cidade}', city);
    const socialResults = await googleSearch(socialQuery);
    budget.consume();
    for (const r of socialResults) {
      raw.push({ ...r, city, sourceType: 'google-social', sourceLabel: 'Google (Instagram/Facebook)' });
    }
  }

  return raw;
}

async function main() {
  const st = state.load();
  state.prune(st);

  const budget = makeQueryBudget(
    Number(process.env.GOOGLE_DAILY_QUERY_BUDGET) || DEFAULT_GOOGLE_DAILY_QUERY_BUDGET
  );

  const normalized = [];
  for (const city of CITIES) {
    const raw = await collectRawResultsForCity(city, budget);
    for (const item of raw) {
      const result = normalizeResult(item);
      if (result.empreendimento) normalized.push(result);
    }
    await sleep(300); // pequena pausa entre cidades para não sobrecarregar as fontes
  }

  const uniqueById = new Map();
  for (const item of normalized) uniqueById.set(item.id, item);

  const newItems = [];
  for (const item of uniqueById.values()) {
    if (state.isNew(st, item.id)) {
      newItems.push(item);
      state.markSeen(st, item.id);
    }
  }

  console.log(
    `[run] cidades pesquisadas: ${CITIES.length} | buscas Google tentadas: ${budget.used()} | ` +
      `resultados brutos: ${normalized.length} | únicos nesta execução: ${uniqueById.size} | novos: ${newItems.length}`
  );

  for (const item of newItems) {
    const companyName = item.construtora || item.incorporadora;
    item.emailContato = companyName ? await findTechEmail(companyName) : null;
  }

  state.save(st);

  if (newItems.length) {
    const result = await sendDigest(newItems);
    console.log('[run] notificação:', result);
  } else {
    console.log('[run] nenhum lançamento novo hoje.');
  }

  return { newItems, totalUnique: uniqueById.size };
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[run] erro fatal:', err);
    process.exitCode = 1;
  });
}

module.exports = { main, collectRawResultsForCity, makeQueryBudget };
