'use strict';

// Formatação compartilhada do resumo de lançamentos novos, reaproveitada
// pelo canal de e-mail (notifier.js) e pelo canal de GitHub Issues
// (githubIssue.js) — o mesmo conteúdo, em formatos diferentes.

function subjectFor(newItems) {
  return `${newItems.length} novo(s) lançamento(s) imobiliário(s) no Vale do Paraíba`;
}

function formatItemText(item) {
  const linhas = [
    `• ${item.empreendimento || '(nome não identificado)'}`,
    `  Cidade: ${item.cidade || '-'}`,
    `  Construtora: ${item.construtora || 'não identificada automaticamente'}`,
    `  Incorporadora: ${item.incorporadora || 'não identificada automaticamente'}`,
  ];
  if (item.emailContato) {
    linhas.push(`  E-mail (${item.emailContato.departamento}): ${item.emailContato.email}`);
  } else {
    linhas.push('  E-mail: não encontrado automaticamente');
  }
  linhas.push(`  Fonte: ${item.sourceLabel || item.sourceType} — ${item.url}`);
  return linhas.join('\n');
}

function formatItemHtml(item) {
  const emailLine = item.emailContato
    ? `<b>E-mail (${item.emailContato.departamento}):</b> <a href="mailto:${item.emailContato.email}">${item.emailContato.email}</a>`
    : '<b>E-mail:</b> não encontrado automaticamente';
  return `
    <li style="margin-bottom:16px;">
      <div style="font-weight:600;font-size:15px;">${item.empreendimento || '(nome não identificado)'}</div>
      <div>Cidade: ${item.cidade || '-'}</div>
      <div>Construtora: ${item.construtora || 'não identificada automaticamente'}</div>
      <div>Incorporadora: ${item.incorporadora || 'não identificada automaticamente'}</div>
      <div>${emailLine}</div>
      <div>Fonte: <a href="${item.url}">${item.sourceLabel || item.sourceType}</a></div>
    </li>`;
}

function formatItemMarkdown(item) {
  const linhas = [
    `### ${item.empreendimento || '(nome não identificado)'}`,
    `- **Cidade:** ${item.cidade || '-'}`,
    `- **Construtora:** ${item.construtora || 'não identificada automaticamente'}`,
    `- **Incorporadora:** ${item.incorporadora || 'não identificada automaticamente'}`,
  ];
  if (item.emailContato) {
    linhas.push(
      `- **E-mail (${item.emailContato.departamento}):** ${item.emailContato.email}`
    );
  } else {
    linhas.push('- **E-mail:** não encontrado automaticamente');
  }
  linhas.push(`- **Fonte:** [${item.sourceLabel || item.sourceType}](${item.url})`);
  return linhas.join('\n');
}

function buildDigest(newItems) {
  const subject = subjectFor(newItems);
  const text = [
    `Foram encontrados ${newItems.length} lançamento(s) novo(s):`,
    '',
    ...newItems.map(formatItemText),
  ].join('\n\n');
  const html = `
    <p>Foram encontrados <b>${newItems.length}</b> lançamento(s) novo(s):</p>
    <ul style="padding-left:18px;">${newItems.map(formatItemHtml).join('')}</ul>
  `;
  const markdown = [
    `Foram encontrados **${newItems.length}** lançamento(s) novo(s):`,
    '',
    ...newItems.map(formatItemMarkdown),
  ].join('\n\n');
  return { subject, text, html, markdown };
}

module.exports = { buildDigest, subjectFor };
