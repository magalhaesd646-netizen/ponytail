'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeShareUrl } = require('../src/lib/oneDrive');

test('encodeShareUrl produces a url-safe "u!" token that decodes back to the original url', () => {
  const url = 'https://dovaleengenharia-my.sharepoint.com/:x:/g/personal/abc/EXAMPLE?e=xyz';
  const token = encodeShareUrl(url);

  assert.ok(token.startsWith('u!'));
  assert.doesNotMatch(token, /[/+]/);

  const restoredBase64 = token
    .slice(2)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const decoded = Buffer.from(restoredBase64, 'base64').toString('utf8');
  assert.equal(decoded, url);
});
