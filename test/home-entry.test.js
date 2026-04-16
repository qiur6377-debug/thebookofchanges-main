const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('home page starts with four product entrances', () => {
  const html = read('public/index.html');

  assert.match(html, /id="home-section"[\s\S]*class="home-section active"/);
  assert.match(html, /id="zhouyi-entry-btn"[\s\S]*周易占事/);
  assert.match(html, /id="bazi-entry-btn"[\s\S]*八字星盘/);
  assert.match(html, /id="bazi-reverse-form"[\s\S]*四柱反推/);
  assert.match(html, /id="reverse-year-pillar"[\s\S]*placeholder="丁巳"/);
  assert.match(html, /id="shengxiao-entry-btn"[\s\S]*生肖合婚/);
  assert.match(html, /id="luohou-entry-btn"[\s\S]*罗喉择日/);
  assert.match(html, /class="luohou-layout"[\s\S]*class="luohou-intro-panel"/);
  assert.match(html, /id="luohou-interpret-btn"[\s\S]*生成大白话解读/);
  assert.match(html, /id="question-section"[\s\S]*class="card hidden"/);
  assert.match(html, /id="bazi-section"[\s\S]*class="card hidden"/);
  assert.match(html, /id="shengxiao-section"[\s\S]*class="card hidden"/);
  assert.match(html, /id="luohou-section"[\s\S]*class="card hidden"/);
});

test('front-end navigation moves between home and all workflows', () => {
  const app = read('public/app.js');

  assert.match(app, /const homeSection = document\.getElementById\('home-section'\)/);
  assert.match(app, /const baziReverseSubmitBtn = document\.getElementById\('bazi-reverse-submit-btn'\)/);
  assert.match(app, /zhouyiEntryBtn\.addEventListener\('click', \(\) => showSection\(questionSection\)\)/);
  assert.match(app, /baziEntryBtn\.addEventListener\('click', \(\) => \{/);
  assert.match(app, /fetch\('\/api\/bazi\/reverse'/);
  assert.match(app, /fetch\('\/api\/luohou\/interpret'/);
  assert.match(app, /shengxiaoEntryBtn\.addEventListener\('click', \(\) => showSection\(shengxiaoSection\)\)/);
  assert.match(app, /luohouEntryBtn\.addEventListener\('click', \(\) => \{/);
  assert.match(app, /showSection\(homeSection\)/);
});
