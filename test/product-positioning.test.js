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

  assert.match(server, /先用一小段短句接住用户当下的情绪/);
  assert.match(server, /\[大白话\]/);
  assert.match(server, /不要使用古风腔、不要故作高深、不要恐吓用户/);
  assert.match(server, /给用户一点方向感和一点安定感/);
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
