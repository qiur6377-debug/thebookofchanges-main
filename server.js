/**
 * 国学易经算命网站 - 后端服务器
 * 
 * 核心职责：
 * 1. 启动时加载64卦 Markdown 知识库到内存
 * 2. 提供 POST /api/divine 接口：接收用户问题，模拟起卦，调用 Qwen AI 流式解读
 * 3. 提供静态文件服务（public 目录）
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { buildBaziInterpretationMessages, runBaziReading, runBaziReverseReading } = require('./lib/bazi-service');
const { buildLuohouInterpretationMessages, runLuohouReading } = require('./lib/luohou-service');
const { runShengxiaoReading } = require('./lib/shengxiao-service');
const { streamQwenResponse } = require('./lib/ai-stream-service');
const { createApiRateLimiter } = require('./lib/http-middleware');
require('dotenv').config();

// 如果还没安装 sqlite3，可能需要用户执行下 npm install sqlite3
let db;
try {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'database.sqlite');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('连接 SQLite 失败:', err.message);
    } else {
      // 自动创建表
      db.run(`
        CREATE TABLE IF NOT EXISTS divination_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT,
          hexagram_number INTEGER,
          changing_positions TEXT,
          changed_hexagram INTEGER,
          ai_interpretation TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  });
} catch (e) {
  console.warn('⚠️ 未侦测到 sqlite3 模块。如需持久化记录请在终端执行 npm install sqlite3，并重启服务。');
  db = null;
}

const app = express();
const PORT = process.env.PORT || 3000;
const apiRateLimiter = createApiRateLimiter({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 100,
});

// ============ 知识库加载 ============

/**
 * 从 markdown 文件解析卦象数据
 * @param {string} filePath - markdown 文件路径
 * @returns {object} 卦象结构化数据
 */
function parseHexagramFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // 提取标题行（第一行 # 开头）
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '未知卦';
  return { title, content };
}

/**
 * 加载全部64卦知识库
 */
function loadKnowledgeBase() {
  const hexagrams = {};
  for (let i = 1; i <= 64; i++) {
    const filePath = path.join(__dirname, 'knowledge', `zhouyi_${i}.md`);
    if (fs.existsSync(filePath)) {
      hexagrams[i] = parseHexagramFile(filePath);
    }
  }
  console.log(`✅ 知识库加载完成，共 ${Object.keys(hexagrams).length} 卦`);
  return hexagrams;
}

const hexagrams = loadKnowledgeBase();

// ============ 起卦算法 ============

/**
 * 蓍草起卦法模拟 —— 生成一个卦号（1-64）和六爻信息
 * 每爻通过三次"分二挂一揲四归奇"得出老阴(6)/少阳(7)/少阴(8)/老阳(9)
 */
function divinate() {
  const yaoValues = [];
  const yaoLines = [];

  for (let i = 0; i < 6; i++) {
    // 模拟三变，每变得到一个余数
    let total = 49; // 大衍之数五十，其用四十有九
    const remainders = [];

    for (let change = 0; change < 3; change++) {
      // 分二
      const left = Math.floor(Math.random() * (total - 2)) + 1;
      const right = total - left;
      // 挂一
      const hung = 1;
      // 揲四归奇
      const leftRemainder = left % 4 === 0 ? 4 : left % 4;
      const rightRemainder = right % 4 === 0 ? 4 : (right - hung) % 4 === 0 ? 4 : (right - hung) % 4;
      const removed = hung + leftRemainder + rightRemainder;
      remainders.push(removed);
      total = total - removed;
    }

    // 根据三变结果计算爻值
    // 简化：用随机数模拟概率分布（老阳9:1/16, 老阴6:1/16, 少阳7:5/16, 少阴8:7/16）
    const rand = Math.random();
    let yaoValue;
    if (rand < 1 / 16) {
      yaoValue = 9; // 老阳 ⚊ → 变
    } else if (rand < 2 / 16) {
      yaoValue = 6; // 老阴 ⚋ → 变
    } else if (rand < 7 / 16) {
      yaoValue = 7; // 少阳 ⚊
    } else {
      yaoValue = 8; // 少阴 ⚋
    }

    yaoValues.push(yaoValue);
    // 阳爻(7,9)为1，阴爻(6,8)为0
    yaoLines.push(yaoValue % 2 === 1 ? 1 : 0);
  }

  // 六爻从下往上组成卦象，转换为卦号（1-64）
  // 下三爻为内卦，上三爻为外卦
  const innerTrigram = yaoLines[0] * 4 + yaoLines[1] * 2 + yaoLines[2];
  const outerTrigram = yaoLines[3] * 4 + yaoLines[4] * 2 + yaoLines[5];

  // 八卦对应先天八卦序号 → 64卦编号映射表
  // 使用文王六十四卦序（传统序号）
  const hexagramMap = [
    [1, 34, 5, 26, 11, 9, 14, 43],    // 乾
    [25, 51, 3, 27, 24, 42, 21, 17],   // 震
    [6, 40, 29, 4, 7, 59, 64, 47],     // 坎
    [33, 62, 39, 52, 15, 53, 56, 31],  // 艮
    [12, 16, 8, 23, 2, 20, 35, 45],    // 坤
    [44, 32, 48, 18, 46, 57, 50, 28],  // 巽
    [13, 55, 63, 22, 36, 37, 30, 49],  // 离
    [10, 54, 60, 41, 19, 61, 38, 58],  // 兑
  ];

  const hexagramNumber = hexagramMap[outerTrigram][innerTrigram];

  // 生成爻线的文字描述
  const yaoNames = ['初', '二', '三', '四', '五', '上'];
  const yaoDescriptions = yaoValues.map((v, i) => {
    const position = yaoNames[i];
    const type = v % 2 === 1 ? '阳' : '阴';
    const changing = (v === 6 || v === 9) ? '（动爻）' : '';
    return `${position}爻：${type}${changing}`;
  });

  // ====== 计算之卦（变卦）======
  // 动爻：老阳(9)变阴，老阴(6)变阳；少阳(7)少阴(8)不变
  const changingPositions = []; // 记录哪些爻是动爻（0-indexed）
  const changedYaoLines = yaoLines.map((line, i) => {
    const v = yaoValues[i];
    if (v === 9) { changingPositions.push(i); return 0; } // 老阳变阴
    if (v === 6) { changingPositions.push(i); return 1; } // 老阴变阳
    return line; // 不变
  });

  let changedHexagramNumber = null;
  if (changingPositions.length > 0) {
    const changedInner = changedYaoLines[0] * 4 + changedYaoLines[1] * 2 + changedYaoLines[2];
    const changedOuter = changedYaoLines[3] * 4 + changedYaoLines[4] * 2 + changedYaoLines[5];
    changedHexagramNumber = hexagramMap[changedOuter][changedInner];
  }

  return {
    hexagramNumber,
    yaoValues,
    yaoLines,
    yaoDescriptions,
    changingPositions,       // 动爻位置数组
    changedYaoLines,         // 变后的爻线
    changedHexagramNumber,   // 之卦编号（无动爻时为 null）
  };
}

// ============ API 路由 ============

app.use(express.json());
app.use('/api/', apiRateLimiter);
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /api/divine
 * 接收用户问题，起卦并返回纯 JSON 卦象信息（含动爻与之卦）
 * 支持两种模式：
 *   1. 快速模式：仅传 question，后端算法起卦
 *   2. 蓍草模式：同时传 yaoValues（前端 Canvas 交互生成），后端直接查表
 */
app.post('/api/divine', (req, res) => {
  const { question, yaoValues: manualYaoValues } = req.body;

  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: '请输入您想要占卜的问题' });
  }

  let result;

  if (manualYaoValues && Array.isArray(manualYaoValues) && manualYaoValues.length === 6) {
    // 蓍草模式：使用前端传来的爻值，后端仅负责查表
    const yaoValues = manualYaoValues;
    const yaoLines = yaoValues.map(v => v % 2 === 1 ? 1 : 0);

    const innerTrigram = yaoLines[0] * 4 + yaoLines[1] * 2 + yaoLines[2];
    const outerTrigram = yaoLines[3] * 4 + yaoLines[4] * 2 + yaoLines[5];

    const hexagramMap = [
      [1, 34, 5, 26, 11, 9, 14, 43],
      [25, 51, 3, 27, 24, 42, 21, 17],
      [6, 40, 29, 4, 7, 59, 64, 47],
      [33, 62, 39, 52, 15, 53, 56, 31],
      [12, 16, 8, 23, 2, 20, 35, 45],
      [44, 32, 48, 18, 46, 57, 50, 28],
      [13, 55, 63, 22, 36, 37, 30, 49],
      [10, 54, 60, 41, 19, 61, 38, 58],
    ];

    const hexagramNumber = hexagramMap[outerTrigram][innerTrigram];
    const yaoNames = ['初', '二', '三', '四', '五', '上'];
    const yaoDescriptions = yaoValues.map((v, i) => {
      const position = yaoNames[i];
      const type = v % 2 === 1 ? '阳' : '阴';
      const changing = (v === 6 || v === 9) ? '（动爻）' : '';
      return `${position}爻：${type}${changing}`;
    });

    const changingPositions = [];
    const changedYaoLines = yaoLines.map((line, i) => {
      const v = yaoValues[i];
      if (v === 9) { changingPositions.push(i); return 0; }
      if (v === 6) { changingPositions.push(i); return 1; }
      return line;
    });

    let changedHexagramNumber = null;
    if (changingPositions.length > 0) {
      const changedInner = changedYaoLines[0] * 4 + changedYaoLines[1] * 2 + changedYaoLines[2];
      const changedOuter = changedYaoLines[3] * 4 + changedYaoLines[4] * 2 + changedYaoLines[5];
      changedHexagramNumber = hexagramMap[changedOuter][changedInner];
    }

    result = { hexagramNumber, yaoValues, yaoLines, yaoDescriptions, changingPositions, changedYaoLines, changedHexagramNumber };
  } else {
    // 快速模式：后端算法起卦
    result = divinate();
  }

  const hexagram = hexagrams[result.hexagramNumber];

  if (!hexagram) {
    return res.status(500).json({ error: '起卦失败，请重试' });
  }

  // 构建之卦信息
  let changedTitle = null;
  if (result.changedHexagramNumber && hexagrams[result.changedHexagramNumber]) {
    changedTitle = hexagrams[result.changedHexagramNumber].title;
  }

  res.json({
    hexagramNumber: result.hexagramNumber,
    title: hexagram.title,
    yaoLines: result.yaoLines,
    yaoDescriptions: result.yaoDescriptions,
    changingPositions: result.changingPositions,
    changedHexagramNumber: result.changedHexagramNumber,
    changedTitle,
    changedYaoLines: result.changedYaoLines,
  });
});

/**
 * POST /api/bazi
 * 接收出生时间信息，调用 bazi-master/bazi.py 输出八字排盘结果
 */
app.post('/api/bazi', async (req, res) => {
  try {
    const result = await runBaziReading(req.body);
    res.json(result);
  } catch (error) {
    const message = error.message || '八字排盘失败，请稍后再试';
    const isInputError = /^(出生|闰月)/.test(message);
    res.status(isInputError ? 400 : 500).json({ error: message });
  }
});

/**
 * POST /api/bazi/reverse
 * 直接输入四柱，调用 bazi-master/bazi.py -b 反推可能出生时间
 */
app.post('/api/bazi/reverse', async (req, res) => {
  try {
    const result = await runBaziReverseReading(req.body);
    res.json(result);
  } catch (error) {
    const message = error.message || '四柱反推失败，请稍后再试';
    const isInputError = /^(年柱|月柱|日柱|时柱|起始年份|结束年份|年份范围)/.test(message);
    res.status(isInputError ? 400 : 500).json({ error: message });
  }
});

/**
 * POST /api/shengxiao
 * 接收生肖，调用 bazi-master/shengxiao.py 输出合冲刑害关系
 */
app.post('/api/shengxiao', async (req, res) => {
  try {
    const result = await runShengxiaoReading(req.body);
    res.json(result);
  } catch (error) {
    const message = error.message || '生肖合婚查询失败，请稍后再试';
    const isInputError = /^请选择正确的生肖/.test(message);
    res.status(isInputError ? 400 : 500).json({ error: message });
  }
});

/**
 * POST /api/luohou
 * 接收起始日期与天数，调用 bazi-master/luohou.py 输出罗喉日时与风水择日辅助
 */
app.post('/api/luohou', async (req, res) => {
  try {
    const result = await runLuohouReading(req.body);
    res.json(result);
  } catch (error) {
    const message = error.message || '罗喉择日查询失败，请稍后再试';
    const isInputError = /^(请选择有效的公历日期|查询天数)/.test(message);
    res.status(isInputError ? 400 : 500).json({ error: message });
  }
});

/**
 * POST /api/luohou/interpret
 * 接收罗喉择日原文，调用 Qwen 流式生成大白话解读
 */
app.post('/api/luohou/interpret', async (req, res) => {
  let messages;
  try {
    messages = buildLuohouInterpretationMessages(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message || '罗喉择日内容无效' });
  }

  await streamQwenResponse({
    res,
    messages,
    errorPrefix: '罗喉 AI 解读',
  });
});

/**
 * POST /api/bazi/interpret
 * 接收八字排盘原文，调用 Qwen 流式生成大白话解读
 */
app.post('/api/bazi/interpret', async (req, res) => {
  let messages;
  try {
    messages = buildBaziInterpretationMessages(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message || '八字排盘内容无效' });
  }

  await streamQwenResponse({
    res,
    messages,
    errorPrefix: '八字 AI 解读',
  });
});

/**
 * POST /api/interpret
 * 接收用户问题与已生成的卦象 ID，调用 Qwen AI 进行 SSE 流式解读
 */
app.post('/api/interpret', async (req, res) => {
  const { question, hexagramNumber } = req.body;
  const hexagram = hexagrams[hexagramNumber];

  if (!hexagram) {
    return res.status(400).json({ error: '卦象参数或查阅有误，无法为您解读' });
  }

  // 构建动爻信息文本（用于 AI 提示词）
  const { changingPositions, changedHexagramNumber } = req.body;
  const yaoNames = ['初', '二', '三', '四', '五', '上'];
  let changingInfo = '';
  if (changingPositions && changingPositions.length > 0) {
    const posNames = changingPositions.map(i => yaoNames[i] + '爻').join('、');
    changingInfo += `\n\n本卦有动爻：${posNames}。动爻代表此事尚有变数，请特别针对动爻的爻辞进行解读。`;
    if (changedHexagramNumber && hexagrams[changedHexagramNumber]) {
      const changedHex = hexagrams[changedHexagramNumber];
      changingInfo += `\n\n动爻变化后得到之卦（变卦）：\n${changedHex.content}\n\n请结合本卦与之卦的关系，说明事态可能的发展方向。`;
    }
  }

  // 构建 AI 提示词
  const systemPrompt = `你是一位精通周易的国学大师。请根据卦象和用户所问之事进行解读。

你的回复必须严格遵循以下格式：

第一段：用古朴典雅的语言说明卦象含义，结合用户所问之事给出指引。如果有动爻，务必专门解读动爻的爻辞含义及事态变化趋势（约350字）。

然后独占一行输出分隔标记（前后不要加任何空格、标点或其他文字）：
[大白话]

第二段：用极其浅显、现代、接地气的大白话重新解释一遍，并给出最直接的行动建议。如果有动爻和之卦，要明确告诉用户变数在哪里、怎么应对（约350字）。

重要：分隔标记 [大白话] 必须独占一行，前后不能有任何其他字符。`;

  const userPrompt = `我想占卜的问题是：${question}\n\n我用蓍草起卦法得到的卦象是：\n\n${hexagram.content}${changingInfo}\n\n请根据以上卦象和我的问题进行解读。`;
  let fullAiResponse = '';

  const streamResult = await streamQwenResponse({
    res,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    errorPrefix: 'AI',
    onContent: (content) => {
      fullAiResponse += content;
    },
    onUsage: (usage) => {
      if (!usage.total_tokens) return;
      const logLine = `[${new Date().toISOString()}] Question: ${question.replace(/\n/g, ' ').substring(0, 30)} | Input: ${usage.prompt_tokens} | Output: ${usage.completion_tokens} | Total: ${usage.total_tokens}\n`;
      fs.appendFileSync(path.join(__dirname, 'token_usage.log'), logLine);
    },
  });

  if (streamResult.ok) {
    if (db) {
      db.run(
        `INSERT INTO divination_history (question, hexagram_number, changing_positions, changed_hexagram, ai_interpretation) VALUES (?, ?, ?, ?, ?)`,
        [question, hexagramNumber, JSON.stringify(changingPositions || []), changedHexagramNumber, fullAiResponse],
        (err) => {
          if (err) console.error('保存占卜记录失败:', err.message);
        }
      );
    }
  }
});

// ============ 启动服务器 ============

app.listen(PORT, () => {
  console.log(`🔮 易经算命网站已启动: http://localhost:${PORT}`);
});
