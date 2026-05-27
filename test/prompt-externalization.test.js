const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('zhouyi interpretation prompt is externalized and reusable', () => {
  const server = read('server.js');
  const promptModule = read('prompts/zhouyi-interpretation.js');

  assert.match(server, /buildZhouyiInterpretationMessages/);
  assert.doesNotMatch(server, /const systemPrompt = `你不是高高在上的算命先生/);
  assert.match(promptModule, /function buildZhouyiInterpretationMessages/);
  assert.match(promptModule, /ZHOUYI_INTERPRETATION_PROMPT_VERSION/);
  assert.match(promptModule, /本卦=现在的局面/);
  assert.match(promptModule, /动爻=变化点/);
  assert.match(promptModule, /之卦=继续变化后的方向/);
});
