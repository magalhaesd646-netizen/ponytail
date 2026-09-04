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

async function fetchWorkbook(shareUrl) {
  const id = extractFileId(shareUrl);
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;

  let res = await fetch(downloadUrl, { redirect: 'follow' });
  let buffer = Buffer.from(await res.arrayBuffer());

  // Arquivos grandes (ou que o Google não consegue escanear) respondem com
  // uma página HTML de confirmação em vez do arquivo — extrai o token
  // `confirm` dela e refaz o pedido.
  const contentType = res.headers.get('content-type') || '';
  if (res.ok && contentType.includes('text/html')) {
    const confirmMatch = buffer.toString('utf8').match(/confirm=([0-9A-Za-z_-]+)/);
    if (confirmMatch) {
      res = await fetch(`${downloadUrl}&confirm=${confirmMatch[1]}`, { redirect: 'follow' });
      buffer = Buffer.from(await res.arrayBuffer());
    }
  }

  if (!res.ok) {
    throw new Error(`Falha ao baixar planilha do Google Drive (HTTP ${res.status})`);
  }
  return buffer;
}

module.exports = { extractFileId, fetchWorkbook };
