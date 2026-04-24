const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('zhouyi interpretation prompt focuses on emotional support and actionable clarity', () => {
  const server = read('server.js');

  assert.match(server, /\[一句判断\]/);
  assert.match(server, /\[定心话\]/);
  assert.match(server, /\[大白话\]/);
  assert.match(server, /不要使用古风腔、不要故作高深、不要恐吓用户/);
  assert.match(server, /给用户一点方向感和一点安定感/);
  assert.match(server, /先接住一点情绪，再给用户一个方向/);
  assert.match(server, /不要短到像半句话/);
  assert.match(server, /这件事为什么还没定、变化主要会出在哪、你现在更适合顺着变还是先别动/);
  assert.match(server, /本卦是现在的局面，动爻是变化点，之卦是继续变化下去后更可能走向的方向/);
  assert.match(server, /你现在卡在哪里：/);
  assert.match(server, /你可以怎么做：/);
  assert.match(server, /给你一句话：/);
});

test('bazi and luohou prompts also shift from tool tone to陪伴式解释', () => {
  const bazi = read('lib/bazi-service.js');
  const luohou = read('lib/luohou-service.js');

  assert.match(bazi, /像一个懂命理、也懂年轻人情绪的朋友/);
  assert.match(bazi, /不要下命运结论/);
  assert.match(bazi, /你给人的底色：/);
  assert.match(bazi, /最近更适合把力气放在哪：/);

  assert.match(luohou, /帮用户看时间窗口的中文解释助手/);
  assert.match(luohou, /别把传统术语讲得吓人/);
  assert.match(luohou, /这段时间适合怎么安排：/);
  assert.match(luohou, /给你一句提醒：/);
});

test('v1 positioning keeps the experience emotion-first and reduces tool wording in key screens', () => {
  const html = read('public/classic.html');

  assert.match(html, /id="bazi-sheet-open-btn"[\s\S]*先看看我的状态/);
  assert.match(html, /id="bazi-submit-btn"[\s\S]*看看我的状态/);
  assert.match(html, /id="bazi-result-title" class="interpretation-title">你的底色和节奏/);
  assert.match(html, /class="raw-result-details"[\s\S]*展开看详细命盘/);
  assert.match(html, /<h3 class="interpretation-title">关系里的感觉<\/h3>/);
  assert.match(html, /<h3 class="interpretation-title">这段时间的时机提醒<\/h3>/);
});
