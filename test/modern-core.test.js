const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const core = require(path.join(root, 'public/modern-core.js'));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('modern core exposes pure question and analytics helpers', () => {
  assert.equal(core.analyzeQuestionDraft('我想辞职').hasEvent, true);
  assert.equal(core.analyzeQuestionDraft('明天上班，不懂').hasEvent, true);
  assert.equal(core.analyzeQuestionDraft('刚投流了，不懂效果怎么样').hasEvent, true);
  assert.equal(core.sanitizeAnalyticsPayload({
    question: '不要记录原文',
    questionLength: 12,
    source: 'manual',
  }).question, undefined);
  assert.equal(core.sanitizeAnalyticsPayload({ questionLength: 12 }).questionLength, 12);
});

test('modern core sanitizes analytics payload without leaking free text or nested data', () => {
  const sanitized = core.sanitizeAnalyticsPayload({
    question: '我要不要主动联系他',
    content: '很私密的一段话',
    nested: { raw: '不要进日志' },
    list: ['也不要进日志'],
    tokenValue: 'secret',
    source: 'manual',
    questionLength: 18,
    okFlag: true,
    badKey$: 'bad',
  });

  assert.deepEqual(sanitized, {
    source: 'manual',
    questionLength: 18,
    okFlag: true,
  });
});

test('modern core extracts stable conflict tags from messy questions', () => {
  assert.equal(core.extractConflictTag(''), '眼前的选择');
  assert.equal(core.extractConflictTag('我要不要主动联系他，还是等一等？'), '要不要主动联系他');
  assert.equal(core.extractConflictTag('这份工作我接还是不接，接了以后会不会更累？'), '会不会更累');
  assert.equal(
    core.extractConflictTag('关于刚才这件事: 这份工作我接不接，变卦是「无妄卦」。这个变化对我意味着什么？'),
    '接还是不接',
  );
  assert.equal(
    core.extractConflictTag('我现在这个项目停滞了，我不懂要怎么继续做了'),
    '工作里的选择',
  );
});

test('modern core fallback judgment is deterministic and scenario aware', () => {
  const workQuestion = '这份工作我现在到底该不该接，会不会接了以后更累？';
  const relationQuestion = '我要不要主动联系他，还是再等等？';

  assert.equal(
    core.getContextualFallbackJudgment(workQuestion),
    core.getContextualFallbackJudgment(workQuestion),
  );
  assert.ok(core.getContextualFallbackJudgment(workQuestion).length >= 8);
  assert.ok(core.getContextualFallbackJudgment(relationQuestion).length >= 8);
  assert.notEqual(
    core.getContextualFallbackJudgment(workQuestion),
    core.getContextualFallbackJudgment(relationQuestion),
  );
});

test('modern core rejects weak or hallucinated judgment candidates', () => {
  assert.equal(core.isUsableJudgmentCandidate('本卦显示事情还在变化', '我要不要继续'), false);
  assert.equal(core.isUsableJudgmentCandidate('项目卡在想拉人一起干的尴尬期。', '项目停滞了怎么办'), false);
  assert.equal(core.isUsableJudgmentCandidate('先把边界看清，再决定下一步。', '项目停滞了怎么办'), true);
});

test('modern core contextual fallback picker can reach every option for varied seeds', () => {
  const options = ['A', 'B', 'C'];
  const seen = new Set(Array.from({ length: 80 }, (_, index) => (
    core.pickContextualFallback(options, `seed-${index}`)
  )));

  assert.deepEqual([...seen].sort(), options);
});

test('modern core strips changed hexagram wording before deriving user-facing text', () => {
  assert.equal(
    core.stripChangedTitleFromQuestion('关于刚才这件事：我要不要继续推进，变卦是「益卦」。接下来我最该注意什么？'),
    '我要不要继续推进',
  );
});

test('modern page loads the core module before the app shell', () => {
  const html = read('public/modern.html');
  const coreIndex = html.indexOf('modern-core.js');
  const appIndex = html.indexOf('modern.js');

  assert.ok(coreIndex > -1, 'modern-core.js should be loaded');
  assert.ok(appIndex > coreIndex, 'modern.js should load after modern-core.js');
});

test('modern app uses shared core helpers instead of owning every pure rule', () => {
  const js = read('public/modern.js');

  assert.match(js, /const ModernCore = window\.XinanModernCore/);
  assert.match(js, /ModernCore\.analyzeQuestionDraft/);
  assert.match(js, /ModernCore\.sanitizeAnalyticsPayload/);
  assert.match(js, /ModernCore\.getContextualFallbackJudgment/);
  assert.doesNotMatch(js, /const BLOCKED_ANALYTICS_KEYS =/);
  assert.doesNotMatch(js, /const SAFE_ANALYTICS_KEYS =/);
  assert.doesNotMatch(js, /const SHORT_INTENT_PATTERN =/);
  assert.doesNotMatch(js, /const WEAK_JUDGMENT_PATTERN =/);
  assert.doesNotMatch(js, /const UNSTATED_FACT_TERMS =/);
});
