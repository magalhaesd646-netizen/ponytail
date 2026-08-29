'use strict';

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

// Consultas usadas nas buscas via Google Custom Search. "{cidade}" é
// substituído pelo nome da cidade. Mantemos só 2 queries por cidade
// (web + redes sociais) para caber na cota gratuita da API (100/dia) mesmo
// cobrindo todos os municípios do Vale do Paraíba — ver src/run.js.
const WEB_QUERY_TEMPLATE =
  '("lançamento imobiliário" OR "novo empreendimento imobiliário" OR "pré-lançamento" OR "apartamentos na planta") {cidade}';

// Não fazemos login nem scraping direto do Instagram/Facebook (ver README) —
// usamos o operador site: para restringir a busca do Google a posts públicos
// indexados nessas redes.
const SOCIAL_QUERY_TEMPLATE =
  '(site:instagram.com OR site:facebook.com) ("lançamento imobiliário" OR "novo empreendimento" OR "pré-lançamento") {cidade}';

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
  SOCIAL_QUERY_TEMPLATE,
  PORTALS,
  TECH_DEPT_KEYWORDS,
  GENERIC_DEPT_FALLBACK_KEYWORDS,
  CONTACT_PATHS,
};
