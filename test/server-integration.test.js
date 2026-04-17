const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('server applies API rate limiting middleware', () => {
  const server = read('server.js');

  assert.match(server, /createApiRateLimiter/);
  assert.match(server, /app\.use\('\/api\/', apiRateLimiter\)/);
});

test('server uses shared Qwen SSE streaming helper', () => {
  const server = read('server.js');

  assert.match(server, /streamQwenResponse/);
  assert.match(server, /errorPrefix: '罗喉 AI 解读'/);
  assert.match(server, /errorPrefix: '八字 AI 解读'/);
  assert.match(server, /errorPrefix: 'AI'/);
});

test('server uses null database fallback instead of a dummy run object', () => {
  const server = read('server.js');

  assert.match(server, /db = null/);
  assert.doesNotMatch(server, /db = \{ run: \(\) => \{\} \}/);
  assert.match(server, /if \(db\) \{/);
});

test('Dockerfile installs Python dependencies in a virtual environment', () => {
  const dockerfile = read('Dockerfile');

  assert.match(dockerfile, /python3 -m venv \/opt\/venv/);
  assert.match(dockerfile, /ENV PATH="\/opt\/venv\/bin:\$PATH"/);
  assert.doesNotMatch(dockerfile, /--break-system-packages/);
});
