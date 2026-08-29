'use strict';

const fs = require('fs');
const path = require('path');
const { hashId } = require('./text');

const KNOWN_BUILDERS_PATH = path.join(__dirname, '..', '..', 'data', 'known-builders.json');

function loadKnownBuilders() {
  try {
    const raw = fs.readFileSync(KNOWN_BUILDERS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[extractor] não foi possível ler known-builders.json: ${err.message}`);
    return [];
  }
}

// Corta sufixos comerciais comuns em títulos de anúncio/portal, tentando
// isolar o nome do empreendimento (ex.: "Residencial Alfa - a partir de
// R$ 300 mil | Viva Real" -> "Residencial Alfa").
function cleanEmpreendimentoName(rawTitle) {
  if (!rawTitle) return null;
  const firstSegment = rawTitle.split(/\s+[-|–]\s+/)[0].trim();
  return firstSegment || rawTitle.trim();
}

function findKnownBuilder(text, knownBuilders) {
  const lower = (text || '').toLowerCase();
  for (const builder of knownBuilders) {
    for (const alias of builder.aliases || []) {
      if (lower.includes(alias.toLowerCase())) {
        return builder;
      }
    }
  }
  return null;
}

/**
 * Normaliza um resultado bruto (do Google Custom Search ou de um portal) em
 * um registro padronizado de "lançamento".
 *
 * @param {object} raw
 * @param {string} raw.title|name nome bruto do anúncio/página
 * @param {string} raw.link|url URL da fonte
 * @param {string} [raw.snippet] trecho de texto associado
 * @param {string} raw.city cidade pesquisada
 * @param {string} raw.sourceType 'portal' | 'google-web' | 'google-social'
 * @param {string} [raw.sourceLabel] rótulo legível da fonte
 * @param {Array} [knownBuilders] injeção para testes; default lê o arquivo
 */
function normalizeResult(raw, knownBuilders = loadKnownBuilders()) {
  const title = raw.title || raw.name || '';
  const url = raw.link || raw.url || '';
  const snippet = raw.snippet || '';
  const empreendimento = cleanEmpreendimentoName(title);

  const combinedText = `${title} ${snippet}`;
  const builder = findKnownBuilder(combinedText, knownBuilders);

  return {
    id: hashId(raw.city || '', raw.sourceType || '', url || empreendimento || ''),
    empreendimento,
    cidade: raw.city || null,
    construtora: builder ? builder.name : null,
    incorporadora: builder && builder.isAlsoIncorporadora ? builder.name : null,
    construtoraIdentificada: Boolean(builder),
    sourceType: raw.sourceType || null,
    sourceLabel: raw.sourceLabel || null,
    url,
    snippet,
    foundAt: new Date().toISOString(),
  };
}

module.exports = { normalizeResult, loadKnownBuilders, cleanEmpreendimentoName, findKnownBuilder };
