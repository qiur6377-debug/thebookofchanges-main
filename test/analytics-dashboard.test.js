const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('analytics dashboard turns raw events into a readable product panel', () => {
  const script = read('scripts/analytics-dashboard.js');
  const pkg = JSON.parse(read('package.json'));

  assert.equal(pkg.scripts['analytics:dashboard'], 'node scripts/analytics-dashboard.js');
  assert.match(script, /function buildDashboardHtml/);
  assert.match(script, /心安屿产品数据面板/);
  assert.match(script, /主链路漏斗/);
  assert.match(script, /下一步优先动作/);
  assert.match(script, /analytics-dashboard\.html/);
});
