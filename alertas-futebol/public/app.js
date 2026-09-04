(function () {
  'use strict';

  let leagues = [];
  let metrics = [];
  let config = { leagues: [], rules: [] };

  const leaguesEl = document.getElementById('leagues');
  const rulesBody = document.getElementById('rules-body');
  const ruleLeagueSelect = document.getElementById('rule-league');
  const ruleMetricSelect = document.getElementById('rule-metric');
  const saveStatus = document.getElementById('save-status');

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data;
  }

  function leagueName(id) {
    const league = leagues.find((l) => l.id === Number(id));
    return league ? `${league.name} (${league.country})` : `Liga ${id}`;
  }

  function renderLeagues() {
    leaguesEl.innerHTML = '';
    for (const league of leagues) {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = league.id;
      checkbox.checked = config.leagues.includes(league.id);
      checkbox.addEventListener('change', () => {
        config.leagues = checkbox.checked
          ? [...config.leagues, league.id]
          : config.leagues.filter((id) => id !== league.id);
        renderRuleLeagueOptions();
      });
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(`${league.name} (${league.country})`));
      leaguesEl.appendChild(label);
    }
  }

  function renderRuleLeagueOptions() {
    ruleLeagueSelect.innerHTML = '<option value="">Todas as ligas selecionadas</option>';
    for (const id of config.leagues) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = leagueName(id);
      ruleLeagueSelect.appendChild(option);
    }
  }

  function renderMetricOptions() {
    ruleMetricSelect.innerHTML = metrics
      .map((m) => `<option value="${m.key}">${m.label}</option>`)
      .join('');
  }

  const COMPARATOR_LABEL = { gte: '≥', lte: '≤', eq: '=' };

  function renderRules() {
    rulesBody.innerHTML = '';
    if (!config.rules.length) {
      rulesBody.innerHTML = '<tr><td colspan="6" class="empty">Nenhuma regra ainda.</td></tr>';
      return;
    }
    for (const rule of config.rules) {
      const metric = metrics.find((m) => m.key === rule.metric);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${rule.leagueId ? leagueName(rule.leagueId) : 'Todas'}</td>
        <td>${{ home: 'Mandante', away: 'Visitante', either: 'Qualquer' }[rule.scope || 'either']}</td>
        <td>${metric ? metric.label : rule.metric}</td>
        <td>${COMPARATOR_LABEL[rule.comparator] || rule.comparator}</td>
        <td>${rule.value}</td>
        <td><button type="button" class="remove-rule" data-id="${rule.id}">×</button></td>
      `;
      rulesBody.appendChild(tr);
    }
    rulesBody.querySelectorAll('.remove-rule').forEach((btn) => {
      btn.addEventListener('click', () => {
        config.rules = config.rules.filter((r) => r.id !== btn.dataset.id);
        renderRules();
      });
    });
  }

  document.getElementById('add-rule-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const leagueId = document.getElementById('rule-league').value;
    const value = Number(document.getElementById('rule-value').value);
    if (Number.isNaN(value)) return;
    config.rules.push({
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      leagueId: leagueId ? Number(leagueId) : null,
      scope: document.getElementById('rule-scope').value,
      metric: document.getElementById('rule-metric').value,
      comparator: document.getElementById('rule-comparator').value,
      value,
    });
    document.getElementById('rule-value').value = '';
    renderRules();
  });

  document.getElementById('save-config').addEventListener('click', async () => {
    saveStatus.textContent = 'Salvando...';
    try {
      await fetchJson('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      saveStatus.textContent = 'Configuração salva.';
    } catch (err) {
      saveStatus.textContent = `Erro: ${err.message}`;
    }
  });

  document.getElementById('check-now').addEventListener('click', async () => {
    saveStatus.textContent = 'Verificando partidas ao vivo...';
    try {
      const result = await fetchJson('/api/check-now', { method: 'POST' });
      saveStatus.textContent = result.skipped
        ? `Nada a fazer: ${result.reason}`
        : `${result.liveFixtures} partida(s) ao vivo, ${result.alertsSent} alerta(s) enviado(s).`;
      loadAlertsLog();
    } catch (err) {
      saveStatus.textContent = `Erro: ${err.message}`;
    }
  });

  function renderLiveFixtures(entries) {
    const el = document.getElementById('live-fixtures');
    if (!entries.length) {
      el.innerHTML = '<p class="empty">Nenhuma partida ao vivo nas ligas selecionadas agora.</p>';
      return;
    }
    el.innerHTML = entries
      .map(({ fixture, stats }) => {
        const home = fixture.teams.home;
        const away = fixture.teams.away;
        const statsLine = [home, away]
          .map((team) => {
            const s = stats[team.id] || {};
            return `${team.name}: chutes a gol ${s.shotsOnGoal ?? '-'}, escanteios ${
              s.corners ?? '-'
            }, posse ${s.possession ?? '-'}%`;
          })
          .join(' · ');
        return `
          <div class="fixture-card">
            <div class="score">${home.name} ${fixture.goals.home ?? 0} x ${
          fixture.goals.away ?? 0
        } ${away.name} — ${fixture.league.name}</div>
            <div class="stats">${statsLine}</div>
          </div>
        `;
      })
      .join('');
  }

  async function loadLiveFixtures() {
    const el = document.getElementById('live-fixtures');
    el.innerHTML = 'Carregando...';
    try {
      const entries = await fetchJson('/api/live');
      renderLiveFixtures(entries);
    } catch (err) {
      el.innerHTML = `<p class="empty">Erro ao buscar partidas: ${err.message}</p>`;
    }
  }

  async function loadAlertsLog() {
    const el = document.getElementById('alerts-log');
    try {
      const log = await fetchJson('/api/alerts-log');
      if (!log.length) {
        el.innerHTML = '<p class="empty">Nenhum alerta enviado ainda.</p>';
        return;
      }
      el.innerHTML = log
        .slice(0, 30)
        .map(
          (entry) => `
        <div class="alert-entry">
          <div class="timestamp">${new Date(entry.timestamp).toLocaleString('pt-BR')}</div>
          <div>${entry.message.replace(/\n/g, '<br>')}</div>
        </div>
      `
        )
        .join('');
    } catch (err) {
      el.innerHTML = `<p class="empty">Erro ao buscar alertas: ${err.message}</p>`;
    }
  }

  document.getElementById('refresh-live').addEventListener('click', loadLiveFixtures);

  async function init() {
    [leagues, metrics, config] = await Promise.all([
      fetchJson('/api/leagues'),
      fetchJson('/api/metrics'),
      fetchJson('/api/config'),
    ]);
    renderLeagues();
    renderRuleLeagueOptions();
    renderMetricOptions();
    renderRules();
    loadLiveFixtures();
    loadAlertsLog();
  }

  init().catch((err) => {
    saveStatus.textContent = `Erro ao carregar: ${err.message}`;
  });
})();
