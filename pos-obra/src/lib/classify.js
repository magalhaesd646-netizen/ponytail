'use strict';

// ponytail: classificação por palavra-chave em texto livre, não um
// classificador de verdade — precisão limitada (falsos positivos/negativos
// esperados, ex.: "porta" aparecendo numa frase sobre outro assunto). Serve
// para dar uma ideia geral da distribuição por família; se a precisão
// importar mais adiante, o caminho é uma coluna de classificação manual na
// própria planilha (mais confiável que qualquer heurística de texto).
const CATEGORIES = [
  ['Hidráulica', /vazamento|infiltra|sif[aã]o|vaso sanit|torneira|registro d|tubula|esgoto|caixa d.?[aá]gua|hidr[aá]ulic|\bralo\b|goteira|encanamento/i],
  ['Elétrica', /el[ée]tric|disjuntor|\btomada\b|interruptor|l[aâ]mpada|plafon|lumin[aá]ria|fia[cç][aã]o|curto.?circuito|quadro de energia|interfone|campainha/i],
  ['Esquadrias (portas/janelas)', /janela|esquadria|batente|fechadura|ma[çc]aneta|guarni[çc][aã]o|\bporta\b/i],
  ['Acabamento/Estrutural', /trinca|rachadura|\bpiso\b|azulejo|revestimento|\bgesso\b|drywall|pintura|textura|\bforro\b|impermeabiliza/i],
  ['Marcenaria', /arm[aá]rio|bancada|\bgaveta\b/i],
];

const TEXT_FIELDS = ['Descrição', 'Descrição de Atendimento', 'Descrição do chamado', 'Parecer Técnico'];

function classifyFamilia(row) {
  const text = TEXT_FIELDS.map((field) => row[field] ?? '').join(' ');
  for (const [name, pattern] of CATEGORIES) {
    if (pattern.test(text)) return name;
  }
  return 'Outros';
}

module.exports = { classifyFamilia, CATEGORIES, TEXT_FIELDS };
