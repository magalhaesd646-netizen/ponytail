'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createAlertIssue, hasGithubContext } = require('../src/lib/githubIssue');

test('hasGithubContext é falso sem GITHUB_TOKEN/GITHUB_REPOSITORY', () => {
  const prevToken = process.env.GITHUB_TOKEN;
  const prevRepo = process.env.GITHUB_REPOSITORY;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_REPOSITORY;
  try {
    assert.equal(hasGithubContext(), false);
  } finally {
    if (prevToken !== undefined) process.env.GITHUB_TOKEN = prevToken;
    if (prevRepo !== undefined) process.env.GITHUB_REPOSITORY = prevRepo;
  }
});

test('createAlertIssue faz dry-run sem lançar exceção quando falta contexto', async () => {
  const prevToken = process.env.GITHUB_TOKEN;
  const prevRepo = process.env.GITHUB_REPOSITORY;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_REPOSITORY;
  try {
    const result = await createAlertIssue([{ empreendimento: 'X', cidade: 'Y', url: 'https://x' }]);
    assert.equal(result.created, false);
  } finally {
    if (prevToken !== undefined) process.env.GITHUB_TOKEN = prevToken;
    if (prevRepo !== undefined) process.env.GITHUB_REPOSITORY = prevRepo;
  }
});

test('createAlertIssue retorna created:false quando não há itens novos', async () => {
  const result = await createAlertIssue([]);
  assert.deepEqual(result, { created: false, reason: 'sem itens novos' });
});
