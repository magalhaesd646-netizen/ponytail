'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractFileId } = require('../src/lib/googleDrive');

test('extractFileId reads the id from a /file/d/<id>/view share link', () => {
  const url = 'https://drive.google.com/file/d/1OzlxrXScWdr_M6WAZjpJxGbHNfzYMpB6/view?usp=sharing';
  assert.equal(extractFileId(url), '1OzlxrXScWdr_M6WAZjpJxGbHNfzYMpB6');
});

test('extractFileId reads the id from a ?id= query param', () => {
  const url = 'https://drive.google.com/uc?export=download&id=abc123XYZ';
  assert.equal(extractFileId(url), 'abc123XYZ');
});

test('extractFileId throws for a link without a recognizable id', () => {
  assert.throws(() => extractFileId('https://drive.google.com/drive/folders/xyz'));
});
