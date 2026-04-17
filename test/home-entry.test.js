const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('home page starts with a focused hero and secondary tools', () => {
  const html = read('public/index.html');

  assert.match(html, /id="home-section"[\s\S]*class="home-section active"/);
  assert.match(html, /class="hero-panel"[\s\S]*以卦问事，以命观势/);
  assert.match(html, /class="hero-title"[\s\S]*周易 · 国学解惑/);
  assert.match(html, /id="zhouyi-entry-btn"[\s\S]*开始起卦/);
  assert.match(html, /id="yarrow-btn"[\s\S]*大衍筮法（古法蓍草推演）/);
  assert.doesNotMatch(html, /蓍草起卦（高级）/);
  assert.doesNotMatch(html, /hero-secondary-btn/);
  assert.match(html, /class="hero-fit-list"[\s\S]*事业、感情、选择、合作、时机判断/);
  assert.match(html, /class="home-subgrid"[\s\S]*id="bazi-entry-btn"[\s\S]*八字星盘/);
  assert.doesNotMatch(html, /id="bazi-tool-entry"/);
  assert.match(html, /id="shengxiao-entry-btn"[\s\S]*生肖合婚/);
  assert.match(html, /id="luohou-entry-btn"[\s\S]*罗喉择日/);
  assert.match(html, /class="method-summary"[\s\S]*占事[\s\S]*观命[\s\S]*择时/);
  assert.match(html, /id="bazi-reverse-form"[\s\S]*四柱反推/);
  assert.match(html, /id="reverse-year-pillar"[\s\S]*placeholder="丁巳"/);
  assert.match(html, /class="luohou-layout"[\s\S]*class="luohou-intro-panel"/);
  assert.match(html, /id="luohou-interpret-btn"[\s\S]*帮我解释这些日子/);
  assert.match(html, /id="luohou-single-day-btn"[\s\S]*只查这一天/);
  assert.match(html, /id="result-home-btn"[\s\S]*返回首页/);
  assert.match(html, /id="question-section"[\s\S]*class="card hidden"/);
  assert.match(html, /id="bazi-section"[\s\S]*class="card hidden"/);
  assert.match(html, /id="shengxiao-section"[\s\S]*class="card hidden"/);
  assert.match(html, /id="luohou-section"[\s\S]*class="card hidden"/);
});

test('result pages include the first four recommendation flow points', () => {
  const html = read('public/index.html');
  const css = read('public/style.css');

  assert.match(html, /id="zhouyi-bazi-recommendation"[\s\S]*想更深入了解自己？/);
  assert.match(html, /id="zhouyi-bazi-recommendation"[\s\S]*刚才的卦象指引了当下之势。/);
  assert.match(html, /id="recommend-bazi-btn" class="flow-recommendation-btn"[\s\S]*查看八字星盘/);
  assert.match(html, /id="zhouyi-shengxiao-recommendation"[\s\S]*想知道TA和你的契合度？/);
  assert.match(html, /id="recommend-shengxiao-btn" class="flow-recommendation-btn"[\s\S]*生肖合婚查询/);
  assert.match(html, /id="bazi-zhouyi-recommendation"[\s\S]*有具体事情想决策？/);
  assert.match(html, /id="recommend-zhouyi-btn" class="flow-recommendation-btn"[\s\S]*周易起卦/);
  assert.match(html, /id="shengxiao-luohou-recommendation"[\s\S]*想选个好日子推进此事？/);
  assert.match(html, /id="recommend-luohou-btn" class="flow-recommendation-btn"[\s\S]*罗喉择日/);
  assert.match(css, /\.flow-recommendation-btn[\s\S]*font-size: 0\.92rem/);
  assert.match(css, /\.flow-recommendation-btn[\s\S]*min-width: 0/);
  assert.match(css, /\.flow-recommendation-btn[\s\S]*box-shadow: none/);
  assert.doesNotMatch(html, /id="recommend-[^"]+" class="secondary-btn/);
}
);

test('front-end navigation moves between home and all workflows', () => {
  const app = read('public/app.js');

  assert.match(app, /const homeSection = document\.getElementById\('home-section'\)/);
  assert.match(app, /const baziReverseSubmitBtn = document\.getElementById\('bazi-reverse-submit-btn'\)/);
  assert.match(app, /const resultHomeBtn = document\.getElementById\('result-home-btn'\)/);
  assert.match(app, /const luohouSingleDayBtn = document\.getElementById\('luohou-single-day-btn'\)/);
  assert.match(app, /zhouyiEntryBtn\.addEventListener\('click', openZhouyiSection\)/);
  assert.match(app, /baziEntryBtn\.addEventListener\('click', \(\) => \{/);
  assert.match(app, /fetch\('\/api\/bazi\/reverse'/);
  assert.match(app, /fetch\('\/api\/luohou\/interpret'/);
  assert.match(app, /shengxiaoEntryBtn\.addEventListener\('click', \(\) => \{/);
  assert.match(app, /luohouEntryBtn\.addEventListener\('click', \(\) => \{/);
  assert.match(app, /luohouSingleDayBtn\.addEventListener\('click', startLuohouSingleDayReading\)/);
  assert.match(app, /resultHomeBtn\.addEventListener\('click', \(\) => showSection\(homeSection\)\)/);
  assert.match(app, /showSection\(homeSection\)/);
});

test('opening zhouyi again re-enables the quick divination button', () => {
  const app = read('public/app.js');
  const openZhouyiMatch = app.match(/function openZhouyiSection\(\) \{([\s\S]*?)\n    \}/);

  assert.ok(openZhouyiMatch, 'openZhouyiSection should exist');
  assert.match(openZhouyiMatch[1], /divineBtn\.disabled = false;/);
});

test('front-end recommendation flow points display and navigate correctly', () => {
  const app = read('public/app.js');

  assert.match(app, /const relationshipQuestionPattern = /);
  for (const keyword of ['感情', '婚姻', '对象', '合作', '合伙', '伴侣', '朋友', '同事']) {
    assert.match(app, new RegExp(keyword));
  }
  assert.match(app, /function updateZhouyiRecommendations\(\)/);
  assert.match(app, /zhouyiBaziRecommendation\.style\.display = 'block'/);
  assert.match(app, /zhouyiShengxiaoRecommendation\.style\.display = relationshipQuestionPattern\.test\(currentQuestion\) \? 'block' : 'none'/);
  assert.match(app, /baziZhouyiRecommendation\.style\.display = 'block'/);
  assert.match(app, /shengxiaoLuohouRecommendation\.style\.display = data\.output \? 'block' : 'none'/);
  assert.match(app, /recommendBaziBtn\.addEventListener\('click', openBaziSection\)/);
  assert.match(app, /recommendShengxiaoBtn\.addEventListener\('click', \(\) => showSection\(shengxiaoSection\)\)/);
  assert.match(app, /recommendZhouyiBtn\.addEventListener\('click', openZhouyiSection\)/);
  assert.match(app, /recommendLuohouBtn\.addEventListener\('click', openLuohouSection\)/);
});

test('ui polish adds guided prompts, inline feedback, structured results, and focus states', () => {
  const html = read('public/index.html');
  const css = read('public/style.css');
  const app = read('public/app.js');

  assert.match(html, /class="question-templates"[\s\S]*data-question-template="事业选择"/);
  assert.match(html, /data-question-template="感情关系"/);
  assert.match(html, /id="zhouyi-message" class="form-message" role="alert"/);
  assert.match(html, /id="bazi-message" class="form-message" role="alert"/);
  assert.match(html, /id="bazi-result-cards" class="structured-result-list"/);
  assert.match(html, /id="shengxiao-result-cards" class="structured-result-list"/);
  assert.match(html, /id="luohou-result-cards" class="structured-result-list"/);
  assert.match(html, /class="raw-result-details"[\s\S]*查看原始排盘/);

  assert.match(css, /button:focus-visible[\s\S]*outline: 3px solid/);
  assert.match(css, /\.form-message\[data-state="error"\]/);
  assert.match(css, /\.question-template-btn/);
  assert.match(css, /\.structured-result-list/);
  assert.match(css, /\.result-card/);

  assert.match(app, /section === luohouSection \|\| section === yarrowSection/);
  assert.match(app, /function setFormMessage/);
  assert.match(app, /function clearFormMessage/);
  assert.match(app, /function renderStructuredResult/);
  assert.match(app, /function startLuohouSingleDayReading/);
  assert.match(app, /startLuohouReading\(1\)/);
  assert.match(app, /questionTemplateBtns\.forEach/);
  assert.doesNotMatch(app, /alert\(/);
});
