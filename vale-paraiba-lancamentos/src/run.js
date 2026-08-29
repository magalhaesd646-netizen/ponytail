'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { CITIES, WEB_QUERY_TEMPLATE, SOCIAL_QUERY_TEMPLATE, SOCIAL_SITE_DOMAINS } = require('./config');
const { webSearch } = require('./sources/webSearch');
const { searchPortalsForCity } = require('./sources/portalScraper');
const { normalizeResult, loadKnownBuilders, findKnownBuilder } = require('./lib/extractor');
const { findTechEmail } = require('./lib/emailFinder');
const { sendDigest } = require('./lib/notifier');
const { createAlertIssue } = require('./lib/githubIssue');
const { fetchHtml } = require('./lib/http');
const state = require('./lib/state');

// Padrão conservador o suficiente para caber no plano grátis do Tavily
// (1.000 créditos/mês ≈ 33/dia) mesmo rodando todo dia — dá pra aumentar via
// env se só o Google estiver configurado (cota gratuita de 100/dia).
const DEFAULT_SEARCH_DAILY_QUERY_BUDGET = 30;
const PRIORITY_CITY_COUNT = 3; // São José dos Campos, Jacareí, Taubaté
const DATA_JSON_PATH = path.join(__dirname, '..', 'web', 'data.json');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Cada cidade consome até 2 buscas (web + redes sociais); o orçamento
// garante que nunca estouramos a cota gratuita do provedor configurado
// (Tavily ou Google), mesmo com todas as cidades do Vale do Paraíba
// configuradas. Sem nenhum provedor configurado, essas buscas são puladas e
// o app funciona só com os portais públicos (modo zero-config).
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

// Com o orçamento diário limitado, nem todas as ~34 cidades cabem numa
// execução só. As prioritárias (São José dos Campos, Jacareí, Taubaté)
// sempre entram primeiro; as demais giram por dia (baseado na data), para
// que todas acabem cobertas ao longo de alguns dias em vez de sempre as
// mesmas primeiras da lista.
function orderedCitiesForToday(cities, priorityCount = PRIORITY_CITY_COUNT) {
  if (cities.length <= priorityCount) return cities;
  const priority = cities.slice(0, priorityCount);
  const rest = cities.slice(priorityCount);
  const dayIndex = Math.floor(Date.now() / 86400000);
  const offset = dayIndex % rest.length;
  const rotated = [...rest.slice(offset), ...rest.slice(0, offset)];
  return [...priority, ...rotated];
}

async function collectRawResultsForCity(city, budget) {
  const raw = [];

  const portalListings = await searchPortalsForCity(city);
  for (const listing of portalListings) {
    raw.push({ ...listing, sourceType: 'portal', sourceLabel: listing.sourceLabel });
  }

  if (budget.hasRoom()) {
    const webQuery = WEB_QUERY_TEMPLATE.replace('{cidade}', city);
    const webResults = await webSearch(webQuery);
    budget.consume();
    for (const r of webResults) {
      raw.push({ ...r, city, sourceType: 'web-search', sourceLabel: 'Busca web' });
    }
  }

  if (budget.hasRoom()) {
    const socialQuery = SOCIAL_QUERY_TEMPLATE.replace('{cidade}', city);
    const socialResults = await webSearch(socialQuery, { domains: SOCIAL_SITE_DOMAINS });
    budget.consume();
    for (const r of socialResults) {
      raw.push({ ...r, city, sourceType: 'web-search-social', sourceLabel: 'Busca web (Instagram/Facebook)' });
    }
  }

  return raw;
}

// Quando a Google Custom Search API não está configurada (modo zero-config),
// os resultados de portal costumam não trazer o nome da construtora no
// texto do link de listagem. Para itens NOVOS ainda sem construtora
// identificada, buscamos a própria página de detalhe do anúncio e tentamos
// reconhecer alguma construtora conhecida no HTML. Só fazemos isso para
// itens novos (não para todos os resultados) para manter o custo de rede
// baixo.
async function enrichConstrutoraFromDetailPage(item, knownBuilders) {
  if (item.construtoraIdentificada || item.sourceType !== 'portal' || !item.url) return;
  const html = await fetchHtml(item.url, { timeout: 10000 });
  if (!html) return;
  const builder = findKnownBuilder(html, knownBuilders);
  if (!builder) return;
  item.construtora = builder.name;
  item.incorporadora = builder.isAlsoIncorporadora ? builder.name : item.incorporadora;
  item.construtoraIdentificada = true;
}

function writeDashboardData(snapshotItems) {
  const payload = {
    generatedAt: new Date().toISOString(),
    cidades: CITIES.length,
    items: snapshotItems,
  };
  fs.mkdirSync(path.dirname(DATA_JSON_PATH), { recursive: true });
  fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

async function main() {
  const st = state.load();
  state.prune(st);

  const budget = makeQueryBudget(
    Number(process.env.SEARCH_DAILY_QUERY_BUDGET || process.env.GOOGLE_DAILY_QUERY_BUDGET) ||
      DEFAULT_SEARCH_DAILY_QUERY_BUDGET
  );

  const normalized = [];
  for (const city of orderedCitiesForToday(CITIES)) {
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
    `[run] cidades pesquisadas: ${CITIES.length} | buscas web tentadas: ${budget.used()} | ` +
      `resultados brutos: ${normalized.length} | únicos nesta execução: ${uniqueById.size} | novos: ${newItems.length}`
  );

  const knownBuilders = loadKnownBuilders();
  for (const item of newItems) {
    await enrichConstrutoraFromDetailPage(item, knownBuilders);
    const companyName = item.construtora || item.incorporadora;
    item.emailContato = companyName ? await findTechEmail(companyName) : null;
  }

  state.save(st);

  const newItemIds = new Set(newItems.map((n) => n.id));
  const snapshot = Array.from(uniqueById.values()).map((item) => ({
    ...item,
    isNew: newItemIds.has(item.id),
    firstSeen: st.ids[item.id] || item.foundAt,
  }));
  writeDashboardData(snapshot);

  if (newItems.length) {
    const [emailResult, issueResult] = await Promise.all([
      sendDigest(newItems),
      createAlertIssue(newItems),
    ]);
    console.log('[run] alerta por e-mail (opcional):', emailResult);
    console.log('[run] alerta por GitHub Issue (padrão):', issueResult);
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

module.exports = { main, collectRawResultsForCity, makeQueryBudget, orderedCitiesForToday };
