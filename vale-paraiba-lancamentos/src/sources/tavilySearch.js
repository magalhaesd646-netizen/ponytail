'use strict';

const axios = require('axios');

const ENDPOINT = 'https://api.tavily.com/search';

/**
 * Wrapper fino sobre a Tavily Search API — https://docs.tavily.com/
 * Setup mais simples que o Google Custom Search: só precisa de uma chave
 * (tavily.com/#pricing tem plano grátis com 1.000 créditos/mês, sem cartão),
 * sem precisar criar projeto no Google Cloud nem mecanismo de busca (CSE).
 *
 * Requer TAVILY_API_KEY configurado (ver .env.example). Se não estiver
 * definido, retorna [] silenciosamente e loga um aviso único.
 */
let warnedMissingCreds = false;

function hasCredentials() {
  return Boolean(process.env.TAVILY_API_KEY);
}

/**
 * @param {string} query texto da busca
 * @param {object} [opts]
 * @param {string[]} [opts.domains] restringe a busca a esses domínios
 * @param {number} [opts.num] número de resultados
 * @param {'day'|'week'|'month'|'year'} [opts.recency] só conteúdo indexado
 *   dentro dessa janela — evita lançamentos antigos que já podem nem estar
 *   mais à venda
 * @returns {Promise<Array<{title: string, link: string, snippet: string}>>}
 */
async function tavilySearch(query, opts = {}) {
  if (!hasCredentials()) {
    if (!warnedMissingCreds) {
      console.warn('[tavilySearch] TAVILY_API_KEY não configurado — pulando busca no Tavily (veja README).');
      warnedMissingCreds = true;
    }
    return [];
  }

  const body = {
    query,
    // A API aceita a chave tanto no header Authorization quanto no corpo
    // (api_key) — mandamos os dois pra cobrir os dois formatos de chave que
    // o Tavily emite (dashboard normal e chaves "-dev-" do fluxo MCP).
    api_key: process.env.TAVILY_API_KEY,
    search_depth: 'basic',
    max_results: opts.num || 10,
  };
  if (opts.domains && opts.domains.length) {
    body.include_domains = opts.domains;
  }
  if (opts.recency) {
    body.time_range = opts.recency;
  }

  try {
    const { data } = await axios.post(ENDPOINT, body, {
      headers: {
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    const results = Array.isArray(data.results) ? data.results : [];
    return results.map((item) => ({
      title: item.title || '',
      link: item.url || '',
      snippet: item.content || '',
    }));
  } catch (err) {
    const status = err.response && err.response.status;
    const rawDetail = err.response && err.response.data && (err.response.data.detail || err.response.data.error);
    const detail = typeof rawDetail === 'string' ? rawDetail : rawDetail ? JSON.stringify(rawDetail) : null;
    console.warn(
      `[tavilySearch] falha na busca "${query}"${status ? ` (HTTP ${status})` : ''}: ${detail || err.message}`
    );
    return [];
  }
}

module.exports = { tavilySearch, hasCredentials };
