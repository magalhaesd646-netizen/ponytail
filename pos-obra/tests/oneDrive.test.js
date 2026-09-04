'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeShareUrl, toDirectDownloadUrl } = require('../src/lib/oneDrive');

test('toDirectDownloadUrl appends download=1 respecting an existing query string', () => {
  assert.equal(
    toDirectDownloadUrl('https://x.sharepoint.com/file?e=abc'),
    'https://x.sharepoint.com/file?e=abc&download=1'
  );
  assert.equal(
    toDirectDownloadUrl('https://x.sharepoint.com/file'),
    'https://x.sharepoint.com/file?download=1'
  );
});

test('encodeShareUrl produces a url-safe "u!" token that decodes back to the original url', () => {
  const url = 'https://example-my.sharepoint.com/:x:/g/personal/abc/EXAMPLE?e=xyz';
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
