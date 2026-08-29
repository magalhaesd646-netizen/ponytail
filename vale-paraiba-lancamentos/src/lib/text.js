'use strict';

const crypto = require('crypto');

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (marcas combinantes pós-NFD)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
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

module.exports = { slugify, hashId, extractEmails };
