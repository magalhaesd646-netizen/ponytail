const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isValidListId } = require('./lists');

const DATA_DIR = path.join(__dirname, '..', 'data');

function contactsFile(listId) {
  if (!isValidListId(listId)) throw new Error(`Lista inválida: ${listId}`);
  return path.join(DATA_DIR, `contacts-${listId}.json`);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function readContacts(listId) {
  return readJson(contactsFile(listId), []);
}

function writeContacts(listId, contacts) {
  writeJson(contactsFile(listId), contacts);
}

// Mescla novos contatos na lista existente, sem duplicar por e-mail.
// Contatos sem e-mail são mantidos (ex: só telefone) mas nunca deduplicados.
function mergeContacts(listId, incoming) {
  const existing = readContacts(listId);
  const byEmail = new Map(
    existing.filter((c) => c.email).map((c) => [c.email.toLowerCase(), c])
  );
  let added = 0;
  let updated = 0;
  for (const raw of incoming) {
    const contact = normalizeContact(raw);
    const key = contact.email ? contact.email.toLowerCase() : null;
    if (key && byEmail.has(key)) {
      const current = byEmail.get(key);
      Object.assign(current, {
        nome: current.nome || contact.nome,
        empresa: current.empresa || contact.empresa,
        telefone: current.telefone || contact.telefone,
        cidade: current.cidade || contact.cidade,
      });
      updated += 1;
    } else {
      existing.push(contact);
      if (key) byEmail.set(key, contact);
      added += 1;
    }
  }
  writeContacts(listId, existing);
  return { added, updated, total: existing.length };
}

function normalizeContact(raw) {
  return {
    id: raw.id || crypto.randomUUID(),
    nome: (raw.nome || '').trim(),
    empresa: (raw.empresa || '').trim(),
    email: (raw.email || '').trim(),
    telefone: (raw.telefone || '').trim(),
    cidade: (raw.cidade || '').trim(),
    origemArquivo: raw.origemArquivo || '',
    importadoEm: raw.importadoEm || new Date().toISOString(),
    status: raw.status || 'ativo', // ativo | descadastrado | invalido
  };
}

function updateContact(listId, contactId, patch) {
  const contacts = readContacts(listId);
  const idx = contacts.findIndex((c) => c.id === contactId);
  if (idx === -1) return null;
  contacts[idx] = { ...contacts[idx], ...patch, id: contacts[idx].id };
  writeContacts(listId, contacts);
  return contacts[idx];
}

function deleteContact(listId, contactId) {
  const contacts = readContacts(listId);
  const next = contacts.filter((c) => c.id !== contactId);
  writeContacts(listId, next);
  return next.length !== contacts.length;
}

const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');
const PROCESSED_FILES_FILE = path.join(DATA_DIR, 'processed-files.json');

function readCampaigns() {
  return readJson(CAMPAIGNS_FILE, []);
}
function appendCampaign(campaign) {
  const campaigns = readCampaigns();
  campaigns.unshift(campaign);
  writeJson(CAMPAIGNS_FILE, campaigns);
  return campaign;
}

function readSchedules() {
  return readJson(SCHEDULES_FILE, []);
}
function writeSchedules(schedules) {
  writeJson(SCHEDULES_FILE, schedules);
}

function readProcessedFiles() {
  return readJson(PROCESSED_FILES_FILE, {});
}
function writeProcessedFiles(map) {
  writeJson(PROCESSED_FILES_FILE, map);
}

module.exports = {
  DATA_DIR,
  readContacts,
  writeContacts,
  mergeContacts,
  normalizeContact,
  updateContact,
  deleteContact,
  readCampaigns,
  appendCampaign,
  readSchedules,
  writeSchedules,
  readProcessedFiles,
  writeProcessedFiles,
};
