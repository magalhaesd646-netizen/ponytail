'use strict';

// Uma aba por linha aqui. Cada uma vira uma aba no painel (web/index.html) e
// um arquivo de dados (web/data/<id>.json), lido a partir da planilha
// apontada por `envVar` (ver .env.example).
const TABS = [
  {
    id: 'pos-obra',
    label: 'Pós-Obra',
    envVar: 'POS_OBRA_SHEET_URL',
    sheetNameEnvVar: 'POS_OBRA_SHEET_NAME',
  },
  {
    id: 'vistorias',
    label: 'Vistorias de Qualidade e Pós-Obra',
    envVar: 'VISTORIAS_SHEET_URL',
    sheetNameEnvVar: 'VISTORIAS_SHEET_NAME',
  },
  {
    id: 'agenda',
    label: 'Agenda Pós-Obra',
    envVar: 'AGENDA_SHEET_URL',
    sheetNameEnvVar: 'AGENDA_SHEET_NAME',
  },
];

module.exports = { TABS };
