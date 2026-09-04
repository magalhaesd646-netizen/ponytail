'use strict';

// Converte um link de compartilhamento do OneDrive/SharePoint ("Qualquer
// pessoa com o link pode visualizar") no token usado pela API de shares, e
// baixa o conteúdo do arquivo direto, sem precisar de login/app registrado.
// Formato documentado pela Microsoft: https://learn.microsoft.com/onedrive/developer/rest-api/api/shares_get
function encodeShareUrl(url) {
  const base64 = Buffer.from(url.trim(), 'utf8').toString('base64');
  const urlSafe = base64.replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
  return 'u!' + urlSafe;
}

async function fetchWorkbook(shareUrl) {
  const token = encodeShareUrl(shareUrl);
  const apiUrl = `https://api.onedrive.com/v1.0/shares/${token}/root/content`;
  const res = await fetch(apiUrl, { redirect: 'follow' });
  if (!res.ok) {
    const location = res.headers.get('location');
    const detail = location ? ` — redirecionou para: ${location}` : '';
    throw new Error(`Falha ao baixar planilha (HTTP ${res.status})${detail}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = { encodeShareUrl, fetchWorkbook };
