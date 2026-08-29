'use strict';

const { fetchHtml } = require('./http');
const { extractEmails } = require('./text');
const { googleSearch } = require('../sources/googleSearch');
const { loadKnownBuilders } = require('./extractor');
const { TECH_DEPT_KEYWORDS, GENERIC_DEPT_FALLBACK_KEYWORDS, CONTACT_PATHS } = require('../config');

const cache = new Map();

function classifyEmail(email) {
  const local = email.split('@')[0].toLowerCase();
  for (const kw of TECH_DEPT_KEYWORDS) {
    if (local.includes(kw)) return { keyword: kw, tier: 'tecnico' };
  }
  for (const kw of GENERIC_DEPT_FALLBACK_KEYWORDS) {
    if (local.includes(kw)) return { keyword: kw, tier: 'generico' };
  }
  return { keyword: null, tier: 'outro' };
}

function pickBestEmail(candidates) {
  // candidates: [{ email, pageUrl }]
  const scored = candidates.map((c) => ({ ...c, ...classifyEmail(c.email) }));
  const tier1 = scored.find((c) => c.tier === 'tecnico');
  if (tier1) return tier1;
  const tier2 = scored.find((c) => c.tier === 'generico');
  if (tier2) return tier2;
  return scored[0] || null;
}

async function resolveWebsite(companyName) {
  const knownBuilders = loadKnownBuilders();
  const known = knownBuilders.find(
    (b) => b.name.toLowerCase() === companyName.toLowerCase()
  );
  if (known && known.website) return known.website;

  const results = await googleSearch(`${companyName} site oficial`, { num: 3 });
  const candidate = results.find((r) => /^https?:\/\//.test(r.link || ''));
  if (!candidate) return null;
  try {
    return new URL(candidate.link).origin;
  } catch {
    return null;
  }
}

/**
 * Tenta localizar um e-mail de contato técnico (suprimentos, compras,
 * engenharia, etc.) para uma construtora/incorporadora, a partir do site
 * institucional dela. Método best-effort: pode não encontrar nada, e nesse
 * caso retorna null em vez de lançar erro (não deve travar o pipeline).
 *
 * @param {string} companyName
 * @returns {Promise<{email: string, departamento: string, confianca: string, paginaEncontrada: string, siteBase: string} | null>}
 */
async function findTechEmail(companyName) {
  if (!companyName) return null;
  if (cache.has(companyName)) return cache.get(companyName);

  const result = await (async () => {
    const website = await resolveWebsite(companyName);
    if (!website) return null;

    const candidates = [];
    for (const path of ['/', ...CONTACT_PATHS]) {
      let pageUrl;
      try {
        pageUrl = new URL(path, website).toString();
      } catch {
        continue;
      }
      const html = await fetchHtml(pageUrl, { timeout: 10000 });
      if (!html) continue;
      const emails = extractEmails(html);
      for (const email of emails) {
        candidates.push({ email, pageUrl });
      }
      if (candidates.length >= 5) break; // já temos o suficiente para escolher
    }

    if (!candidates.length) return null;

    const best = pickBestEmail(candidates);
    if (!best) return null;

    return {
      email: best.email,
      departamento:
        best.tier === 'tecnico'
          ? `provável depto. técnico/suprimentos (contém "${best.keyword}")`
          : best.tier === 'generico'
            ? `contato geral (contém "${best.keyword}") — depto. técnico não confirmado`
            : 'contato encontrado no site — departamento não identificado',
      confianca: best.tier === 'tecnico' ? 'alta' : best.tier === 'generico' ? 'media' : 'baixa',
      paginaEncontrada: best.pageUrl,
      siteBase: website,
    };
  })();

  cache.set(companyName, result);
  return result;
}

module.exports = { findTechEmail, classifyEmail };
