'use strict';

// Formatação compartilhada do resumo de lançamentos novos, reaproveitada
// pelo canal de e-mail (notifier.js) e pelo canal de GitHub Issues
// (githubIssue.js) — o mesmo conteúdo, em formatos diferentes.

// Limite de itens detalhados no digest. Protege contra um alerta enorme
// (ex.: e-mail gigante, corpo de Issue passando do limite do GitHub) numa
// execução que ache muitos lançamentos novos de uma vez — o painel web
// sempre tem a lista completa.
const MAX_DIGEST_ITEMS = 50;

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
  const shown = newItems.slice(0, MAX_DIGEST_ITEMS);
  const omitted = newItems.length - shown.length;
  const omittedNote = omitted > 0
    ? `\n\n... e mais ${omitted} lançamento(s) novo(s). Veja a lista completa no painel web.`
    : '';
  const omittedNoteHtml = omitted > 0
    ? `<p>... e mais <b>${omitted}</b> lançamento(s) novo(s). Veja a lista completa no painel web.</p>`
    : '';

  const text = [
    `Foram encontrados ${newItems.length} lançamento(s) novo(s):`,
    '',
    ...shown.map(formatItemText),
  ].join('\n\n') + omittedNote;
  const html = `
    <p>Foram encontrados <b>${newItems.length}</b> lançamento(s) novo(s):</p>
    <ul style="padding-left:18px;">${shown.map(formatItemHtml).join('')}</ul>
    ${omittedNoteHtml}
  `;
  const markdown = [
    `Foram encontrados **${newItems.length}** lançamento(s) novo(s):`,
    '',
    ...shown.map(formatItemMarkdown),
  ].join('\n\n') + omittedNote;
  return { subject, text, html, markdown };
}

module.exports = { buildDigest, subjectFor };
