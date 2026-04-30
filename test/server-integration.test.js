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
  assert.match(server, /app\.set\('trust proxy'/);
  assert.match(server, /express\.json\(\{ limit: '16kb' \}\)/);
  assert.match(server, /app\.use\('\/api\/', apiRateLimiter\)/);
  assert.match(server, /app\.get\('\/', \(_req, res\) => \{/);
  assert.match(server, /app\.get\('\/classic', \(_req, res\) => \{/);
  assert.match(server, /sendFile\(path\.join\(publicDir, 'index\.html'\)\)/);
  assert.match(server, /sendFile\(path\.join\(publicDir, 'classic\.html'\)\)/);
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
  assert.match(server, /SAVE_DIVINATION_HISTORY/);
  assert.match(server, /if \(db && SAVE_DIVINATION_HISTORY\) \{/);
});

test('Dockerfile installs Python dependencies in a virtual environment', () => {
  const dockerfile = read('Dockerfile');
  const dockerignore = read('.dockerignore');
  const requirements = read('requirements.txt');

  assert.match(dockerfile, /python3 -m venv \/opt\/venv/);
  assert.match(dockerfile, /ENV PATH="\/opt\/venv\/bin:\$PATH"/);
  assert.doesNotMatch(dockerfile, /--break-system-packages/);
  assert.match(dockerignore, /\*\.log/);
  assert.match(dockerignore, /token_usage\.log/);
  assert.match(dockerignore, /analytics_events\.log/);
  assert.match(requirements, /bidict==0\.23\.1/);
  assert.match(requirements, /lunar_python==1\.4\.8/);
  assert.match(requirements, /colorama==0\.4\.6/);
  assert.match(requirements, /sxtwl==2\.0\.7/);
});

test('docs build ignores local reference and generated workspaces', () => {
  const vitepressConfig = read('.vitepress/config.mts');

  assert.match(vitepressConfig, /srcExclude/);
  assert.match(vitepressConfig, /design-references\/\*\*\//);
  assert.match(vitepressConfig, /bazi-master\/\*\*\//);
  assert.match(vitepressConfig, /docs\/\*\*\//);
});

test('server keeps analytics and token logs free of user question text', () => {
  const server = read('server.js');

  assert.match(server, /BLOCKED_ANALYTICS_KEYS/);
  assert.match(server, /sanitizeAnalyticsPayload/);
  assert.match(server, /requestId/);
  assert.doesNotMatch(server, /Question: \$\{question/);
  assert.doesNotMatch(server, /question\.replace\(/);
});

test('server strictly validates divination payloads before using them', () => {
  const server = read('server.js');

  assert.match(server, /function normalizeQuestionInput/);
  assert.match(server, /function isValidYaoValues/);
  assert.match(server, /function normalizeChangingPositions/);
  assert.match(server, /\[6, 7, 8, 9\]\.includes\(item\)/);
  assert.match(server, /const changingPositions = normalizedChangingPositions/);
});

test('server supports guest-first auth gate with phone and wechat login', () => {
  const server = read('server.js');

  assert.match(server, /CREATE TABLE IF NOT EXISTS users/);
  assert.match(server, /CREATE TABLE IF NOT EXISTS auth_sessions/);
  assert.match(server, /CREATE TABLE IF NOT EXISTS phone_login_codes/);
  assert.match(server, /CREATE TABLE IF NOT EXISTS guest_usage/);
  assert.match(server, /function parseCookies/);
  assert.match(server, /function getAuthContext/);
  assert.match(server, /function ensureDivinationAccess/);
  assert.match(server, /const AUTH_GATE_ENABLED = false/);
  assert.match(server, /if \(!AUTH_GATE_ENABLED\) return \{ ok: true, reason: 'auth_disabled' \}/);
  assert.match(server, /function markDivinationUsed/);
  assert.match(server, /LOGIN_REQUIRED/);
  assert.match(server, /app\.get\('\/api\/auth\/me'/);
  assert.match(server, /app\.post\('\/api\/auth\/phone\/request-code'/);
  assert.match(server, /app\.post\('\/api\/auth\/phone\/verify'/);
  assert.match(server, /app\.get\('\/api\/auth\/wechat\/start'/);
  assert.match(server, /app\.get\('\/api\/auth\/wechat\/callback'/);
  assert.match(server, /app\.post\('\/api\/auth\/logout'/);
  assert.match(server, /xinan_session/);
  assert.match(server, /x-guest-id/);
});

test('interpretation prompt keeps Zhouyi evidence while staying readable', () => {
  const server = read('server.js');

  assert.match(server, /本卦=现在的局面/);
  assert.match(server, /动爻=变化点/);
  assert.match(server, /之卦=继续变化后的方向/);
  assert.match(server, /每个小标题下面都必须按“三层写法”/);
  assert.match(server, /第一行：用 \*\*加粗\*\* 写一句人话结论/);
  assert.match(server, /第二行：用本卦、动爻、之卦作依据/);
  assert.match(server, /第三行：给一个具体可执行的小动作/);
  assert.match(server, /卦理是依据，不是正文主角/);
  assert.match(server, /不要连续堆术语/);
  assert.match(server, /每个小标题至少有一个 \*\*加粗重点句\*\*/);
});
