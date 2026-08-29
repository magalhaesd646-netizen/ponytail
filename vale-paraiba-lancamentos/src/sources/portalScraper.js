'use strict';

const cheerio = require('cheerio');
const { PORTALS } = require('../config');
const { slugify } = require('../lib/text');
const { fetchHtml } = require('../lib/http');

const MAX_LISTINGS_PER_PORTAL = 20;

/**
 * Portais como Viva Real e ZAP Imóveis são SPAs que mudam de layout com
 * frequência e usam proteção anti-bot. Em vez de depender de classes CSS
 * específicas (que quebram a cada redesign), extraímos os links de
 * detalhe do anúncio pelo padrão da própria URL (listingPathHint) e usamos
 * o texto do link/atributos como nome do empreendimento. É um método
 * "best effort": pode perder alguns anúncios, mas não quebra silenciosamente
 * quando o HTML muda de estrutura visual.
 */

function extractListingsFromHtml(html, portal, pageUrl) {
  const $ = cheerio.load(html);
  const seenHrefs = new Set();
  const listings = [];

  $('a[href]').each((_, el) => {
    if (listings.length >= MAX_LISTINGS_PER_PORTAL) return;
    const href = $(el).attr('href') || '';
    if (!href.includes(portal.listingPathHint)) return;

    const absoluteHref = href.startsWith('http')
      ? href
      : new URL(href, pageUrl).toString();
    if (absoluteHref === pageUrl) return;
    if (seenHrefs.has(absoluteHref)) return;

    const text =
      $(el).attr('title') ||
      $(el).attr('aria-label') ||
      $(el).text().replace(/\s+/g, ' ').trim();

    if (!text) return;

    seenHrefs.add(absoluteHref);
    listings.push({
      name: text,
      url: absoluteHref,
      source: portal.id,
      sourceLabel: portal.label,
    });
  });

  return listings;
}

/**
 * Busca lançamentos para uma cidade em todos os portais configurados.
 * Nunca lança exceção — falhas de rede/parse resultam em array vazio para
 * aquele portal, para não interromper o restante do pipeline.
 * @param {string} cityName
 */
async function searchPortalsForCity(cityName) {
  const citySlug = slugify(cityName);
  const results = [];

  for (const portal of PORTALS) {
    const url = portal.buildUrl(citySlug);
    const html = await fetchHtml(url);
    if (!html) continue;
    try {
      const listings = extractListingsFromHtml(html, portal, url);
      for (const listing of listings) {
        results.push({ ...listing, city: cityName });
      }
    } catch (err) {
      console.warn(`[portalScraper] falha ao processar ${url}: ${err.message}`);
    }
  }

  return results;
}

module.exports = { searchPortalsForCity, extractListingsFromHtml, fetchHtml };
