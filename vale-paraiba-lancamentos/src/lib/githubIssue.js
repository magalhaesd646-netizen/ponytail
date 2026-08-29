'use strict';

const axios = require('axios');
const { buildDigest, subjectFor } = require('./digest');

/**
 * Canal de alerta PADRÃO (zero configuração): quando rodado dentro do
 * GitHub Actions, o runner já injeta GITHUB_TOKEN (se o workflow passar
 * `secrets.GITHUB_TOKEN` como env) e GITHUB_REPOSITORY automaticamente —
 * não é preciso criar nenhuma credencial nova. O app abre uma Issue no
 * próprio repositório com o resumo dos lançamentos novos; como o dono do
 * repositório recebe notificação por e-mail do GitHub para issues novas
 * (configuração padrão do GitHub), isso já cobre o alerta "sempre me avise"
 * sem precisar configurar SMTP.
 *
 * Fora do Actions (ex.: rodando localmente sem GITHUB_TOKEN), cai em modo
 * dry-run e só loga o resumo — nunca lança exceção.
 */
function hasGithubContext() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY);
}

async function createAlertIssue(newItems) {
  if (!newItems.length) return { created: false, reason: 'sem itens novos' };

  if (!hasGithubContext()) {
    console.log(
      '[githubIssue] GITHUB_TOKEN/GITHUB_REPOSITORY não disponíveis — canal de Issue em modo dry-run.'
    );
    return { created: false, reason: 'sem contexto do GitHub Actions (dry-run)' };
  }

  const { markdown } = buildDigest(newItems);
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { data } = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        title: `🏗️ ${subjectFor(newItems)} — ${today}`,
        body: markdown,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        timeout: 15000,
      }
    );
    return { created: true, url: data.html_url };
  } catch (err) {
    const status = err.response && err.response.status;
    console.warn(
      `[githubIssue] falha ao criar issue de alerta${status ? ` (HTTP ${status})` : ''}: ${err.message}`
    );
    return { created: false, reason: `erro na API do GitHub: ${err.message}` };
  }
}

module.exports = { createAlertIssue, hasGithubContext };
