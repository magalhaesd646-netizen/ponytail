'use strict';

const axios = require('axios');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.5',
};

/**
 * GET resiliente: nunca lança exceção, retorna null em qualquer falha
 * (timeout, DNS, HTTP >= 400/500, etc.) para não derrubar o pipeline.
 */
async function fetchHtml(url, { timeout = 15000 } = {}) {
  try {
    const { data, status } = await axios.get(url, {
      headers: HEADERS,
      timeout,
      validateStatus: (s) => s < 500,
      maxRedirects: 5,
    });
    if (status >= 400) {
      console.warn(`[http] HTTP ${status} ao buscar ${url}`);
      return null;
    }
    return typeof data === 'string' ? data : null;
  } catch (err) {
    console.warn(`[http] falha ao buscar ${url}: ${err.message}`);
    return null;
  }
}

module.exports = { fetchHtml, HEADERS };
