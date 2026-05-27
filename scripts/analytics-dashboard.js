const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const logPath = path.join(rootDir, 'analytics_events.log');
const outputPath = path.join(rootDir, 'analytics-dashboard.html');

function readEvents() {
  if (!fs.existsSync(logPath)) return [];
  return fs.readFileSync(logPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (_error) {
        return null;
      }
    })
    .filter(Boolean);
}

function uniqueSessions(events, eventName) {
  const scoped = eventName ? events.filter(item => item.event === eventName) : events;
  return new Set(scoped.map(item => item.sessionId).filter(Boolean)).size;
}

function uniqueSessionsAny(events, eventNames) {
  const names = new Set(eventNames);
  return new Set(events
    .filter(item => names.has(item.event))
    .map(item => item.sessionId)
    .filter(Boolean)).size;
}

function countBy(events, eventName) {
  return events.filter(item => item.event === eventName).length;
}

function rate(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMetrics(events) {
  const sessions = uniqueSessions(events);
  const pageViews = uniqueSessions(events, 'page_view') || sessions;
  const entered = uniqueSessions(events, 'enter_click');
  const inputStarted = uniqueSessionsAny(events, ['question_draft_started', 'question_input_start']);
  const submitted = uniqueSessions(events, 'submit_click');
  const divineSuccess = uniqueSessions(events, 'divine_success');
  const interpreted = uniqueSessions(events, 'interpret_complete');
  const shared = uniqueSessions(events, 'share_generate_success') || uniqueSessions(events, 'share_click');
  const followedUp = uniqueSessions(events, 'followup_question_click');
  const helperOpened = uniqueSessions(events, 'question_helper_open');
  const errors = events.filter(item => item.event === 'divine_error');

  const funnel = [
    { name: '进入提问', value: entered, base: pageViews || sessions, hint: '首页主按钮是否足够明确' },
    { name: '开始输入', value: inputStarted, base: entered, hint: '提问页有没有帮用户开口' },
    { name: '提交问卦', value: submitted, base: inputStarted, hint: '问题是否被整理到“可以问”' },
    { name: '起卦成功', value: divineSuccess, base: submitted, hint: '接口和网络稳定性' },
    { name: '解读完成', value: interpreted, base: divineSuccess, hint: 'AI 等待体验和成功率' },
    { name: '保存心安屿卡片', value: shared, base: interpreted, hint: '结果是否戳中、是否想分享' },
  ].map(step => ({ ...step, conversion: rate(step.value, step.base) }));

  const weakest = funnel
    .filter(step => step.base > 0 && step.conversion < 100)
    .sort((a, b) => a.conversion - b.conversion)[0];

  const actions = [];
  if (errors.length) actions.push('先处理失败记录，稳定性优先于增长优化。');
  if (weakest) actions.push(`${weakest.name} 是当前最大掉点，先看：${weakest.hint}。`);
  if (rate(shared, interpreted) < 20 && interpreted > 0) actions.push('保存率偏低，继续优化落点句和心安屿卡片文案。');
  if (rate(followedUp, interpreted) < 15 && interpreted > 0) actions.push('追问率偏低，把追问按钮改得更像用户真实下一问。');
  if (rate(helperOpened, entered) < 35 && entered > 0) actions.push('提问助手打开率偏低，让“帮我问清楚”更轻、更即时。');
  if (!actions.length) actions.push('当前样本还少，先继续积累真实访问数据。');

  return {
    sessions,
    pageViews,
    interpreted,
    shared,
    followedUp,
    helperOpened,
    errors,
    funnel,
    weakest,
    actions: [...new Set(actions)].slice(0, 5),
  };
}

function buildDashboardHtml(metrics) {
  const maxValue = Math.max(...metrics.funnel.map(step => step.value), 1);
  const cards = [
    ['会话数', metrics.sessions, '有行为记录的访问'],
    ['完成解读', metrics.interpreted, '北极星：被接住的问卦'],
    ['保存卡片', metrics.shared, `${rate(metrics.shared, metrics.interpreted)}% 解读后保存`],
    ['继续追问', metrics.followedUp, `${rate(metrics.followedUp, metrics.interpreted)}% 解读后追问`],
  ];

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>心安屿产品数据面板</title>
  <style>
    :root { color-scheme: light; --bg:#f6efe6; --card:#fffaf3; --ink:#2b211d; --muted:#8a7a6c; --line:#eaded2; --accent:#7c594b; }
    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Noto Sans SC",sans-serif; background:var(--bg); color:var(--ink); }
    main { width:min(1080px, calc(100% - 32px)); margin:40px auto; }
    h1 { font-size:32px; margin:0 0 8px; }
    p { color:var(--muted); line-height:1.8; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:14px; margin:24px 0; }
    .card, .panel { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:22px; box-shadow:0 16px 36px rgba(70,48,34,.06); }
    .metric { font-size:34px; font-weight:750; margin:8px 0 0; }
    .section-title { margin-top:32px; font-size:20px; }
    .funnel-row { display:grid; grid-template-columns:120px 1fr 88px; gap:14px; align-items:center; margin:14px 0; }
    .bar { height:14px; border-radius:999px; background:#eee5dc; overflow:hidden; }
    .bar span { display:block; height:100%; width:var(--w); background:linear-gradient(90deg,#b99683,#6f4e42); }
    ol { padding-left:22px; line-height:1.9; }
    code { background:#f0e7dc; padding:2px 6px; border-radius:6px; }
  </style>
</head>
<body>
  <main>
    <h1>心安屿产品数据面板</h1>
    <p>从 <code>analytics_events.log</code> 生成。它不是给工程师看的原始日志，而是把主链路翻译成产品判断。</p>
    <section class="grid">
      ${cards.map(([label, value, note]) => `<article class="card"><span>${escapeHtml(label)}</span><div class="metric">${escapeHtml(value)}</div><p>${escapeHtml(note)}</p></article>`).join('')}
    </section>
    <section class="panel">
      <h2 class="section-title">主链路漏斗</h2>
      ${metrics.funnel.map(step => `<div class="funnel-row"><strong>${escapeHtml(step.name)}</strong><div class="bar"><span style="--w:${Math.max(4, Math.round((step.value / maxValue) * 100))}%"></span></div><span>${step.conversion}%</span></div>`).join('')}
    </section>
    <section class="panel">
      <h2 class="section-title">下一步优先动作</h2>
      <ol>${metrics.actions.map(action => `<li>${escapeHtml(action)}</li>`).join('')}</ol>
    </section>
    <p>生成时间：${escapeHtml(new Date().toLocaleString('zh-CN', { hour12: false }))}</p>
  </main>
</body>
</html>`;
}

function main() {
  const events = readEvents();
  const metrics = buildMetrics(events);
  const html = buildDashboardHtml(metrics);
  fs.writeFileSync(outputPath, html);
  console.log(`已生成产品数据面板：${outputPath}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  readEvents,
  buildMetrics,
  buildDashboardHtml,
};
