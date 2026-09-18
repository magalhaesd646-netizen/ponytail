'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  slugify,
  hashId,
  extractEmails,
  textMentionsCity,
  textMentionsRealEstateLaunch,
  textMentionsOtherBrazilianState,
  findLaunchSentence,
} = require('../src/lib/text');

test('slugify remove acentos e espaços', () => {
  assert.equal(slugify('São José dos Campos'), 'sao-jose-dos-campos');
  assert.equal(slugify('Taubaté'), 'taubate');
});

test('hashId é determinístico e sensível à ordem das partes', () => {
  assert.equal(hashId('a', 'b', 'c'), hashId('a', 'b', 'c'));
  assert.notEqual(hashId('a', 'b'), hashId('b', 'a'));
});

test('extractEmails encontra e-mails únicos e ignora falsos positivos de imagem (ex.: icon@2x.png)', () => {
  const html = `
    contato: suprimentos@construtora.com.br, também compras@construtora.com.br
    duplicado suprimentos@construtora.com.br
    background: url(icon@2x.png);
  `;
  const emails = extractEmails(html);
  assert.deepEqual(emails.sort(), ['compras@construtora.com.br', 'suprimentos@construtora.com.br'].sort());
});

test('textMentionsCity é tolerante a acento/maiúscula e detecta a cidade certa', () => {
  assert.equal(textMentionsCity('Lançamento em São José dos Campos, SP', 'São José dos Campos'), true);
  assert.equal(textMentionsCity('LANÇAMENTO EM SAO JOSE DOS CAMPOS', 'São José dos Campos'), true);
  assert.equal(textMentionsCity('novo empreendimento em taubate - sp', 'Taubaté'), true);
});

test('textMentionsCity retorna false quando a cidade não aparece no texto', () => {
  assert.equal(textMentionsCity('Lançamento em Curitiba, PR', 'Cruzeiro'), false);
  assert.equal(textMentionsCity('', 'Taubaté'), false);
  assert.equal(textMentionsCity('Lançamento em Taubaté', ''), false);
});

test('textMentionsRealEstateLaunch aceita texto com sinal de lançamento + vocabulário imobiliário', () => {
  assert.equal(textMentionsRealEstateLaunch('Construtora lança novo empreendimento com apartamentos de 2 dormitórios'), true);
  assert.equal(textMentionsRealEstateLaunch('Estande de vendas do Residencial Jardins já está aberto'), true);
  assert.equal(textMentionsRealEstateLaunch('Apartamentos na planta a partir de 45m² em condomínio fechado'), true);
});

test('textMentionsRealEstateLaunch rejeita vocabulário imobiliário genérico sem sinal de lançamento (revenda, institucional)', () => {
  assert.equal(textMentionsRealEstateLaunch('Construtora e Incorporadora em Taubaté'), false);
  assert.equal(textMentionsRealEstateLaunch('Apartamento com 3 dormitórios em condomínio residencial'), false);
});

test('textMentionsRealEstateLaunch rejeita conteúdo sem relação com imóveis (vaga, evento, clima)', () => {
  assert.equal(textMentionsRealEstateLaunch('5ª Etapa Campeonato Vale Paraibano 2026'), false);
  assert.equal(textMentionsRealEstateLaunch('Previsão do tempo em São Bento do Sapucaí'), false);
  assert.equal(textMentionsRealEstateLaunch('Gerente de vendas - vaga de emprego'), false);
  assert.equal(textMentionsRealEstateLaunch(''), false);
});

test('textMentionsRealEstateLaunch rejeita aluguel/locação mesmo citando apartamento', () => {
  assert.equal(textMentionsRealEstateLaunch('Apartamento 3 dormitórios para alugar em Jacareí'), false);
  assert.equal(textMentionsRealEstateLaunch('Imóvel disponível para locação'), false);
});

test('textMentionsRealEstateLaunch rejeita vaga de emprego mesmo citando incorporação', () => {
  assert.equal(textMentionsRealEstateLaunch('Gerente de Incorporação e Novos Negócios'), false);
  assert.equal(textMentionsRealEstateLaunch('Analista de Construtora - vaga em Pindamonhangaba'), false);
});

test('textMentionsOtherBrazilianState detecta sigla de outro estado isolada (caso real: Cruzeiro trazendo Sarandi-PR)', () => {
  assert.equal(
    textMentionsOtherBrazilianState('LANÇAMENTO! Jardim José Vignoto Sarandi-PR um empreendimento totalmente planejado'),
    true
  );
  assert.equal(textMentionsOtherBrazilianState('Novo lançamento em Cachoeira Paulista, SP'), false);
});

test('textMentionsOtherBrazilianState não confunde código de referência de anúncio com sigla de estado (caso real)', () => {
  assert.equal(
    textMentionsOtherBrazilianState('R$ 187.000,00 · Cond. Residencial Paraiso - Caçapava/SP. Ref.AP5059.'),
    false
  );
  assert.equal(
    textMentionsOtherBrazilianState('Apartamento de 56 m² na Estados Unidos - Jardim Caçapava - Caçapava - SP AP1548-MA19'),
    false
  );
});

test('findLaunchSentence acha a frase de lançamento dentro de um snippet bagunçado de feed social (caso real)', () => {
  const snippet =
    'Title: Instagram\nNever miss a post from noticias.sjcampos. Photo by Notícias São José dos Campos on July 21, 2026. ' +
    'May be an image of text. Lançamento do edifício Riza estabelece novo patamar para o mercado imobiliário da região. ' +
    'O mercado imobiliário de São José dos Campos registrou um novo marco com o lançamento do Riza, primeiro edifício ' +
    'residencial do bairro planejado Parque Una.';
  const sentence = findLaunchSentence(snippet);
  assert.ok(sentence && /riza/i.test(sentence), `esperava frase sobre o Riza, veio: ${sentence}`);
});

test('findLaunchSentence retorna null quando não há frase sobre lançamento no snippet', () => {
  assert.equal(findLaunchSentence('Video by Fulano on March 3, 2026. May be an image of text.'), null);
  assert.equal(findLaunchSentence(''), null);
});
