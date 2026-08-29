'use strict';

const axios = require('axios');

const ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

/**
 * Wrapper fino sobre a Google Programmable Search Engine (Custom Search JSON
 * API) — https://developers.google.com/custom-search/v1/overview
 *
 * Requer GOOGLE_API_KEY e GOOGLE_CSE_ID configurados (ver .env.example). Se
 * não estiverem definidos, retorna [] silenciosamente (o restante do app
 * continua funcionando só com os portais públicos) e loga um aviso único.
 */
let warnedMissingCreds = false;

function hasCredentials() {
  return Boolean(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID);
}

/**
 * @param {string} query texto da busca
 * @param {object} [opts]
 * @param {string} [opts.siteSearch] restringe a um domínio (ex.: instagram.com)
 * @param {number} [opts.num] número de resultados (máx. 10 por página na API)
 * @returns {Promise<Array<{title: string, link: string, snippet: string}>>}
 */
async function googleSearch(query, opts = {}) {
  if (!hasCredentials()) {
    if (!warnedMissingCreds) {
      console.warn(
        '[googleSearch] GOOGLE_API_KEY/GOOGLE_CSE_ID não configurados — pulando busca no Google (veja README).'
      );
      warnedMissingCreds = true;
    }
    return [];
  }

  const params = {
    key: process.env.GOOGLE_API_KEY,
    cx: process.env.GOOGLE_CSE_ID,
    q: query,
    num: opts.num || 10,
    gl: 'br',
    hl: 'pt-BR',
  };
  if (opts.siteSearch) {
    params.siteSearch = opts.siteSearch;
    params.siteSearchFilter = 'i';
  }

  try {
    const { data } = await axios.get(ENDPOINT, { params, timeout: 10000 });
    const items = data.items || [];
    return items.map((item) => ({
      title: item.title || '',
      link: item.link || '',
      snippet: item.snippet || '',
    }));
  } catch (err) {
    const status = err.response && err.response.status;
    console.warn(
      `[googleSearch] falha na busca "${query}"${status ? ` (HTTP ${status})` : ''}: ${err.message}`
    );
    return [];
  }
}

module.exports = { googleSearch, hasCredentials };
