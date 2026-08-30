'use strict';

const fs = require('fs');
const path = require('path');

// Municípios da mesorregião do Vale do Paraíba Paulista (IBGE), com os três
// citados pelo usuário sempre em primeiro lugar. Pode ser sobrescrito via
// variável de ambiente VALE_CITIES (lista separada por vírgula).
const DEFAULT_CITIES = [
  'São José dos Campos',
  'Jacareí',
  'Taubaté',
  'Aparecida',
  'Arapeí',
  'Areias',
  'Bananal',
  'Caçapava',
  'Cachoeira Paulista',
  'Campos do Jordão',
  'Canas',
  'Cruzeiro',
  'Cunha',
  'Guaratinguetá',
  'Igaratá',
  'Jambeiro',
  'Lagoinha',
  'Lorena',
  'Monteiro Lobato',
  'Natividade da Serra',
  'Paraibuna',
  'Pindamonhangaba',
  'Piquete',
  'Potim',
  'Queluz',
  'Redenção da Serra',
  'Roseira',
  'Santa Branca',
  'Santo Antônio do Pinhal',
  'São Bento do Sapucaí',
  'São José do Barreiro',
  'São Luiz do Paraitinga',
  'Silveiras',
  'Tremembé',
];

function citiesFromEnv() {
  const raw = process.env.VALE_CITIES;
  if (!raw) return DEFAULT_CITIES;
  const list = raw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_CITIES;
}

// Consultas usadas nas buscas via API de busca (Tavily ou Google Custom
// Search — ver src/sources/webSearch.js). "{cidade}" é substituído pelo nome
// da cidade. Mantemos só 2 queries por cidade (web + fontes oficiais) para
// caber nas cotas gratuitas típicas dessas APIs mesmo cobrindo todos os
// municípios do Vale do Paraíba — ver src/run.js.
//
// O sufixo ", SP" é importante: vários municípios do Vale do Paraíba têm
// nomes comuns a outros estados (ex.: "Cruzeiro", "Lagoinha"), e sem o
// qualificador de estado a busca pode trazer lançamentos de cidades
// homônimas em outros lugares do Brasil (já aconteceu com resultados do
// Paraná, por exemplo).
const WEB_QUERY_TEMPLATE =
  '("lançamento imobiliário" OR "novo empreendimento imobiliário" OR "pré-lançamento" OR "apartamentos na planta") "{cidade}, SP"';

// Segunda busca: dá preferência aos sites oficiais das construtoras e
// incorporadoras conhecidas (data/known-builders.json) — é lá que elas
// mesmas anunciam os lançamentos, com informação mais confiável do que
// agregadores genéricos — e também cobre posts públicos de Instagram/
// Facebook (sem login nem scraping direto dessas redes, ver README).
const OFFICIAL_SOURCES_QUERY_TEMPLATE =
  '("lançamento imobiliário" OR "novo empreendimento" OR "breve lançamento" OR "apartamentos na planta") "{cidade}, SP"';

const SOCIAL_SITE_DOMAINS = ['instagram.com', 'facebook.com'];

function loadBuilderSiteDomains() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'known-builders.json'), 'utf8');
    const builders = JSON.parse(raw);
    return builders
      .map((b) => {
        try {
          return new URL(b.website).hostname.replace(/^www\./, '');
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Domínios preferidos na segunda busca: sites das construtoras/
// incorporadoras conhecidas + redes sociais, nessa ordem de prioridade
// (a API não garante ordenação por domínio, mas restringir a esse conjunto
// já favorece fontes primárias sobre agregadores/blogs genéricos).
const OFFICIAL_SOURCE_DOMAINS = [...loadBuilderSiteDomains(), ...SOCIAL_SITE_DOMAINS];

// Restringe as buscas a conteúdo indexado no último ano — evita trazer
// lançamentos antigos (ex.: de 2025) que já podem nem estar mais à venda.
// Ver src/sources/webSearch.js para como cada provedor interpreta isso.
const SEARCH_RECENCY = 'year';

// Portais públicos de imóveis com página de "lançamentos" por cidade.
// A extração é feita de forma resiliente (ver src/sources/portalScraper.js),
// sem depender de classes CSS específicas que mudam com frequência.
const PORTALS = [
  {
    id: 'vivareal',
    label: 'Viva Real',
    buildUrl: (citySlug) =>
      `https://www.vivareal.com.br/imoveis-lancamento/${citySlug}/`,
    listingPathHint: '/imoveis-lancamento/',
  },
  {
    id: 'zap',
    label: 'ZAP Imóveis',
    buildUrl: (citySlug) =>
      `https://www.zapimoveis.com.br/lancamentos/imoveis/sp+${citySlug}/`,
    listingPathHint: '/imovel/',
  },
];

// Palavras-chave usadas para classificar e-mails encontrados nos sites das
// construtoras/incorporadoras. Ordem = prioridade (primeira que bater vence).
const TECH_DEPT_KEYWORDS = [
  'suprimentos',
  'compras',
  'engenharia',
  'obras',
  'tecnico',
  'técnico',
  'projetos',
  'incorporacao',
  'incorporação',
];

const GENERIC_DEPT_FALLBACK_KEYWORDS = ['comercial', 'contato', 'institucional', 'atendimento'];

const CONTACT_PATHS = [
  '/contato',
  '/contact',
  '/fale-conosco',
  '/trabalhe-conosco',
  '/institucional/contato',
  '/institucional',
  '/quem-somos',
];

module.exports = {
  CITIES: citiesFromEnv(),
  WEB_QUERY_TEMPLATE,
  OFFICIAL_SOURCES_QUERY_TEMPLATE,
  OFFICIAL_SOURCE_DOMAINS,
  SEARCH_RECENCY,
  PORTALS,
  TECH_DEPT_KEYWORDS,
  GENERIC_DEPT_FALLBACK_KEYWORDS,
  CONTACT_PATHS,
};
