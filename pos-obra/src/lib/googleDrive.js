'use strict';

// Baixa o conteúdo de um arquivo do Google Drive a partir de um link de
// compartilhamento ("Qualquer pessoa com o link"), sem precisar de login.
function extractFileId(url) {
  const pathMatch = url.match(/\/file\/d\/([^/]+)/);
  if (pathMatch) return pathMatch[1];
  const queryMatch = url.match(/[?&]id=([^&]+)/);
  if (queryMatch) return queryMatch[1];
  throw new Error('Não foi possível extrair o ID do arquivo do link do Google Drive');
}

function looksLikeZip(buffer) {
  // Um .xlsx é um .zip por dentro — todo arquivo zip começa com "PK".
  return buffer.length > 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

async function fetchWorkbook(shareUrl) {
  const id = extractFileId(shareUrl);
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;

  let res = await fetch(downloadUrl, { redirect: 'follow' });
  let buffer = Buffer.from(await res.arrayBuffer());

  // Arquivos grandes (ou que o Google não consegue escanear) respondem com
  // uma página HTML de confirmação em vez do arquivo — extrai o token
  // `confirm` dela e refaz o pedido.
  if (res.ok && !looksLikeZip(buffer)) {
    const html = buffer.toString('utf8');
    const confirmMatch = html.match(/confirm=([0-9A-Za-z_-]+)/);
    if (confirmMatch) {
      res = await fetch(`${downloadUrl}&confirm=${confirmMatch[1]}`, { redirect: 'follow' });
      buffer = Buffer.from(await res.arrayBuffer());
    }
  }

  if (!res.ok) {
    throw new Error(`Falha ao baixar planilha do Google Drive (HTTP ${res.status})`);
  }
  if (!looksLikeZip(buffer)) {
    const preview = buffer.toString('utf8').slice(0, 300).replace(/\s+/g, ' ');
    throw new Error(
      `O Google Drive não devolveu o arquivo .xlsx (content-type: ${res.headers.get('content-type')}) — resposta: ${preview}`
    );
  }
  return buffer;
}

module.exports = { extractFileId, fetchWorkbook };
