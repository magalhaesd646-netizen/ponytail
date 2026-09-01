// Categorias fixas de potenciais clientes (as "abas" do app).
const LISTS = [
  {
    id: 'construtoras',
    label: 'Construtoras',
    description: 'Construtoras e incorporadoras — potenciais clientes de obra.',
  },
  {
    id: 'advocacia',
    label: 'Escritórios de Advocacia (Direito Imobiliário)',
    description: 'Escritórios de advocacia voltados para direito imobiliário.',
  },
  {
    id: 'sindicos',
    label: 'Síndicos e Administradoras de Condomínio',
    description: 'Síndicos profissionais e administradoras de condomínio.',
  },
];

const LIST_IDS = LISTS.map((l) => l.id);

function isValidListId(id) {
  return LIST_IDS.includes(id);
}

module.exports = { LISTS, LIST_IDS, isValidListId };
