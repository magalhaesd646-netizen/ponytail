'use strict';

// Baixa o conteúdo de um arquivo do Google Drive/Sheets a partir de um link
// de compartilhamento ("Qualquer pessoa com o link"), sem precisar de
// login. Aceita três formatos:
// - arquivo hospedado no Drive: /file/d/<id>/view (ou ?id=<id>)
// - planilha nativa do Sheets: /spreadsheets/d/<id>/edit
// - planilha "Publicada na Web": /spreadsheets/d/e/<pubId>/pubhtml (Arquivo
//   > Compartilhar > Publicar na Web) — link com um ID em formato diferente
//   (prefixo "2PACX-").
function extractPublishedId(url) {
  const match = url.match(/\/spreadsheets\/d\/e\/([^/]+)/);
  return match ? match[1] : null;
}

function extractFileId(url) {
  const publishedId = extractPublishedId(url);
  if (publishedId) return publishedId;
  const pathMatch = url.match(/\/(?:file|spreadsheets)\/d\/([^/]+)/);
  if (pathMatch) return pathMatch[1];
  const queryMatch = url.match(/[?&]id=([^&]+)/);
  if (queryMatch) return queryMatch[1];
  throw new Error('Não foi possível extrair o ID do arquivo do link do Google Drive');
}

function isPublishedSheetUrl(url) {
  return extractPublishedId(url) !== null;
}

// Uma planilha nativa do Sheets não é um "arquivo" no Drive (não tem bytes
// de .xlsx armazenados) — precisa ser exportada por um endpoint próprio, em
// vez do link de download genérico usado para arquivos .xlsx/.csv soltos.
// Mas um arquivo .xlsx enviado ao Drive e só aberto no editor do Sheets
// (modo de compatibilidade do Office) também usa esse mesmo formato de URL
// mesmo sendo um arquivo de verdade — por isso, na dúvida, tentamos o
// endpoint de arquivo do Drive primeiro (ver `candidateDownloadUrls`).
function isNativeSheetUrl(url) {
  return /\/spreadsheets\/d\//.test(url) && !isPublishedSheetUrl(url);
}

// O arquivo pode vir como .xlsx (zip, começa com "PK") ou como .csv (texto).
// Só uma página HTML de verdade (aviso/confirmação do próprio Google) não é
// um desses dois — é o único caso que precisa da segunda tentativa abaixo.
function looksLikeHtmlPage(buffer) {
  return /^\s*<(!doctype|html)/i.test(buffer.slice(0, 200).toString('utf8'));
}

// Sem um User-Agent de navegador, o Google trata a requisição como tráfego
// automatizado (visto na prática vindo do IP dos runners do GitHub Actions)
// e devolve uma página de desafio anti-bot em vez do arquivo.
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// Uma URL no formato "planilha nativa" (/spreadsheets/d/<id>) pode, na
// prática, apontar tanto para um Google Sheets de verdade quanto para um
// .xlsx comum enviado ao Drive e só aberto no editor do Sheets — os dois
// têm a mesma cara de URL, e não dá pra saber qual é sem tentar. O endpoint
// de arquivo do Drive (uc?export=download) atende o segundo caso e, na
// prática, não aciona o desafio anti-bot que o endpoint de exportação do
// Sheets aciona vindo do IP dos runners do GitHub Actions — por isso vai
// primeiro; o endpoint de exportação do Sheets fica como segunda tentativa,
// para quando for mesmo um Sheets nativo.
function candidateDownloadUrls(shareUrl, id) {
  if (isPublishedSheetUrl(shareUrl)) return [`https://docs.google.com/spreadsheets/d/e/${id}/pub?output=xlsx`];
  if (isNativeSheetUrl(shareUrl)) {
    return [
      `https://drive.google.com/uc?export=download&id=${id}`,
      `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
    ];
  }
  return [`https://drive.google.com/uc?export=download&id=${id}`];
}

async function downloadOnce(downloadUrl) {
  const fetchOpts = { redirect: 'follow', headers: { 'User-Agent': BROWSER_USER_AGENT } };
  let res = await fetch(downloadUrl, fetchOpts);
  let buffer = Buffer.from(await res.arrayBuffer());

  // Arquivos grandes (ou que o Google não consegue escanear) respondem com
  // uma página HTML de confirmação em vez do arquivo — extrai o token
  // `confirm` dela e refaz o pedido.
  if (res.ok && looksLikeHtmlPage(buffer)) {
    const confirmMatch = buffer.toString('utf8').match(/confirm=([0-9A-Za-z_-]+)/);
    if (confirmMatch) {
      res = await fetch(`${downloadUrl}&confirm=${confirmMatch[1]}`, fetchOpts);
      buffer = Buffer.from(await res.arrayBuffer());
    }
  }

  return { res, buffer };
}

async function fetchWorkbook(shareUrl) {
  const id = extractFileId(shareUrl);
  const candidates = candidateDownloadUrls(shareUrl, id);

  let lastError;
  for (const downloadUrl of candidates) {
    const { res, buffer } = await downloadOnce(downloadUrl);

    if (res.ok && !looksLikeHtmlPage(buffer)) return buffer;

    lastError = res.ok
      ? new Error(
          `O Google Drive devolveu uma página HTML em vez do arquivo — resposta: ${buffer
            .toString('utf8')
            .slice(0, 300)
            .replace(/\s+/g, ' ')}`
        )
      : new Error(
          `Falha ao baixar planilha do Google Drive (HTTP ${res.status} ${res.statusText}) — resposta: ${buffer
            .toString('utf8')
            .slice(0, 500)
            .replace(/\s+/g, ' ')}`
        );
  }

  throw lastError;
}

module.exports = { extractFileId, isNativeSheetUrl, isPublishedSheetUrl, fetchWorkbook };
