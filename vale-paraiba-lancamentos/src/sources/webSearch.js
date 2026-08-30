'use strict';

const tavily = require('./tavilySearch');
const google = require('./googleSearch');

/**
 * Camada única de busca web: usa o Tavily se estiver configurado (setup mais
 * simples — só uma chave, sem projeto no Google Cloud), senão cai para o
 * Google Custom Search se esse estiver configurado, senão retorna []
 * silenciosamente (o app segue funcionando só com os portais públicos).
 *
 * @param {string} query
 * @param {object} [opts]
 * @param {string[]} [opts.domains] restringe a busca a esses domínios
 * @param {number} [opts.num]
 * @param {'day'|'week'|'month'|'year'} [opts.recency] só conteúdo recente
 */
async function webSearch(query, opts = {}) {
  if (tavily.hasCredentials()) {
    return tavily.tavilySearch(query, opts);
  }
  if (google.hasCredentials()) {
    const finalQuery = opts.domains && opts.domains.length
      ? `(${opts.domains.map((d) => `site:${d}`).join(' OR ')}) ${query}`
      : query;
    return google.googleSearch(finalQuery, { num: opts.num, recency: opts.recency });
  }
  return [];
}

function hasAnyProvider() {
  return tavily.hasCredentials() || google.hasCredentials();
}

module.exports = { webSearch, hasAnyProvider };
