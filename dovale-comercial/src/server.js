require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const cron = require('node-cron');

const { LISTS, isValidListId } = require('./lists');
const {
  readContacts,
  mergeContacts,
  updateContact,
  deleteContact,
  readCampaigns,
  readSchedules,
  writeSchedules,
} = require('./store');
const { extractCandidatesFromPdf } = require('./pdfExtract');
const { sendCampaign } = require('./mailer');
const { runDueSchedules } = require('./scheduler');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

function requireValidList(req, res, next) {
  if (!isValidListId(req.params.listId)) {
    return res.status(404).json({ error: `Lista inválida: ${req.params.listId}` });
  }
  next();
}

app.get('/api/lists', (req, res) => res.json(LISTS));

app.get('/api/contacts/:listId', requireValidList, (req, res) => {
  res.json(readContacts(req.params.listId));
});

app.post('/api/contacts/:listId', requireValidList, (req, res) => {
  const result = mergeContacts(req.params.listId, [req.body]);
  res.json(result);
});

app.patch('/api/contacts/:listId/:contactId', requireValidList, (req, res) => {
  const updated = updateContact(req.params.listId, req.params.contactId, req.body);
  if (!updated) return res.status(404).json({ error: 'Contato não encontrado' });
  res.json(updated);
});

app.delete('/api/contacts/:listId/:contactId', requireValidList, (req, res) => {
  const ok = deleteContact(req.params.listId, req.params.contactId);
  if (!ok) return res.status(404).json({ error: 'Contato não encontrado' });
  res.status(204).end();
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', 'uploads', req.params.listId));
    },
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Apenas arquivos PDF'));
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Faz upload do(s) PDF(s) e devolve candidatos extraídos para revisão —
// nada é salvo na base ainda (isso acontece em /api/import).
app.post(
  '/api/upload/:listId',
  requireValidList,
  upload.array('arquivos', 10),
  async (req, res) => {
    try {
      const files = req.files || [];
      const porArquivo = [];
      for (const file of files) {
        const fs = require('fs');
        const buffer = fs.readFileSync(file.path);
        const candidatos = await extractCandidatesFromPdf(buffer, file.filename);
        candidatos.forEach((c) => {
          c.id = crypto.randomUUID();
        });
        porArquivo.push({ arquivo: file.filename, candidatos });
      }
      res.json({ porArquivo });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Confirma a importação: recebe a lista (possivelmente editada pelo
// usuário na revisão) e mescla na base definitiva.
app.post('/api/import/:listId', requireValidList, (req, res) => {
  const candidatos = Array.isArray(req.body.candidatos) ? req.body.candidatos : [];
  const result = mergeContacts(req.params.listId, candidatos);
  res.json(result);
});

app.get('/api/campaigns', (req, res) => res.json(readCampaigns()));

app.post('/api/send/:listId', requireValidList, async (req, res) => {
  const { subject, bodyHtml, contactIds } = req.body;
  if (!subject || !bodyHtml) {
    return res.status(400).json({ error: 'Assunto e corpo do e-mail são obrigatórios' });
  }
  let contacts = readContacts(req.params.listId);
  if (Array.isArray(contactIds) && contactIds.length) {
    contacts = contacts.filter((c) => contactIds.includes(c.id));
  }
  try {
    const campaign = await sendCampaign({
      listId: req.params.listId,
      contacts,
      subject,
      bodyHtml,
      tipo: 'manual',
    });
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/schedules', (req, res) => res.json(readSchedules()));

app.post('/api/schedules', (req, res) => {
  const { nome, listId, assunto, corpoHtml, cronExpr } = req.body;
  if (!isValidListId(listId)) return res.status(400).json({ error: 'Lista inválida' });
  if (!nome || !assunto || !corpoHtml || !cronExpr) {
    return res.status(400).json({ error: 'nome, listId, assunto, corpoHtml e cronExpr são obrigatórios' });
  }
  const schedules = readSchedules();
  const schedule = {
    id: `sched_${Date.now()}`,
    nome,
    listId,
    assunto,
    corpoHtml,
    cronExpr,
    ativo: true,
    criadoEm: new Date().toISOString(),
    ultimaExecucao: null,
  };
  schedules.push(schedule);
  writeSchedules(schedules);
  res.status(201).json(schedule);
});

app.patch('/api/schedules/:id', (req, res) => {
  const schedules = readSchedules();
  const idx = schedules.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Agendamento não encontrado' });
  schedules[idx] = { ...schedules[idx], ...req.body, id: schedules[idx].id };
  writeSchedules(schedules);
  res.json(schedules[idx]);
});

app.delete('/api/schedules/:id', (req, res) => {
  const schedules = readSchedules();
  const next = schedules.filter((s) => s.id !== req.params.id);
  writeSchedules(next);
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Dovale Comercial rodando em http://localhost:${PORT}`);
  });

  // Confere agendamentos a cada 5 minutos enquanto o servidor estiver de pé.
  // Isso cobre a recorrência "ao vivo"; scripts/run-scheduler.js cobre o
  // caso do servidor não ficar ligado o tempo todo (via GitHub Actions).
  cron.schedule('*/5 * * * *', () => {
    runDueSchedules().catch((err) => console.error('Erro no agendador:', err.message));
  });
}

module.exports = app;
