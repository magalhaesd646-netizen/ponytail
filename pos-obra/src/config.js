'use strict';

const { summarizePosObra } = require('./lib/summarize');

// Uma aba por linha aqui. Cada uma vira uma aba no painel (web/index.html) e
// um arquivo de dados (web/data/<id>.json), lido a partir da planilha
// apontada por `envVar` (ver .env.example). `summarize`, quando presente,
// substitui a tabela crua por um resumo agregado (ver src/lib/summarize.js)
// — o arquivo de chamados de pós-obra tem colunas demais/texto livre demais
// pra fazer sentido como tabela direta.
const TABS = [
  {
    id: 'pos-obra',
    label: 'Pós-Obra',
    envVar: 'POS_OBRA_SHEET_URL',
    sheetNameEnvVar: 'POS_OBRA_SHEET_NAME',
    summarize: summarizePosObra,
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
