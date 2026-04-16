const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_TIMEOUT_MS = 20000;
const MAX_AI_BAZI_OUTPUT_LENGTH = 12000;
const DEFAULT_REVERSE_START_YEAR = 1850;
const DEFAULT_REVERSE_END_YEAR = 2030;
const GAN = '甲乙丙丁戊己庚辛壬癸';
const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const baziScriptPath = path.join(__dirname, '..', 'bazi-master', 'bazi.py');

function toInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number)) {
    throw new Error(`${label}必须是整数`);
  }
  return number;
}

function normalizeBaziInput(input = {}) {
  const year = toInteger(input.year, '出生年份');
  const month = toInteger(input.month, '出生月份');
  const day = toInteger(input.day, '出生日期');
  const hour = toInteger(input.hour, '出生时辰');
  const calendar = input.calendar === 'lunar' ? 'lunar' : 'solar';
  const gender = input.gender === 'female' ? 'female' : 'male';
  const leapMonth = Boolean(input.leapMonth);

  if (year < 1850 || year > 2030) {
    throw new Error('出生年份必须在 1850 到 2030 之间');
  }
  if (month < 1 || month > 12) {
    throw new Error('出生月份必须在 1 到 12 之间');
  }
  if (day < 1 || day > 31) {
    throw new Error('出生日期必须在 1 到 31 之间');
  }
  if (hour < 0 || hour > 23) {
    throw new Error('出生时辰必须在 0 到 23 之间');
  }
  if (calendar === 'solar' && leapMonth) {
    throw new Error('闰月只适用于农历日期');
  }

  return { year, month, day, hour, calendar, gender, leapMonth };
}

function buildBaziArgs(input) {
  const normalized = normalizeBaziInput(input);
  const args = [baziScriptPath];

  if (normalized.calendar === 'solar') {
    args.push('-g');
  }
  if (normalized.calendar === 'lunar' && normalized.leapMonth) {
    args.push('-r');
  }
  if (normalized.gender === 'female') {
    args.push('-n');
  }

  args.push(
    String(normalized.year),
    String(normalized.month),
    String(normalized.day),
    String(normalized.hour)
  );

  return args;
}

function normalizePillar(value, label) {
  const pillar = String(value || '').trim();
  const gan = pillar[0];
  const zhi = pillar[1];
  const ganIndex = GAN.indexOf(gan);
  const zhiIndex = ZHI.indexOf(zhi);
  const isValid = pillar.length === 2
    && ganIndex >= 0
    && zhiIndex >= 0
    && ganIndex % 2 === zhiIndex % 2;

  if (!isValid) {
    throw new Error(`${label}必须是有效的六十甲子`);
  }

  return pillar;
}

function normalizeBaziReverseInput(input = {}) {
  const yearPillar = normalizePillar(input.yearPillar, '年柱');
  const monthPillar = normalizePillar(input.monthPillar, '月柱');
  const dayPillar = normalizePillar(input.dayPillar, '日柱');
  const hourPillar = normalizePillar(input.hourPillar, '时柱');
  const startYear = input.startYear === undefined || input.startYear === ''
    ? DEFAULT_REVERSE_START_YEAR
    : toInteger(input.startYear, '起始年份');
  const endYear = input.endYear === undefined || input.endYear === ''
    ? DEFAULT_REVERSE_END_YEAR
    : toInteger(input.endYear, '结束年份');

  if (startYear < 1 || endYear < 1 || startYear > endYear) {
    throw new Error('年份范围不正确');
  }
  if (endYear - startYear > 300) {
    throw new Error('年份范围最多查询 300 年');
  }

  return { yearPillar, monthPillar, dayPillar, hourPillar, startYear, endYear };
}

function buildBaziReverseArgs(input) {
  const normalized = normalizeBaziReverseInput(input);
  return [
    baziScriptPath,
    '-b',
    '--start',
    String(normalized.startYear),
    '--end',
    String(normalized.endYear),
    normalized.yearPillar,
    normalized.monthPillar,
    normalized.dayPillar,
    normalized.hourPillar,
  ];
}

function stripAnsi(text) {
  return String(text).replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function normalizeBaziInterpretationInput(input = {}) {
  const baziOutput = String(input.baziOutput || '').trim();

  if (!baziOutput) {
    throw new Error('请先完成八字排盘，再生成大白话解读');
  }

  return {
    baziOutput: baziOutput.slice(0, MAX_AI_BAZI_OUTPUT_LENGTH),
  };
}

function buildBaziInterpretationMessages(input) {
  const { baziOutput } = normalizeBaziInterpretationInput(input);
  const systemPrompt = `你是一位熟悉八字命理术语的中文解释助手。你的任务不是重新算命，而是把用户已有的八字排盘结果翻译成现代人能看懂的大白话。

请严格遵守：
1. 只根据排盘文本解释，不要编造排盘里没有的信息。
2. 输出要通俗、克制、可执行，不要制造焦虑，不要恐吓用户。
3. 明确提示命理内容只适合作为传统文化参考，不能替代现实决策。
4. 分成「整体印象」「性格与做事方式」「事业与财务」「关系与沟通」「行动建议」五小段，第一行必须是「整体印象：」。
5. 每段尽量短，用普通话解释术语。
6. 直接开始解读，不要寒暄，不要使用 emoji，不要使用 Markdown 粗体、分隔线或列表符号。
7. 禁止出现“这份八字排盘”“这份排盘”“下面”“我们来”“我来”“先说明”等开场说明。`;

  const userPrompt = `请把下面这份八字排盘结果翻译成大白话解读：\n\n${baziOutput}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

function explainPythonFailure(stderr, code) {
  if (stderr.includes("No module named 'lunar_python'")) {
    return '八字排盘依赖缺失：请先安装 Python 依赖 lunar_python、bidict、colorama。';
  }
  if (stderr.includes("No module named 'bidict'")) {
    return '八字排盘依赖缺失：请先安装 Python 依赖 bidict。';
  }
  if (stderr.includes("No module named 'colorama'")) {
    return '八字排盘依赖缺失：请先安装 Python 依赖 colorama。';
  }
  if (stderr.includes("No module named 'sxtwl'")) {
    return '四柱反推依赖缺失：请先安装 Python 依赖 sxtwl。';
  }
  return `八字排盘脚本执行失败（退出码 ${code}）：${stripAnsi(stderr).trim() || '未返回错误信息'}`;
}

async function runBaziReading(input, options = {}) {
  const args = buildBaziArgs(input);
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
      reject(new Error('八字排盘超时，请稍后再试'));
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
      reject(new Error(`无法启动 Python 八字排盘脚本：${error.message}`));
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(explainPythonFailure(stderr, code)));
        return;
      }

      resolve({
        output: stripAnsi(stdout).trim(),
      });
    });
  });
}

async function runBaziReverseReading(input, options = {}) {
  const args = buildBaziReverseArgs(input);
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
      reject(new Error('四柱反推超时，请缩小年份范围后再试'));
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
      reject(new Error(`无法启动 Python 四柱反推脚本：${error.message}`));
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(explainPythonFailure(stderr, code)));
        return;
      }

      resolve({
        output: stripAnsi(stdout).trim(),
      });
    });
  });
}

module.exports = {
  buildBaziArgs,
  buildBaziInterpretationMessages,
  buildBaziReverseArgs,
  normalizeBaziInput,
  normalizeBaziInterpretationInput,
  normalizeBaziReverseInput,
  runBaziReading,
  runBaziReverseReading,
  stripAnsi,
};
