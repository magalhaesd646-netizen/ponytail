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

// Vocabulário genérico de imóveis — sozinho não basta, porque também
// aparece em anúncio de revenda, aluguel ou só numa página institucional
// da construtora (ex.: "Construtora e Incorporadora em Taubaté").
const REAL_ESTATE_KEYWORDS = [
  'apartamento',
  'casa',
  'imovel',
  'imoveis',
  'imobiliari', // cobre imobiliário/imobiliária/imobiliarios (ex.: "lançamento imobiliário")
  'empreendimento',
  'edificio',
  'condominio',
  'incorpora', // cobre incorporação/incorporadora/incorporador
  'construtora',
  'residencial',
  'dormitorio',
  'lote',
  'unidades',
  'metro quadrado',
  'metros quadrados',
];

// Sinal específico de LANÇAMENTO (não só "é sobre imóvel") — sem exigir
// isso além do vocabulário genérico acima, a busca aceitava qualquer
// página com "apartamento"/"suíte"/"banheiro" no texto, incluindo revenda
// e aluguel de imóveis prontos que não têm nada de novo lançamento.
const LAUNCH_SIGNAL_KEYWORDS = [
  'lanca', // cobre lança/lançar/lançando/lançamento/lançará (após normalizeText)
  'lancamento',
  'pre-venda',
  'pre venda',
  'novo empreendimento',
  'na planta',
  'em breve',
  'estande de vendas',
  'plantao de vendas',
  'unidades a partir de',
  'reserve sua unidade',
  'reserva sua unidade',
  'inicio das vendas',
  'início das vendas',
  'primeira fase de vendas',
];

// Passa nos dois filtros acima mas claramente não é um lançamento à venda —
// aluguel/locação e vagas de emprego no setor imobiliário, por exemplo.
// "gerente de" pega títulos de vaga tipo "Gerente de Incorporação e Novos
// Negócios" (visto se repetindo em sites de emprego para várias cidades).
const NON_LAUNCH_EXCLUDE_KEYWORDS = [
  'aluguel',
  'para alugar',
  'locacao',
  'vaga de emprego',
  'curriculo',
  'gerente de',
  'analista de',
  'coordenador de',
  'oportunidade de emprego',
];

// Exige vocabulário de imóveis E um sinal específico de lançamento — as
// duas coisas juntas, não uma ou outra — para reduzir falso positivo de
// texto que só é "sobre imóveis" sem ser sobre um lançamento novo.
function textMentionsRealEstateLaunch(text) {
  if (!text) return false;
  const normalized = normalizeText(text);
  if (NON_LAUNCH_EXCLUDE_KEYWORDS.some((kw) => normalized.includes(kw))) return false;
  const mentionsRealEstate = REAL_ESTATE_KEYWORDS.some((kw) => normalized.includes(kw));
  const mentionsLaunch = LAUNCH_SIGNAL_KEYWORDS.some((kw) => normalized.includes(kw));
  return mentionsRealEstate && mentionsLaunch;
}

// Siglas de UF diferentes de SP — usadas para pegar resultados que vieram
// por engano de outro estado (ex.: busca por "Cruzeiro, SP" trazendo um
// anúncio de "Sarandi-PR" só porque o texto cita "Cruzeiro" de outro jeito,
// como nome de rua/bairro). A API de busca não garante o estado certo.
// Ficam de fora as siglas que colidem com palavra comum do português
// coloquial (texto de rede social é cheio disso): "ce"/"cê" (você), "se"
// (se/if), "to" (tô, "estou"), "mt" (mt = muito, gíria de chat) — incluir
// essas geraria falso positivo descartando lançamentos legítimos de SP.
const OTHER_BRAZIL_UF_CODES = [
  'ac', 'al', 'ap', 'am', 'ba', 'df', 'es', 'go', 'ma', 'ms',
  'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc',
];

// A sigla só conta se estiver isolada como "palavra", cercada por espaço,
// vírgula, hífen, barra ou início/fim de texto — uma lista positiva desses
// separadores, não "qualquer coisa que não seja letra". Isso importa porque
// anúncio de imóvel é cheio de código de referência tipo "Ref. AP7152" ou
// "AP1548-MA19", onde "AP"/"MA" colado a dígito não tem nada a ver com
// Amapá/Maranhão — se o separador aceitasse dígito/pontuação, esses códigos
// de referência virariam falso positivo de "outro estado".
function textMentionsOtherBrazilianState(text) {
  if (!text) return false;
  const normalized = normalizeText(text);
  return OTHER_BRAZIL_UF_CODES.some((uf) => {
    const re = new RegExp(`(^|[\\s,/-])${uf}($|[\\s,/-])`);
    return re.test(normalized);
  });
}

// Ruído comum em texto raspado de feed do Instagram/Facebook (a página
// indexada é o perfil inteiro, não um post só) — remover antes de tentar
// achar uma frase útil, senão "Video by Fulano on March 3, 2026." vira o
// "nome do lançamento".
const SOCIAL_BOILERPLATE_PATTERNS = [
  /title:\s*instagram/gi,
  /never miss a post from [^.]+\./gi,
  /(?:video|photo) by [^.]+ on \w+ \d{1,2},? \d{4}\.?/gi,
  /may be an? (?:image|meme) of[^.]*\./gi,
  /log in to like or comment\.?/gi,
  /see more posts/gi,
  /\d+ likes?\b/gi,
  /\breply\b/gi,
];

function stripSocialBoilerplate(text) {
  let cleaned = text;
  for (const re of SOCIAL_BOILERPLATE_PATTERNS) cleaned = cleaned.replace(re, ' ');
  return cleaned.replace(/\s+/g, ' ').trim();
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Usado quando o título da página é genérico demais ("Instagram", "Facebook"
// — a rede social não expôs um título de verdade) para servir de nome do
// empreendimento: procura, dentro do texto (geralmente um snippet bagunçado
// de feed social), a primeira frase que realmente fala de um lançamento —
// em vez de aceitar a primeira frase qualquer (que costuma ser boilerplate
// tipo "Never miss a post from...").
function findLaunchSentence(text) {
  if (!text) return null;
  const cleaned = stripSocialBoilerplate(text);
  for (const sentence of splitSentences(cleaned)) {
    if (sentence.length < 8 || sentence.length > 160) continue;
    const normalized = normalizeText(sentence);
    const hasRealEstate = REAL_ESTATE_KEYWORDS.some((kw) => normalized.includes(kw));
    const hasLaunch = LAUNCH_SIGNAL_KEYWORDS.some((kw) => normalized.includes(kw));
    if (hasRealEstate && hasLaunch) return sentence;
  }
  return null;
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
  textMentionsOtherBrazilianState,
  findLaunchSentence,
};
