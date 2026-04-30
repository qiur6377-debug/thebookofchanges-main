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
const crypto = require('crypto');
const { buildBaziInterpretationMessages, runBaziReading, runBaziReverseReading } = require('./lib/bazi-service');
const { buildLuohouInterpretationMessages, runLuohouReading } = require('./lib/luohou-service');
const { runShengxiaoReading } = require('./lib/shengxiao-service');
const { streamQwenResponse } = require('./lib/ai-stream-service');
const { createApiRateLimiter } = require('./lib/http-middleware');
require('dotenv').config();

const SAVE_DIVINATION_HISTORY = process.env.SAVE_DIVINATION_HISTORY === 'true';
const MAX_QUESTION_LENGTH = 500;
const SESSION_COOKIE_NAME = 'xinan_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PHONE_CODE_TTL_MS = 10 * 60 * 1000;
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'xinan-local-dev-secret';
const AUTH_SUCCESS_REDIRECT = process.env.AUTH_SUCCESS_REDIRECT || '/';
const AUTH_GATE_ENABLED = false;
const BLOCKED_ANALYTICS_KEYS = new Set([
  'question',
  'content',
  'text',
  'message',
  'email',
  'phone',
  'name',
  'token',
  'key',
  'password',
  'secret',
]);

// 如果还没安装 sqlite3，可能需要用户执行下 npm install sqlite3
let db;
const memoryAuthStore = {
  nextUserId: 1,
  users: [],
  sessions: new Map(),
  phoneCodes: new Map(),
  guestUsage: new Map(),
};

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
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT UNIQUE,
          wechat_openid TEXT UNIQUE,
          nickname TEXT,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS phone_login_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          consumed_at TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS guest_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guest_id TEXT NOT NULL,
          usage_date TEXT NOT NULL,
          question_count INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(guest_id, usage_date)
        )
      `);
    }
  });
} catch (e) {
  console.warn('⚠️ 未侦测到 sqlite3 模块。如需持久化记录请在终端执行 npm install sqlite3，并重启服务。');
  db = null;
}

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === 'true' || process.env.RENDER ? 1 : false);
const PORT = process.env.PORT || 3000;
const apiRateLimiter = createApiRateLimiter({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 100,
});
const publicDir = path.join(__dirname, 'public');

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

app.use(express.json({ limit: '16kb' }));
app.use('/api/', apiRateLimiter);
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/classic', (_req, res) => {
  res.sendFile(path.join(publicDir, 'classic.html'));
});

app.use(express.static(publicDir));

function sanitizeAnalyticsValue(value, depth = 0) {
  if (depth > 1) return null;
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.slice(0, 120);
  if (Array.isArray(value)) {
    return value.slice(0, 8).map(item => sanitizeAnalyticsValue(item, depth + 1));
  }
  if (typeof value === 'object' && value) {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 20)
        .filter(([key]) => /^[a-zA-Z0-9_]+$/.test(key))
        .map(([key, item]) => [key, sanitizeAnalyticsValue(item, depth + 1)])
    );
  }
  return null;
}

function isBlockedAnalyticsKey(key) {
  const normalized = String(key || '').toLowerCase();
  return BLOCKED_ANALYTICS_KEYS.has(normalized)
    || normalized.includes('question')
    || normalized.includes('content')
    || normalized.includes('token')
    || normalized.includes('secret')
    || normalized.includes('password');
}

function sanitizeAnalyticsPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  return Object.fromEntries(
    Object.entries(payload)
      .slice(0, 24)
      .filter(([key]) => /^[a-zA-Z0-9_]+$/.test(key))
      .filter(([key]) => !isBlockedAnalyticsKey(key))
      .map(([key, value]) => [key, sanitizeAnalyticsValue(value)])
  );
}

function normalizeQuestionInput(value) {
  if (typeof value !== 'string') return null;
  const question = value.trim();
  if (!question || question.length > MAX_QUESTION_LENGTH) return null;
  return question;
}

function isValidYaoValues(value) {
  return Array.isArray(value)
    && value.length === 6
    && value.every(item => Number.isInteger(item) && [6, 7, 8, 9].includes(item));
}

function normalizeChangingPositions(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 6) return null;
  const normalized = [];
  for (const item of value) {
    if (!Number.isInteger(item) || item < 0 || item > 5) return null;
    if (!normalized.includes(item)) normalized.push(item);
  }
  return normalized;
}

function createRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
}

function dbRun(sql, params = []) {
  if (!db) return Promise.resolve({ lastID: null, changes: 0 });
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  if (!db) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row || null);
    });
  });
}

function parseCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf('=');
      if (index === -1) return cookies;
      const key = decodeURIComponent(part.slice(0, index));
      const value = decodeURIComponent(part.slice(index + 1));
      cookies[key] = value;
      return cookies;
    }, {});
}

function hashSecret(value) {
  return crypto.createHash('sha256').update(`${AUTH_SECRET}:${value}`).digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function normalizePhone(value) {
  const phone = String(value || '').replace(/\s+/g, '');
  return /^1[3-9]\d{9}$/.test(phone) ? phone : null;
}

function createCookieValue(name, value, options = {}) {
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', createCookieValue(SESSION_COOKIE_NAME, token, {
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure: process.env.NODE_ENV === 'production',
  }));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', createCookieValue(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  }));
}

function formatUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    phone: user.phone || null,
    nickname: user.nickname || (user.phone ? `用户${String(user.phone).slice(-4)}` : '微信用户'),
    avatarUrl: user.avatar_url || null,
    loginType: user.phone ? 'phone' : 'wechat',
  };
}

async function findOrCreatePhoneUser(phone) {
  if (!db) {
    let user = memoryAuthStore.users.find(item => item.phone === phone);
    if (!user) {
      user = { id: memoryAuthStore.nextUserId++, phone, nickname: `用户${phone.slice(-4)}` };
      memoryAuthStore.users.push(user);
    }
    return user;
  }

  const existing = await dbGet('SELECT * FROM users WHERE phone = ?', [phone]);
  if (existing) {
    await dbRun('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [existing.id]);
    return existing;
  }
  const result = await dbRun('INSERT INTO users (phone, nickname) VALUES (?, ?)', [phone, `用户${phone.slice(-4)}`]);
  return dbGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
}

async function findOrCreateWechatUser(profile) {
  const openid = String(profile?.openid || '').trim();
  if (!openid) throw new Error('微信登录信息缺少 openid');

  if (!db) {
    let user = memoryAuthStore.users.find(item => item.wechat_openid === openid);
    if (!user) {
      user = {
        id: memoryAuthStore.nextUserId++,
        wechat_openid: openid,
        nickname: profile.nickname || '微信用户',
        avatar_url: profile.headimgurl || null,
      };
      memoryAuthStore.users.push(user);
    }
    return user;
  }

  const existing = await dbGet('SELECT * FROM users WHERE wechat_openid = ?', [openid]);
  if (existing) {
    await dbRun(
      'UPDATE users SET nickname = COALESCE(?, nickname), avatar_url = COALESCE(?, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [profile.nickname || null, profile.headimgurl || null, existing.id]
    );
    return dbGet('SELECT * FROM users WHERE id = ?', [existing.id]);
  }

  const result = await dbRun(
    'INSERT INTO users (wechat_openid, nickname, avatar_url) VALUES (?, ?, ?)',
    [openid, profile.nickname || '微信用户', profile.headimgurl || null]
  );
  return dbGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
}

async function createSession(res, user) {
  const token = createToken();
  const tokenHash = hashSecret(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  if (db) {
    await dbRun(
      'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );
  } else {
    memoryAuthStore.sessions.set(tokenHash, { userId: user.id, expiresAt });
  }

  setSessionCookie(res, token);
}

async function getUserBySessionToken(token) {
  if (!token) return null;
  const tokenHash = hashSecret(token);

  if (!db) {
    const session = memoryAuthStore.sessions.get(tokenHash);
    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
    return memoryAuthStore.users.find(user => user.id === session.userId) || null;
  }

  const row = await dbGet(
    `SELECT users.*
       FROM auth_sessions
       JOIN users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.token_hash = ?`,
    [tokenHash]
  );
  if (!row) return null;
  const session = await dbGet('SELECT expires_at FROM auth_sessions WHERE token_hash = ?', [tokenHash]);
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) return null;
  return row;
}

function getGuestId(req) {
  const guestId = String(req.headers['x-guest-id'] || '').trim();
  return /^[a-zA-Z0-9_-]{12,96}$/.test(guestId) ? guestId : null;
}

async function getAuthContext(req) {
  const cookies = parseCookies(req);
  const user = await getUserBySessionToken(cookies[SESSION_COOKIE_NAME]);
  return {
    user,
    guestId: getGuestId(req),
  };
}

function getGuestUsageKey(guestId) {
  return `${guestId}:lifetime`;
}

async function getGuestQuestionCount(guestId) {
  if (!guestId) return 0;
  if (!db) {
    return memoryAuthStore.guestUsage.get(getGuestUsageKey(guestId)) || 0;
  }
  const row = await dbGet(
    'SELECT question_count FROM guest_usage WHERE guest_id = ? AND usage_date = ?',
    [guestId, 'lifetime']
  );
  return row ? Number(row.question_count) || 0 : 0;
}

async function ensureDivinationAccess(authContext) {
  if (!AUTH_GATE_ENABLED) return { ok: true, reason: 'auth_disabled' };
  if (authContext.user) return { ok: true, reason: 'user' };
  if (!authContext.guestId) {
    return { ok: false, code: 'GUEST_ID_REQUIRED', message: '请刷新页面后再试一次' };
  }
  const count = await getGuestQuestionCount(authContext.guestId);
  if (count >= 1) {
    return { ok: false, code: 'LOGIN_REQUIRED', message: '继续问，需要先登录' };
  }
  return { ok: true, reason: 'guest' };
}

async function markDivinationUsed(authContext) {
  if (authContext.user || !authContext.guestId) return;
  if (!db) {
    const key = getGuestUsageKey(authContext.guestId);
    memoryAuthStore.guestUsage.set(key, (memoryAuthStore.guestUsage.get(key) || 0) + 1);
    return;
  }

  await dbRun(
    `INSERT INTO guest_usage (guest_id, usage_date, question_count, updated_at)
     VALUES (?, ?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(guest_id, usage_date)
     DO UPDATE SET question_count = question_count + 1, updated_at = CURRENT_TIMESTAMP`,
    [authContext.guestId, 'lifetime']
  );
}

async function storePhoneCode(phone, code) {
  const codeHash = hashSecret(`${phone}:${code}`);
  const expiresAt = new Date(Date.now() + PHONE_CODE_TTL_MS).toISOString();

  if (!db) {
    memoryAuthStore.phoneCodes.set(phone, { codeHash, expiresAt, consumedAt: null });
    return;
  }

  await dbRun(
    'INSERT INTO phone_login_codes (phone, code_hash, expires_at) VALUES (?, ?, ?)',
    [phone, codeHash, expiresAt]
  );
}

async function consumePhoneCode(phone, code) {
  const codeHash = hashSecret(`${phone}:${code}`);

  if (!db) {
    const record = memoryAuthStore.phoneCodes.get(phone);
    if (!record || record.consumedAt || record.codeHash !== codeHash || new Date(record.expiresAt).getTime() <= Date.now()) {
      return false;
    }
    record.consumedAt = new Date().toISOString();
    return true;
  }

  const record = await dbGet(
    `SELECT id, expires_at FROM phone_login_codes
      WHERE phone = ? AND code_hash = ? AND consumed_at IS NULL
      ORDER BY id DESC LIMIT 1`,
    [phone, codeHash]
  );
  if (!record || new Date(record.expires_at).getTime() <= Date.now()) return false;
  await dbRun('UPDATE phone_login_codes SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?', [record.id]);
  return true;
}

function canUseDevSmsMode() {
  return process.env.AUTH_DEV_SMS === 'true';
}

async function sendSmsCode(phone, code) {
  if (canUseDevSmsMode()) {
    console.log(`[auth] 手机号 ${phone} 的本地测试验证码：${code}`);
    return { sent: true, devCode: code };
  }
  throw new Error('短信服务未配置');
}

app.get('/api/auth/me', async (req, res) => {
  try {
    const authContext = await getAuthContext(req);
    const guestQuestionCount = await getGuestQuestionCount(authContext.guestId);
    res.json({
      user: formatUser(authContext.user),
      guest: {
        questionUsed: !authContext.user && guestQuestionCount >= 1,
      },
    });
  } catch (error) {
    console.error('读取登录状态失败:', error.message);
    res.status(500).json({ error: '登录状态暂时不可用' });
  }
});

app.post('/api/auth/phone/request-code', async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  if (!phone) {
    return res.status(400).json({ error: '请输入正确的手机号' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    await storePhoneCode(phone, code);
    const result = await sendSmsCode(phone, code);
    res.json({
      ok: true,
      message: result.devCode ? `本地测试验证码：${result.devCode}` : '验证码已发送',
      devCode: result.devCode || undefined,
    });
  } catch (error) {
    res.status(503).json({ error: error.message || '验证码发送失败，请稍后再试' });
  }
});

app.post('/api/auth/phone/verify', async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const code = String(req.body?.code || '').trim();
  if (!phone || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: '手机号或验证码格式不正确' });
  }

  try {
    const valid = await consumePhoneCode(phone, code);
    if (!valid) {
      return res.status(400).json({ error: '验证码不正确或已过期' });
    }
    const user = await findOrCreatePhoneUser(phone);
    await createSession(res, user);
    res.json({ ok: true, user: formatUser(user) });
  } catch (error) {
    console.error('手机号登录失败:', error.message);
    res.status(500).json({ error: '手机号登录失败，请稍后再试' });
  }
});

app.get('/api/auth/wechat/start', (req, res) => {
  const appId = process.env.WECHAT_APP_ID;
  const redirectUri = process.env.WECHAT_REDIRECT_URI;
  if (!appId || !redirectUri) {
    return res.status(503).json({ error: '微信登录暂未配置，请先使用手机号登录' });
  }

  const state = createToken().slice(0, 16);
  const scope = process.env.WECHAT_OAUTH_SCOPE || 'snsapi_userinfo';
  const url = new URL('https://open.weixin.qq.com/connect/oauth2/authorize');
  url.searchParams.set('appid', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  const loginUrl = `${url.toString()}#wechat_redirect`;
  if (req.query.mode === 'json') {
    return res.json({ url: loginUrl });
  }
  res.redirect(loginUrl);
});

app.get('/api/auth/wechat/callback', async (req, res) => {
  const { code } = req.query || {};
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (!code || !appId || !appSecret) {
    return res.status(400).send('微信登录配置不完整，请返回后使用手机号登录');
  }

  try {
    const tokenUrl = new URL('https://api.weixin.qq.com/sns/oauth2/access_token');
    tokenUrl.searchParams.set('appid', appId);
    tokenUrl.searchParams.set('secret', appSecret);
    tokenUrl.searchParams.set('code', String(code));
    tokenUrl.searchParams.set('grant_type', 'authorization_code');

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();
    if (!tokenData.openid || !tokenData.access_token) {
      throw new Error(tokenData.errmsg || '微信授权失败');
    }

    const profileUrl = new URL('https://api.weixin.qq.com/sns/userinfo');
    profileUrl.searchParams.set('access_token', tokenData.access_token);
    profileUrl.searchParams.set('openid', tokenData.openid);
    profileUrl.searchParams.set('lang', 'zh_CN');
    const profileResponse = await fetch(profileUrl);
    const profile = await profileResponse.json();

    const user = await findOrCreateWechatUser({
      openid: tokenData.openid,
      nickname: profile.nickname,
      headimgurl: profile.headimgurl,
    });
    await createSession(res, user);
    res.redirect(AUTH_SUCCESS_REDIRECT);
  } catch (error) {
    console.error('微信登录失败:', error.message);
    res.status(500).send('微信登录失败，请返回后使用手机号登录');
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  if (token) {
    const tokenHash = hashSecret(token);
    if (db) {
      await dbRun('DELETE FROM auth_sessions WHERE token_hash = ?', [tokenHash]).catch(error => {
        console.error('退出登录清理会话失败:', error.message);
      });
    } else {
      memoryAuthStore.sessions.delete(tokenHash);
    }
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

/**
 * POST /api/track
 * 轻量产品埋点：只记录行为与长度等元数据，不记录用户提问原文。
 */
app.post('/api/track', (req, res) => {
  const { event, payload, sessionId, timestamp, path: clientPath, viewportWidth } = req.body || {};
  const normalizedEvent = String(event || '').trim();

  if (!/^[a-zA-Z0-9_:-]{2,64}$/.test(normalizedEvent)) {
    return res.status(400).json({ error: '埋点事件名无效' });
  }

  const record = {
    event: normalizedEvent,
    payload: sanitizeAnalyticsPayload(payload),
    sessionId: String(sessionId || '').slice(0, 80),
    path: String(clientPath || '').slice(0, 120),
    viewportWidth: Number(viewportWidth) || null,
    clientTimestamp: String(timestamp || '').slice(0, 40),
    serverTimestamp: new Date().toISOString(),
  };

  fs.appendFile(
    path.join(__dirname, 'analytics_events.log'),
    `${JSON.stringify(record)}\n`,
    (error) => {
      if (error) {
        console.error('写入埋点失败:', error.message);
      }
    }
  );

  res.json({ ok: true });
});

/**
 * POST /api/divine
 * 接收用户问题，起卦并返回纯 JSON 卦象信息（含动爻与之卦）
 * 支持两种模式：
 *   1. 快速模式：仅传 question，后端算法起卦
 *   2. 蓍草模式：同时传 yaoValues（前端 Canvas 交互生成），后端直接查表
 */
app.post('/api/divine', async (req, res) => {
  const { yaoValues: manualYaoValues } = req.body || {};
  const question = normalizeQuestionInput(req.body?.question);

  if (!question) {
    return res.status(400).json({ error: '请输入您想要占卜的问题' });
  }

  let authContext;
  try {
    authContext = await getAuthContext(req);
    const access = await ensureDivinationAccess(authContext);
    if (!access.ok) {
      return res.status(access.code === 'LOGIN_REQUIRED' ? 401 : 400).json({
        code: access.code,
        error: access.message,
      });
    }
  } catch (error) {
    console.error('校验问卦权限失败:', error.message);
    return res.status(500).json({ error: '登录状态暂时不可用，请稍后再试' });
  }

  let result;

  if (manualYaoValues !== undefined) {
    if (!isValidYaoValues(manualYaoValues)) {
      return res.status(400).json({ error: '蓍草起卦参数有误，请重新起卦' });
    }
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

  try {
    await markDivinationUsed(authContext);
  } catch (error) {
    console.error('记录问卦次数失败:', error.message);
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
  const { hexagramNumber } = req.body || {};
  const question = normalizeQuestionInput(req.body?.question);
  const hexagram = hexagrams[hexagramNumber];

  if (!question) {
    return res.status(400).json({ error: '请输入您想要解读的问题' });
  }

  if (!hexagram) {
    return res.status(400).json({ error: '卦象参数或查阅有误，无法为您解读' });
  }

  // 构建动爻信息文本（用于 AI 提示词）
  const { changedHexagramNumber } = req.body || {};
  const normalizedChangingPositions = normalizeChangingPositions(req.body?.changingPositions);
  if (!normalizedChangingPositions) {
    return res.status(400).json({ error: '动爻参数有误，无法为您解读' });
  }
  const changingPositions = normalizedChangingPositions;
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
  const systemPrompt = `你不是高高在上的算命先生，而是一个懂周易、也懂年轻人情绪的中文解读助手。请根据卦象和用户所问之事，给用户一点方向感和一点安定感。

你的回复必须严格遵循以下格式：

第一段：独占一行输出标记：
[一句判断]
然后下一行给出一句短判断，14-26个字左右，必须是完整句并以句号、问号或感叹号结尾。它要像“先给一个落点”：先接住一点情绪，再给用户一个方向。不要只写四五个字，不要解释术语，不要写成列表，不要下绝对结论。

第二段：独占一行输出标记：
[定心话]
然后下一行用一句 24-55 字的短句接住用户当下的情绪，必须是完整句并以句号、问号或感叹号结尾。它会作为“落点”的第二层解释，也会进入分享卡，所以要温柔、具体、像朋友在旁边帮用户稳住。不要解释术语，不要下绝对结论，不要使用古风腔、不要故作高深、不要恐吓用户。

然后独占一行输出分隔标记（前后不要加任何空格、标点或其他文字）：
[大白话]

第三段：用年轻人能看懂的大白话详细解释，必须严格包含以下五个小标题，顺序不能改：
你现在卡在哪里：
这件事的势头：
你最该注意：
你可以怎么做：
给你一句话：

详细解释时请严格遵守：
1. 只根据用户问题、卦象、动爻与之卦来解释，不要编造卦里没有的信息。卦理是依据，不是正文主角。
2. 每个小标题下面都必须按“三层写法”：
   第一行：用 **加粗** 写一句人话结论，先说用户眼下该怎么理解这件事。
   第二行：用本卦、动爻、之卦作依据。必须说清：本卦=现在的局面，动爻=变化点，之卦=继续变化后的方向；也就是本卦是现在的局面，动爻是变化点，之卦是继续变化下去后更可能走向的方向。但术语后必须马上翻译成人话。
   第三行：给一个具体可执行的小动作、观察点或下一步。
3. 如果有动爻和之卦，必须在大白话里明确说清三件事：这件事为什么还没定、变化主要会出在哪、你现在更适合顺着变还是先别动。
4. 本卦、动爻、之卦必须出现，但只能作为判断依据，不要连续堆术语。不要写成“无妄卦本意是……”这种教材腔，要写成“本卦『无妄』放成人话，就是……”
5. 每个小标题控制 90-150 字，分成 2-3 个短段，手机上要好读；每个小标题至少有一个 **加粗重点句**。
6. “给你一句话：”只输出一句适合分享的完整短句，不要再解释卦理。
7. 语气温柔、稳一点、接地气一点，像一个愿意陪用户把事情捋清楚的朋友。
8. 可以给建议，但不要替用户做人生决定，不要说绝对会怎样。
9. 不要使用 emoji，不要使用文言腔，不要写“吾观此卦”“此乃天意”等表达。

重要：
1. [一句判断]、[定心话]、[大白话] 都必须独占一行，前后不能有任何其他字符。
2. 一句判断保持 14-26 个字，必须完整，不要短到像半句话，也不要超过一行半。
3. 定心话一定不要和一句判断重复，要补充“为什么可以先这样看”。`;

  const userPrompt = `用户现在最纠结的问题是：${question}\n\n对应卦象如下：\n\n${hexagram.content}${changingInfo}\n\n请先接住用户情绪，再把这件事讲清楚。`;
  let fullAiResponse = '';
  const requestId = createRequestId();

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
      const logLine = `[${new Date().toISOString()}] Request: ${requestId} | QuestionLength: ${question.length} | Input: ${usage.prompt_tokens} | Output: ${usage.completion_tokens} | Total: ${usage.total_tokens}\n`;
      fs.appendFileSync(path.join(__dirname, 'token_usage.log'), logLine);
    },
  });

  if (streamResult.ok) {
    if (db && SAVE_DIVINATION_HISTORY) {
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
