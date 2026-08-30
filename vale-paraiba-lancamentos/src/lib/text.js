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

// Vocabulário que indica que o texto é mesmo sobre imóveis/lançamento —
// sem isso, uma busca por "lançamento" + nome da cidade traz muita coisa
// que não tem nada a ver (vaga de emprego, evento esportivo, previsão do
// tempo, obituário...), porque a API de busca não garante que a frase
// completa da query apareça no resultado.
const REAL_ESTATE_KEYWORDS = [
  'apartamento',
  'imovel',
  'imoveis',
  'empreendimento',
  'condominio',
  'incorpora', // cobre incorporação/incorporadora/incorporador
  'construtora',
  'residencial',
  'dormitorio',
  'lote',
  'banheiro',
  'suite',
  'unidades',
  'metro quadrado',
  'metros quadrados',
  'na planta',
  'lancamento imobiliario',
];

// Passa no filtro acima mas claramente não é um lançamento à venda —
// aluguel/locação e vagas de emprego no setor imobiliário, por exemplo.
const NON_LAUNCH_EXCLUDE_KEYWORDS = [
  'aluguel',
  'para alugar',
  'locacao',
  'vaga de emprego',
  'curriculo',
];

function textMentionsRealEstateLaunch(text) {
  if (!text) return false;
  const normalized = normalizeText(text);
  if (NON_LAUNCH_EXCLUDE_KEYWORDS.some((kw) => normalized.includes(kw))) return false;
  return REAL_ESTATE_KEYWORDS.some((kw) => normalized.includes(kw));
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

module.exports = {
  normalizeText,
  slugify,
  hashId,
  extractEmails,
  textMentionsCity,
  textMentionsRealEstateLaunch,
};
