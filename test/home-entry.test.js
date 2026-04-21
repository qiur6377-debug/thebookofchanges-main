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
  assert.match(html, /class="hero-panel"[\s\S]*给一点方向，也给一点心安/);
  assert.match(html, /class="hero-title"[\s\S]*心里有事，就来算一下/);
  assert.match(html, /id="zhouyi-entry-btn"[\s\S]*立即算一算/);
  assert.match(html, /id="yarrow-btn"[\s\S]*大衍筮法（古法蓍草推演）/);
  assert.doesNotMatch(html, /蓍草起卦（高级）/);
  assert.doesNotMatch(html, /hero-secondary-btn/);
  assert.match(html, /class="hero-fit-list"[\s\S]*感情反复、工作犹豫、关系拉扯、要不要主动、该不该推进/);
  assert.match(html, /class="home-subgrid"[\s\S]*id="bazi-entry-btn"[\s\S]*看看自己/);
  assert.doesNotMatch(html, /id="bazi-tool-entry"/);
  assert.match(html, /id="shengxiao-entry-btn"[\s\S]*关系合拍/);
  assert.match(html, /id="luohou-entry-btn"[\s\S]*挑个日子/);
  assert.match(html, /class="method-summary"[\s\S]*问现在[\s\S]*看自己[\s\S]*选时机/);
  assert.match(html, /id="question-intro-title"[\s\S]*把心里的事说出来/);
  assert.match(html, /id="question"[\s\S]*我要不要主动联系他/);
  assert.match(html, /class="question-note"[\s\S]*像发消息一样写出来就好/);
  assert.match(html, /id="divine-btn"[\s\S]*立即算一算/);
  assert.match(html, /class="section-intro"[\s\S]*默认先用轻模式/);
  assert.match(html, /id="bazi-optional-panel" class="bazi-lite-panel"[\s\S]*补充更多出生信息（可选）/);
  assert.match(html, /id="bazi-minute"[\s\S]*placeholder="30"/);
  assert.match(html, /id="bazi-birth-place"[\s\S]*list="bazi-city-list"[\s\S]*placeholder="北京"/);
  assert.match(html, /id="bazi-city-list"[\s\S]*value="北京"[\s\S]*value="上海"[\s\S]*value="成都"/);
  assert.match(html, /id="bazi-advanced-panel" class="advanced-time-panel"[\s\S]*专业设置/);
  assert.match(html, /class="advanced-time-panel"[\s\S]*手动填写经度[\s\S]*id="bazi-longitude"[\s\S]*placeholder="116\.397"/);
  assert.match(html, /id="bazi-true-solar"[\s\S]*按出生城市自动换算真太阳时/);
  assert.match(html, /id="bazi-zi-mode"[\s\S]*子初换日/);
  assert.match(html, /<details id="bazi-reverse-panel" class="bazi-subform"[\s\S]*<summary[\s\S]*四柱反推/);
  assert.match(html, /id="reverse-year-pillar"[\s\S]*placeholder="丁巳"/);
  assert.match(html, /class="luohou-layout"[\s\S]*class="luohou-intro-panel"/);
  assert.match(html, /id="luohou-interpret-btn"[\s\S]*帮我挑重点/);
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

  assert.match(html, /id="zhouyi-bazi-recommendation"[\s\S]*想再看看自己最近的底色？/);
  assert.match(html, /id="recommend-bazi-btn" class="flow-recommendation-btn"[\s\S]*看看自己/);
  assert.match(html, /id="zhouyi-shengxiao-recommendation"[\s\S]*这件事和某个人有关？/);
  assert.match(html, /id="recommend-shengxiao-btn" class="flow-recommendation-btn"[\s\S]*看看关系合拍/);
  assert.match(html, /id="bazi-zhouyi-recommendation"[\s\S]*想问眼前这件具体的事？/);
  assert.match(html, /id="recommend-zhouyi-btn" class="flow-recommendation-btn"[\s\S]*去问一卦/);
  assert.match(html, /id="shengxiao-luohou-recommendation"[\s\S]*关系想往前推一步？/);
  assert.match(html, /id="recommend-luohou-btn" class="flow-recommendation-btn"[\s\S]*挑个日子/);
  assert.match(css, /\.flow-recommendation-btn[\s\S]*font-size: 0\.92rem/);
  assert.match(css, /\.flow-recommendation-btn[\s\S]*min-width: 0/);
  assert.match(css, /\.flow-recommendation-btn[\s\S]*box-shadow: none/);
  assert.doesNotMatch(html, /id="recommend-[^"]+" class="secondary-btn/);
}
);

test('front-end navigation moves between home and all workflows', () => {
  const app = read('public/app.js');

  assert.match(app, /const homeSection = document\.getElementById\('home-section'\)/);
  assert.match(app, /const baziMinute = document\.getElementById\('bazi-minute'\)/);
  assert.match(app, /const baziBirthPlace = document\.getElementById\('bazi-birth-place'\)/);
  assert.match(app, /const baziLongitude = document\.getElementById\('bazi-longitude'\)/);
  assert.match(app, /const baziTrueSolar = document\.getElementById\('bazi-true-solar'\)/);
  assert.match(app, /const baziZiMode = document\.getElementById\('bazi-zi-mode'\)/);
  assert.match(app, /const BAZI_CITY_LONGITUDES = /);
  assert.match(app, /function getBaziLongitude\(\)/);
  assert.match(app, /const baziReverseSubmitBtn = document\.getElementById\('bazi-reverse-submit-btn'\)/);
  assert.match(app, /const resultHomeBtn = document\.getElementById\('result-home-btn'\)/);
  assert.match(app, /const luohouSingleDayBtn = document\.getElementById\('luohou-single-day-btn'\)/);
  assert.match(app, /zhouyiEntryBtn\.addEventListener\('click', openZhouyiSection\)/);
  assert.match(app, /baziEntryBtn\.addEventListener\('click', \(\) => \{/);
  assert.match(app, /fetch\('\/api\/bazi\/reverse'/);
  assert.match(app, /minute: baziMinute\.value/);
  assert.match(app, /birthPlace: baziBirthPlace\.value/);
  assert.match(app, /longitude: getBaziLongitude\(\)/);
  assert.match(app, /trueSolar: baziTrueSolar\.checked/);
  assert.match(app, /ziMode: baziZiMode\.value/);
  assert.match(app, /fetch\('\/api\/luohou\/interpret'/);
  assert.match(app, /shengxiaoEntryBtn\.addEventListener\('click', \(\) => \{/);
  assert.match(app, /luohouEntryBtn\.addEventListener\('click', \(\) => \{/);
  assert.match(app, /luohouSingleDayBtn\.addEventListener\('click', startLuohouSingleDayReading\)/);
  assert.match(app, /resultHomeBtn\.addEventListener\('click', \(\) => \{/);
  assert.match(app, /updateQuestionEcho\(''\)/);
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

  assert.match(html, /class="question-templates"[\s\S]*data-question-template="感情拉扯"/);
  assert.match(html, /data-question-template="工作选择"/);
  assert.match(html, /id="zhouyi-message" class="form-message" role="alert"/);
  assert.match(html, /id="bazi-message" class="form-message" role="alert"/);
  assert.match(html, /id="question-echo" class="question-echo"[\s\S]*你问的是/);
  assert.match(html, /先给你一句定心话/);
  assert.match(html, /陪你把这件事捋一捋/);
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
  assert.match(app, /function updateQuestionEcho\(question\)/);
  assert.match(app, /function renderStructuredResult/);
  assert.match(app, /function startLuohouSingleDayReading/);
  assert.match(app, /startLuohouReading\(1\)/);
  assert.match(app, /questionTemplateBtns\.forEach/);
  assert.doesNotMatch(app, /alert\(/);
});

test('mobile bazi result cards stay inside the viewport and wrap long lines', () => {
  const css = read('public/style.css');

  assert.match(css, /body[\s\S]*overflow-x: hidden/);
  assert.match(css, /\.result-card[\s\S]*min-width: 0/);
  assert.match(css, /\.result-card-list li[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.bazi-result[\s\S]*max-width: 100%/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*\.card[\s\S]*padding: 1\.25rem/);
});

test('mobile form bottom sheets are available for bazi and luohou', () => {
  const html = read('public/index.html');
  const css = read('public/style.css');
  const app = read('public/app.js');

  assert.match(html, /id="bazi-sheet-open-btn"[\s\S]*data-sheet-target="bazi-input-sheet"[\s\S]*填写出生信息/);
  assert.match(html, /id="bazi-input-sheet" class="mobile-sheet" role="dialog" aria-modal="true"/);
  assert.match(html, /id="bazi-sheet-close-btn"[\s\S]*data-sheet-close/);
  assert.match(html, /id="luohou-sheet-open-btn"[\s\S]*data-sheet-target="luohou-input-sheet"[\s\S]*选择查询日期/);
  assert.match(html, /id="luohou-input-sheet" class="mobile-sheet" role="dialog" aria-modal="true"/);
  assert.match(html, /class="sheet-backdrop" data-sheet-close/);

  assert.match(css, /--ink-black:\s*#1a1a1a/);
  assert.match(css, /--cinnabar-red:\s*#c02c38/);
  assert.match(css, /--gold-foil:\s*#dfc28b/);
  assert.match(css, /\.mobile-sheet[\s\S]*transform: translateY\(100%\)/);
  assert.match(css, /\.mobile-sheet\.active[\s\S]*transform: translateY\(0\)/);
  assert.match(css, /transition: transform 0\.3s cubic-bezier\(0\.25, 0\.8, 0\.25, 1\)/);
  assert.match(css, /@media \(min-width: 721px\)[\s\S]*\.mobile-sheet[\s\S]*transform: none/);

  assert.match(app, /function openMobileSheet\(sheet\)/);
  assert.match(app, /function closeMobileSheets\(\)/);
  assert.match(app, /document\.querySelectorAll\('\[data-sheet-target\]'\)/);
  assert.match(app, /document\.body\.classList\.add\('sheet-open'\)/);
});

test('streaming interpretation keeps a blinking cursor and follows new text', () => {
  const css = read('public/style.css');
  const app = read('public/app.js');

  assert.match(css, /\.cursor-blink/);
  assert.match(css, /@keyframes cursorBlink/);
  assert.match(app, /function renderStreamingText\(/);
  assert.match(app, /class="cursor cursor-blink"/);
  assert.match(app, /window\.scrollTo\(\{ top: document\.body\.scrollHeight, behavior: 'smooth' \}\)/);
});

test('share export adds a share-only emotional quote card and prepares a focused snapshot', () => {
  const html = read('public/index.html');
  const css = read('public/style.css');
  const app = read('public/app.js');

  assert.match(html, /id="share-card-footer" class="share-card-footer share-only-block"/);
  assert.match(html, /id="share-card-quote" class="share-card-quote"/);
  assert.match(html, /这一卦想对你说/);
  assert.match(html, /id="interpretation-emotion-block"/);
  assert.match(html, /id="interpretation-modern-block"/);

  assert.match(css, /\.share-only-block[\s\S]*display: none/);
  assert.match(css, /\.share-mode \.share-only-block[\s\S]*display: block !important/);
  assert.match(css, /\.share-card-footer/);
  assert.match(css, /\.share-card-quote/);
  assert.match(css, /\.share-mode #interpretation-emotion-block[\s\S]*display: none !important/);

  assert.match(app, /function extractShareSentence\(\)/);
  assert.match(app, /function prepareShareCard\(\)/);
  assert.match(app, /function cleanupShareCard\(\)/);
  assert.match(app, /shareCardQuote\.textContent = /);
  assert.match(app, /心安分享图_/);
});

test('result footer share button stays readable on narrow screens', () => {
  const html = read('public/index.html');
  const css = read('public/style.css');

  assert.match(html, /id="share-btn" class="secondary-btn share-btn-style"[\s\S]*保存心安分享图/);
  assert.match(css, /\.share-btn-style[\s\S]*font-size:\s*1\.02rem/);
  assert.match(css, /\.share-btn-style[\s\S]*letter-spacing:\s*0/);
  assert.match(css, /\.share-btn-style[\s\S]*white-space:\s*nowrap/);
  assert.match(css, /\.share-btn-style[\s\S]*flex:\s*1 1 220px/);
});

test('bazi reading scrolls smoothly to the result after submitting', () => {
  const app = read('public/app.js');

  assert.match(app, /function scrollToResult\(target\)/);
  assert.match(app, /target\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
  assert.match(app, /baziResultWrapper\.style\.display = 'block'[\s\S]*scrollToResult\(baziResultWrapper\)/);
});

test('luohou range submit does not pass the click event as query days', () => {
  const app = read('public/app.js');

  assert.match(app, /function startLuohouReading\(daysOverride\)/);
  assert.match(app, /const queryDays = daysOverride === undefined \? luohouDays\.value : daysOverride/);
  assert.match(app, /luohouSubmitBtn\.addEventListener\('click', \(\) => startLuohouReading\(\)\)/);
  assert.match(app, /luohouSingleDayBtn\.addEventListener\('click', startLuohouSingleDayReading\)/);
});

test('yarrow mode uses haptic feedback at key ritual steps', () => {
  const yarrow = read('public/yarrow.js');

  assert.match(yarrow, /function vibrateFeedback\(pattern\)/);
  assert.match(yarrow, /navigator\.vibrate\(pattern\)/);
  assert.match(yarrow, /vibrateFeedback\(50\)/);
  assert.match(yarrow, /vibrateFeedback\(\[100, 50, 100\]\)/);
});
