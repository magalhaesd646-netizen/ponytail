'use strict';

// Baixa o conteúdo de um arquivo do OneDrive/SharePoint a partir de um link
// de compartilhamento ("Qualquer pessoa com o link pode visualizar"), sem
// precisar de login nem app registrado. Duas estratégias, pois a Microsoft
// vem migrando contas OneDrive for Business/SharePoint para uma
// infraestrutura onde só a primeira funciona:
//
// 1. Anexar `download=1` na própria URL de compartilhamento — funciona
//    direto contra o domínio *.sharepoint.com da conta.
// 2. Endpoint legado da OneDrive API (`api.onedrive.com/v1.0/shares`) —
//    funciona em contas OneDrive mais antigas, ainda não migradas.
function toDirectDownloadUrl(shareUrl) {
  const separator = shareUrl.includes('?') ? '&' : '?';
  return `${shareUrl}${separator}download=1`;
}

function encodeShareUrl(url) {
  const base64 = Buffer.from(url.trim(), 'utf8').toString('base64');
  const urlSafe = base64.replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
  return 'u!' + urlSafe;
}

async function fetchWorkbook(shareUrl) {
  const attempts = [
    toDirectDownloadUrl(shareUrl),
    `https://api.onedrive.com/v1.0/shares/${encodeShareUrl(shareUrl)}/root/content`,
  ];

  const errors = [];
  for (const url of attempts) {
    const res = await fetch(url, { redirect: 'follow' });
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    const body = (await res.text().catch(() => '')).slice(0, 300);
    errors.push(`HTTP ${res.status}${body ? `: ${body}` : ''}`);
  }
  throw new Error(`Falha ao baixar planilha — ${errors.join(' | ')}`);
}

module.exports = { toDirectDownloadUrl, encodeShareUrl, fetchWorkbook };
