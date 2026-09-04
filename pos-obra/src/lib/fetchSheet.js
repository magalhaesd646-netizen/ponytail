'use strict';

const oneDrive = require('./oneDrive');
const googleDrive = require('./googleDrive');

// Escolhe a estratégia de download pelo domínio do link de compartilhamento,
// para que o mesmo campo de config (ex.: POS_OBRA_SHEET_URL) aceite tanto um
// link do OneDrive/SharePoint quanto do Google Drive.
function fetchWorkbook(shareUrl) {
  const host = new URL(shareUrl).hostname;
  if (host.endsWith('drive.google.com') || host.endsWith('docs.google.com')) {
    return googleDrive.fetchWorkbook(shareUrl);
  }
  return oneDrive.fetchWorkbook(shareUrl);
}

module.exports = { fetchWorkbook };
