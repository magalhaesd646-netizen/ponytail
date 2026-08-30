'use strict';

const crypto = require('crypto');

// Minúsculas, sem acentos, espaços colapsados — base para comparações
// tolerantes a acento/maiúscula (slugify, matching de cidade, etc.).
function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (marcas combinantes pós-NFD)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Verifica se o texto (título + trecho de um resultado de busca) realmente
// menciona a cidade buscada — usado para descartar resultados que a busca
// trouxe por engano (ex.: uma cidade homônima em outro estado, ou uma
// página genérica que só cita o nome de leve).
function textMentionsCity(text, city) {
  if (!text || !city) return false;
  const normalizedText = normalizeText(text);
  const normalizedCity = normalizeText(city);
  return normalizedText.includes(normalizedCity);
}

function hashId(...parts) {
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex');
}

function extractEmails(text) {
  if (!text) return [];
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const seen = new Set();
  const out = [];
  for (const raw of matches) {
    const email = raw.toLowerCase().replace(/\.$/, '');
    if (seen.has(email)) continue;
    // Filtra extensões de imagem coladas ao domínio (comum em favicons/sprites)
    if (/\.(png|jpe?g|gif|svg|webp)$/i.test(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

module.exports = { normalizeText, slugify, hashId, extractEmails, textMentionsCity };
