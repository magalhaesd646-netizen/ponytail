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

function countByNormalized(rows, getRaw) {
  const groups = new Map(); // key -> Map(rawLabel -> count)
  for (const row of rows) {
    const raw = String(getRaw(row) ?? '').trim() || '(sem empreendimento)';
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

  return { totalChamados: total, porEmpreendimento, porFamilia };
}

module.exports = { summarizePosObra };
