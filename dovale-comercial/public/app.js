let LISTS = [];
let currentListId = null;
let currentContacts = [];

const tabsEl = document.getElementById('tabs');
const panels = {
  list: document.getElementById('list-panel'),
  schedules: document.getElementById('schedules-panel'),
  history: document.getElementById('history-panel'),
};

async function api(path, opts) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

async function init() {
  LISTS = await api('/api/lists');
  const tabDefs = [
    ...LISTS.map((l) => ({ id: l.id, label: l.label, type: 'list' })),
    { id: 'schedules', label: 'Agendamentos', type: 'schedules' },
    { id: 'history', label: 'Histórico', type: 'history' },
  ];
  tabsEl.innerHTML = tabDefs
    .map((t) => `<button data-tab="${t.id}" data-type="${t.type}">${escapeHtml(t.label)}</button>`)
    .join('');
  tabsEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => selectTab(btn.dataset.tab, btn.dataset.type));
  });
  populateScheduleListSelect();
  selectTab(LISTS[0].id, 'list');
}

function selectTab(tabId, type) {
  tabsEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
  Object.values(panels).forEach((p) => (p.hidden = true));
  if (type === 'list') {
    currentListId = tabId;
    panels.list.hidden = false;
    document.getElementById('review-area').innerHTML = '';
    loadContacts(tabId);
  } else if (type === 'schedules') {
    panels.schedules.hidden = false;
    loadSchedules();
  } else if (type === 'history') {
    panels.history.hidden = false;
    loadHistory();
  }
}

// --- Contatos ---

async function loadContacts(listId) {
  currentContacts = await api(`/api/contacts/${listId}`);
  renderContactsTable();
}

function renderContactsTable() {
  document.getElementById('contacts-count').textContent = `${currentContacts.length} contato(s)`;
  const tbody = document.querySelector('#contacts-table tbody');
  tbody.innerHTML = currentContacts
    .map(
      (c) => `
    <tr data-id="${c.id}">
      <td><input type="checkbox" class="row-select" /></td>
      <td>${escapeHtml(c.nome)}</td>
      <td>${escapeHtml(c.empresa)}</td>
      <td>${escapeHtml(c.email)}</td>
      <td>${escapeHtml(c.telefone)}</td>
      <td>${escapeHtml(c.cidade)}</td>
      <td>
        <select class="status-select">
          <option value="ativo" ${c.status === 'ativo' ? 'selected' : ''}>ativo</option>
          <option value="descadastrado" ${c.status === 'descadastrado' ? 'selected' : ''}>descadastrado</option>
          <option value="invalido" ${c.status === 'invalido' ? 'selected' : ''}>inválido</option>
        </select>
      </td>
      <td>${escapeHtml(c.origemArquivo)}</td>
      <td><button class="secondary del-btn">excluir</button></td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('.status-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      await api(`/api/contacts/${currentListId}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: e.target.value }),
      });
    });
  });
  tbody.querySelectorAll('.del-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr');
      if (!confirm('Excluir este contato?')) return;
      await api(`/api/contacts/${currentListId}/${tr.dataset.id}`, { method: 'DELETE' });
      loadContacts(currentListId);
    });
  });
}

document.getElementById('select-all').addEventListener('change', (e) => {
  document.querySelectorAll('.row-select').forEach((cb) => (cb.checked = e.target.checked));
});

// --- Upload / extração de PDF ---

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('upload-input');
  if (!input.files.length) return;
  const formData = new FormData();
  for (const file of input.files) formData.append('arquivos', file);

  const res = await fetch(`/api/upload/${currentListId}`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) {
    document.getElementById('review-area').innerHTML = `<p class="hint">Erro: ${escapeHtml(data.error)}</p>`;
    return;
  }
  renderReview(data.porArquivo);
  input.value = '';
});

function renderReview(porArquivo) {
  const area = document.getElementById('review-area');
  area.innerHTML = porArquivo
    .map(
      (grupo, gi) => `
    <div class="card" style="margin-top:16px">
      <h3>${escapeHtml(grupo.arquivo)} — ${grupo.candidatos.length} contato(s) encontrado(s)</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Incluir</th><th>Nome</th><th>Empresa</th><th>E-mail</th><th>Telefone</th><th>Cidade</th></tr></thead>
          <tbody id="review-body-${gi}">
            ${grupo.candidatos
              .map(
                (c, ci) => `
              <tr data-idx="${ci}">
                <td><input type="checkbox" class="review-select" checked /></td>
                <td><input type="text" class="f-nome" value="${escapeHtml(c.nome)}" /></td>
                <td><input type="text" class="f-empresa" value="${escapeHtml(c.empresa)}" /></td>
                <td><input type="text" class="f-email" value="${escapeHtml(c.email)}" /></td>
                <td><input type="text" class="f-telefone" value="${escapeHtml(c.telefone)}" /></td>
                <td><input type="text" class="f-cidade" value="${escapeHtml(c.cidade)}" /></td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <button class="confirm-import-btn" data-arquivo="${escapeHtml(grupo.arquivo)}" data-idx="${gi}">
        Confirmar importação
      </button>
    </div>`
    )
    .join('');

  area.querySelectorAll('.confirm-import-btn').forEach((btn) => {
    btn.addEventListener('click', () => confirmImport(btn.dataset.idx, btn.dataset.arquivo));
  });
}

async function confirmImport(gi, arquivo) {
  const rows = document.querySelectorAll(`#review-body-${gi} tr`);
  const candidatos = [];
  rows.forEach((row) => {
    if (!row.querySelector('.review-select').checked) return;
    candidatos.push({
      nome: row.querySelector('.f-nome').value,
      empresa: row.querySelector('.f-empresa').value,
      email: row.querySelector('.f-email').value,
      telefone: row.querySelector('.f-telefone').value,
      cidade: row.querySelector('.f-cidade').value,
      origemArquivo: arquivo,
    });
  });
  const result = await api(`/api/import/${currentListId}`, {
    method: 'POST',
    body: JSON.stringify({ candidatos }),
  });
  alert(`Importado: ${result.added} novo(s), ${result.updated} atualizado(s). Total na base: ${result.total}.`);
  document.getElementById('review-area').innerHTML = '';
  loadContacts(currentListId);
}

// --- Disparo manual ---

document.getElementById('send-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const subject = document.getElementById('send-subject').value;
  const bodyHtml = document.getElementById('send-body').value;
  const selectedRows = [...document.querySelectorAll('#contacts-table tbody tr')].filter((tr) =>
    tr.querySelector('.row-select').checked
  );
  const contactIds = selectedRows.map((tr) => tr.dataset.id);
  const resultEl = document.getElementById('send-result');
  resultEl.textContent = 'Enviando...';
  try {
    const campaign = await api(`/api/send/${currentListId}`, {
      method: 'POST',
      body: JSON.stringify({ subject, bodyHtml, contactIds: contactIds.length ? contactIds : undefined }),
    });
    resultEl.textContent = `Concluído: ${campaign.enviados} enviado(s), ${campaign.falhas} falha(s), de ${campaign.totalAlvo} contato(s) alvo.`;
  } catch (err) {
    resultEl.textContent = `Erro: ${err.message}`;
  }
});

// --- Agendamentos ---

function populateScheduleListSelect() {
  const select = document.getElementById('sched-lista');
  select.innerHTML = LISTS.map((l) => `<option value="${l.id}">${escapeHtml(l.label)}</option>`).join('');
}

document.getElementById('sched-preset').addEventListener('change', (e) => {
  const wrap = document.getElementById('sched-cron-wrap');
  wrap.hidden = e.target.value !== 'custom';
});

document.getElementById('schedule-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const preset = document.getElementById('sched-preset').value;
  const cronExpr = preset === 'custom' ? document.getElementById('sched-cron').value : preset;
  await api('/api/schedules', {
    method: 'POST',
    body: JSON.stringify({
      nome: document.getElementById('sched-nome').value,
      listId: document.getElementById('sched-lista').value,
      assunto: document.getElementById('sched-subject').value,
      corpoHtml: document.getElementById('sched-body').value,
      cronExpr,
    }),
  });
  e.target.reset();
  document.getElementById('sched-cron-wrap').hidden = true;
  loadSchedules();
});

async function loadSchedules() {
  const schedules = await api('/api/schedules');
  const tbody = document.querySelector('#schedules-table tbody');
  const listLabel = (id) => LISTS.find((l) => l.id === id)?.label || id;
  tbody.innerHTML = schedules
    .map(
      (s) => `
    <tr data-id="${s.id}">
      <td>${escapeHtml(s.nome)}</td>
      <td>${escapeHtml(listLabel(s.listId))}</td>
      <td>${escapeHtml(s.assunto)}</td>
      <td><code>${escapeHtml(s.cronExpr)}</code></td>
      <td>${s.ultimaExecucao ? new Date(s.ultimaExecucao).toLocaleString('pt-BR') : 'nunca'}</td>
      <td><input type="checkbox" class="sched-ativo" ${s.ativo ? 'checked' : ''} /></td>
      <td><button class="danger sched-del">excluir</button></td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('.sched-ativo').forEach((cb) => {
    cb.addEventListener('change', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      await api(`/api/schedules/${id}`, { method: 'PATCH', body: JSON.stringify({ ativo: e.target.checked }) });
    });
  });
  tbody.querySelectorAll('.sched-del').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      if (!confirm('Excluir este agendamento?')) return;
      await api(`/api/schedules/${id}`, { method: 'DELETE' });
      loadSchedules();
    });
  });
}

// --- Histórico ---

async function loadHistory() {
  const campaigns = await api('/api/campaigns');
  const listLabel = (id) => LISTS.find((l) => l.id === id)?.label || id;
  const tbody = document.querySelector('#history-table tbody');
  tbody.innerHTML = campaigns
    .map(
      (c) => `
    <tr>
      <td>${new Date(c.criadoEm).toLocaleString('pt-BR')}</td>
      <td>${escapeHtml(listLabel(c.listId))}</td>
      <td>${escapeHtml(c.tipo)}</td>
      <td>${escapeHtml(c.assunto)}</td>
      <td>${c.enviados}</td>
      <td>${c.falhas}</td>
      <td>${c.totalAlvo}</td>
    </tr>`
    )
    .join('');
}

init();
