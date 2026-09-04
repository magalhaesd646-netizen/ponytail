'use strict';

const { classifyFamilia } = require('./classify');

// A mesma coluna "Empreendimento" vem escrita de formas diferentes na
// planilha (ex.: "DUMONT" e "Dumont", "BABILÔNIA" e "Babilonia") — agrupa
// ignorando maiúsculas/acentos, mas mostra a variante mais comum de cada
// grupo como rótulo (não normaliza erros de digitação como "Vilage Iris" em
// vez de "Village Iris", que continuam contados à parte).
function normalizeKey(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function countByNormalized(rows, getRaw, emptyLabel = '(sem empreendimento)') {
  const groups = new Map(); // key -> Map(rawLabel -> count)
  for (const row of rows) {
    const raw = String(getRaw(row) ?? '').trim() || emptyLabel;
    const key = normalizeKey(raw);
    if (!groups.has(key)) groups.set(key, new Map());
    const variants = groups.get(key);
    variants.set(raw, (variants.get(raw) || 0) + 1);
  }

  return [...groups.values()]
    .map((variants) => {
      const total = [...variants.values()].reduce((sum, n) => sum + n, 0);
      const label = [...variants.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return [label, total];
    })
    .sort((a, b) => b[1] - a[1]);
}

function countBy(rows, getKey) {
  const counts = new Map();
  for (const row of rows) {
    const key = getKey(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// A coluna "Data" vem no formato dd/mm/aaaa (data de abertura do chamado).
function parseDataBR(value) {
  const match = String(value ?? '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  return { year: Number(match[3]), month: Number(match[2]) - 1 };
}

// Chamados por mês de abertura, em ordem cronológica (não por volume) — é
// uma série temporal, faz sentido lida da esquerda pra direita.
function porMesDe(rows) {
  const counts = new Map();
  for (const row of rows) {
    const parsed = parseDataBR(row.Data);
    if (!parsed) continue;
    const key = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, total]) => {
      const [year, month] = key.split('-').map(Number);
      return { mes: `${MESES[month]}/${String(year).slice(2)}`, total };
    });
}

// Resumo do arquivo de chamados de pós-obra: quantidade por empreendimento e
// a distribuição por família (hidráulica, elétrica, etc.) do total de
// chamados. Pensado especificamente pro formato desse arquivo (colunas
// "Empreendimento" + descrições em texto livre) — não é genérico pras
// outras abas.
function summarizePosObra(rows) {
  const porEmpreendimento = countByNormalized(rows, (row) => row.Empreendimento).map(([empreendimento, total]) => ({
    empreendimento,
    total,
  }));

  const porFamiliaCounts = countBy(rows, classifyFamilia);
  const total = rows.length;
  const porFamilia = porFamiliaCounts.map(([familia, count]) => ({
    familia,
    total: count,
    percentual: total ? Math.round((count / total) * 1000) / 10 : 0,
  }));

  return { totalChamados: total, porEmpreendimento, porFamilia, porMes: porMesDe(rows) };
}

// Resumo do arquivo de vistorias: cada linha já é uma não conformidade (o
// link só traz os itens "Não conforme"), então o resumo é simplesmente a
// contagem por obra e por tipo de vistoria ("Modelo").
function summarizeVistorias(rows) {
  const porObra = countByNormalized(rows, (row) => row.Obra, '(sem obra)').map(([obra, total]) => ({
    obra,
    total,
  }));

  const porModeloCounts = countBy(rows, (row) => String(row.Modelo ?? '').trim() || '(sem modelo)');
  const total = rows.length;
  const porModelo = porModeloCounts.map(([modelo, count]) => ({
    modelo,
    total: count,
    percentual: total ? Math.round((count / total) * 1000) / 10 : 0,
  }));

  return { totalNC: total, porObra, porModelo, porMes: porMesDe(rows) };
}

module.exports = { summarizePosObra, summarizeVistorias };
