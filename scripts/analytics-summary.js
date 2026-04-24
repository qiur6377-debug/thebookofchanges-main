const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '..', 'analytics_events.log');

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

function percent(part, total) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function rateValue(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function countBy(events, eventName) {
  return events.filter(item => item.event === eventName).length;
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

function topList(items, limit = 5) {
  return Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function printLine(label, value, note = '') {
  const padded = label.padEnd(18, ' ');
  console.log(`${padded} ${String(value).padStart(5, ' ')}${note ? `  ${note}` : ''}`);
}

function findWeakestStep(steps) {
  return steps
    .filter(step => step.denominator > 0)
    .map(step => ({ ...step, rate: rateValue(step.numerator, step.denominator) }))
    .filter(step => step.rate < 100)
    .sort((a, b) => a.rate - b.rate)[0] || null;
}

function buildProductInsights(metrics) {
  const {
    sessions,
    pageViews,
    entered,
    inputStarted,
    submitted,
    divineSuccess,
    interpreted,
    shared,
    followedUp,
    recentClicked,
    openedHelper,
    avgQuestionLength,
    errors,
  } = metrics;

  const funnelSteps = [
    { name: '首页进入提问', numerator: entered, denominator: pageViews || sessions, advice: '首页主按钮或首屏文案需要更直接，让用户更快知道可以问什么。' },
    { name: '提问页开始输入', numerator: inputStarted, denominator: entered, advice: '提问页需要更像陪用户开口，继续强化提问助手和可直接改写的句子。' },
    { name: '输入后提交', numerator: submitted, denominator: inputStarted, advice: '用户写了但没提交，可能是不确定这样问行不行，需要更强的“这个问题已经能问了”反馈。' },
    { name: '提交后起卦成功', numerator: divineSuccess, denominator: submitted, advice: '起卦失败会直接伤主链路，需要优先查接口和错误提示。' },
    { name: '起卦后解读完成', numerator: interpreted, denominator: divineSuccess, advice: '解读完成率低通常是 AI 慢、断流或等待反馈不够安定。' },
    { name: '解读后保存心安卡片', numerator: shared, denominator: interpreted, advice: '保存率低说明分享卡不够戳，优先优化落点和治愈摘句。' },
  ];

  const weakest = findWeakestStep(funnelSteps);
  const saveRate = rateValue(shared, interpreted);
  const followRate = rateValue(followedUp, interpreted);
  const recentRate = rateValue(recentClicked, interpreted);
  const helperRate = rateValue(openedHelper, entered);

  const nextActions = [];
  if (weakest) nextActions.push(weakest.advice);
  if (!weakest && interpreted > 0) {
    nextActions.push('当前样本下主链路暂未发现明显掉点，下一步重点看更多真实用户里的保存、追问和复访。');
  }
  if (helperRate < 35 && entered > 0) {
    nextActions.push('提问助手打开率偏低，可以把“帮我问清楚”的提示做得更像即时陪写，而不是折叠说明。');
  }
  if (saveRate < 20 && interpreted > 0) {
    nextActions.push('保存率偏低，优先检查心安卡片是否有一句足够治愈、能发出去的话。');
  }
  if (followRate < 15 && interpreted > 0) {
    nextActions.push('追问率偏低，可以把同一件事追问按钮改得更贴近用户的真实下一问。');
  }
  if (recentRate < 10 && interpreted > 0) {
    nextActions.push('最近问题复问率偏低，说明复访入口还没形成习惯，可以先观察更多样本。');
  }
  if (errors.length > 0) {
    nextActions.unshift('有失败记录，先看异常区，接口稳定性比增长优化更优先。');
  }
  if (nextActions.length === 0) {
    nextActions.push('当前样本下主链路没有明显掉点，下一步需要积累更多真实用户数据。');
  }

  return {
    northStar: `完成一次被接住的问卦：${interpreted} 次`,
    weakest,
    saveRate,
    followRate,
    recentRate,
    helperRate,
    avgQuestionLength,
    nextActions: [...new Set(nextActions)].slice(0, 4),
  };
}

const events = readEvents();

if (events.length === 0) {
  console.log('还没有埋点数据。先启动网站并操作几次，再运行：npm run analytics');
  process.exit(0);
}

const sessions = uniqueSessions(events);
const pageViews = uniqueSessions(events, 'page_view') || sessions;
const entered = uniqueSessions(events, 'enter_click');
const inputStarted = uniqueSessionsAny(events, ['question_draft_started', 'question_input_start']);
const submitted = uniqueSessions(events, 'submit_click');
const divineSuccess = uniqueSessions(events, 'divine_success');
const interpreted = uniqueSessions(events, 'interpret_complete');
const shared = uniqueSessions(events, 'share_generate_success') || uniqueSessions(events, 'share_click');
const rephrased = uniqueSessions(events, 'rephrase_click');
const followedUp = uniqueSessions(events, 'followup_question_click');
const recentClicked = uniqueSessions(events, 'recent_question_click');
const openedHelper = uniqueSessions(events, 'question_helper_open');
const openedChanged = uniqueSessions(events, 'changed_shell_open');

const submitEvents = events.filter(item => item.event === 'submit_click');
const avgQuestionLength = submitEvents.length
  ? Math.round(submitEvents.reduce((sum, item) => sum + (Number(item.payload?.questionLength) || 0), 0) / submitEvents.length)
  : 0;

const sourceCounts = submitEvents.reduce((acc, item) => {
  const source = item.payload?.questionSource || 'unknown';
  acc[source] = (acc[source] || 0) + 1;
  return acc;
}, {});

const chipCounts = events
  .filter(item => item.event === 'chip_click')
  .reduce((acc, item) => {
    const key = `模板 ${Number(item.payload?.chipIndex ?? -1) + 1}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const errors = events.filter(item => item.event === 'divine_error');
const insights = buildProductInsights({
  sessions,
  pageViews,
  entered,
  inputStarted,
  submitted,
  divineSuccess,
  interpreted,
  shared,
  followedUp,
  recentClicked,
  openedHelper,
  avgQuestionLength,
  errors,
});

console.log('\n心安一下埋点中文汇总');
console.log('='.repeat(36));
console.log(`数据文件：${logPath}`);
console.log(`事件总数：${events.length}`);
console.log(`页面会话：${pageViews}`);
console.log(`行为会话：${sessions}`);
console.log('');

console.log('核心漏斗');
console.log('-'.repeat(36));
printLine('进入提问', entered, `占页面会话 ${percent(entered, pageViews)}`);
printLine('开始输入', inputStarted, `进入后 ${percent(inputStarted, entered)}`);
printLine('提交问卦', submitted, `输入后 ${percent(submitted, inputStarted)}`);
printLine('起卦成功', divineSuccess, `提交后 ${percent(divineSuccess, submitted)}`);
printLine('解读完成', interpreted, `起卦后 ${percent(interpreted, divineSuccess)}`);
printLine('保存心安卡片', shared, `解读后 ${percent(shared, interpreted)}`);
printLine('换个问法', rephrased, `解读后 ${percent(rephrased, interpreted)}`);
printLine('同一件事追问', followedUp, `解读后 ${percent(followedUp, interpreted)}`);
printLine('最近问题再问', recentClicked, `解读后 ${percent(recentClicked, interpreted)}`);
console.log('');

console.log('提问助手');
console.log('-'.repeat(36));
printLine('打开助手', openedHelper, `进入后 ${percent(openedHelper, entered)}`);
printLine('即时陪写', countBy(events, 'question_coach_click'), '次');
printLine('平均问题长度', avgQuestionLength, '字');
console.log('提交来源：');
topList(sourceCounts).forEach(([source, count]) => {
  console.log(`  - ${source}: ${count}`);
});
if (Object.keys(chipCounts).length > 0) {
  console.log('常用模板点击：');
  topList(chipCounts).forEach(([name, count]) => {
    console.log(`  - ${name}: ${count}`);
  });
}
console.log('');

console.log('结果页行为');
console.log('-'.repeat(36));
printLine('展开动爻/之卦', openedChanged, `解读后 ${percent(openedChanged, interpreted)}`);
printLine('复制搜索词', countBy(events, 'copy_changed_search'));
printLine('点击搜索之卦', countBy(events, 'search_changed_click'));
printLine('分享生成失败', countBy(events, 'share_generate_error'));
console.log('');

console.log('产品判断面板');
console.log('-'.repeat(36));
console.log(`北极星指标：${insights.northStar}`);
console.log(`提问助手打开率：${insights.helperRate}%`);
console.log(`保存率：${insights.saveRate}%`);
console.log(`追问率：${insights.followRate}%`);
console.log(`最近问题复问率：${insights.recentRate}%`);
console.log(`平均问题长度：${insights.avgQuestionLength} 字`);
if (insights.weakest) {
  console.log(`当前最大掉点：${insights.weakest.name}，转化率 ${insights.weakest.rate}%`);
} else {
  console.log('当前最大掉点：暂未发现明显掉点，或样本不足。');
}
console.log('下一步建议：');
insights.nextActions.forEach((action, index) => {
  console.log(`  ${index + 1}. ${action}`);
});
console.log('');

console.log('异常');
console.log('-'.repeat(36));
if (errors.length === 0) {
  console.log('暂无起卦/解读失败记录。');
} else {
  console.log(`失败次数：${errors.length}`);
  topList(errors.reduce((acc, item) => {
    const message = item.payload?.message || '未知错误';
    acc[message] = (acc[message] || 0) + 1;
    return acc;
  }, {})).forEach(([message, count]) => {
    console.log(`  - ${message}: ${count}`);
  });
}
console.log('');
