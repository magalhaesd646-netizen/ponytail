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

const RECENCY_TO_DATE_RESTRICT = {
  day: 'd1',
  week: 'w1',
  month: 'm1',
  year: 'y1',
};

/**
 * @param {string} query texto da busca (restrição por domínio, se houver, já
 *   deve vir embutida na query como operador site: — ver src/sources/webSearch.js)
 * @param {object} [opts]
 * @param {number} [opts.num] número de resultados (máx. 10 por página na API)
 * @param {'day'|'week'|'month'|'year'} [opts.recency] só conteúdo indexado
 *   dentro dessa janela — evita lançamentos antigos que já podem nem estar
 *   mais à venda
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
  if (opts.recency && RECENCY_TO_DATE_RESTRICT[opts.recency]) {
    params.dateRestrict = RECENCY_TO_DATE_RESTRICT[opts.recency];
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
