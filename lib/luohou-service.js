const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_DAYS = 15;
const MAX_AI_LUOHOU_OUTPUT_LENGTH = 12000;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const luohouScriptPath = path.join(__dirname, '..', 'bazi-master', 'luohou.py');

function stripAnsi(text) {
  return String(text).replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function cleanLuohouOutput(text) {
  return stripAnsi(text)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !/^\s*-{3,}\s*$/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number)) {
    throw new Error(`${label}必须是整数`);
  }
  return number;
}

function parseDateInput(input) {
  const date = String(input.date || '').trim();

  if (date) {
    const match = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) {
      throw new Error('请选择有效的公历日期');
    }
    return {
      year: toInteger(match[1], '年份'),
      month: toInteger(match[2], '月份'),
      day: toInteger(match[3], '日期'),
    };
  }

  return {
    year: toInteger(input.year, '年份'),
    month: toInteger(input.month, '月份'),
    day: toInteger(input.day, '日期'),
  };
}

function normalizeLuohouInput(input = {}) {
  const { year, month, day } = parseDateInput(input);
  const days = input.days === undefined || input.days === ''
    ? DEFAULT_DAYS
    : toInteger(input.days, '查询天数');

  const candidate = new Date(Date.UTC(year, month - 1, day));
  const isValidDate = candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day;

  if (!isValidDate || year < MIN_YEAR || year > MAX_YEAR) {
    throw new Error('请选择有效的公历日期');
  }
  if (days < 1 || days > 90) {
    throw new Error('查询天数必须在 1 到 90 之间');
  }

  return { year, month, day, days };
}

function buildLuohouArgs(input) {
  const { year, month, day, days } = normalizeLuohouInput(input);
  return [
    luohouScriptPath,
    '-d',
    `${year} ${month} ${day}`,
    '-n',
    String(days),
  ];
}

function normalizeLuohouInterpretationInput(input = {}) {
  const luohouOutput = String(input.luohouOutput || '').trim();

  if (!luohouOutput) {
    throw new Error('请先完成罗喉择日，再生成大白话解读');
  }

  return {
    luohouOutput: luohouOutput.slice(0, MAX_AI_LUOHOU_OUTPUT_LENGTH),
  };
}

function buildLuohouInterpretationMessages(input) {
  const { luohouOutput } = normalizeLuohouInterpretationInput(input);
  const systemPrompt = `你是一位熟悉罗喉择日、九宫飞星、岁破月破与传统择日术语的中文解释助手。你的任务不是重新推算，而是把用户已有的罗喉择日结果翻译成现代人能看懂的大白话。

请严格遵守：
1. 只根据用户提供的择日文本解释，不要重新推算，不要编造文本里没有的信息。
2. 输出要通俗、克制、可执行，不要制造焦虑，不要恐吓用户。
3. 明确提示择日内容只适合作为传统文化参考，不能替代现实决策。
4. 分成「整体看法」「需要留意的日时」「比较可用的信息」「行动建议」四小段。
5. 每段尽量短，用普通话解释术语。
6. 直接开始解释，不要寒暄，不要使用 emoji，不要使用 Markdown 粗体、分隔线或列表符号。
7. 禁止出现“这份择日结果”“下面”“我们来”“我来”“先说明”等开场说明。`;

  const userPrompt = `请把下面这份罗喉择日结果翻译成大白话解读：\n\n${luohouOutput}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

function explainPythonFailure(stderr, code) {
  if (stderr.includes("No module named 'sxtwl'")) {
    return '罗喉择日依赖缺失：请先安装 Python 依赖 sxtwl。';
  }
  if (stderr.includes("No module named 'lunar_python'")) {
    return '罗喉择日依赖缺失：请先安装 Python 依赖 lunar_python。';
  }
  if (stderr.includes("No module named 'bidict'")) {
    return '罗喉择日依赖缺失：请先安装 Python 依赖 bidict。';
  }
  if (stderr.includes("No module named 'colorama'")) {
    return '罗喉择日依赖缺失：请先安装 Python 依赖 colorama。';
  }
  return `罗喉择日脚本执行失败（退出码 ${code}）：${stripAnsi(stderr).trim() || '未返回错误信息'}`;
}

async function runLuohouReading(input, options = {}) {
  const args = buildLuohouArgs(input);
  const spawnImpl = options.spawnImpl || spawn;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const child = spawnImpl('python3', args, {
      cwd: path.join(__dirname, '..', 'bazi-master'),
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (child.kill) child.kill('SIGTERM');
      reject(new Error('罗喉择日查询超时，请稍后再试'));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`无法启动罗喉择日脚本：${error.message}`));
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(explainPythonFailure(stderr, code)));
        return;
      }

      resolve({ output: cleanLuohouOutput(stdout) });
    });
  });
}

module.exports = {
  buildLuohouInterpretationMessages,
  buildLuohouArgs,
  cleanLuohouOutput,
  normalizeLuohouInput,
  normalizeLuohouInterpretationInput,
  runLuohouReading,
  stripAnsi,
};
